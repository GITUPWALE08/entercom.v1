# To-Do List

This document keeps track of features, technical debt, and tasks that were missed or temporarily bypassed during development.

## Features & Improvements
- [ ] **Notifications & Emails**: Implement the full notification and emailing system to reliably deliver system alerts, workflow updates, and transactional emails.
- [ ] **Evidence / Photo Evidence**: Implement the feature to allow technicians to properly upload and attach photo evidence during the verification submission process.
- [ ] **Timeline Privacy**: Hide internal staff actions and status transitions from the customer-facing timeline. Customers should not be allowed to view internal staff activities.

## Infrastructure & Security
- [ ] **Celery SSL Certificate**: Replace the temporary/missing SSL certificate in the Celery configuration with a proper, valid certificate for secure broker communication.
