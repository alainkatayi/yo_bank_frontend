export const AUDIT_ACTIONS = [
  'CUSTOMER_CREATED',
  'ACCOUNT_OPENED',
  'ACCOUNT_DEPOSIT',
  'ACCOUNT_BLOCKED',
  'ACCOUNT_UNBLOCKED',
  'ACCOUNT_CLOSED',
  'CUSTOMER_SUSPENDED',
  'CUSTOMER_REACTIVATED',
  'AGENT_CREATED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}
