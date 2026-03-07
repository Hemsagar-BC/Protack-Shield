import os
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import aiohttp

from playbooks import (
    run_playbook,
    get_blocked_ips,
    get_isolated_services,
    get_action_log,
    clear_all_actions,
    unblock_ip,
    ActionResult
)

PORT = int(os.environ.get("PORT", 8004))
API_GATEWAY_URL = os.environ.get("API_GATEWAY_URL", "http://localhost:3001")

class Alert(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    source: str
    timestamp: str
    acknowledged: bool = False
    evidence: Optional[dict] = None
    recommendation: Optional[str] = None
    anomaly_id: Optional[str] = None
    rule_id: Optional[str] = None

class ActionOutput(BaseModel):
    action_id: str
    action_type: str
    status: str
    target: str
    message: str
    executed_at: str
    details: Optional[dict] = None

class ExecuteResponse(BaseModel):
    alert_id: str
    actions_executed: int
    actions: List[ActionOutput]

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "response-engine"
    version: str = "1.0.0"
    blocked_ips: int = 0
    isolated_services: int = 0

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Response Engine running on port {PORT}")
    print(f"Gateway: {API_GATEWAY_URL}")
    yield
    print("Response Engine shutting down...")

app = FastAPI(
    title="Threat_Ops.ai - Response Engine",
    description="Automated incident response",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="healthy",
        service="response-engine",
        version="1.0.0",
        blocked_ips=len(get_blocked_ips()),
        isolated_services=len(get_isolated_services())
    )

@app.get("/status", tags=["Status"])
async def get_status():
    from playbooks import throttled_ips
    return {
        "blocked_ips": get_blocked_ips(),
        "isolated_services": get_isolated_services(),
        "throttled_ips": throttled_ips,
        "actions_executed": len(get_action_log())
    }

@app.get("/actions", tags=["Actions"])
async def list_actions(limit: int = 50):
    actions = get_action_log()[-limit:]
    return {
        "actions": [
            {
                "action_type": a.action_type,
                "status": a.status,
                "target": a.target,
                "message": a.message,
                "executed_at": a.executed_at,
            }
            for a in reversed(actions)
        ],
        "count": len(actions)
    }

@app.post("/execute", response_model=ExecuteResponse, tags=["Execute"])
async def execute_response(alert: Alert):
    try:
        print(f"\n{'='*60}")
        print(f"[RESPONSE ENGINE] Processing alert: {alert.title}")
        print(f"[RESPONSE ENGINE] Rule ID: {alert.rule_id} | Severity: {alert.severity}")
        print(f"[RESPONSE ENGINE] Source: {alert.source}")

        results = run_playbook(alert.model_dump())

        actions = []
        for result in results:
            action_id = str(uuid.uuid4())
            action = ActionOutput(
                action_id=action_id,
                action_type=result.action_type,
                status=result.status,
                target=result.target,
                message=result.message,
                executed_at=result.executed_at,
                details=result.details
            )
            actions.append(action)

            # Log auto-block decisions prominently
            if result.action_type == "block_ip":
                if result.status == "success":
                    print(f"[AUTO-BLOCK] ✅ IP {result.target} BLOCKED for {alert.rule_id} (severity: {alert.severity})")
                elif result.status == "skipped":
                    print(f"[AUTO-BLOCK] ⏭️  Skipped: {result.message}")
            else:
                print(f"   [{result.action_type}] {result.message}")

        print(f"{'='*60}\n")

        await emit_action_events(alert, actions)

        return ExecuteResponse(
            alert_id=alert.id,
            actions_executed=len(actions),
            actions=actions
        )

    except Exception as e:
        print(f"Response execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def emit_action_events(alert: Alert, actions: List[ActionOutput]):
    try:
        async with aiohttp.ClientSession() as session:
            for action in actions:
                event = {
                    "type": "response_action",
                    "alert_id": alert.id,
                    "action": action.model_dump(),
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }

                async with session.post(
                    f"{API_GATEWAY_URL}/internal/device-status",
                    json=event,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as resp:
                    if resp.status == 200:
                        print(f"Action event emitted: {action.action_type}")

                # Sync IP blocks to API Gateway's IP Manager
                if action.action_type == "block_ip" and action.status == "success":
                    await sync_block_to_gateway(action.target, alert)

    except aiohttp.ClientError as e:
        print(f"Could not emit action event: {e}")


async def sync_block_to_gateway(ip: str, alert: Alert):
    """Sync IP block to API Gateway's centralized IP Manager + emit to dashboard"""
    if not ip or ip == "unknown" or ip == "N/A":
        return

    try:
        # Map rule_id to block reason
        reason_map = {
            "sql_injection": "sql_injection",
            "xss_attack": "xss",
            "brute_force": "brute_force",
            "ddos_flood": "flooding",
            "port_scan": "port_scan",
            "rate_spike": "flooding",
            "ml_web_gatekeeper": "ml_detected",
            "ml_xss_brain": "ml_detected",
            "ml_network_shield": "ml_detected",
        }
        reason = reason_map.get(alert.rule_id, "abuse")

        # Map severity to TTL (LOW=60s, MEDIUM=300s, HIGH=600s, CRITICAL=900s)
        severity_map = {
            "critical": "critical",
            "high": "high",
            "warning": "medium",
            "medium": "medium",
            "low": "low"
        }
        severity = severity_map.get(alert.severity, "high")

        # TTL based on severity
        ttl_map = {
            "low": 60,
            "medium": 300,
            "high": 600,
            "critical": 900
        }
        ttl = ttl_map.get(severity, 600)

        print(f"[AUTO-BLOCK SYNC] Sending block to API Gateway: IP={ip}, reason={reason}, severity={severity}, TTL={ttl}s")

        async with aiohttp.ClientSession() as session:
            # 1. Block the IP at API Gateway level
            async with session.post(
                f"{API_GATEWAY_URL}/ip/block",
                json={
                    "ip": ip,
                    "reason": reason,
                    "severity": severity,
                    "duration": ttl
                },
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"[AUTO-BLOCK SYNC] ✅ Gateway confirmed: {ip} blocked -> {result.get('message')}")
                else:
                    print(f"[AUTO-BLOCK SYNC] ❌ Gateway block failed: {resp.status}")

            # 2. Push auto-block log to dashboard via device-status event
            await session.post(
                f"{API_GATEWAY_URL}/internal/device-status",
                json={
                    "type": "auto_block",
                    "ip": ip,
                    "rule_id": alert.rule_id,
                    "reason": reason,
                    "severity": severity,
                    "ttl": ttl,
                    "alert_title": alert.title,
                    "message": f"🚫 Auto-blocked {ip} for {alert.rule_id} (TTL: {ttl}s)",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                },
                timeout=aiohttp.ClientTimeout(total=5)
            )

    except Exception as e:
        print(f"[AUTO-BLOCK SYNC] ❌ Could not sync block to Gateway: {e}")


@app.post("/block/{ip}", tags=["Manual"])
async def manual_block_ip(ip: str, duration: int = 600, reason: str = "manual"):
    """Block an IP via Response Engine (syncs to API Gateway)"""
    from playbooks import blocked_ips

    if ip in blocked_ips:
        return {"status": "already_blocked", "ip": ip}

    blocked_ips.add(ip)

    # Sync to API Gateway
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_GATEWAY_URL}/ip/block",
                json={"ip": ip, "reason": reason, "severity": "high", "duration": duration},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                gateway_result = await resp.json() if resp.status == 200 else None
    except:
        gateway_result = None

    return {
        "status": "blocked",
        "ip": ip,
        "message": f"IP {ip} blocked",
        "gateway_sync": gateway_result
    }

@app.delete("/block/{ip}", tags=["Manual"])
async def manual_unblock_ip(ip: str):
    """Unblock an IP via Response Engine (syncs to API Gateway)"""
    if not unblock_ip(ip):
        raise HTTPException(status_code=404, detail="IP not blocked")

    # Sync to API Gateway
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_GATEWAY_URL}/ip/unblock",
                json={"ip": ip},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                gateway_result = await resp.json() if resp.status == 200 else None
    except:
        gateway_result = None

    return {"status": "unblocked", "ip": ip, "gateway_sync": gateway_result}

@app.post("/isolate/{service}", tags=["Manual"])
async def manual_isolate_service(service: str):
    from playbooks import isolated_services

    if service in isolated_services:
        return {"status": "already_isolated", "service": service}

    isolated_services.add(service)
    return {"status": "isolated", "service": service}

@app.delete("/isolate/{service}", tags=["Manual"])
async def manual_restore_service(service: str):
    from playbooks import isolated_services

    if service not in isolated_services:
        raise HTTPException(status_code=404, detail="Service not isolated")

    isolated_services.discard(service)
    return {"status": "restored", "service": service}

@app.post("/throttle/{ip}", tags=["Manual"])
async def manual_throttle_ip(ip: str, limit: int = 10):
    from playbooks import throttled_ips

    throttled_ips[ip] = limit
    return {"status": "throttled", "ip": ip, "limit": limit, "message": f"IP {ip} throttled to {limit} req/min"}

@app.delete("/throttle/{ip}", tags=["Manual"])
async def manual_remove_throttle(ip: str):
    from playbooks import throttled_ips

    if ip not in throttled_ips:
        raise HTTPException(status_code=404, detail="IP not throttled")

    del throttled_ips[ip]
    return {"status": "unthrottled", "ip": ip}

@app.delete("/reset", tags=["Admin"])
async def reset_all():
    clear_all_actions()
    return {"status": "reset", "message": "All actions cleared"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        reload=False
    )
