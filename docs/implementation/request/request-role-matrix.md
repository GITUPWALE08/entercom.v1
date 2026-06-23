# Role Permission Matrix

## Customer
- allowed permissions: `request.create`, `request.submit`, `request.cancel`, `quote.approve`, `quote.reject`, `quote.revise`
- denied permissions: `assignment.accept`, `assignment.decline`, `request.update`, `quote.create`, `verification.submit`, `request.triage`, `request.assign`, `verification.verify`, `request.escalate`, `escalation.resolve`, `verification.override`, `request.cancel_active`, `system.override`

## Technician
- allowed permissions: `assignment.accept`, `assignment.decline`, `request.update`, `quote.create`, `verification.submit`
- denied permissions: `request.create`, `request.submit`, `request.cancel`, `quote.approve`, `quote.reject`, `quote.revise`, `request.triage`, `request.assign`, `verification.verify`, `request.escalate`, `escalation.resolve`, `verification.override`, `request.cancel_active`, `system.override`

## Staff
- allowed permissions: `request.triage`, `request.assign`, `request.cancel`, `quote.create`, `verification.verify`
- denied permissions: `request.create`, `request.submit`, `quote.approve`, `quote.reject`, `quote.revise`, `assignment.accept`, `assignment.decline`, `request.update`, `verification.submit`, `request.escalate`, `escalation.resolve`, `verification.override`, `request.cancel_active`, `system.override`

## Manager
- allowed permissions: `request.escalate`, `escalation.resolve`, `verification.override`, `request.cancel_active`, `request.cancel`
- denied permissions: `request.create`, `request.submit`, `quote.approve`, `quote.reject`, `quote.revise`, `assignment.accept`, `assignment.decline`, `request.update`, `quote.create`, `verification.submit`, `request.triage`, `request.assign`, `verification.verify`, `system.override`

## Superadmin
- allowed permissions: `system.override`
- denied permissions: All standard request lifecycle permissions (operates outside normal flow).