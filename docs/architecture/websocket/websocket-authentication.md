# WebSocket Authentication Architecture

## Purpose
The purpose of this document is to define the exact mechanics of securely authenticating a WebSocket connection. Because standard HTTP headers (like `Authorization: Bearer <token>`) are not uniformly supported by all browser WebSocket APIs during the initial handshake, a specific architectural pattern is required to guarantee secure access.

## Scope
- The authentication handshake process.
- Token transmission vectors (URL query parameters vs. Initial Frame payloads).
- Connection rejection for invalid or expired credentials.
- Security constraints against CSRF and Cross-Site WebSocket Hijacking (CSWSH).

## Out of Scope
- The generation and signing of the JWTs (owned by the Authentication Domain).
- Channel-level authorization (handled in `websocket-authorization.md`).
- Single Sign-On (SSO) integrations.

## Definitions
- **Handshake**: The initial HTTP `GET` request sent by the client with the `Upgrade: websocket` header.
- **Connection Scope**: The persistent state dictionary attached to an active WebSocket connection, containing the authenticated User ID and their active Roles.
- **CSWSH**: Cross-Site WebSocket Hijacking, an attack where a malicious site initiates a WebSocket connection to the server using the victim's implicit browser credentials (like cookies).

## Architecture

### Token Transmission Strategy
Because standard browser `WebSocket(url)` constructors do not allow setting custom HTTP headers, the platform mandates one of two secure token transmission strategies.

**Primary Strategy: Query Parameter Authentication**
1. The frontend client retrieves its valid JWT Access Token from its secure storage mechanism (e.g., Zustand store).
2. The client initiates the WebSocket connection, embedding the token in the URL:
   `wss://api.entercom.com/ws/?token=eyJhbGci...`
3. The ASGI Connection Management Service intercepts the HTTP Upgrade request.
4. It extracts the `token` from the query string and hands it to the Authentication Domain for synchronous validation.
5. If valid, the user's details are populated into the Connection Scope, and the HTTP `101 Switching Protocols` response is returned. The connection is open.
6. If invalid or expired, the ASGI server rejects the handshake with an HTTP `403 Forbidden`, preventing the TCP connection from fully forming.

**Alternative Strategy: Initial Payload Authentication (First Frame)**
1. The client initiates a standard WebSocket connection without tokens: `wss://api.entercom.com/ws/`.
2. The server accepts the connection but marks it as `UNAUTHENTICATED`.
3. The server sets a strict timer (e.g., 3 seconds).
4. The client must immediately send a JSON frame containing `{ "type": "authenticate", "token": "eyJhbGci..." }`.
5. If the server validates the token, the connection is upgraded to `AUTHENTICATED`. If the timer expires or validation fails, the server forcibly drops the TCP connection.

*Decision:* The platform defaults to the **Query Parameter Authentication** strategy due to its simplicity and the immediate rejection of unauthorized traffic at the load-balancer/gateway level before allocating ASGI resources.

### CSWSH Protection
To protect against Cross-Site WebSocket Hijacking:
1. The ASGI server must strictly enforce the `AllowedHostsOriginValidator`. Any WebSocket upgrade request originating from an `Origin` not explicitly whitelisted (e.g., `https://portal.entercom.com`) must be rejected.
2. The system does NOT rely on implicit Cookie-based authentication for WebSockets. The explicit inclusion of the JWT in the query string acts as an effective anti-CSRF token.

## Responsibilities
- **Connection Management Service**: Execute the authentication strategy securely, parsing the query string and invoking the validation middleware.
- **Authentication Domain**: Provide a fast, optimized method for validating the JWT signature and expiration without incurring heavy database lookups.

## Dependencies
- **Authentication Domain**: Source of truth for JWT validation.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Access token expiry immediately closes the WebSocket connection.

Client must reconnect after token refresh.

**Decision:** Mandatory First Frame Authentication.

Query-string authentication prohibited.

## Completion Criteria
- The specific mechanism for transmitting the authentication token is defined.
- Protections against CSWSH are mandated.
- Edge cases regarding token expiration during an active connection are highlighted.
