# WebSocket Event Publishing Implementation

## Purpose
The purpose of this document is to define the technical implementation for how Core Domains publish real-time events to the WebSocket Event Router, ensuring decoupled and asynchronous data flow.

## Scope
- The Event Router interface.
- Defining the Redis publishing mechanism.
- Internal publishing payload schema.

## Out of Scope
- Client-side data rendering.

## Definitions
- **Event Router**: A service within the WebSocket domain that acts as the bridge between internal backend events and the external Redis Backplane.

## Architecture

### 1. The Publishing Interface
Core domains (like Notifications or Requests) do not import Django Channels code directly. They interact with an internal `EventPublisher` abstraction.
- **Method**: `publish_to_channel(channel_name: str, payload: dict)`
- **Validation**: The `EventPublisher` strictly validates the `channel_name` against the defined taxonomy (`[scope].[entity].[id].[action]`).

### 2. Redis Pub/Sub Routing
As per the resolved business decision, the Event Routing Service relies exclusively on standard Redis Pub/Sub without "sticky routing".
- The `EventPublisher` serializes the payload to JSON.
- It executes a native Redis `PUBLISH` command targeting the specific Django Channels Group name.
- Any ASGI worker currently holding a socket subscribed to that Group will receive the pub/sub message and forward it to the client.

### 3. Payload Integrity
- The publisher must strip any internal database IDs or sensitive fields not meant for public consumption before calling the router.
- The outer envelope must conform to the `WebSocket Message Contract` (i.e., `{"type": "data", "payload": {...}}`).

## Responsibilities
- **Core Domains**: Must construct sanitized, client-ready payloads.
- **Event Router**: Must execute the Redis publish asynchronously to prevent blocking standard HTTP request threads.

## Dependencies
- **Redis**: The transport layer for publishing.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The decoupled publishing interface is defined.
- Reliance on Redis Pub/Sub (without sticky routing) is codified.
