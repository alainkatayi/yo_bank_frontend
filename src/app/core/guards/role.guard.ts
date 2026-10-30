import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { appPaths } from '../config/app-paths';
import { BankRole, isBankRole } from '../models/bank-role';
import { SessionStore } from '../services/session.store';

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const allowed = readRoles(route.data['roles']);
  if (allowed.length === 0 || allowed.some((role) => session.roles().includes(role))) {
    return true;
  }
  return router.createUrlTree([appPaths.forbidden]);
};

function readRoles(value: unknown): BankRole[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isBankRole);
}
