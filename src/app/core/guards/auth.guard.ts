import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { appPaths } from '../config/app-paths';
import { SessionStore } from '../services/session.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  if (!session.isAuthenticated()) {
    return router.createUrlTree([appPaths.login], {
      queryParams: { returnUrl: state.url },
    });
  }
  if (!session.hasBankAccess()) {
    return router.createUrlTree([appPaths.unauthorized]);
  }
  return true;
};
