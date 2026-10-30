import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      (click)="closed.emit()"
    >
      <div
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId()"
        class="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card"
        (click)="$event.stopPropagation()"
      >
        <h2 [id]="titleId()" class="text-lg font-semibold text-ink">{{ title() }}</h2>
        <ng-content />
      </div>
    </div>
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly titleId = input.required<string>();
  readonly closed = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);
  private readonly previouslyFocused =
    this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;

  constructor() {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closed.emit();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const items = this.focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = this.document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    this.document.addEventListener('keydown', onKey);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('keydown', onKey);
      this.previouslyFocused?.focus();
    });
    afterNextRender(() => {
      this.focusable()[0]?.focus();
    });
  }

  private focusable(): HTMLElement[] {
    const nodes = this.host.nativeElement.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );
    return [...nodes].filter((node): node is HTMLElement => node instanceof HTMLElement);
  }
}
