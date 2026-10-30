import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { appPaths } from '../../core/config/app-paths';
import { Icon, IconName } from '../ui/icon';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-64 shrink-0 max-md:w-0' },
  template: `
    @if (open()) {
      <button
        type="button"
        class="fixed inset-0 z-20 bg-ink/40 md:hidden"
        aria-label="Fermer le menu"
        (click)="closed.emit()"
      ></button>
    }
    <aside
      class="z-30 flex h-full w-64 flex-col border-r border-line bg-sidebar max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:transition-transform"
      [class.max-md:-translate-x-full]="!open()"
      [class.max-md:translate-x-0]="open()"
    >
      <div class="flex items-center gap-2.5 px-5 py-5">
        <app-icon name="bank" [size]="18" />
        <p class="text-base font-semibold tracking-tight text-ink">YO! Bank</p>
      </div>
      <nav class="flex flex-1 flex-col gap-1 px-3" aria-label="Navigation principale">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive
            #link="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium"
            [class.bg-navy]="link.isActive"
            [class.text-on-navy]="link.isActive"
            [class.hover:bg-navy]="link.isActive"
            [class.hover:text-on-navy]="link.isActive"
            [class.text-ink]="!link.isActive"
            [class.hover:bg-chip]="!link.isActive"
            [class.hover:text-ink]="!link.isActive"
            [attr.aria-current]="link.isActive ? 'page' : null"
            (click)="closed.emit()"
          >
            <app-icon [name]="item.icon" [size]="18" />
            {{ item.label }}
          </a>
        }
      </nav>
    </aside>
  `,
})
export class Sidebar {
  readonly open = input(false);
  readonly closed = output<void>();
  protected readonly items: readonly NavItem[] = [
    { path: appPaths.dashboard, label: 'Tableau de bord', icon: 'grid', exact: true },
    { path: appPaths.customers, label: 'Clients', icon: 'users', exact: false },
    { path: appPaths.accounts, label: 'Comptes', icon: 'bank', exact: false },
    { path: appPaths.audit, label: 'Journal d’audit', icon: 'shield', exact: false },
  ];
}
