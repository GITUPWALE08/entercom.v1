Required tests:

Hierarchy:
- Manager cannot create Manager
- Manager cannot create SuperAdmin
- Staff cannot modify Staff

Ownership:
- Customer cannot access other customer requests
- Technician cannot access unassigned jobs

Permission:
- Deny-by-default returns 403
- Missing permission returns deny

Cache:
- Role change invalidates cache immediately

Approval:
- Expired approval auto-rejects
- Dual approval enforced

Audit:
- Permission denial logged
- Override logged

Websocket:
- JWT auth enforced
- Permission checks enforced

PII:
- Customer address masking
- Staff payment masking