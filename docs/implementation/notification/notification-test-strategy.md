# Notification Test Strategy

## Purpose
The purpose of this document is to define the testing methodologies and coverage requirements for the Notification Domain. Because this domain involves complex asynchronous workflows, external provider integrations, and strict delivery guarantees, a robust and layered testing strategy is mandatory to ensure reliability.

## Scope
- Unit testing for the logical service layer and preference resolution.
- Integration testing for database transactions and Celery task execution.
- Mocking strategies for external Email and Push providers.
- Testing the backoff and retry mathematics.

## Out of Scope
- End-to-End (E2E) UI testing using tools like Cypress/Playwright (this document focuses on backend Python/Django testing).
- Load testing or benchmarking the Redis cluster.

## Definitions
- **Unit Test**: A fast, isolated test verifying a single function or class method without interacting with the database or external services.
- **Integration Test**: A test that verifies the interaction between multiple components, including the PostgreSQL database and the Celery task broker.
- **Mock**: A simulated object that mimics the behavior of real external APIs (e.g., simulating a SendGrid HTTP 429 response) in controlled ways.

## Architecture

### 1. Unit Testing Layer
The core business logic must be thoroughly tested in isolation to ensure rapid feedback during development.
- **Preference Resolution**: Tests must verify that the `PreferenceResolverService` correctly merges global defaults with user overrides, accurately honors the `is_system_critical` bypass flag, and securely drops channels the user has explicitly disabled.
- **Failure Classification**: Tests must pass various HTTP exception objects into the `FailureClassificationService` and assert that they are correctly binned into `TRANSIENT` or `PERMANENT` categories according to the defined matrix.
- **Backoff Mathematics**: Tests must validate the exponential backoff algorithm, ensuring the maximum delay cap is enforced and jitter is appropriately applied without exceeding limits.

### 2. Integration Testing Layer
Integration tests ensure that the domain correctly orchestrates its asynchronous boundaries.
- **Transaction Integrity**: Tests must assert that when the `NotificationOrchestrator` receives an event, both the `Notification` record and the multiple `DeliveryAttempt` records are successfully created in the test database, and the relevant Celery tasks are appended to the queue.
- **Tenancy Enforcement**: API integration tests must use the Django Test Client to verify that User A receives a 404 Not Found when attempting to mark User B's notification as read.
- **Retention Sweeps**: Tests must mock the system clock (e.g., using `freezegun`) to fast-forward time, run the Celery Beat retention jobs, and assert that expired notifications are correctly archived or purged from the database.

### 3. External Provider Mocking Strategy
The test suite MUST NOT send real emails or push notifications to external APIs during execution.
- **Dispatcher Tests**: The `EmailDispatcher` and `PushDispatcher` must utilize mocking libraries (e.g., `responses` or `unittest.mock`) to intercept outbound HTTP requests.
- **Simulating Failures**: Tests must specifically mock provider failure responses (e.g., a mock returning HTTP 429 with a `Retry-After: 60` header) and assert that the `DeliveryProcessingService` correctly halts, transitions the state to `FAILED`, and enqueues the retry task with the explicit 60-second delay.

## Responsibilities
- **Developers**: Must achieve 100% test coverage on the `PreferenceResolverService` and `FailureClassificationService` due to their critical role in data privacy and system stability.
- **CI/CD Pipeline**: Must run the full integration suite against a real PostgreSQL and Redis instance (via Docker services) before merging code.

## Dependencies
- **pytest**: The standard test runner framework.
- **pytest-django**: For database transaction handling and test client utilities.
- **celery.contrib.testing**: For evaluating task execution synchronously during tests.

## Open Questions
- None. The strategy provides a comprehensive safety net for the implementation phase.

## Completion Criteria
- Requirements for mocking external providers are strictly enforced.
- The separation between rapid unit tests (logic) and slower integration tests (database/Celery) is defined.
- Critical paths (Preference Resolution, Retry Mathematics, Tenancy) are mandated for comprehensive coverage.
