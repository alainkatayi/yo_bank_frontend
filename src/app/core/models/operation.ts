import { OperationStatus } from './operation-status';
import { OperationType } from './operation-type';
import { RejectionReason } from './rejection-reason';

export interface AccountOperation {
  reference: string;
  type: OperationType;
  status: OperationStatus;
  rejectionReason?: RejectionReason;
  balanceAfter?: string;
  createdAt: string;
}
