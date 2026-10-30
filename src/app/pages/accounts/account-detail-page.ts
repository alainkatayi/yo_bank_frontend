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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '../../core/config/constants';
import { appPaths } from '../../core/config/app-paths';
import { OPERATION_TYPE_LABELS, labelFrom, rejectionLabel } from '../../core/config/labels';
import { AdminOnlyDirective } from '../../core/directives/admin-only.directive';
import { Account } from '../../core/models/account';
import { AccountOperation } from '../../core/models/operation';
import { OPERATION_STATUSES, isOperationStatus } from '../../core/models/operation-status';
import { OPERATION_TYPES, isOperationType } from '../../core/models/operation-type';
import { PageResult } from '../../core/models/page-result';
import { ApiProblem } from '../../core/models/problem-detail';
import { AccountService } from '../../core/services/account.service';
import { OperationQuery, OperationService } from '../../core/services/operation.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDateTime } from '../../core/utils/date.util';
import { isPositiveMoney, isValidMoney, normalizeMoneyInput } from '../../core/utils/money.util';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { FormField } from '../../components/ui/form-field';
import { Icon } from '../../components/ui/icon';
import { Modal } from '../../components/ui/modal';
import { Money } from '../../components/ui/money';
import { PageHeader } from '../../components/ui/page-header';
import { Pagination } from '../../components/ui/pagination';
import { Spinner } from '../../components/ui/spinner';

@Component({
  selector: 'app-account-detail-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminOnlyDirective,
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    EmptyState,
    FormField,
    Icon,
    Modal,
    Money,
    PageHeader,
    Pagination,
    Spinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="mb-4 inline-block text-sm font-medium text-navy" [routerLink]="customerPath()">Retour au client</a>
    @if (accountState() === 'loading') {
      <app-spinner />
    } @else if (accountState() === 'error' || !account()) {
      <app-card>
        <div class="px-6 py-10 text-center" role="alert">
          <p class="font-medium text-ink">{{ accountMessage() }}</p>
          <div class="mt-4 flex justify-center">
            <app-button variant="secondary" (click)="retry()">Réessayer</app-button>
          </div>
        </div>
      </app-card>
    } @else {
      @if (account(); as current) {
        <app-page-header [title]="'Compte ' + current.accountNumber" subtitle="Mouvements et statut du compte.">
          <app-badge kind="account" [value]="current.status" />
        </app-page-header>
        <app-card>
          <div class="flex flex-wrap items-end justify-between gap-4 p-6">
            <div>
              <p class="text-xs font-semibold tracking-wide text-muted uppercase">Solde disponible</p>
              <p class="mt-2 text-4xl"><app-money [amount]="current.balance" /></p>
            </div>
            <div class="flex flex-wrap gap-2">
              @if (current.status === 'ACTIVE') {
                <app-button *appAdminOnly [disabled]="pending()" (click)="depositOpen.set(true)">Dépôt</app-button>
                <app-button *appAdminOnly variant="secondary" [disabled]="pending()" (click)="blockOpen.set(true)">
                  Bloquer
                </app-button>
              }
              @if (current.status === 'BLOCKED') {
                <app-button *appAdminOnly variant="secondary" [disabled]="pending()" (click)="unblockOpen.set(true)">
                  Débloquer
                </app-button>
              }
              @if (current.status === 'ACTIVE' || current.status === 'BLOCKED') {
                <app-button *appAdminOnly variant="danger" [disabled]="pending()" (click)="askClose()">
                  Clôturer
                </app-button>
              }
            </div>
          </div>
        </app-card>

        <app-card class="mt-6">
          <div class="flex flex-wrap items-end justify-between gap-3 px-4 pt-4">
            <h2 class="text-lg font-semibold text-ink">Historique des opérations</h2>
            <div class="flex flex-wrap gap-2">
              <label class="text-sm text-muted">
                Type
                <select class="field-control mt-1" [value]="operationQuery().type ?? ''" (change)="onType($event)">
                  <option value="">Tous</option>
                  @for (type of operationTypes; track type) {
                    <option [value]="type">{{ typeLabel(type) }}</option>
                  }
                </select>
              </label>
              <label class="text-sm text-muted">
                Statut
                <select class="field-control mt-1" [value]="operationQuery().status ?? ''" (change)="onStatus($event)">
                  <option value="">Tous</option>
                  @for (status of operationStatuses; track status) {
                    <option [value]="status">{{ status === 'SUCCESS' ? 'Réussie' : 'Refusée' }}</option>
                  }
                </select>
              </label>
            </div>
          </div>
          @if (operationsState() === 'loading' && !operations()) {
            <app-spinner />
          } @else if (operationsState() === 'error' && !operations()) {
            <div class="px-6 py-10 text-center" role="alert">
              <p class="font-medium text-ink">Impossible de charger les opérations.</p>
              <div class="mt-4 flex justify-center">
                <app-button variant="secondary" (click)="retry()">Réessayer</app-button>
              </div>
            </div>
          } @else if ((operations()?.items.length ?? 0) === 0) {
            <app-empty-state title="Aucune opération" description="Aucune écriture ne correspond à ces filtres." />
          } @else {
            <app-data-table>
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Référence</th>
                    <th scope="col">Type</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Solde après</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (operation of operations()?.items ?? []; track operation.reference) {
                    <tr>
                      <td>
                        <span class="inline-flex items-center gap-2">
                          <span class="font-medium">{{ operation.reference }}</span>
                          <button
                            type="button"
                            class="rounded-control p-1 text-muted hover:bg-chip"
                            [attr.aria-label]="'Copier la référence ' + operation.reference"
                            (click)="copy(operation.reference)"
                          >
                            <app-icon name="copy" [size]="16" />
                          </button>
                        </span>
                      </td>
                      <td>{{ typeLabel(operation.type) }}</td>
                      <td><app-badge kind="operation" [value]="operation.status" /></td>
                      <td>
                        @if (operation.status === 'REJECTED') {
                          <span>{{ reason(operation.rejectionReason) }}</span>
                        } @else if (operation.balanceAfter) {
                          <app-money [amount]="operation.balanceAfter" />
                        } @else {
                          —
                        }
                      </td>
                      <td>{{ formatDate(operation.createdAt) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </app-data-table>
            <app-pagination
              [page]="operationQuery().page"
              [size]="pageSize"
              [totalItems]="operations()?.totalItems ?? 0"
              (pageChange)="onPage($event)"
            />
          }
        </app-card>
      }
    }

    @if (depositOpen()) {
      <form [formGroup]="depositForm" (ngSubmit)="submitDeposit()">
        <app-modal title="Dépôt" titleId="deposit-title" (closed)="depositOpen.set(false)">
          <p class="mt-2 text-sm text-muted">Le montant est envoyé tel quel, avec au plus deux décimales.</p>
          <div class="mt-4">
            <app-form-field label="Montant (CDF)" inputId="deposit-amount" [error]="amountError()">
              <input
                id="deposit-amount"
                class="field-control"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                formControlName="amount"
              />
            </app-form-field>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <app-button variant="secondary" type="button" (click)="depositOpen.set(false)">Annuler</app-button>
            <app-button type="submit" [loading]="pending()" [disabled]="depositForm.invalid">Enregistrer le dépôt</app-button>
          </div>
        </app-modal>
      </form>
    }
    @if (blockOpen()) {
      <app-confirm-dialog
        title="Bloquer le compte"
        message="Les dépôts et les débits seront refusés tant que le compte reste bloqué."
        confirmLabel="Bloquer"
        [danger]="true"
        (confirmed)="block()"
        (cancelled)="blockOpen.set(false)"
      />
    }
    @if (unblockOpen()) {
      <app-confirm-dialog
        title="Débloquer le compte"
        message="Le compte redeviendra actif."
        confirmLabel="Débloquer"
        (confirmed)="unblock()"
        (cancelled)="unblockOpen.set(false)"
      />
    }
    @if (closeOpen()) {
      <app-confirm-dialog
        title="Clôturer le compte"
        message="Un compte clôturé ne se rouvre pas. Le solde doit être exactement 0,00 CDF."
        confirmLabel="Clôturer"
        phraseLabel="Saisissez les 4 derniers chiffres du numéro de compte"
        [confirmPhrase]="confirmDigits()"
        [danger]="true"
        [error]="closeError()"
        (confirmed)="close()"
        (cancelled)="closeOpen.set(false)"
      />
    }
  `,
})
export class AccountDetailPage {
  readonly customerId = input.required<string>();
  readonly accountNumber = input.required<string>();

  private readonly accounts = inject(AccountService);
  private readonly operationsApi = inject(OperationService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly reloadTick = signal(0);

  protected readonly pageSize = DEFAULT_PAGE_SIZE;
  protected readonly operationTypes = OPERATION_TYPES;
  protected readonly operationStatuses = OPERATION_STATUSES;
  protected readonly formatDate = formatDateTime;
  protected readonly accountState = signal<'loading' | 'error' | 'ready'>('loading');
  protected readonly accountMessage = signal('Impossible de charger ce compte.');
  protected readonly account = signal<Account | null>(null);
  protected readonly operationsState = signal<'loading' | 'error' | 'ready'>('loading');
  protected readonly operations = signal<PageResult<AccountOperation> | null>(null);
  protected readonly operationQuery = signal<OperationQuery>({
    type: null,
    status: null,
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  });
  protected readonly pending = signal(false);
  protected readonly depositOpen = signal(false);
  protected readonly blockOpen = signal(false);
  protected readonly unblockOpen = signal(false);
  protected readonly closeOpen = signal(false);
  protected readonly closeError = signal<string | null>(null);
  protected readonly submittedDeposit = signal(false);
  protected readonly depositForm = new FormGroup({
    amount: new FormControl('', { nonNullable: true, validators: [Validators.required, moneyValidator] }),
  });

  constructor() {
    this.title.setTitle('Compte · Yo Bank');
    effect(() => {
      const customerId = this.customerId();
      const accountNumber = this.accountNumber();
      const tick = this.reloadTick();
      untracked(() => this.loadAccount(customerId, accountNumber, tick));
    });
    effect(() => {
      const accountNumber = this.accountNumber();
      const query = this.operationQuery();
      const tick = this.reloadTick();
      untracked(() => this.loadOperations(accountNumber, query, tick));
    });
  }

  protected customerPath(): string {
    return appPaths.customer(this.customerId());
  }

  protected confirmDigits(): string {
    return this.accountNumber().slice(-4);
  }

  protected retry(): void {
    this.reloadTick.update((value) => value + 1);
  }

  protected typeLabel(type: string): string {
    return labelFrom(OPERATION_TYPE_LABELS, type);
  }

  protected reason(value: string | undefined): string {
    return rejectionLabel(value);
  }

  protected onType(event: Event): void {
    const value = eventValue(event);
    this.operationQuery.update((query) => ({
      ...query,
      page: 0,
      type: isOperationType(value) ? value : null,
    }));
  }

  protected onStatus(event: Event): void {
    const value = eventValue(event);
    this.operationQuery.update((query) => ({
      ...query,
      page: 0,
      status: isOperationStatus(value) ? value : null,
    }));
  }

  protected onPage(page: number): void {
    this.operationQuery.update((query) => ({ ...query, page }));
  }

  protected amountError(): string | null {
    const control = this.depositForm.controls.amount;
    if (!this.submittedDeposit() && !control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Le montant est obligatoire.';
    }
    if (control.hasError('money')) {
      return 'Saisissez un montant positif avec au plus deux décimales, par exemple 100000.00.';
    }
    return null;
  }

  protected submitDeposit(): void {
    this.submittedDeposit.set(true);
    if (this.depositForm.invalid || this.pending()) {
      this.depositForm.markAllAsTouched();
      return;
    }
    const amount = normalizeMoneyInput(this.depositForm.controls.amount.value);
    this.pending.set(true);
    this.accounts
      .deposit(this.accountNumber(), amount)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (operation) => {
          this.pending.set(false);
          this.depositOpen.set(false);
          this.depositForm.reset({ amount: '' });
          this.submittedDeposit.set(false);
          if (operation.status === 'REJECTED') {
            this.toast.error(rejectionLabel(operation.rejectionReason));
          } else {
            this.toast.success('Dépôt enregistré.');
          }
          this.retry();
        },
        error: () => this.pending.set(false),
      });
  }

  protected block(): void {
    this.runStatus('block');
  }

  protected unblock(): void {
    this.runStatus('unblock');
  }

  protected askClose(): void {
    this.closeError.set(null);
    this.closeOpen.set(true);
  }

  protected close(): void {
    if (this.pending()) {
      return;
    }
    this.pending.set(true);
    this.closeError.set(null);
    this.accounts
      .close(this.accountNumber())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.pending.set(false);
          this.closeOpen.set(false);
          this.account.set(account);
          this.toast.success('Compte clôturé.');
          this.retry();
        },
        error: (error: unknown) => {
          this.pending.set(false);
          if (error instanceof ApiProblem && error.code === 'ACCOUNT_NOT_EMPTY') {
            this.closeError.set(error.userMessage);
          }
        },
      });
  }

  protected async copy(reference: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(reference);
      this.toast.success('Référence copiée.');
    } catch {
      this.toast.error('Impossible de copier la référence.');
    }
  }

  private runStatus(action: 'block' | 'unblock'): void {
    if (this.pending()) {
      return;
    }
    this.blockOpen.set(false);
    this.unblockOpen.set(false);
    this.pending.set(true);
    const request =
      action === 'block'
        ? this.accounts.block(this.accountNumber())
        : this.accounts.unblock(this.accountNumber());
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (account) => {
        this.pending.set(false);
        this.account.set(account);
        this.toast.success(action === 'block' ? 'Compte bloqué.' : 'Compte débloqué.');
        this.retry();
      },
      error: () => this.pending.set(false),
    });
  }

  private loadAccount(customerId: string, accountNumber: string, _tick: number): void {
    this.accountState.set('loading');
    this.accounts
      .list(customerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (accounts) => {
          const found = accounts.find((item) => item.accountNumber === accountNumber) ?? null;
          this.account.set(found);
          if (!found) {
            this.accountMessage.set('Compte introuvable pour ce client.');
            this.accountState.set('error');
            return;
          }
          this.accountState.set('ready');
          this.title.setTitle(`Compte ${found.accountNumber} · Yo Bank`);
        },
        error: () => {
          this.accountMessage.set('Impossible de charger ce compte.');
          this.accountState.set('error');
        },
      });
  }

  private loadOperations(accountNumber: string, query: OperationQuery, _tick: number): void {
    this.operationsState.set('loading');
    this.operationsApi
      .list(accountNumber, query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.operations.set(page);
          this.operationsState.set('ready');
        },
        error: () => this.operationsState.set('error'),
      });
  }
}

function moneyValidator(control: { value: unknown }): { money: true } | null {
  const value = typeof control.value === 'string' ? control.value : '';
  if (value.trim() === '') {
    return null;
  }
  return isValidMoney(value) && isPositiveMoney(value) ? null : { money: true };
}

function eventValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLSelectElement ? target.value : '';
}
