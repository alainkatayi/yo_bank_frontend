export const AUDIT_TARGET_TYPES = ['CUSTOMER', 'ACCOUNT', 'AGENT'] as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];
