import { AccountStatus } from './account-status';

export interface Account {
  accountNumber: string;
  balance: string;
  status: AccountStatus;
  holderName?: string;
}
