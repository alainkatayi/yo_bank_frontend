import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-search-input',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="relative block min-w-64">
      <span class="sr-only">{{ label() }}</span>
      <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint">
        <app-icon name="search" [size]="16" />
      </span>
      <input
        type="search"
        class="field-control pr-3 pl-9"
        [value]="value()"
        [placeholder]="placeholder()"
        (input)="onInput($event)"
      />
    </label>
  `,
})
export class SearchInput {
  readonly label = input.required<string>();
  readonly placeholder = input('Rechercher…');
  readonly value = input('');
  readonly valueChange = output<string>();

  protected onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.valueChange.emit(target.value);
    }
  }
}
