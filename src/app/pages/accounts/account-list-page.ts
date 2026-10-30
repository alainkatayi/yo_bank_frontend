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
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../../core/config/constants';
import { appPaths } from '../../core/config/app-paths';
import { Account } from '../../core/models/account';
import { AccountStatus } from '../../core/models/account-status';
import { Customer } from '../../core/models/customer';
import { PageResult } from '../../core/models/page-result';
import { AccountService } from '../../core/services/account.service';
import { CustomerService } from '../../core/services/customer.service';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { Money } from '../../components/ui/money';
import { PageHeader } from '../../components/ui/page-header';
import { Pagination } from '../../components/ui/pagination';
import { SearchInput } from '../../components/ui/search-input';
import { Spinner } from '../../components/ui/spinner';

const DIRECTORY_SIZE = 100;

interface AccountRow {
  accountNumber: string;
  balance: string;
  status: AccountStatus;
  customerId: string;
  holderName: string;
  phone: string;
}

@Component({
  selector: 'app-account-list-page',
  imports: [Badge, Button, Card, DataTable, EmptyState, Money, PageHeader, Pagination, SearchInput, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Comptes" subtitle="Recherche par client, téléphone ou numéro de compte." />
    <app-card>
      <div class="px-4 pt-4">
        <app-search-input
          label="Rechercher un compte"
          placeholder="Client, téléphone ou numéro"
          [value]="draft()"
          (valueChange)="onSearch($event)"
        />
      </div>
      @if (loading() && !result()) {
        <app-spinner />
      } @else if (failed() && !result()) {
        <div class="px-6 py-10 text-center" role="alert">
          <p class="font-medium text-ink">Impossible de charger les comptes.</p>
          <div class="mt-4 flex justify-center">
            <app-button variant="secondary" (click)="retry()">Réessayer</app-button>
          </div>
        </div>
      } @else if ((result()?.items.length ?? 0) === 0) {
        <app-empty-state
          [title]="draft().trim() ? 'Aucun compte ne correspond à cette recherche.' : 'Aucun compte ouvert.'"
          description="Les comptes apparaissent ici dès qu’un dossier client en possède un."
        />
      } @else {
        <app-data-table>
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Numéro</th>
                <th scope="col">Client</th>
                <th scope="col">Téléphone</th>
                <th scope="col">Solde</th>
                <th scope="col">Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (account of result()?.items ?? []; track account.customerId + ':' + account.accountNumber) {
                <tr
                  class="cursor-pointer"
                  tabindex="0"
                  (click)="open(account)"
                  (keydown.enter)="open(account)"
                >
                  <td class="font-medium">{{ account.accountNumber }}</td>
                  <td>{{ account.holderName }}</td>
                  <td>{{ account.phone }}</td>
                  <td><app-money [amount]="account.balance" /></td>
                  <td><app-badge kind="account" [value]="account.status" /></td>
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
export class AccountListPage {
  private readonly customers = inject(CustomerService);
  private readonly accounts = inject(AccountService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private timer = 0;
  private requestId = 0;

  protected readonly pageSize = DEFAULT_PAGE_SIZE;
  protected readonly draft = signal('');
  protected readonly query = signal({ search: '', page: 0 });
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly result = signal<PageResult<AccountRow> | null>(null);

  constructor() {
    inject(Title).setTitle('Comptes · Yo Bank');
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

  protected open(account: AccountRow): void {
    void this.router.navigateByUrl(appPaths.account(account.customerId, account.accountNumber));
  }

  private fetch(query: { search: string; page: number }): void {
    const id = this.requestId + 1;
    this.requestId = id;
    this.loading.set(true);
    this.failed.set(false);
    const term = query.search.trim();
    this.customers
      .search(term, 0, DIRECTORY_SIZE)
      .pipe(
        switchMap((page) => this.rowsFor(page.items, term)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) => {
          if (id !== this.requestId) {
            return;
          }
          const start = query.page * this.pageSize;
          this.result.set({
            items: rows.slice(start, start + this.pageSize),
            page: query.page,
            size: this.pageSize,
            totalItems: rows.length,
          });
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

  private rowsFor(customers: readonly Customer[], term: string): Observable<AccountRow[]> {
    const accountNumber = /^\d{4,}$/.test(term);
    if (customers.length === 0 && accountNumber) {
      return this.customers.search('', 0, DIRECTORY_SIZE).pipe(
        switchMap((page) => this.loadRows(page.items)),
        map((rows) => rows.filter((row) => row.accountNumber.includes(term))),
      );
    }
    return this.loadRows(customers);
  }

  private loadRows(customers: readonly Customer[]): Observable<AccountRow[]> {
    if (customers.length === 0) {
      return of([]);
    }
    return forkJoin(
      customers.map((customer) =>
        this.accounts.list(customer.id).pipe(map((accounts) => accounts.map((account) => toRow(customer, account)))),
      ),
    ).pipe(map((groups) => groups.flat()));
  }
}

function toRow(customer: Customer, account: Account): AccountRow {
  return {
    accountNumber: account.accountNumber,
    balance: account.balance,
    status: account.status,
    customerId: customer.id,
    holderName: `${customer.firstName} ${customer.lastName}`.trim(),
    phone: customer.phone,
  };
}
