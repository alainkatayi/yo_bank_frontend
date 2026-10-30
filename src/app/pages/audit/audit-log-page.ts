import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { AUDIT_ACTIONS, AuditAction, isAuditAction } from '../../core/models/audit-action';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../../core/config/constants';
import { AUDIT_ACTION_LABELS, labelFrom, targetLabel } from '../../core/config/labels';
import { AuditLog } from '../../core/models/audit-log';
import { PageResult } from '../../core/models/page-result';
import { AuditQuery, AuditService } from '../../core/services/audit.service';
import { formatDateTime } from '../../core/utils/date.util';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Pagination } from '../../components/ui/pagination';
import { Spinner } from '../../components/ui/spinner';

@Component({
  selector: 'app-audit-page',
  imports: [Button, Card, DataTable, EmptyState, PageHeader, Pagination, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Journal d’audit" subtitle="Actions des agents, de la plus récente à la plus ancienne." />
    <app-card>
      <div class="flex flex-wrap gap-3 px-4 pt-4">
        <label class="min-w-56 text-sm text-muted">
          Acteur
          <input
            class="field-control mt-1"
            type="search"
            [value]="actorDraft()"
            placeholder="Nom d’utilisateur"
            (input)="onActor($event)"
          />
        </label>
        <label class="min-w-56 text-sm text-muted">
          Action
          <select class="field-control mt-1" [value]="query().action ?? ''" (change)="onAction($event)">
            <option value="">Toutes les actions</option>
            @for (action of actions; track action) {
              <option [value]="action">{{ actionLabel(action) }}</option>
            }
          </select>
        </label>
      </div>
      @if (loading() && !result()) {
        <app-spinner />
      } @else if (failed() && !result()) {
        <div class="px-6 py-10 text-center" role="alert">
          <p class="font-medium text-ink">Impossible de charger le journal.</p>
          <div class="mt-4 flex justify-center">
            <app-button variant="secondary" (click)="retry()">Réessayer</app-button>
          </div>
        </div>
      } @else if ((result()?.items.length ?? 0) === 0) {
        <app-empty-state title="Aucune écriture" description="Aucun événement ne correspond à ces filtres." />
      } @else {
        <app-data-table>
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Acteur</th>
                <th scope="col">Action</th>
                <th scope="col">Cible</th>
                <th scope="col">Détails</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of result()?.items ?? []; track entry.createdAt + entry.action + entry.targetId) {
                <tr>
                  <td>{{ formatDate(entry.createdAt) }}</td>
                  <td>{{ entry.actorUsername }}</td>
                  <td>{{ actionLabel(entry.action) }}</td>
                  <td>{{ target(entry) }}</td>
                  <td>{{ entry.details || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </app-data-table>
        <app-pagination
          [page]="query().page"
          [size]="pageSize"
          [totalItems]="result()?.totalItems ?? 0"
          (pageChange)="onPage($event)"
        />
      }
    </app-card>
  `,
})
export class AuditPage {
  private readonly audits = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);
  private timer = 0;
  private requestId = 0;

  protected readonly actions = AUDIT_ACTIONS;
  protected readonly pageSize = DEFAULT_PAGE_SIZE;
  protected readonly formatDate = formatDateTime;
  protected readonly actorDraft = signal('');
  protected readonly query = signal<AuditQuery>({ actor: '', action: null, page: 0, size: DEFAULT_PAGE_SIZE });
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly result = signal<PageResult<AuditLog> | null>(null);

  constructor() {
    inject(Title).setTitle('Journal d’audit · Yo Bank');
    effect(() => {
      const query = this.query();
      untracked(() => this.fetch(query));
    });
  }

  protected onActor(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const value = target.value;
    this.actorDraft.set(value);
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.query.update((current) => ({ ...current, actor: value.trim(), page: 0 }));
    }, SEARCH_DEBOUNCE_MS);
  }

  protected onAction(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const action: AuditAction | null = isAuditAction(target.value) ? target.value : null;
    this.query.update((current) => ({ ...current, action, page: 0 }));
  }

  protected onPage(page: number): void {
    this.query.update((current) => ({ ...current, page }));
  }

  protected retry(): void {
    this.fetch(this.query());
  }

  protected actionLabel(action: string): string {
    return labelFrom(AUDIT_ACTION_LABELS, action);
  }

  protected target(entry: AuditLog): string {
    return targetLabel(entry.targetType, entry.targetId);
  }

  private fetch(query: AuditQuery): void {
    const id = this.requestId + 1;
    this.requestId = id;
    this.loading.set(true);
    this.failed.set(false);
    this.audits
      .search(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          if (id !== this.requestId) {
            return;
          }
          this.result.set(page);
          this.loading.set(false);
        },
        error: () => {
          if (id !== this.requestId) {
            return;
          }
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }
}
