import type { RequestItem } from '../../../api/requests';

export interface WorkflowAction {
  id: string;
  label: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  apiAction?: string;
  route?: string;
  disabledReason?: string;
  requiresModal?: boolean; // E.g., for reject/cancel reasons
}

export interface WorkflowResolution {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error' | 'default';
  ownerRole: 'CUSTOMER' | 'STAFF' | 'TECHNICIAN' | 'MANAGER' | 'SYSTEM' | 'NONE';
  primaryCTA?: WorkflowAction;
  secondaryCTAs: WorkflowAction[];
  blockingMessage?: string;
  completionHint?: string;
}

export function resolveWorkflowState(
  request: RequestItem,
  currentRole: 'CUSTOMER' | 'STAFF' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN'
): WorkflowResolution {
  
  const status = request.status;
  const isOwner = currentRole === getOwnerRole(status);

  let resolution: WorkflowResolution = {
    title: 'Unknown State',
    description: 'The request is in an unknown state.',
    severity: 'default',
    ownerRole: 'NONE',
    secondaryCTAs: []
  };

  switch (status) {
    case 'draft':
      resolution = {
        title: 'Draft Request',
        description: 'Your request is saved as a draft. Submit it to begin processing.',
        severity: 'default',
        ownerRole: 'CUSTOMER',
        primaryCTA: { id: 'submit', label: 'Submit Request', variant: 'primary', apiAction: 'submit' },
        secondaryCTAs: [],
      };
      break;
    case 'submitted':
      resolution = {
        title: currentRole === 'STAFF' ? 'Request Ready For Review' : 'Request Submitted',
        description: currentRole === 'STAFF' 
          ? 'A new request has been submitted by the customer. Pick it up to begin triage.' 
          : 'Your request has been submitted and is awaiting staff review.',
        severity: 'info',
        ownerRole: 'STAFF',
        primaryCTA: currentRole === 'STAFF' ? { id: 'pickup', label: 'Pick Up Request', variant: 'primary', apiAction: 'pickup' } : undefined,
        secondaryCTAs: [],
      };
      break;
    case 'staff_review':
      resolution = {
        title: 'Staff Review',
        description: currentRole === 'STAFF' 
          ? 'Triage this request to determine the next steps based on category.' 
          : 'Our staff is currently reviewing your request details.',
        severity: 'info',
        ownerRole: 'STAFF',
        secondaryCTAs: []
      };
      if (currentRole === 'STAFF') {
        // Triage actions depend on what's available or backend rules, 
        // we'll populate the UI dynamically via the components, but we define the base config here.
        resolution.primaryCTA = { id: 'triage_panel', label: 'Triage Actions', variant: 'primary', route: '#triage' };
      }
      break;
    case 'awaiting_quote':
      resolution = {
        title: 'Awaiting Quote',
        description: currentRole === 'STAFF' 
          ? 'Prepare and issue a quote for this request.' 
          : 'We are preparing a custom quote for your request.',
        severity: 'warning',
        ownerRole: 'STAFF',
        primaryCTA: currentRole === 'STAFF' ? { id: 'open_quote', label: 'Manage Quotes', variant: 'primary', route: '#quotes' } : undefined,
        secondaryCTAs: [],
      };
      break;
    case 'awaiting_customer_approval':
      resolution = {
        title: 'Quote Ready',
        description: currentRole === 'CUSTOMER' 
          ? 'Please review and respond to the quote below.' 
          : 'Waiting for the customer to approve or reject the quote.',
        severity: 'warning',
        ownerRole: 'CUSTOMER',
        primaryCTA: currentRole === 'CUSTOMER' ? { id: 'review_quote', label: 'Review Quote', variant: 'primary', route: '#quote-approval' } : undefined,
        secondaryCTAs: [],
      };
      break;
    case 'awaiting_payment':
      resolution = {
        title: 'Payment Required',
        description: currentRole === 'CUSTOMER' 
          ? 'Work cannot begin until payment is completed.' 
          : 'Waiting for the customer to complete payment.',
        severity: 'warning',
        ownerRole: 'CUSTOMER',
        primaryCTA: currentRole === 'CUSTOMER' ? { id: 'pay_now', label: 'Pay Now', variant: 'primary', route: '#checkout' } : undefined,
        secondaryCTAs: [],
        blockingMessage: 'Payment must be received before assignment.'
      };
      break;
    case 'awaiting_assignment':
      resolution = {
        title: 'Awaiting Assignment',
        description: currentRole === 'STAFF' || currentRole === 'MANAGER' 
          ? 'Assign a technician to this request.' 
          : 'We are locating an available technician for your request.',
        severity: 'info',
        ownerRole: 'STAFF',
        primaryCTA: ['STAFF', 'MANAGER'].includes(currentRole) ? { id: 'assign', label: 'Assign Technician', variant: 'primary', route: '#assignment' } : undefined,
        secondaryCTAs: [],
      };
      break;
    case 'assigned':
      resolution = {
        title: 'Technician Assigned',
        description: currentRole === 'TECHNICIAN' 
          ? 'You have been assigned to this request. Accept or decline.' 
          : 'A technician has been assigned and must accept the job.',
        severity: 'info',
        ownerRole: 'TECHNICIAN',
        primaryCTA: currentRole === 'TECHNICIAN' ? { id: 'accept', label: 'Accept Assignment', variant: 'primary', apiAction: 'accept' } : undefined,
        secondaryCTAs: currentRole === 'TECHNICIAN' ? [{ id: 'decline', label: 'Decline', variant: 'danger', requiresModal: true }] : [],
      };
      break;
    case 'in_progress':
      resolution = {
        title: 'Work In Progress',
        description: currentRole === 'TECHNICIAN' 
          ? 'Track your progress and mark work as finished when done.' 
          : 'The assigned technician is currently working on your request.',
        severity: 'info',
        ownerRole: 'TECHNICIAN',
        primaryCTA: currentRole === 'TECHNICIAN' ? { id: 'mark_finished', label: 'Complete Work', variant: 'primary', route: '#finish-work' } : undefined,
        secondaryCTAs: [],
      };
      break;
    case 'pending_verification':
      resolution = {
        title: 'Verification Pending',
        description: currentRole === 'STAFF' 
          ? 'Review the completed work and approve or reject it.' 
          : 'Staff is reviewing the completed work for quality assurance.',
        severity: 'warning',
        ownerRole: 'STAFF',
        primaryCTA: currentRole === 'STAFF' ? { id: 'verify', label: 'Verify Work', variant: 'primary', route: '#verification' } : undefined,
        secondaryCTAs: [],
      };
      break;
    case 'escalated':
      resolution = {
        title: 'Escalated',
        description: currentRole === 'MANAGER' 
          ? 'This request has been escalated and requires managerial resolution.' 
          : 'This request has been escalated and is under review by management.',
        severity: 'error',
        ownerRole: 'MANAGER',
        primaryCTA: currentRole === 'MANAGER' ? { id: 'resolve', label: 'Resolve Escalation', variant: 'primary', route: '#resolve-escalation' } : undefined,
        secondaryCTAs: [],
      };
      break;
    case 'completed':
      resolution = {
        title: 'Completed Successfully',
        description: 'This request has been completed.',
        severity: 'success',
        ownerRole: 'NONE',
        secondaryCTAs: [],
        completionHint: 'No further action is required.'
      };
      break;
    case 'cancelled':
      resolution = {
        title: 'Cancelled',
        description: 'This request has been cancelled.',
        severity: 'default',
        ownerRole: 'NONE',
        secondaryCTAs: [],
      };
      break;
  }

  // Common overrides based on permissions can go here, like if a role doesn't actually own it, we disable the CTA
  if (!isOwner && resolution.primaryCTA) {
    resolution.primaryCTA.disabledReason = `Waiting on ${resolution.ownerRole}`;
  }

  return resolution;
}

export function getOwnerRole(status: string): 'CUSTOMER' | 'STAFF' | 'TECHNICIAN' | 'MANAGER' | 'SYSTEM' | 'NONE' {
  switch (status) {
    case 'draft':
    case 'awaiting_customer_approval':
    case 'awaiting_payment':
      return 'CUSTOMER';
    case 'submitted':
    case 'staff_review':
    case 'awaiting_quote':
    case 'awaiting_assignment':
    case 'pending_verification':
      return 'STAFF';
    case 'assigned':
    case 'in_progress':
      return 'TECHNICIAN';
    case 'escalated':
      return 'MANAGER';
    case 'completed':
    case 'cancelled':
      return 'NONE';
    default:
      return 'SYSTEM';
  }
}
