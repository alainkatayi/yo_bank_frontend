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
import { Router } from '@angular/router';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../../core/config/constants';
import { appPaths } from '../../core/config/app-paths';
import { AdminOnlyDirective } from '../../core/directives/admin-only.directive';
import { Customer } from '../../core/models/customer';
import { PageResult } from '../../core/models/page-result';
import { CustomerService } from '../../core/services/customer.service';
import { formatDateTime } from '../../core/utils/date.util';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Pagination } from '../../components/ui/pagination';
import { SearchInput } from '../../components/ui/search-input';
import { Spinner } from '../../components/ui/spinner';

@Component({
  selector: 'app-customer-list-page',
  imports: [
    AdminOnlyDirective,
    Badge,
    Button,
    Card,
    DataTable,
    EmptyState,
    PageHeader,
    Pagination,
    SearchInput,
    Spinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Clients" subtitle="Recherche par nom, prénom ou téléphone.">
      <app-button *appAdminOnly (click)="create()">Nouveau client</app-button>
    </app-page-header>
    <app-card>
      <div class="px-4 pt-4">
        <app-search-input
          label="Rechercher un client"
          placeholder="Nom, prénom ou téléphone"
          [value]="draft()"
          (valueChange)="onSearch($event)"
        />
      </div>
      @if (loading() && !result()) {
        <app-spinner />
      } @else if (failed() && !result()) {
        <div class="px-6 py-10 text-center" role="alert">
          <p class="font-medium text-ink">Impossible de charger les clients.</p>
          <div class="mt-4 flex justify-center">
            <app-button variant="secondary" (click)="retry()">Réessayer</app-button>
          </div>
        </div>
      } @else if ((result()?.items.length ?? 0) === 0) {
        <app-empty-state
          [title]="draft().trim() ? 'Aucun client ne correspond à cette recherche.' : 'Aucun client enregistré.'"
          description="Modifiez la recherche ou créez un nouveau dossier."
        />
      } @else {
        <app-data-table>
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Téléphone</th>
                <th scope="col">E-mail</th>
                <th scope="col">Statut</th>
                <th scope="col">Créé le</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of result()?.items ?? []; track customer.id) {
                <tr class="cursor-pointer" tabindex="0" (click)="open(customer.id)" (keydown.enter)="open(customer.id)">
                  <td class="font-medium">{{ customer.firstName }} {{ customer.lastName }}</td>
                  <td>{{ customer.phone }}</td>
                  <td>{{ customer.email || '—' }}</td>
                  <td><app-badge kind="customer" [value]="customer.status" /></td>
                  <td>{{ formatDate(customer.createdAt) }}</td>
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
export class CustomerListPage {
  private readonly customers = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private timer = 0;
  private requestId = 0;

  protected readonly pageSize = DEFAULT_PAGE_SIZE;
  protected readonly formatDate = formatDateTime;
  protected readonly draft = signal('');
  protected readonly query = signal({ search: '', page: 0 });
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly result = signal<PageResult<Customer> | null>(null);

  constructor() {
    inject(Title).setTitle('Clients · Yo Bank');
    effect(() => {
      const query = this.query();
      untracked(() => this.fetch(query));
    });
  }

  protected onSearch(value: string): void {
    this.draft.set(value);
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.query.set({ search: value.trim(), page: 0 });
    }, SEARCH_DEBOUNCE_MS);
  }

  protected onPage(page: number): void {
    this.query.update((current) => ({ ...current, page }));
  }

  protected retry(): void {
    this.fetch(this.query());
  }

  protected create(): void {
    void this.router.navigateByUrl(appPaths.customerCreate);
  }

  protected open(id: string): void {
    void this.router.navigateByUrl(appPaths.customer(id));
  }

  private fetch(query: { search: string; page: number }): void {
    const id = this.requestId + 1;
    this.requestId = id;
    this.loading.set(true);
    this.failed.set(false);
    this.customers
      .search(query.search, query.page, this.pageSize)
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
