import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <label class="block" [attr.for]="inputId()">
      <span class="mb-1.5 block text-sm font-medium text-ink">{{ label() }}</span>
      <ng-content />
      @if (hint()) {
        <span class="mt-1 block text-xs text-muted">{{ hint() }}</span>
      }
      @if (error()) {
        <span class="mt-1 block text-sm text-danger" role="alert">{{ error() }}</span>
      }
    </label>
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
}
