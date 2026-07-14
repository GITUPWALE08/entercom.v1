# Notification Email Specification

## Purpose
The purpose of this document is to define the technical requirements for rendering, formatting, and dispatching Email notifications to external providers. It ensures that emails sent by the platform are secure, compliant with anti-spam regulations, and consistently branded.

## Scope
- HTML and Plain Text template rendering.
- Metadata requirements (Subject lines, From addresses).
- Deep linking and authentication handling via email.
- Unsubscribe (CAN-SPAM/GDPR) compliance handling.
- Idempotency and provider response parsing.

## Out of Scope
- Selection of a specific third-party email vendor (e.g., SendGrid, Postmark).
- The visual CSS design of the email templates.
- DMARC, DKIM, and SPF DNS configurations.

## Definitions
- **Template Context**: The dictionary of variables passed to the templating engine to generate the final email string (e.g., `{{ user.first_name }}`).
- **Deep Link**: A URL embedded in the email that routes the user directly to a specific state or resource in the frontend application.
- **Idempotency Key**: A unique identifier sent in the email header to prevent the provider from sending duplicate emails in the event of a network timeout.

## Architecture

### 1. Template Rendering Pipeline
When the `DeliveryProcessingService` executes an Email dispatch task:
1. **Context Hydration**: The dispatcher takes the raw JSON context from the `Notification` record and fetches any required user profile data (e.g., fetching the current email address from the Users domain).
2. **Template Selection**: It selects the correct base template based on the `notification.category` or `notification.event_type`.
3. **Dual Rendering**: The template engine MUST render both an HTML version (for modern clients) and a Plain Text version (for accessibility and spam-score optimization).

### 2. Deep Linking and Authentication
Emails must safely guide users back to the platform without compromising security.
- **URLs**: All links must be absolute, pointing to the frontend domain configured in the environment variables (e.g., `https://portal.entercom.com/requests/1024`).
- **Authentication**: Emails MUST NOT contain raw access tokens or "magic links" that bypass standard login unless explicitly designed as a secure authentication flow (e.g., Password Reset). Users clicking a deep link who are not currently logged in will be routed to the login page and redirected to the resource post-authentication by the frontend router.

### 3. Compliance and Unsubscribe
To comply with global anti-spam laws, the email payload must include strict opt-out mechanisms.
- **Unsubscribe Link**: Every non-system-critical email MUST append an unsubscribe link in the footer.
- **One-Click Unsubscribe**: The link should route to a frontend endpoint (e.g., `/settings/notifications`) or a dedicated rapid-unsubscribe API endpoint that immediately updates the user's `NotificationPreference` record for that specific category.
- **System Critical Exemption**: Emails categorized as System Critical (Password Resets, Security Alerts, Legal Notices) are exempt from the unsubscribe requirement.

### 4. Dispatch and Idempotency
- The dispatcher constructs the final API payload for the external provider.
- It injects the `DeliveryAttempt.id` as a custom header or idempotency key.
- Upon receiving a response, it parses the HTTP status code according to the `notification-retry-policy.md`.
- It saves the provider's `message_id` (receipt) into the `DeliveryAttempt.provider_response` JSONB field for future diagnostic tracking.

## Responsibilities
- **Email Dispatcher**: Must gracefully handle the absence of a valid email address (e.g., if a user profile is incomplete) by marking the delivery as a Permanent Failure (`DEAD_LETTERED`) without crashing.
- **Template Engine**: Ensure all user-generated content injected into the email context is strictly HTML-escaped to prevent injection vulnerabilities.

## Dependencies
- **Template Engine**: Django Templates or Jinja2 for rendering the HTML/Text strings.
- **Users Domain**: Source of truth for the recipient's current email address.

## Open Questions
- None. The specification provides clear technical boundaries for implementing the email channel.

## Completion Criteria
- The requirement for dual HTML/Plain Text rendering is codified.
- The compliance requirements (Unsubscribe handling and System Critical exemptions) are defined.
- Deep linking constraints (no magic authentication) are established.
