import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ICONS = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 19v-1a3.5 3.5 0 0 0-2.6-3.4M16 4.1a3 3 0 0 1 0 5.8',
  shield: 'M12 3l8 3v6c0 5-3.4 7.6-8 9-4.6-1.4-8-4-8-9V6l8-3z',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-3.5-3.5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
  plus: 'M12 5v14M5 12h14',
  lock: 'M8 11V8a4 4 0 0 1 8 0v3M6 11h12v9H6z',
  unlock: 'M8 11V8a4 4 0 0 1 7.4-2M6 11h12v9H6z',
  logout: 'M9 7V5H4v14h5v-2M10 12h9M16 8l4 4-4 4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  alert: 'M12 9v4M12 17h.01M12 3l9 16H3L12 3z',
  bank: 'M4 10l8-6 8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16',
  filter: 'M4 5h16l-6 7v6l-4 2v-8L4 5z',
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  protected readonly path = computed(() => ICONS[this.name()]);
}
