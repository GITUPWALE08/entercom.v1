# Payment Lifecycle

## 1. Purpose
The purpose of this document is to define the definitive states and transition rules for Payment records within the Entercom platform. It ensures financial integrity by strictly controlling the progression from initialization to settlement or cancellation.

## 2. Scope
This lifecycle applies to all payment records created via the Payment Provider provider integration.

## 3. Out of Scope
* Refund, reversal, or escrow states.
* Partially paid or installment states.
* Any state not explicitly listed in Section 6.

## 4. Actors
* **Customer:** Initiates attempt and retries.
* **System:** Enforces expiration and initializes records.
* **Webhook:** Authoritative trigger for state transitions.

## 5. Lifecycle Diagram
```text
      [Start]
         ↓
     (pending) ←────────┐
         ↓              │ (Retry)
    ┌────┴────┐         │
    ↓         ↓         │
 (paid)*   (failed) ────┘
    ↓         ↓
  [End]   (cancelled)*
              ↓
            [End]

* Terminal State
```

## 6. Approved States
* **`pending`:** Initial state. Awaiting authoritative webhook notification.
* **`paid`:** Terminal successful state. Verified webhook confirms full settlement.
* **`failed`:** Non-terminal failure state. Provider confirms a declined attempt.
* **`cancelled`:** Terminal failure state. Triggered by 24-hour expiration or manual order termination.

## 7. Transition Matrix

| Start State | End State | Trigger Source | Rule |
| :--- | :--- | :--- | :--- |
| `None` | `pending` | Order Creation | System initialization. |
| `pending` | `paid` | Webhook | Verified server-to-server data only. |
| `pending` | `failed` | Webhook (Failed) | Non-terminal; Order remains `pending_payment`. |
| `pending` | `cancelled`| Background Job | Occurs at T+24 hours. |
| `failed` | `pending` | Customer Retry | Initiates new session for the same Order. |
| `failed` | `cancelled`| Background Job | Occurs at T+24 hours. |

## 8. Detailed Lifecycle Rules

### 8.1 State & Transition Ownership
* **System Ownership:** `pending` and `cancelled` states.
* **Webhook Authority:** The Payment Domain holds sole authority to transition a record to `paid` or `failed`.

### 8.2 Retry Behavior
* A `failed` payment does NOT cancel the Order.
* The Order remains in `pending_payment` state.
* The Customer may retry the payment. This uses the SAME Payment record, but generates a new `provider_reference`. No new Payment object is created.

### 8.3 Expiration Behavior
* A Background Job is the sole producer of payment expiration. Expiration is not user-initiated.
* Expiration transitions the Payment, Order, and Request to `cancelled`.
* Expiration is a terminal transition.

### 8.4 Forbidden Transitions
* Once in a terminal state (`paid` or `cancelled`), no further transitions are permitted.
* System state MUST NOT be updated based on frontend redirects.

## 9. Failure Scenarios

### 9.1 Declined Attempt
* **Status:** `failed`.
* **Behavior:** Order preserved; retry allowed.

### 9.2 Payment Window Breach
* **Status:** `cancelled`.
* **Behavior:** Order terminated; financial commitment voided.

## 10. Audit & Event Touchpoints
* Every transition must emit a domain event (`payment.success`, etc.).
* Audit logs must capture the `correlation_id` and raw webhook reference.

## 11. Completion Criteria
* State machine prevents premature inventory reduction.
* Expiration policy is handled autonomously.
* Failed attempts are recoverable within the 24-hour window.
