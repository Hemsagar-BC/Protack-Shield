"""
╔═══════════════════════════════════════════════════════════════════╗
║        PROTACK-SHIELD — SYN FLOOD ATTACK SIMULATOR              ║
║   Generates realistic SYN flood telemetry for ML + Rule Engine  ║
╚═══════════════════════════════════════════════════════════════════╝

This script simulates a SYN flood attack by generating telemetry events
with realistic network features and sending them to:
  1. Ingest Service   (port 8001) → Detection Engine rules
  2. Model Microservice (port 8006) → Network Shield ML model

It does NOT send real network packets. It produces the *data* that
describes SYN flood behavior so the ML model and detection engine
can classify and respond to it.

Usage:
    python simulate_syn_flood.py                       # default flood mode
    python simulate_syn_flood.py --stealth             # slow, evasive mode
    python simulate_syn_flood.py --target 192.168.1.10 # custom target IP
    python simulate_syn_flood.py --count 500           # send 500 events
    python simulate_syn_flood.py --port 5050           # target port
"""

import requests
import random
import time
import argparse
import sys
import os
from datetime import datetime

# ─── Try colorama for colored output ───
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

INGEST_URL   = "http://127.0.0.1:8001/ingest"
ML_MODEL_URL = "http://127.0.0.1:8006/api/analyze"

# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def random_ip():
    """Generate a random spoofed source IP (private + public ranges)."""
    pools = [
        lambda: f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
        lambda: f"172.{random.randint(16,31)}.{random.randint(0,255)}.{random.randint(1,254)}",
        lambda: f"192.168.{random.randint(0,255)}.{random.randint(1,254)}",
        lambda: f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
    ]
    return random.choice(pools)()


def random_port():
    """Random ephemeral source port."""
    return random.randint(1024, 65535)


def color(text, fg):
    """Conditionally apply color."""
    if HAS_COLOR:
        return f"{fg}{text}{Style.RESET_ALL}"
    return text


# ═══════════════════════════════════════════════════════════════
# SYN FLOOD DATA GENERATORS
# ═══════════════════════════════════════════════════════════════

def generate_syn_flood_network_data(intensity="high"):
    """
    Generate network feature vector that mimics a SYN flood.
    These are the features the Network Shield ML model evaluates:
      - syn_count > 50   → SYN flood indicator
      - Rate > 5000      → high traffic rate (DDoS)
      - rst_count > 30   → connection reset storm
      - IAT < 200        → suspiciously fast packet timing
      - Number > 60      → high packet volume
    """
    if intensity == "high":
        syn_count = random.randint(80, 200)
        rate      = random.uniform(800_000, 5_000_000)
        rst_count = random.randint(40, 120)
        iat       = random.uniform(5, 100)
        number    = random.randint(80, 300)
    elif intensity == "medium":
        syn_count = random.randint(55, 100)
        rate      = random.uniform(100_000, 800_000)
        rst_count = random.randint(35, 60)
        iat       = random.uniform(100, 190)
        number    = random.randint(65, 120)
    else:  # stealth / low-and-slow
        syn_count = random.randint(51, 65)
        rate      = random.uniform(6_000, 50_000)
        rst_count = random.randint(31, 45)
        iat       = random.uniform(150, 199)
        number    = random.randint(61, 80)

    return {
        # ── Packet header features ──
        "Header_Length":     random.uniform(40, 60),
        "Protocol Type":    6,  # TCP
        "Time_To_Live":     random.randint(1, 30),
        "Rate":             rate,

        # ── TCP flag features ──
        "fin_flag_number":  0,
        "syn_flag_number":  1,  # SYN flag SET
        "rst_flag_number":  random.randint(0, 1),
        "psh_flag_number":  0,
        "ack_flag_number":  0,  # No ACK (half-open)
        "ece_flag_number":  0,
        "cwr_flag_number":  0,

        # ── Connection counters ──
        "ack_count":  random.randint(0, 5),
        "syn_count":  syn_count,
        "fin_count":  random.randint(0, 3),
        "rst_count":  rst_count,

        # ── Protocol flags ──
        "HTTP": 0, "HTTPS": 0, "DNS": 0, "Telnet": 0,
        "SMTP": 0, "SSH": 0,   "IRC": 0, "TCP": 1,
        "UDP": 0,  "DHCP": 0,  "ARP": 0, "ICMP": 0,
        "IGMP": 0, "IPv": 1,   "LLC": 0,

        # ── Traffic statistics ──
        "Tot sum":   random.randint(200_000, 500_000),
        "Min":       random.uniform(40, 60),
        "Max":       random.uniform(60, 80),  # SYN packets are small, uniform size
        "AVG":       random.uniform(50, 70),
        "Std":       random.uniform(2, 10),   # Low variance (all SYN, same size)
        "Tot size":  random.uniform(3000, 8000),
        "IAT":       iat,
        "Number":    number,
        "Variance":  random.uniform(10, 100),
    }


def build_ingest_event(target_ip, target_port, source_ip, source_port):
    """Build a telemetry event for the ingest service (detection engine rules)."""
    return {
        "source_ip":  source_ip,
        "domain":     "general",
        "service":    f"target-{target_ip}:{target_port}",
        "event_type": "network_flood",
        "payload": {
            "attack_type":  "syn_flood",
            "reason":       "SYN flood — high volume half-open connections",
            "target_ip":    target_ip,
            "target_port":  target_port,
            "source_ip":    source_ip,
            "source_port":  source_port,
            "protocol":     "TCP",
            "flags":        "SYN",
            "action":       "DETECTED",
            "path":         f"/{target_ip}:{target_port}",
        },
    }


def build_ml_event(target_ip, intensity):
    """Build a payload for the ML model microservice (Network Shield)."""
    return {
        "sector":       "healthcare",  # triggers Network Shield layer
        "network_data": generate_syn_flood_network_data(intensity),
        "payload":      "",            # empty = skip Web Gatekeeper layer
        "sensor_data":  [
            random.uniform(60, 100),   # dummy sensor values
            random.uniform(36, 38),
            random.uniform(95, 100),
            random.uniform(110, 140),
        ],
    }


# ═══════════════════════════════════════════════════════════════
# STATS TRACKER
# ═══════════════════════════════════════════════════════════════

class Stats:
    def __init__(self):
        self.sent        = 0
        self.detected    = 0
        self.failed      = 0
        self.start_time  = time.time()
        self.unique_ips  = set()

    @property
    def elapsed(self):
        return time.time() - self.start_time

    @property
    def rate(self):
        return self.sent / max(self.elapsed, 0.001)

    def banner(self):
        return (
            f"  Sent: {color(str(self.sent), Fore.CYAN)}"
            f"  |  Detected: {color(str(self.detected), Fore.RED)}"
            f"  |  Failed: {color(str(self.failed), Fore.YELLOW)}"
            f"  |  Spoofed IPs: {color(str(len(self.unique_ips)), Fore.MAGENTA)}"
            f"  |  Rate: {color(f'{self.rate:.1f} evt/s', Fore.GREEN)}"
            f"  |  Elapsed: {self.elapsed:.1f}s"
        )


# ═══════════════════════════════════════════════════════════════
# MAIN SIMULATION LOOP
# ═══════════════════════════════════════════════════════════════

def run_flood(args):
    stats = Stats()

    intensity = "low" if args.stealth else ("medium" if args.medium else "high")

    delay = 0.0
    if args.stealth:
        delay = random.uniform(0.3, 0.8)
    elif args.delay:
        delay = args.delay

    # ── Header ──
    print()
    print(color("═" * 68, Fore.RED))
    print(color("║", Fore.RED) + color("     PROTACK-SHIELD  —  SYN FLOOD ATTACK SIMULATOR", Fore.WHITE).center(75) + color("║", Fore.RED))
    print(color("║", Fore.RED) + color("     Telemetry-based  ·  Feeds ML + Detection Engine", Fore.CYAN).center(75) + color("║", Fore.RED))
    print(color("═" * 68, Fore.RED))
    print()
    print(f"  🎯  Target .............. {color(f'{args.target}:{args.port}', Fore.YELLOW)}")
    print(f"  ⚡  Intensity ........... {color(intensity.upper(), Fore.RED)}")
    print(f"  🔁  Events to send ...... {color(str(args.count) if args.count else '∞ (Ctrl+C to stop)', Fore.CYAN)}")
    print(f"  ⏱️   Delay ............... {color(f'{delay:.2f}s', Fore.GREEN) if delay else color('none (full speed)', Fore.RED)}")
    print(f"  📡  Ingest Service ...... {color(INGEST_URL, Fore.WHITE)}")
    print(f"  🧠  ML Model ............ {color(ML_MODEL_URL, Fore.WHITE)}")
    print()
    print(color("─" * 68, Fore.WHITE))
    print(f"  {'#':>6}  {'SOURCE IP':<20} {'SRC PORT':>8}  {'TARGET':>18}  {'STATUS':<10}")
    print(color("─" * 68, Fore.WHITE))

    try:
        seq = 0
        while True:
            seq += 1
            if args.count and seq > args.count:
                break

            # ── Generate spoofed source ──
            src_ip   = random_ip()
            src_port = random_port()
            stats.unique_ips.add(src_ip)

            # ── 1. Send to Ingest Service ──
            ingest_ok = False
            try:
                evt = build_ingest_event(args.target, args.port, src_ip, src_port)
                r = requests.post(INGEST_URL, json=evt, timeout=3)
                if r.status_code == 200:
                    ingest_ok = True
            except Exception:
                pass

            # ── 2. Send to ML Model Microservice ──
            ml_ok = False
            ml_status = ""
            try:
                ml_evt = build_ml_event(args.target, intensity)
                r2 = requests.post(ML_MODEL_URL, json=ml_evt, timeout=3)
                if r2.status_code == 200:
                    ml_ok = True
                    result = r2.json()
                    ml_status = result.get("status", "unknown")
                    if ml_status in ("blocked", "quarantined", "isolated"):
                        stats.detected += 1
            except Exception:
                pass

            # ── Update stats ──
            if ingest_ok or ml_ok:
                stats.sent += 1
            else:
                stats.failed += 1

            # ── Console output ──
            if ml_status in ("blocked", "quarantined", "isolated"):
                status_str = color("🚨 BLOCKED", Fore.RED)
            elif ingest_ok:
                status_str = color("📡 SENT", Fore.GREEN)
            else:
                status_str = color("❌ FAIL", Fore.YELLOW)

            line = f"  {seq:>6}  {src_ip:<20} {src_port:>8}  {args.target + ':' + str(args.port):>18}  {status_str}"
            print(line)

            # ── Real-time stats every 25 events ──
            if seq % 25 == 0:
                print(color("  ├── ", Fore.WHITE) + stats.banner())

            # ── Stealth delay ──
            if delay > 0:
                actual_delay = delay
                if args.stealth:
                    actual_delay = random.uniform(delay * 0.5, delay * 1.5)
                time.sleep(actual_delay)

    except KeyboardInterrupt:
        pass

    # ── Final Report ──
    print()
    print(color("═" * 68, Fore.RED))
    print(color("  SIMULATION COMPLETE", Fore.WHITE))
    print(color("═" * 68, Fore.RED))
    print(f"  Total events sent .... {color(str(stats.sent), Fore.CYAN)}")
    print(f"  ML detections ........ {color(str(stats.detected), Fore.RED)}")
    print(f"  Failed deliveries .... {color(str(stats.failed), Fore.YELLOW)}")
    print(f"  Unique spoofed IPs ... {color(str(len(stats.unique_ips)), Fore.MAGENTA)}")
    print(f"  Avg event rate ....... {color(f'{stats.rate:.1f} evt/s', Fore.GREEN)}")
    print(f"  Total time ........... {stats.elapsed:.1f}s")
    print(color("═" * 68, Fore.RED))
    print()


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="ProTack-Shield SYN Flood Simulator — feeds ML model & detection engine"
    )
    parser.add_argument("--target", default="127.0.0.1",
                        help="Target IP address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=5050,
                        help="Target port (default: 5050)")
    parser.add_argument("--count", type=int, default=None,
                        help="Number of events to send (default: infinite)")
    parser.add_argument("--stealth", action="store_true",
                        help="Stealth mode — slower, randomized delays")
    parser.add_argument("--medium", action="store_true",
                        help="Medium intensity (between stealth and full)")
    parser.add_argument("--delay", type=float, default=0.0,
                        help="Custom delay between events in seconds")
    args = parser.parse_args()

    run_flood(args)


if __name__ == "__main__":
    main()
