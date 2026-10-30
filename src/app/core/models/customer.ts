import { CustomerStatus } from './customer-status';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  status: CustomerStatus;
  createdAt: string;
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}
