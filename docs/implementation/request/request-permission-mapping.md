# Request Permission Mapping

## 1. File Purpose
Maps RBAC roles (Customer, Technician, Staff, Manager) to granular actions within the Request system, ensuring secure access and transition boundaries.

## 2. Scope
*   Role-to-action permissions.
*   State-based access restrictions.
*   Permission matrix for core lifecycle operations.

## 3. Out of Scope
- Code-level `has_permission` checks.
- Identity provider configuration.

## 4. Full Content

### 4.1 Permission Matrix

| Action | Customer | Technician | Staff | Manager |
| :--- | :---: | :---: | :---: | :---: |
| **View Request** | Owned | Assigned | Global | Global |
| **Edit Draft** | Owned | No | No | No |
| **Submit Request** | Owned | No | No | No |
| **Assign Tech** | No | No | Global | Global |
| **Accept/Decline** | No | Assigned | No | No |
| **Perform Work** | No | Assigned | No | No |
| **Create Quote** | No | Assigned | Global | Global |
| **Approve Quote** | Owned | No | No | No |
| **Reject Quote** | Owned | No | No | No |
| **Revise Quote** | Owned | No | No | No |
| **Verify Work** | No | No | Global | Global |
| **Verify Override**| No | No | No | Global |
| **Escalate** | No | Assigned | Global | Global |
| **Cancel** | Pre-Assignment | No | Pre-Assignment | Global |

### 4.2 Permission Definitions

#### 4.2.1 Customer
*   **Purpose**: Allow users to request services and manage their own financial commitments.
*   **Scope**: "Owned" resources only.
*   **Restrictions**: Strictly blocked from cancellation once a technician is assigned/engaged.

#### 4.2.2 Technician
*   **Purpose**: Allow field workers to accept work and provide evidence of fulfillment.
*   **Scope**: "Assigned" resources only.
*   **Restrictions**: Cannot verify their own work. Cannot cancel assignments (must decline instead).

#### 4.2.3 Staff
*   **Purpose**: Triage requests and orchestrate technician dispatch.
*   **Scope**: Global read/write for triage and assignment.
*   **Restrictions**: Cannot cancel active `in_progress` work without Manager approval.

#### 4.2.4 Manager
*   **Purpose**: Oversight, override authority, and escalation resolution.
*   **Scope**: Universal.
*   **Restrictions**: None within the Request domain.

#### 4.2.5 Transition Ownership Matrix

| Transition | Primary Actor | Permission Gate |
| :--- | :--- | :--- |
| draft -> submitted | Customer | `request.create` |
| submitted -> assigned | Staff | `request.assign` |
| assigned -> in_progress | Technician | `assignment.accept` |
| in_progress -> pending_verification | Technician | `request.fulfill` |
| pending_verification -> completed | Staff | `request.verify` |
| Any -> escalated | System/Staff | `request.escalate` |
| Any -> cancelled | Actor | `request.cancel` |
