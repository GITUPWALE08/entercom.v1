# WebSocket Consumer Design Implementation

## Purpose
The purpose of this document is to outline the structural design of the core Django Channels `Consumer` classes that maintain the physical WebSocket connection. It defines how incoming frames are parsed, how subscriptions are delegated, and how outbound data is formatted.

## Scope
- Base Consumer inheritance (e.g., `AsyncJsonWebsocketConsumer`).
- Input frame validation and routing logic.
- Output frame serialization.
- Exception handling and connection teardown.

## Out of Scope
- Exact internal logic of the Subscription Management Service.
- ASGI routing layers (covered in `connection-manager.md`).

## Definitions
- **Consumer**: A class that handles the lifecycle of a WebSocket connection, similar to how a View handles an HTTP request.
- **Frame**: A discrete message sent over the WebSocket connection (text or binary).
- **Backplane**: The Redis layer that broadcasts messages to all consumers subscribed to a specific group.

## Architecture

### 1. Consumer Base Class
The WebSocket domain will utilize an asynchronous JSON-based consumer (e.g., extending `AsyncJsonWebsocketConsumer` from Django Channels) because the message contract strictly defines JSON as the data interchange format.

- **`connect()`**: Handled primarily by the logic defined in the `Connection Manager`. Upon success, the consumer implicitly subscribes the user to their personal root channels (`user.[user_id].*`).
- **`receive_json(content)`**: The primary entry point for all frames sent *from* the client *to* the server.

### 2. Input Frame Parsing & Routing
When the client sends a message up the socket, the consumer must route it appropriately.
- **Validation**: The consumer must validate the `content` dictionary against the `WebSocket Message Contract` (ensuring `type` and `payload` fields exist).
- **System Commands**: If the frame is a `system` command (e.g., `SUBSCRIBE` to a shared resource channel), the consumer passes the request to the `Subscription Management Service`, injecting the current `user_id` from the scope for authorization.
- **Data Commands**: As per the resolved business decisions, clients cannot route messages directly to other clients. If a client sends a data payload (e.g., `typing_indicator`), the consumer must forward this to the appropriate Core Domain (e.g., the Request domain) for validation. The Core Domain will then publish it back to the Event Router if valid.

### 3. Backplane Event Handling
When a message is published to the Redis Backplane (e.g., by the Notification domain), the consumer receives it via a custom event handler.
- **Handler Method**: `async def broadcast_message(self, event):`
- **Serialization**: The consumer extracts the `payload` from the internal `event` dict, wraps it in the standard outbound JSON envelope, and pushes it down the physical TCP socket via `self.send_json()`.

### 4. Exception Management
The consumer must gracefully handle runtime exceptions to prevent ASGI worker crashes.
- **Invalid JSON**: If the client sends malformed JSON, `receive_json` will fail. The consumer should catch the `ValueError`, send an `error` frame back to the client, and optionally force-close the connection if abuse is suspected.
- **Disconnects**: In the event of an unhandled exception within the consumer logic, the `disconnect()` lifecycle method must still reliably execute to prune zombie Redis subscriptions.

## Responsibilities
- **Type Safety**: The consumer must ensure that all data pushed down the socket strictly adheres to the outbound JSON schema, stripping any internal Django Channels metadata.
- **Non-Blocking**: The consumer MUST be fully asynchronous. It cannot execute synchronous ORM queries directly; it must delegate to `database_sync_to_async` wrappers.

## Dependencies
- **Django Channels**: Provides the `AsyncJsonWebsocketConsumer` base class.
- **Subscription Management Service**: Called by the consumer to handle `SUBSCRIBE`/`UNSUBSCRIBE` frames.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The use of `AsyncJsonWebsocketConsumer` and JSON parsing logic is defined.
- The routing rules for incoming system commands vs. data payloads are codified.
- Exception handling and non-blocking asynchronous constraints are established.
