export interface AdminUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  enabled: boolean;
  createdAt: string;
}
