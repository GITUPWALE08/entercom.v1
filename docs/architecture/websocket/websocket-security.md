# WebSocket Security Architecture

## Purpose
The purpose of this document is to define the defensive measures and security constraints implemented within the WebSocket Domain. Because WebSockets maintain long-lived, persistent connections and allow bi-directional data flow, they present unique attack vectors (e.g., DoS, CSWSH, data injection) that must be systematically mitigated.

## Scope
- Connection limits and Rate Limiting.
- Message payload validation and sanitization.
- Transport-layer encryption.
- Defenses against Cross-Site WebSocket Hijacking (CSWSH).

## Out of Scope
- Initial JWT authentication mechanics (detailed in `websocket-authentication.md`).
- Channel subscription authorization rules (detailed in `websocket-authorization.md`).
- Specific Web Application Firewall (WAF) rule sets.

## Definitions
- **CSWSH**: Cross-Site WebSocket Hijacking. An attack where a malicious site initiates a WebSocket connection to the server using the victim's implicit browser credentials.
- **WSS**: WebSocket Secure. The encrypted protocol over TLS, analogous to HTTPS.
- **Frame Rate Limiting**: Restricting the number of individual WebSocket frames a client is allowed to send to the server within a specific time window.

## Architecture

### Transport Level Security
- **Strict TLS**: The server MUST ONLY accept connections over the `wss://` protocol. All unencrypted `ws://` upgrade requests must be rejected or redirected by the load balancer. This prevents man-in-the-middle packet sniffing of real-time payloads.
- **CSWSH Defense**: As established in the authentication architecture, the platform rejects implicit cookie-based authentication and mandates explicit origin validation via the `AllowedHostsOriginValidator`.

### Denial of Service (DoS) Protections
A malicious actor could attempt to exhaust ASGI server memory or CPU by keeping millions of idle connections open or by spamming the server with massive payloads.
1. **Connection Limits**: 
   - A hard limit must be enforced on the number of concurrent connections permitted per authenticated user (e.g., maximum 5 active devices/tabs). Subsequent connection attempts must drop the oldest connection or be rejected.
2. **Frame Size Limits**:
   - The ASGI server must enforce a strict maximum payload size for incoming frames (e.g., 8KB). Frames exceeding this limit must cause the server to forcefully drop the connection to prevent buffer overflow attacks.
3. **Frame Rate Limiting**:
   - The system must track the velocity of incoming frames per connection. If a client exceeds a reasonable threshold (e.g., >10 control messages per second), the server must terminate the connection.

### Payload Security
- **JSON Validation**: Every incoming frame must be strictly parsed against the defined `websocket-message-contract.md` schema. Malformed JSON or invalid schema structures must be discarded immediately without further processing.
- **Sanitization**: The WebSocket Domain MUST NEVER inherently trust data sent up from the client. Any future client-to-server data (e.g., typing indicators) must be sanitized to prevent XSS payloads from being reflected to other users.

## Responsibilities
- **Infrastructure (WAF/Load Balancer)**: Enforce TLS termination and initial volumetric rate limiting.
- **Connection Management Service**: Enforce concurrent connection limits per user and frame size/velocity limits.

## Dependencies
- **Audit Domain**: Security-related connection drops (e.g., rate limit exceeded, invalid origins) must be logged to the Audit Domain for threat analysis.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Maximum frame size:
64 KB

**Decision:** On rate-limit violation:

Disconnect immediately.

Ban user ID for 5 minutes.

IP bans are not applied automatically.

## Completion Criteria
- Strict `wss://` transport requirements are established.
- Defensive boundaries against DoS (size limits, velocity limits, concurrency limits) are codified.
- The principle of zero-trust for client-sent payloads is explicitly mandated.
