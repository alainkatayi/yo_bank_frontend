import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Button } from './button';
import { Modal } from './modal';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="title()" titleId="confirm-title" (closed)="cancelled.emit()">
      <p class="mt-2 text-sm text-muted" id="confirm-message">{{ message() }}</p>
      @if (confirmPhrase(); as phrase) {
        <label class="mt-4 block text-sm font-medium text-ink" for="confirm-phrase">
          {{ phraseLabel() }}
        </label>
        <input
          id="confirm-phrase"
          class="field-control mt-1.5"
          [value]="typed()"
          autocomplete="off"
          (input)="onType($event)"
        />
      }
      @if (error()) {
        <p class="mt-3 text-sm text-danger" role="alert">{{ error() }}</p>
      }
      <div class="mt-6 flex justify-end gap-2">
        <app-button variant="secondary" (click)="cancelled.emit()">Annuler</app-button>
        <app-button
          [variant]="danger() ? 'danger' : 'primary'"
          [disabled]="!canConfirm()"
          (click)="confirmed.emit()"
        >
          <span data-confirm>{{ confirmLabel() }}</span>
        </app-button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmer');
  readonly phraseLabel = input('Saisissez la confirmation');
  readonly confirmPhrase = input<string | null>(null);
  readonly danger = input(false);
  readonly error = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly typed = signal('');
  protected readonly canConfirm = computed(() => {
    const phrase = this.confirmPhrase();
    if (!phrase) {
      return true;
    }
    return this.typed() === phrase;
  });

  protected onType(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.typed.set(target.value);
    }
  }
}
