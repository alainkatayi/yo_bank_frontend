import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AUDIT_PREVIEW_SIZE } from '../../core/config/constants';
import { appPaths } from '../../core/config/app-paths';
import { AUDIT_ACTION_LABELS, labelFrom, targetLabel } from '../../core/config/labels';
import { AdminOnlyDirective } from '../../core/directives/admin-only.directive';
import { AuditLog } from '../../core/models/audit-log';
import { PageResult } from '../../core/models/page-result';
import { AuditService } from '../../core/services/audit.service';
import { SessionStore } from '../../core/services/session.store';
import { formatDateTime } from '../../core/utils/date.util';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { Icon } from '../../components/ui/icon';
import { Spinner } from '../../components/ui/spinner';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, AdminOnlyDirective, Badge, Button, Card, DataTable, EmptyState, Icon, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mb-6">
      <p class="text-xs font-semibold tracking-wide text-muted uppercase">Espace d’administration</p>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <h1 class="text-3xl font-semibold tracking-tight text-ink">Bonjour, {{ session.displayName() }}</h1>
        @if (session.roleLabel(); as role) {
          <app-badge kind="role" [value]="role" />
        }
      </div>
      <p class="mt-2 text-sm text-muted">Consultez les clients, les comptes et le journal d’audit. Aucun indicateur statistique n’est calculé ici.</p>
    </section>

    <div class="mb-6 grid gap-4 md:grid-cols-3">
      <a *appAdminOnly class="block" [routerLink]="paths.customerCreate">
        <app-card>
          <div class="flex items-center gap-4 p-5">
            <span class="flex h-11 w-11 items-center justify-center rounded-control bg-navy text-on-navy">
              <app-icon name="plus" />
            </span>
            <span>
              <span class="block font-semibold text-ink">Nouveau client</span>
              <span class="block text-sm text-muted">Ouvrir un dossier</span>
            </span>
          </div>
        </app-card>
      </a>
      <a class="block" [routerLink]="paths.customers">
        <app-card>
          <div class="flex items-center gap-4 p-5">
            <span class="flex h-11 w-11 items-center justify-center rounded-control bg-gold-soft text-gold">
              <app-icon name="search" />
            </span>
            <span>
              <span class="block font-semibold text-ink">Rechercher un client</span>
              <span class="block text-sm text-muted">Nom, prénom ou téléphone</span>
            </span>
          </div>
        </app-card>
      </a>
      <a class="block" [routerLink]="paths.audit">
        <app-card>
          <div class="flex items-center gap-4 p-5">
            <span class="flex h-11 w-11 items-center justify-center rounded-control bg-chip text-navy">
              <app-icon name="shield" />
            </span>
            <span>
              <span class="block font-semibold text-ink">Journal d’audit</span>
              <span class="block text-sm text-muted">Actions des agents</span>
            </span>
          </div>
        </app-card>
      </a>
    </div>

    <app-card>
      <div class="flex items-center justify-between px-6 pt-6">
        <div>
          <h2 class="text-lg font-semibold text-ink">Dernières écritures d’audit</h2>
          <p class="text-sm text-muted">Les cinq événements les plus récents.</p>
        </div>
        <a class="text-sm font-medium text-navy" [routerLink]="paths.audit">Voir tout</a>
      </div>
      @if (state() === 'loading') {
        <app-spinner />
      } @else if (state() === 'error') {
        <div class="px-6 py-10 text-center" role="alert">
          <p class="font-medium text-ink">Impossible de charger l’audit.</p>
          <div class="mt-4 flex justify-center">
            <app-button variant="secondary" (click)="load()">Réessayer</app-button>
          </div>
        </div>
      } @else if ((audit()?.items.length ?? 0) === 0) {
        <app-empty-state title="Aucune écriture d’audit" description="Les actions d’administration apparaîtront ici." />
      } @else {
        <app-data-table>
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Quand</th>
                <th scope="col">Acteur</th>
                <th scope="col">Action</th>
                <th scope="col">Cible</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of audit()?.items ?? []; track entry.createdAt + entry.targetId + entry.action) {
                <tr>
                  <td>{{ formatDate(entry.createdAt) }}</td>
                  <td>{{ entry.actorUsername }}</td>
                  <td>{{ actionLabel(entry.action) }}</td>
                  <td>{{ target(entry) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </app-data-table>
      }
    </app-card>
  `,
})
export class DashboardPage {
  private readonly audits = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly session = inject(SessionStore);
  protected readonly paths = appPaths;
  protected readonly formatDate = formatDateTime;
  protected readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  protected readonly audit = signal<PageResult<AuditLog> | null>(null);

  constructor() {
    inject(Title).setTitle('Tableau de bord · Yo Bank');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.audits
      .search({ actor: '', action: null, page: 0, size: AUDIT_PREVIEW_SIZE })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.audit.set(page);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected actionLabel(action: string): string {
    return labelFrom(AUDIT_ACTION_LABELS, action);
  }

  protected target(entry: AuditLog): string {
    return targetLabel(entry.targetType, entry.targetId);
  }
}
