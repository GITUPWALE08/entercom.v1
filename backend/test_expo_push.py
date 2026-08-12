import urllib.request
import json
import time
import sys

def send_test_push(token):
    print(f"\n🚀 Step 1: Sending test push to Expo...")
    url = "https://exp.host/--/api/v2/push/send"
    payload = [{
        "to": token,
        "title": "System Diagnostic",
        "body": "If you see this, push notifications are working!",
        "sound": "default",
        "priority": "high"
    }]
    
    req = urllib.request.Request(url, json.dumps(payload).encode('utf-8'))
    req.add_header('Accept', 'application/json')
    req.add_header('Accept-encoding', 'gzip, deflate')
    req.add_header('Content-Type', 'application/json')
    
    try:
        response = urllib.request.urlopen(req, timeout=10)
        result = json.loads(response.read().decode())
        print(f"✅ Expo Response: {json.dumps(result, indent=2)}")
        
        if "data" in result and result["data"]:
            item = result["data"][0]
            if item.get("status") == "error":
                print(f"\n❌ EXPO REJECTED THE TOKEN IMMEDIATELY!")
                print(f"Reason: {item.get('message')}")
                return
            elif item.get("status") == "ok":
                ticket_id = item.get("id")
                print(f"\n✅ Expo accepted the token! Ticket ID: {ticket_id}")
                check_receipt(ticket_id)
    except Exception as e:
        print(f"\n❌ Network error contacting Expo: {e}")

def check_receipt(ticket_id):
    print(f"\n⏳ Step 2: Waiting 5 seconds for Firebase to process it...")
    time.sleep(5)
    
    url = "https://exp.host/--/api/v2/push/getReceipts"
    payload = {"ids": [ticket_id]}
    req = urllib.request.Request(url, json.dumps(payload).encode('utf-8'))
    req.add_header('Accept', 'application/json')
    req.add_header('Content-Type', 'application/json')
    
    try:
        response = urllib.request.urlopen(req, timeout=10)
        result = json.loads(response.read().decode())
        print(f"✅ Receipt Response: {json.dumps(result, indent=2)}")
        
        receipts = result.get("data", {})
        receipt = receipts.get(ticket_id, {})
        
        if receipt.get("status") == "ok":
            print(f"\n🎉 FIREBASE ACCEPTED IT! The push notification MUST be on your phone!")
            print("If it's not on your phone, check your phone's OS notification settings.")
        elif receipt.get("status") == "error":
            print(f"\n❌ FIREBASE BLOCKED IT in the background!")
            print(f"Error Code: {receipt.get('details', {}).get('error')}")
            print(f"Message: {receipt.get('message')}")
            print("\nThis means your EAS Credentials (Service Account Key) are invalid or missing.")
        else:
            print(f"\n❓ Firebase is still processing it, or status is unknown.")
    except Exception as e:
        print(f"\n❌ Network error contacting Expo Receipts: {e}")

if __name__ == "__main__":
    token = input("Paste your Expo Push Token (e.g. ExponentPushToken[...] or ExpoPushToken[...]): ").strip()
    if not token:
        print("Token is required.")
        sys.exit(1)
    send_test_push(token)
