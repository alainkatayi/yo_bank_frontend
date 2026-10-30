import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#contenu"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3"
    >
      Aller au contenu
    </a>
    <div class="flex min-h-screen bg-canvas lg:h-screen lg:overflow-hidden">
      <app-sidebar [open]="menuOpen()" (closed)="menuOpen.set(false)" />
      <div class="flex min-w-0 flex-1 flex-col lg:h-screen">
        <app-topbar (menu)="menuOpen.update((open) => !open)" />
        <main id="contenu" class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppShell {
  protected readonly menuOpen = signal(false);
}
