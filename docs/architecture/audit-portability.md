# Audit Logging Portability & Compatibility Review

## Overview

The audit logging system (`apps/audit_logs`) has been designed to meet stringent zero-trust, forensic-grade standards. To achieve this level of security, the system leverages certain database-specific features, notably PostgreSQL triggers and session-level configurations (`SET LOCAL`).

This document outlines the PostgreSQL-specific behaviors, their impact on portability (e.g., when running on SQLite for local development or MySQL), and the fallback strategies employed to ensure the application remains functional across different database backends.

## PostgreSQL-Specific Behaviors

### 1. Database Triggers (Immutability)

- **Feature:** PostgreSQL triggers prevent any `UPDATE` or `DELETE` operations on the `audit_logs_entry` table, ensuring an append-only guarantee at the database level.
- **Location:** Defined in migrations `0003_db_immutability_triggers.py` and `0004_retention_trigger_bypass.py`.
- **Portability Impact:** These triggers are written in PL/pgSQL and are only applied when `connection.vendor == "postgresql"`.
- **Fallback Strategy:** For non-PostgreSQL databases (like SQLite used in some test environments), the migrations silently bypass the trigger creation. Immutability is partially enforced at the application level, but true forensic immutability requires PostgreSQL in production.

### 2. Retention Bypass via `SET LOCAL`

- **Feature:** To allow the background retention worker to delete old logs without being blocked by the immutability triggers, the system temporarily sets a local session variable: `SET LOCAL audit.retention_purge = 'on'`. The trigger function checks this variable and allows the deletion if set.
- **Location:** `apps/audit_logs/services/retention_service.py` (`_enable_retention_purge`).
- **Portability Impact:** `SET LOCAL` and custom session variables are PostgreSQL-specific.
- **Fallback Strategy:** The `_enable_retention_purge` function and the batch delete logic explicitly check `if connection.vendor == "postgresql"`. For other databases, the retention service will fallback to application-level operations (e.g., updating the `archived_at` timestamp rather than a hard delete, or using standard Django `delete()` if the triggers are not present).

## Fallback Strategy Summary

1. **Local Development (SQLite):**
   - The system works seamlessly.
   - DB triggers are not created.
   - Retention script uses application-level updates or standard deletes.
   - Ideal for rapid prototyping and unit testing where forensic guarantees are not the primary concern.

2. **Production (PostgreSQL):**
   - FULL forensic guarantees.
   - Immutability enforced by DB triggers.
   - Strict retention controls via session variables.
   - Requires PostgreSQL 12+.

## Warning

**Do NOT remove the PostgreSQL enforcement checks.** The system is designed to fail open gracefully for local development but must enforce strict forensic boundaries in production environments running PostgreSQL.