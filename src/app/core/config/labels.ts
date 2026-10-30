import { AccountStatus } from '../models/account-status';
import { AuditAction } from '../models/audit-action';
import { BankRole } from '../models/bank-role';
import { CustomerStatus } from '../models/customer-status';
import { OperationStatus } from '../models/operation-status';
import { OperationType } from '../models/operation-type';
import { RejectionReason } from '../models/rejection-reason';

export const CUSTOMER_STATUS_LABELS: Readonly<Record<CustomerStatus, string>> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

export const ACCOUNT_STATUS_LABELS: Readonly<Record<AccountStatus, string>> = {
  ACTIVE: 'Actif',
  BLOCKED: 'Bloqué',
  CLOSED: 'Clôturé',
};

export const OPERATION_STATUS_LABELS: Readonly<Record<OperationStatus, string>> = {
  SUCCESS: 'Réussie',
  REJECTED: 'Refusée',
};

export const OPERATION_TYPE_LABELS: Readonly<Record<OperationType, string>> = {
  DEBIT: 'Débit',
  CREDIT: 'Crédit',
};

export const REJECTION_LABELS: Readonly<Record<RejectionReason, string>> = {
  INSUFFICIENT_FUNDS: 'Fonds insuffisants',
  ACCOUNT_BLOCKED: 'Compte bloqué',
  ACCOUNT_CLOSED: 'Compte clôturé',
};

export const AUDIT_ACTION_LABELS: Readonly<Record<AuditAction, string>> = {
  CUSTOMER_CREATED: 'Client créé',
  ACCOUNT_OPENED: 'Compte ouvert',
  ACCOUNT_DEPOSIT: 'Dépôt',
  ACCOUNT_BLOCKED: 'Compte bloqué',
  ACCOUNT_UNBLOCKED: 'Compte débloqué',
  ACCOUNT_CLOSED: 'Compte clôturé',
  CUSTOMER_SUSPENDED: 'Client suspendu',
  CUSTOMER_REACTIVATED: 'Client réactivé',
  AGENT_CREATED: 'Agent créé',
};

export const TARGET_LABELS: Readonly<Record<string, string>> = {
  CUSTOMER: 'Client',
  ACCOUNT: 'Compte',
  AGENT: 'Agent',
};

export const ROLE_LABELS: Readonly<Record<BankRole, string>> = {
  BANK_ADMIN: 'Administrateur',
  BANK_AUDITOR: 'Auditeur',
};

export function labelFrom<T extends string>(labels: Readonly<Record<T, string>>, value: string): string {
  const keys = Object.keys(labels) as T[];
  if (!keys.includes(value as T)) {
    return value;
  }
  return labels[value as T];
}

export function badgeLabel(kind: string, value: string): string {
  if (kind === 'customer') {
    return labelFrom(CUSTOMER_STATUS_LABELS, value);
  }
  if (kind === 'account') {
    return labelFrom(ACCOUNT_STATUS_LABELS, value);
  }
  if (kind === 'operation') {
    return labelFrom(OPERATION_STATUS_LABELS, value);
  }
  if (kind === 'role') {
    return labelFrom(ROLE_LABELS, value);
  }
  return value;
}

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export function badgeTone(kind: string, value: string): BadgeTone {
  if (kind === 'role' && value === 'BANK_ADMIN') {
    return 'info';
  }
  if (kind === 'role') {
    return 'neutral';
  }
  if (value === 'ACTIVE' || value === 'SUCCESS') {
    return 'success';
  }
  if (value === 'SUSPENDED' || value === 'BLOCKED') {
    return 'warning';
  }
  if (value === 'REJECTED') {
    return 'danger';
  }
  return 'neutral';
}

export function rejectionLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Motif non précisé';
  }
  return labelFrom(REJECTION_LABELS, value);
}

export function targetLabel(type: string, id: string): string {
  return `${labelFrom(TARGET_LABELS, type)} ${id}`;
}
