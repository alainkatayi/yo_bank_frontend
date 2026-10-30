import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { appPaths } from '../../core/config/app-paths';
import { PROBLEM_MESSAGES } from '../../core/config/problem-messages';
import { ApiProblem } from '../../core/models/problem-detail';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { FormField } from '../../components/ui/form-field';
import { PageHeader } from '../../components/ui/page-header';

const PHONE_PATTERN = /^(\+243|243)\d{9}$/;

@Component({
  selector: 'app-customer-create-page',
  imports: [ReactiveFormsModule, Button, Card, FormField, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Nouveau client" subtitle="Le dossier est créé avec le statut Actif." />
    <div class="max-w-3xl">
      <app-card>
        <form class="p-6 md:p-8" [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid items-start gap-x-5 gap-y-5 sm:grid-cols-2">
            <app-form-field label="Prénom" inputId="firstName" [error]="textError('firstName', 'Le prénom')">
              <input id="firstName" class="field-control" type="text" formControlName="firstName" autocomplete="given-name" />
            </app-form-field>
            <app-form-field label="Nom" inputId="lastName" [error]="textError('lastName', 'Le nom')">
              <input id="lastName" class="field-control" type="text" formControlName="lastName" autocomplete="family-name" />
            </app-form-field>
            <app-form-field
              class="sm:col-span-2"
              label="Téléphone"
              inputId="phone"
              hint="Format +243 suivi de 9 chiffres, par exemple +243810000001."
              [error]="phoneMessage()"
            >
              <input id="phone" class="field-control" type="tel" formControlName="phone" autocomplete="tel" inputmode="tel" />
            </app-form-field>
            <app-form-field class="sm:col-span-2" label="E-mail (facultatif)" inputId="email" [error]="textError('email', 'L’e-mail')">
              <input id="email" class="field-control" type="email" formControlName="email" autocomplete="email" />
            </app-form-field>
          </div>
          <div class="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
            <app-button class="sm:w-auto" variant="secondary" type="button" [block]="true" (click)="cancel()">Annuler</app-button>
            <app-button class="sm:w-auto" type="submit" [block]="true" [loading]="submitting()">Créer le client</app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class CustomerCreatePage {
  private readonly customers = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly phoneError = signal<string | null>(null);
  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    phone: new FormControl('', { nonNullable: true, validators: [phoneValidator, Validators.maxLength(20)] }),
    email: new FormControl('', { nonNullable: true, validators: [optionalEmail, Validators.maxLength(150)] }),
  });

  constructor() {
    inject(Title).setTitle('Nouveau client · Yo Bank');
    this.form.controls.phone.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.phoneError.set(null);
    });
  }

  protected textError(name: 'firstName' | 'lastName' | 'email', label: string): string | null {
    const control = this.form.controls[name];
    if (!this.submitted() && !control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return `${label} est obligatoire.`;
    }
    if (control.hasError('email')) {
      return 'Adresse e-mail invalide.';
    }
    if (control.hasError('maxlength')) {
      return `${label} est trop long.`;
    }
    return null;
  }

  protected phoneMessage(): string | null {
    if (this.phoneError()) {
      return this.phoneError();
    }
    const control = this.form.controls.phone;
    if ((!this.submitted() && !control.touched) || control.valid) {
      return null;
    }
    return 'Saisissez un numéro +243 suivi de 9 chiffres.';
  }

  protected cancel(): void {
    void this.router.navigateByUrl(appPaths.customers);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.phoneError.set(null);
    const raw = this.form.getRawValue();
    this.customers
      .create({
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        phone: raw.phone.trim(),
        email: raw.email.trim() === '' ? null : raw.email.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (customer) => {
          this.toast.success('Client créé.');
          void this.router.navigateByUrl(appPaths.customer(customer.id));
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          if (error instanceof ApiProblem && error.code === 'DUPLICATE_PHONE') {
            this.phoneError.set(error.userMessage || PROBLEM_MESSAGES['DUPLICATE_PHONE'] || null);
            this.form.controls.phone.setErrors({ duplicate: true });
          }
        },
      });
  }
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return { required: true };
  }
  return PHONE_PATTERN.test(value) ? null : { phone: true };
}

function optionalEmail(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return null;
  }
  return Validators.email(control);
}
