import os
import json
import hashlib
import asyncio
import logging
from typing import Optional

import aiohttp
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("llm_explainer")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")  # "openai" or "gemini"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "15"))

# ── In-memory cache ─────────────────────────────────────
_explanation_cache: dict[str, dict] = {}
MAX_CACHE_SIZE = 500


def _cache_key(alert: dict) -> str:
    key_data = json.dumps(
        {"rule_id": alert.get("rule_id"), "evidence": alert.get("evidence")},
        sort_keys=True,
    )
    return hashlib.sha256(key_data.encode()).hexdigest()


# ── Rule-based fallback templates ────────────────────────
FALLBACK_TEMPLATES = {
    "sql_injection": {
        "summary": "A SQL injection attack was detected. The attacker attempted to inject malicious SQL code into the application to manipulate or extract data from the database.",
        "risk": "Critical — successful exploitation can lead to full database compromise, data theft, unauthorized data modification, or complete system takeover.",
        "action_taken": "The malicious request was detected and flagged. If an external attacker IP was identified, it has been blocked; otherwise the alert has been escalated for manual review.",
        "recommendation": "Block the attacker IP from the Response panel. Review application input validation. Use parameterized queries. Audit database access logs for any successful exfiltration.",
    },
    "xss_attack": {
        "summary": "A Cross-Site Scripting (XSS) attack was detected. The attacker tried to inject malicious JavaScript into the application to execute in users' browsers.",
        "risk": "High — XSS can steal session cookies, redirect users to phishing sites, or perform actions on behalf of authenticated users.",
        "action_taken": "The malicious payload was detected and flagged. If an external attacker IP was identified, it has been blocked; otherwise the alert has been escalated for manual review.",
        "recommendation": "Block the attacker IP from the Response panel. Implement Content Security Policy headers. Sanitize all user inputs. Review front-end rendering for unescaped dynamic content.",
    },
    "brute_force": {
        "summary": "A brute force authentication attack was detected. Multiple failed login attempts were observed from the same source, suggesting credential stuffing or password guessing.",
        "risk": "High — successful brute force can grant unauthorized access to user accounts and sensitive systems.",
        "action_taken": "The attack was detected and flagged. If an external attacker IP was identified, it has been blocked and rate-limited; otherwise the alert has been escalated for manual review.",
        "recommendation": "Block the attacker IP from the Response panel. Enforce strong password policies. Enable multi-factor authentication. Consider implementing account lockout after repeated failures.",
    },
    "ddos_flood": {
        "summary": "A Distributed Denial of Service (DDoS) flood attack was detected. An abnormal volume of network traffic is targeting the infrastructure.",
        "risk": "Critical — DDoS attacks can render services unavailable, causing downtime and potential revenue loss.",
        "action_taken": "The flood was detected and flagged. If an external attacker IP was identified, it has been rate-limited and blocked; otherwise the alert has been escalated for manual review.",
        "recommendation": "Block the attacker IP from the Response panel. Enable upstream DDoS protection. Review load balancer configuration. Consider activating CDN-level scrubbing.",
    },
    "port_scan": {
        "summary": "Port scanning reconnaissance activity was detected. An external host is probing multiple ports to discover running services and potential vulnerabilities.",
        "risk": "Medium — port scanning is often a precursor to targeted attacks against discovered services.",
        "action_taken": "The scanning activity was detected and logged. If an external attacker IP was identified, it has been blocked; otherwise the alert has been escalated for monitoring.",
        "recommendation": "Block the scanning IP from the Response panel. Close unnecessary ports. Review firewall rules. Monitor for follow-up exploitation attempts from this source.",
    },
    "rate_spike": {
        "summary": "An abnormal spike in request rate was detected from a single source, potentially indicating an automated attack or aggressive bot activity.",
        "risk": "Medium — sustained high request rates can degrade service performance and may indicate a DDoS attempt.",
        "action_taken": "The spike was detected and flagged. If an external source IP was identified, it has been rate-throttled; otherwise the alert has been escalated for review.",
        "recommendation": "Review rate limiting thresholds. Analyze request patterns for automated bot signatures. Consider CAPTCHA challenges for suspicious sources.",
    },
    "high_cpu": {
        "summary": "CPU utilization has exceeded safe thresholds, which may indicate a resource exhaustion attack or a runaway process.",
        "risk": "Warning — prolonged high CPU can cause service degradation, increased latency, and potential system crashes.",
        "action_taken": "The alert has been raised for operations review. No IP was blocked as this is a system resource alert.",
        "recommendation": "Identify the root cause process. Check for cryptomining malware. Review auto-scaling policies.",
    },
    "high_memory": {
        "summary": "Memory usage has reached critical levels, risking system instability and potential out-of-memory failures.",
        "risk": "Critical — memory exhaustion can crash services, cause data loss, and trigger cascading failures.",
        "action_taken": "The alert has been escalated and the affected service has been flagged for isolation. No IP was blocked as this is a system resource alert.",
        "recommendation": "Investigate memory leaks. Review application memory allocation. Consider restarting affected services from the Response panel.",
    },
    "high_network": {
        "summary": "Network traffic has spiked above normal thresholds, potentially indicating data exfiltration or a flood-based attack.",
        "risk": "Warning — unusual network traffic may signal data theft or an ongoing attack against infrastructure.",
        "action_taken": "The alert has been raised and traffic patterns are being analyzed. No IP was blocked as this is a system resource alert.",
        "recommendation": "Review outbound connections for unauthorized data transfers. Check for compromised services. Inspect packet captures.",
    },
}

DEFAULT_FALLBACK = {
    "summary": "A security anomaly was detected that requires investigation.",
    "risk": "The severity and impact depend on further analysis of the event details.",
    "action_taken": "The alert has been generated and forwarded for analyst review.",
    "recommendation": "Review the alert evidence, correlate with related events, and determine appropriate response actions.",
}


def _get_fallback(alert: dict) -> dict:
    rule_id = alert.get("rule_id", "")
    # Strip ml_ prefix for lookup
    base_rule = rule_id.replace("ml_", "") if rule_id.startswith("ml_") else rule_id
    return FALLBACK_TEMPLATES.get(base_rule, DEFAULT_FALLBACK)


# ── LLM prompt construction ─────────────────────────────
def _build_prompt(alert: dict) -> str:
    evidence_str = json.dumps(alert.get("evidence", {}), indent=2)
    return f"""You are a cybersecurity assistant for SOC analysts.
Explain the following threat in simple language.

Threat Type: {alert.get("rule_id", "unknown")}
Severity: {alert.get("severity", "unknown")}
Source IP: {alert.get("source", alert.get("source_ip", "unknown"))}
Evidence: {evidence_str}

Important context: The system only auto-blocks external attacker IPs. If the source IP is a local/internal machine IP, no IP blocking occurs — only alerting and escalation. For system resource alerts (high_cpu, high_memory, high_network), no IP is blocked since these are infrastructure issues, not external attacks.

Provide:
1. What happened
2. Why it is dangerous
3. What action was actually taken (be accurate — say if IP was blocked or if the alert was only flagged for review)
4. Recommended next step

Return ONLY valid JSON in this exact format:
{{"summary": "...", "risk": "...", "action_taken": "...", "recommendation": "..."}}"""


# ── OpenAI call ──────────────────────────────────────────
async def _call_openai(prompt: str) -> Optional[dict]:
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set")
        return None

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 500,
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            json=body,
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=LLM_TIMEOUT),
        ) as resp:
            if resp.status != 200:
                text = await resp.text()
                logger.error(f"OpenAI API error {resp.status}: {text}")
                return None
            data = await resp.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)


# ── Gemini call ──────────────────────────────────────────
async def _call_gemini(prompt: str) -> Optional[dict]:
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 500,
            "responseMimeType": "application/json",
        },
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            json=body,
            timeout=aiohttp.ClientTimeout(total=LLM_TIMEOUT),
        ) as resp:
            if resp.status != 200:
                text = await resp.text()
                logger.error(f"Gemini API error {resp.status}: {text}")
                return None
            data = await resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)


# ── Main public function ─────────────────────────────────
async def generate_threat_explanation(alert: dict) -> dict:
    """Generate a human-readable explanation for a threat alert.

    Uses LLM if available, falls back to rule-based templates on failure/timeout.
    Results are cached by (rule_id, evidence) to avoid repeated LLM calls.
    """
    # Check cache first
    key = _cache_key(alert)
    if key in _explanation_cache:
        logger.info(f"Cache hit for {alert.get('rule_id')}")
        return _explanation_cache[key]

    explanation = None

    try:
        prompt = _build_prompt(alert)

        if LLM_PROVIDER == "openai":
            explanation = await asyncio.wait_for(
                _call_openai(prompt), timeout=LLM_TIMEOUT
            )
        elif LLM_PROVIDER == "gemini":
            explanation = await asyncio.wait_for(
                _call_gemini(prompt), timeout=LLM_TIMEOUT
            )

        # Validate LLM response has required keys
        if explanation:
            required = {"summary", "risk", "action_taken", "recommendation"}
            if not required.issubset(explanation.keys()):
                logger.warning("LLM response missing required keys, using fallback")
                explanation = None

    except asyncio.TimeoutError:
        logger.warning(f"LLM call timed out after {LLM_TIMEOUT}s, using fallback")
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.warning(f"LLM response parse error: {e}, using fallback")
    except Exception as e:
        logger.warning(f"LLM call failed: {e}, using fallback")

    # Fallback to rule-based templates
    if not explanation:
        explanation = _get_fallback(alert)

    # Cache result (evict oldest if full)
    if len(_explanation_cache) >= MAX_CACHE_SIZE:
        oldest_key = next(iter(_explanation_cache))
        del _explanation_cache[oldest_key]
    _explanation_cache[key] = explanation

    return explanation
