# WebSocket Authentication Flow Implementation

## Purpose
The purpose of this document is to define the technical implementation of the Authentication Flow for WebSocket connections. It specifies how JWT tokens are transmitted, validated, and injected into the ASGI connection scope to ensure secure access.

## Scope
- Implementation of the "First Frame" authentication strategy.
- ASGI Middleware for token validation.
- Handling expired or invalid tokens.

## Out of Scope
- OAuth2 flows or JWT generation logic (handled by the core Authentication domain).

## Definitions
- **First Frame Authentication**: A strategy where the initial TCP handshake occurs without credentials, and the client's very first WebSocket message must contain the authentication token before any other action is permitted.

## Architecture

### 1. The First Frame Strategy
As per the resolved business decision, query-string authentication is prohibited to prevent token leakage in proxy logs.
- The connection is accepted at the TCP level.
- The server sets a short timeout (e.g., 5 seconds) waiting for an `authenticate` frame.
- If the first frame is NOT an `authenticate` command, or if the timeout expires, the connection is forcefully closed.

### 2. JWT Validation Middleware
- The custom Authentication Middleware intercepts the `authenticate` frame.
- It parses the JWT payload and cryptographically verifies the signature against the server's public key.
- Upon success, it extracts the `user_id` and binds a user object to `self.scope['user']`.

### 3. Expiry and Eviction
As per the resolved business decision, token expiry must be strictly enforced.
- The server must periodically check the `exp` claim of the bound token.
- If the token expires while the socket is open, the server immediately drops the connection. The client is responsible for refreshing the token via the REST API and establishing a new WebSocket connection.

## Responsibilities
- **Middleware**: Must execute cryptographic validation asynchronously to prevent blocking the ASGI event loop.
- **Client**: Must ensure the `authenticate` frame is the immediate first action post-handshake.

## Dependencies
- **Authentication Domain**: Provides the JWT verification utilities.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- First Frame authentication mechanics are codified.
- Token validation and expiry lifecycle are defined.
