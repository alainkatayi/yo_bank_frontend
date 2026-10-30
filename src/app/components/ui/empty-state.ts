import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-6 py-12 text-center" role="status">
      <p class="text-base font-medium text-ink">{{ title() }}</p>
      @if (description()) {
        <p class="mt-1 text-sm text-muted">{{ description() }}</p>
      }
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
