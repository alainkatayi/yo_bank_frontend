export const BANK_ROLES = ['BANK_ADMIN', 'BANK_AUDITOR'] as const;
export type BankRole = (typeof BANK_ROLES)[number];

export function isBankRole(value: unknown): value is BankRole {
  return value === 'BANK_ADMIN' || value === 'BANK_AUDITOR';
}
