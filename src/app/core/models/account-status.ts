export const ACCOUNT_STATUSES = ['ACTIVE', 'BLOCKED', 'CLOSED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
