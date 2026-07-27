import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws/system/"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to system websocket")
            response = await websocket.recv()
            print("Received:", response)
    except Exception as e:
        print("Error connecting to system ws:", e)

    uri_chat = "ws://localhost:8000/ws/chat/test-123/"
    try:
        async with websockets.connect(uri_chat) as websocket:
            print("Connected to chat websocket")
    except Exception as e:
        print("Error connecting to chat ws:", e)

asyncio.get_event_loop().run_until_complete(test_ws())
