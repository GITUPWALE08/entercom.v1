# WebSocket Message Contract Architecture

## Purpose
The purpose of this document is to define the strict JSON payload schema that governs all communication passing through the physical WebSocket connections. It ensures that both the frontend client and the backend ASGI servers use a predictable, strongly-typed format for multiplexing channels over a single socket.

## Scope
- Base envelope structure for all WebSocket frames (JSON).
- Schema for client-to-server control messages (Subscribe, Unsubscribe).
- Schema for server-to-client broadcasts (Data, Errors).
- Schema for server-to-client system messages (Maintenance, Reconnect).

## Out of Scope
- The detailed payload structure of the core business events nested *inside* the data frames (e.g., the specific fields of a `RequestUpdated` event).
- Binary WebSocket frames (Phase 6 strictly mandates text-based JSON frames).

## Definitions
- **Envelope**: The outer JSON structure of a message that contains routing metadata (type, channel) necessary for multiplexing.
- **Payload**: The inner JSON object containing the actual data or control arguments.
- **Control Message**: A message used to manage the state of the connection or subscriptions (e.g., `subscribe`), rather than transmitting business data.

## Architecture

### The Base Envelope
All frames transmitted over the WebSocket, in either direction, MUST conform to a universal envelope schema:
```json
{
  "type": "string",
  "channel": "string",
  "payload": { ... }
}
```
- `type`: Defines the intent of the message (e.g., `subscribe`, `unsubscribe`, `data`, `error`, `system`).
- `channel`: Identifies the routing target. For control messages, this is the channel being acted upon. For data broadcasts, it is the channel the data originated from. If the message applies to the whole connection (like a system alert), this field may be `null` or omitted.
- `payload`: An object containing the specific data for the message type.

### Client-to-Server Messages
The frontend client uses control messages to manage its dynamic multiplexing.

1. **Subscribe**
   - *Type*: `subscribe`
   - *Channel*: The target namespace (e.g., `request.1024.updates`).
   - *Payload*: Optional authorization parameters if required.

2. **Unsubscribe**
   - *Type*: `unsubscribe`
   - *Channel*: The target namespace.
   - *Payload*: Empty.

### Server-to-Client Messages
The backend uses these message types to push state or respond to control commands.

1. **Data Broadcast**
   - *Type*: `data`
   - *Channel*: The namespace the event occurred on.
   - *Payload*: The sanitized business event (e.g., `{ "event": "quote_approved", "data": { "quote_id": 88 } }`).

2. **Error Responses**
   - *Type*: `error`
   - *Channel*: The namespace the error occurred on (if applicable).
   - *Payload*: Standardized error details (e.g., `{ "code": 403, "message": "Unauthorized to subscribe to this channel" }`).

3. **System Directives**
   - *Type*: `system`
   - *Channel*: `null` (applies globally to the connection).
   - *Payload*: Commands for the client to execute (e.g., `{ "directive": "force_reconnect", "reason": "server_drain" }`).

## Responsibilities
- **Frontend Client Library**: Must wrap all outgoing intents in the standard envelope and unwrap all incoming frames before dispatching them to the React component tree.
- **Event Routing Service**: Must format all outbound business events into the `data` envelope format before pushing to the client.

## Dependencies
- None. This is a foundational schema contract.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Application ACKs required only for high-priority commands.

Broadcast events rely on TCP.

## Completion Criteria
- The JSON envelope structure for all WebSocket frames is explicitly defined.
- The schemas for subscription management and data broadcasting are codified.
