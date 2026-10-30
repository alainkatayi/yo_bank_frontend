import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden rounded-card border border-line bg-surface shadow-card' },
  template: `<ng-content />`,
})
export class Card {}
