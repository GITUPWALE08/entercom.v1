# WebSocket Test Strategy

## Purpose
The purpose of this document is to define the testing methodologies and coverage requirements for the WebSocket Domain. Testing asynchronous, stateful connections requires a different approach than standard HTTP stateless testing.

## Scope
- Unit testing Consumers and ASGI middleware.
- Integration testing with the Redis Channel Layer.
- Testing authorization eviction and reconnection advisory workflows.

## Out of Scope
- Load testing or benchmarking maximum connection limits (handled by dedicated load testing tools in staging).

## Definitions
- **Channels Communicator**: A testing utility provided by Django Channels (`channels.testing.WebsocketCommunicator`) used to simulate client interactions within unit tests.

## Architecture

### 1. Unit Testing Layer
The core ASGI logic must be tested without requiring a running Redis instance (using the InMemoryChannelLayer).
- **Authentication**: Tests must verify that a connection drops if the First Frame is not `authenticate`, and succeeds if a valid mocked JWT is provided.
- **Routing**: Tests must assert that sending a valid JSON payload triggers the correct internal method, while malformed JSON returns an error frame.
- **Heartbeats**: Tests must simulate time progression to ensure the server disconnects the communicator if a `ping` is not received within 65 seconds.

### 2. Integration Testing Layer
Integration tests ensure that the backplane and pub/sub mechanics operate correctly.
- **Broadcast Integrity**: A test must instantiate two separate `WebsocketCommunicator` instances, subscribe both to the same `resource.request.1024` channel, publish an event via the `EventPublisher`, and assert that both communicators receive the exact same payload.
- **Eviction Testing**: Tests must simulate a permission revocation event and assert that the Subscription Manager correctly executes a `group_discard` and forces an `UNSUBSCRIBE` frame down to the active communicator.

### 3. Reconnection Advisory Testing
- Tests must invoke the server shutdown hook and assert that all active communicators receive the `system_reconnect_advisory` frame before the connections are forcibly closed.

## Responsibilities
- **Developers**: Must utilize `pytest-asyncio` and the `WebsocketCommunicator` to achieve high coverage on the Consumer logic and Subscription Manager.

## Dependencies
- **pytest-asyncio**: Required for testing asynchronous consumer methods.
- **channels.testing**: Provides the necessary mocking utilities for the ASGI application.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- Testing methodologies for First Frame Authentication, broadcasting, and eviction are defined.
- The use of `WebsocketCommunicator` and in-memory layers is mandated.
