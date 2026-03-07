"""Quick test: send 10 SQL injection requests to victim node"""
import urllib.request
import json

url = "http://localhost:5050/data"
ok = 0
fail = 0

for i in range(10):
    query = f"SELECT * FROM users WHERE id={i} OR 1=1 --"
    body = json.dumps({"query": query}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        ok += 1
        print(f"  #{i}: HTTP {resp.status} OK")
    except urllib.error.HTTPError as e:
        fail += 1
        print(f"  #{i}: HTTP {e.code} BLOCKED")
    except Exception as e:
        fail += 1
        print(f"  #{i}: ERROR {e}")

print(f"\nResults: {ok} success / {fail} blocked")
