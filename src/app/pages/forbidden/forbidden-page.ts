import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appPaths } from '../../core/config/app-paths';
import { Card } from '../../components/ui/card';

@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card>
      <div class="p-8">
        <p class="text-sm font-medium text-muted">403</p>
        <h1 class="mt-2 text-2xl font-semibold text-ink">Action non autorisée</h1>
        <p class="mt-2 text-sm text-muted">Cette page est réservée aux administrateurs.</p>
        <a class="mt-6 inline-block text-sm font-medium text-navy" [routerLink]="home">Retour au tableau de bord</a>
      </div>
    </app-card>
  `,
})
export class ForbiddenPage {
  protected readonly home = appPaths.dashboard;
}
