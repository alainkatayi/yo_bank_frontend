import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { appPaths, safeReturnUrl } from '../../core/config/app-paths';
import { ApiProblem } from '../../core/models/problem-detail';
import { AuthService } from '../../core/services/auth.service';
import { SessionStore } from '../../core/services/session.store';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { FormField } from '../../components/ui/form-field';
import { Icon } from '../../components/ui/icon';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, Button, Card, FormField, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <p class="text-xl font-semibold tracking-tight text-ink">YO! Bank</p>
        </div>
        <app-card>
          <form class="p-6 md:p-8" [formGroup]="form" (ngSubmit)="submit()">
            <p class="inline-flex items-center gap-2 rounded-full bg-chip px-3 py-1 text-xs font-medium text-muted">
              <app-icon name="shield" [size]="14" />
              Connexion sécurisée
            </p>
            <h1 class="mt-5 text-2xl font-semibold tracking-tight text-ink">Connexion agent</h1>
            <p class="mt-1 text-sm text-muted">Espace d’administration du core banking.</p>
            @if (errorMessage(); as message) {
              <p class="mt-4 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{{ message }}</p>
            }
            <div class="mt-6 space-y-4">
              <app-form-field label="Nom d’utilisateur" inputId="username" [error]="controlError('username', 'Le nom d’utilisateur')">
                <input id="username" class="field-control" type="text" formControlName="username" autocomplete="username" />
              </app-form-field>
              <app-form-field label="Mot de passe" inputId="password" [error]="controlError('password', 'Le mot de passe')">
                <input id="password" class="field-control" type="password" formControlName="password" autocomplete="current-password" />
              </app-form-field>
            </div>
            <app-button class="mt-6" [block]="true" type="submit" [loading]="submitting()" [disabled]="form.invalid">
              Se connecter
            </app-button>
          </form>
        </app-card>
        <p class="mt-4 text-center text-sm">
          <a class="text-navy" routerLink="/auth/callback">Reprendre une session</a>
        </p>
      </div>
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    inject(Title).setTitle('Connexion · Yo Bank');
    if (this.session.isAuthenticated()) {
      void this.router.navigateByUrl(this.destination());
    }
  }

  protected controlError(name: 'username' | 'password', label: string): string | null {
    const control = this.form.controls[name];
    if (!this.submitted() || control.valid) {
      return null;
    }
    return `${label} est obligatoire.`;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth
      .login(username.trim(), password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(this.destination());
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          if (error instanceof ApiProblem && error.status === 401) {
            this.errorMessage.set('Identifiants invalides.');
            return;
          }
          this.errorMessage.set(error instanceof ApiProblem ? error.userMessage : 'Impossible de se connecter.');
        },
      });
  }

  private destination(): string {
    if (!this.session.hasBankAccess()) {
      return appPaths.unauthorized;
    }
    return safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }
}
