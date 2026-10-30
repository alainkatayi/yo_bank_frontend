import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-on-navy hover:bg-navy-soft',
  secondary: 'border border-line bg-surface text-ink hover:bg-chip',
  danger: 'bg-danger text-on-navy hover:opacity-90',
  ghost: 'bg-transparent text-ink hover:bg-chip',
};

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
    '[class.w-full]': 'block()',
  },
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [class]="classes()"
    >
      @if (loading()) {
        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.3" stroke-width="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span class="sr-only">Envoi en cours</span>
      }
      <ng-content />
    </button>
  `,
})
export class Button {
  readonly type = input<'button' | 'submit'>('button');
  readonly variant = input<ButtonVariant>('primary');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly block = input(false);

  protected readonly classes = computed(
    () =>
      `inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${this.block() ? 'w-full' : ''} ${VARIANTS[this.variant()]}`,
  );
}
