export const appPaths = {
  login: '/connexion',
  callback: '/auth/callback',
  dashboard: '/',
  customers: '/clients',
  accounts: '/comptes',
  customerCreate: '/clients/nouveau',
  customer: (id: string) => `/clients/${id}`,
  account: (customerId: string, accountNumber: string) =>
    `/clients/${customerId}/comptes/${accountNumber}`,
  audit: '/audit',
  forbidden: '/interdit',
  unauthorized: '/acces-refuse',
} as const;

export function safeReturnUrl(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return appPaths.dashboard;
  }
  if (value.startsWith(appPaths.login) || value.startsWith(appPaths.callback)) {
    return appPaths.dashboard;
  }
  return value;
}
