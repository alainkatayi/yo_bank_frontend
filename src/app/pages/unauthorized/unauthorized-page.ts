import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appPaths } from '../../core/config/app-paths';
import { AuthService } from '../../core/services/auth.service';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

@Component({
  selector: 'app-unauthorized-page',
  imports: [RouterLink, Button, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-canvas p-4">
      <app-card>
        <div class="max-w-md p-8 text-center">
          <h1 class="text-2xl font-semibold text-ink">Accès non autorisé</h1>
          <p class="mt-2 text-sm text-muted">
            Votre compte n’a ni le rôle administrateur ni le rôle auditeur. Vous ne pouvez pas ouvrir l’espace d’administration.
          </p>
          <div class="mt-6 flex justify-center">
            <app-button (click)="auth.logout()">Se déconnecter</app-button>
          </div>
          <a class="mt-4 inline-block text-sm text-navy" [routerLink]="login">Retour à la connexion</a>
        </div>
      </app-card>
    </main>
  `,
})
export class UnauthorizedPage {
  protected readonly auth = inject(AuthService);
  protected readonly login = appPaths.login;
}
