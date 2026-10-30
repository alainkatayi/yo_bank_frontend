import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { appPaths } from '../../core/config/app-paths';
import { SessionStore } from '../../core/services/session.store';
import { Spinner } from '../../components/ui/spinner';

@Component({
  selector: 'app-auth-callback-page',
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-canvas p-6">
      <app-spinner label="Redirection en cours…" />
    </main>
  `,
})
export class AuthCallbackPage {
  constructor() {
    const session = inject(SessionStore);
    const router = inject(Router);
    if (!session.isAuthenticated()) {
      void router.navigateByUrl(appPaths.login);
      return;
    }
    if (!session.hasBankAccess()) {
      void router.navigateByUrl(appPaths.unauthorized);
      return;
    }
    void router.navigateByUrl(appPaths.dashboard);
  }
}
