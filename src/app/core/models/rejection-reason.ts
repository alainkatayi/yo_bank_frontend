export const REJECTION_REASONS = ['INSUFFICIENT_FUNDS', 'ACCOUNT_BLOCKED', 'ACCOUNT_CLOSED'] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];
