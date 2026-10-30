import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./pages/login/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback-page').then((module) => module.AuthCallbackPage),
  },
  {
    path: 'acces-refuse',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized-page').then((module) => module.UnauthorizedPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/app-shell').then((module) => module.AppShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/dashboard/dashboard-page').then((module) => module.DashboardPage),
      },
      {
        path: 'clients/nouveau',
        canActivate: [roleGuard],
        data: { roles: ['BANK_ADMIN'] },
        loadComponent: () =>
          import('./pages/customers/customer-create-page').then((module) => module.CustomerCreatePage),
      },
      {
        path: 'clients/:customerId/comptes/:accountNumber',
        loadComponent: () =>
          import('./pages/accounts/account-detail-page').then((module) => module.AccountDetailPage),
      },
      {
        path: 'clients/:customerId',
        loadComponent: () =>
          import('./pages/customers/customer-detail-page').then((module) => module.CustomerDetailPage),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./pages/customers/customer-list-page').then((module) => module.CustomerListPage),
      },
      {
        path: 'comptes',
        loadComponent: () =>
          import('./pages/accounts/account-list-page').then((module) => module.AccountListPage),
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit/audit-log-page').then((module) => module.AuditPage),
      },
      {
        path: 'interdit',
        loadComponent: () => import('./pages/forbidden/forbidden-page').then((module) => module.ForbiddenPage),
      },
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found-page').then((module) => module.NotFoundPage),
      },
    ],
  },
];
