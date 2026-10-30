import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { appPaths } from '../../core/config/app-paths';
import { AdminOnlyDirective } from '../../core/directives/admin-only.directive';
import { Account } from '../../core/models/account';
import { Customer } from '../../core/models/customer';
import { AccountService } from '../../core/services/account.service';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDateTime } from '../../core/utils/date.util';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { Money } from '../../components/ui/money';
import { PageHeader } from '../../components/ui/page-header';
import { Spinner } from '../../components/ui/spinner';

@Component({
  selector: 'app-customer-detail-page',
  imports: [
    RouterLink,
    AdminOnlyDirective,
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    EmptyState,
    Money,
    PageHeader,
    Spinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="mb-4 inline-block text-sm font-medium text-navy" [routerLink]="customersPath">Retour aux clients</a>
    @if (state() === 'loading') {
      <app-spinner />
    } @else if (state() === 'error' || !customer()) {
      <app-card>
        <div class="px-6 py-10 text-center" role="alert">
          <p class="font-medium text-ink">Impossible de charger ce client.</p>
          <div class="mt-4 flex justify-center">
            <app-button variant="secondary" (click)="retry()">Réessayer</app-button>
          </div>
        </div>
      </app-card>
    } @else {
      @if (customer(); as person) {
        <app-page-header [title]="person.firstName + ' ' + person.lastName" [subtitle]="person.phone">
          @if (person.status === 'ACTIVE') {
            <app-button *appAdminOnly variant="secondary" [disabled]="pending()" (click)="confirmSuspend.set(true)">
              Suspendre
            </app-button>
          }
          @if (person.status === 'SUSPENDED') {
            <app-button *appAdminOnly variant="secondary" [disabled]="pending()" (click)="confirmReactivate.set(true)">
              Réactiver
            </app-button>
          }
        </app-page-header>
        <div class="mb-6 grid gap-4 md:grid-cols-2">
          <app-card>
            <dl class="grid gap-3 p-6 text-sm">
              <div>
                <dt class="text-muted">Statut</dt>
                <dd class="mt-1"><app-badge kind="customer" [value]="person.status" /></dd>
              </div>
              <div>
                <dt class="text-muted">E-mail</dt>
                <dd class="mt-1 text-ink">{{ person.email || '—' }}</dd>
              </div>
              <div>
                <dt class="text-muted">Créé le</dt>
                <dd class="mt-1 text-ink">{{ formatDate(person.createdAt) }}</dd>
              </div>
            </dl>
          </app-card>
          <app-card>
            <div class="p-6">
              <h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Ouverture de compte</h2>
              @if (person.status === 'SUSPENDED') {
                <p class="mt-2 text-sm text-ink">
                  Client suspendu : l’ouverture d’un nouveau compte est impossible. Les comptes déjà ouverts restent utilisables.
                </p>
              } @else {
                <p class="mt-2 text-sm text-muted">Un nouveau compte est ouvert avec un solde de 0,00 CDF.</p>
              }
              <div class="mt-4">
                <app-button
                  *appAdminOnly
                  [disabled]="person.status === 'SUSPENDED' || pending()"
                  [loading]="pending()"
                  (click)="openAccount()"
                >
                  Ouvrir un compte
                </app-button>
              </div>
            </div>
          </app-card>
        </div>
        <app-card>
          <div class="px-6 pt-6">
            <h2 class="text-lg font-semibold text-ink">Comptes</h2>
          </div>
          @if (accounts().length === 0) {
            <app-empty-state title="Aucun compte" description="Aucun compte n’est encore ouvert pour ce client." />
          } @else {
            <app-data-table>
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Numéro</th>
                    <th scope="col">Solde</th>
                    <th scope="col">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (account of accounts(); track account.accountNumber) {
                    <tr
                      class="cursor-pointer"
                      tabindex="0"
                      (click)="openAccountDetail(account.accountNumber)"
                      (keydown.enter)="openAccountDetail(account.accountNumber)"
                    >
                      <td class="font-medium">{{ account.accountNumber }}</td>
                      <td><app-money [amount]="account.balance" /></td>
                      <td><app-badge kind="account" [value]="account.status" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </app-data-table>
          }
        </app-card>
      }
    }

    @if (confirmSuspend()) {
      <app-confirm-dialog
        title="Suspendre le client"
        message="Le client ne pourra plus ouvrir de nouveau compte. Les comptes déjà ouverts restent utilisables."
        confirmLabel="Suspendre"
        [danger]="true"
        (confirmed)="suspend()"
        (cancelled)="confirmSuspend.set(false)"
      />
    }
    @if (confirmReactivate()) {
      <app-confirm-dialog
        title="Réactiver le client"
        message="Le client pourra de nouveau ouvrir un compte."
        confirmLabel="Réactiver"
        (confirmed)="reactivate()"
        (cancelled)="confirmReactivate.set(false)"
      />
    }
  `,
})
export class CustomerDetailPage {
  readonly customerId = input.required<string>();

  private readonly title = inject(Title);
  private readonly customers = inject(CustomerService);
  private readonly accountApi = inject(AccountService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadTick = signal(0);

  protected readonly customersPath = appPaths.customers;
  protected readonly formatDate = formatDateTime;
  protected readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  protected readonly customer = signal<Customer | null>(null);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly pending = signal(false);
  protected readonly confirmSuspend = signal(false);
  protected readonly confirmReactivate = signal(false);

  constructor() {
    this.title.setTitle('Client · Yo Bank');
    effect(() => {
      const id = this.customerId();
      const tick = this.reloadTick();
      untracked(() => this.load(id, tick));
    });
  }

  protected retry(): void {
    this.reloadTick.update((value) => value + 1);
  }

  protected openAccountDetail(accountNumber: string): void {
    void this.router.navigateByUrl(appPaths.account(this.customerId(), accountNumber));
  }

  protected openAccount(): void {
    const person = this.customer();
    if (!person || person.status === 'SUSPENDED' || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.accountApi
      .open(person.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.pending.set(false);
          this.toast.success('Compte ouvert.');
          void this.router.navigateByUrl(appPaths.account(person.id, account.accountNumber));
        },
        error: () => this.pending.set(false),
      });
  }

  protected suspend(): void {
    this.changeStatus('suspend');
  }

  protected reactivate(): void {
    this.changeStatus('reactivate');
  }

  private changeStatus(action: 'suspend' | 'reactivate'): void {
    const person = this.customer();
    if (!person || this.pending()) {
      return;
    }
    this.confirmSuspend.set(false);
    this.confirmReactivate.set(false);
    this.pending.set(true);
    const request =
      action === 'suspend' ? this.customers.suspend(person.id) : this.customers.reactivate(person.id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (customer) => {
        this.pending.set(false);
        this.customer.set(customer);
        this.toast.success(action === 'suspend' ? 'Client suspendu.' : 'Client réactivé.');
      },
      error: () => this.pending.set(false),
    });
  }

  private load(id: string, _tick: number): void {
    this.state.set('loading');
    forkJoin({
      customer: this.customers.get(id),
      accounts: this.accountApi.list(id),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ customer, accounts }) => {
          this.customer.set(customer);
          this.accounts.set(accounts);
          this.state.set('ready');
          this.title.setTitle(`${customer.firstName} ${customer.lastName} · Yo Bank`);
        },
        error: () => this.state.set('error'),
      });
  }
}
