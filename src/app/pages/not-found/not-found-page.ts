import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appPaths } from '../../core/config/app-paths';
import { Card } from '../../components/ui/card';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card>
      <div class="p-8">
        <p class="text-sm font-medium text-muted">404</p>
        <h1 class="mt-2 text-2xl font-semibold text-ink">Page introuvable</h1>
        <p class="mt-2 text-sm text-muted">Cette adresse ne correspond à aucune page de l’administration.</p>
        <a class="mt-6 inline-block text-sm font-medium text-navy" [routerLink]="home">Retour au tableau de bord</a>
      </div>
    </app-card>
  `,
})
export class NotFoundPage {
  protected readonly home = appPaths.dashboard;
}
