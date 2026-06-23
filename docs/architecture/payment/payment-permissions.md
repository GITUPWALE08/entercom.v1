# Payment Permissions Architecture

## 1. Purpose
The purpose of this document is to define the Role-Based Access Control (RBAC) boundaries for the Payment Domain within the Entercom platform. It establishes the permissions governing payment initialization, viewing, reconciliation, and the strict security constraints surrounding authoritative webhook processing.

## 2. Scope
This document covers:
* RBAC permissions for Payment tracking and initialization.
* Webhook processing authorization.
* Administrative boundaries for financial reconciliation.
* The mandatory rule enforcing system-only state transitions for settlements.

## 3. Out of Scope
* Permissions for Order creation or Fulfillment (Covered in Order Permissions).
* Product and Inventory management permissions (Covered in Product Permissions).
* Implementation details of the cryptographic signature verification.
* Refund, chargeback, or dispute management workflows.

## 4. Definitions
* **Reconciliation:** The administrative action of comparing platform payment records against external provider logs (viewing only, not mutating state).
* **System Actor:** An automated, non-human identity (e.g., the Webhook Listener or a Background Job) operating with elevated, specific privileges.

## 5. Permission Inventory

### 5.1 Payment Permissions
* `payment.view_own`
* `payment.view`
* `payment.initialize`
* `payment.cancel`
* `payment.reconcile`

### 5.2 Webhook Permissions
* `webhook.process`
* `webhook.view`

## 6. Role Matrix

| Action | Customer | Staff | Manager | Superadmin | System |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `payment.view_own` | ALLOW | N/A | N/A | N/A | N/A |
| `payment.view` | DENY | ALLOW | ALLOW | ALLOW | N/A |
| `payment.initialize`| ALLOW | DENY | DENY | ALLOW | N/A |
| `payment.cancel` | DENY | DENY | ALLOW | ALLOW | ALLOW |
| `payment.reconcile` | DENY | DENY | ALLOW | ALLOW | N/A |
| `webhook.view` | DENY | DENY | ALLOW | ALLOW | N/A |
| `webhook.process` | DENY | DENY | DENY | DENY | ALLOW |

## 7. Permission Specifications

### 7.1 `payment.initialize`
* **Purpose:** Allows the creation of a pending payment record and the generation of a Payment Provider reference.
* **Scope:** Customers (for their own orders) and Superadmins.
* **Restrictions:** Can only be invoked against an Order in the `pending_payment` state.

### 7.2 `payment.view_own` & `payment.view`
* **Purpose:** Allows querying of payment status, amounts, and references.
* **Scope:** Customers (`view_own`) are strictly limited via IDOR to payments linked to their orders. Staff/Manager/Superadmin (`view`) have global visibility.
* **Restrictions:** Customers cannot view other users' financial data.

### 7.3 `payment.reconcile` & `webhook.view`
* **Purpose:** Allows elevated administrative roles to audit raw webhook logs and compare internal states against provider dashboards.
* **Scope:** Global.
* **Restrictions:** Strictly denied to Customers and standard Staff.
* **Ownership:** Administrative.

### 7.4 `webhook.process`
* **Purpose:** Grants authority to execute the atomic state transitions resulting from provider notifications.
* **Scope:** System only.
* **Restrictions:** Users never execute webhook processing manually.
* **Ownership:** Explicitly System-owned.

## 8. Payment Security Rules
### 8.1 The "System-Only" Settlement Mandate
The transition to the `paid` state is the most critical financial operation in the platform.
* The `payment.paid` state **CANNOT be manually triggered** by any human role: Customer, Staff, Manager, or Superadmin.
* **Only verified webhook processing (`webhook.process`) may create the `payment.paid` state.**
* Any attempt to bypass the webhook listener to force a success state must be structurally rejected by the service layer.

## 9. Transition Ownership Matrix

| Transition | Start State | End State | Owner | Trigger | Authority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Initialize** | `None` | `pending` | Customer | `payment.initialize` | RBAC |
| **Settle** | `pending` | `paid` | System | Verified Webhook | Provider Canonical Truth |
| **Decline** | `pending` | `failed` | System | Verified Webhook | Provider Canonical Truth |
| **Retry** | `failed` | `pending` | Customer | `payment.initialize` | RBAC |
| **Cancel (Admin)**| `pending` | `cancelled`| Manager+ | `payment.cancel` | RBAC |
| **Expire (System)**| `pending` | `cancelled`| System | 24h Expiration Job | Background Job |

## 10. Restrictions & Security Requirements
* **Customer Isolation:** Customers MUST NOT have any ability to access the reconciliation or webhook viewing tools.
* **Staff Restrictions:** Staff can view payment statuses to assist customers but cannot perform deep financial reconciliation or manual cancellations.

## 11. Dependencies
* **Payment Domain Architecture:** Defines the states governed by these permissions.
* **Payment Provider Webhook Flow:** Implements the `webhook.process` authority.

## 12. Open Questions
* None at this time.

## 13. Completion Criteria
* The absolute restriction preventing manual settlement transitions is codified.
* Webhook processing is explicitly defined as a system-owned operation.
* Customer access is strictly isolated to their own payment records.
