import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnauthorizedRoutingModule } from './unauthorized-routing.module';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { MaterialModule } from 'src/app/shared-modules/material/material.module';


@NgModule({
  declarations: [
    SignUpComponent,
    VerifyEmailComponent,
    SignInComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    UnauthorizedRoutingModule
  ],
  entryComponents: []
})
export class UnauthorizedModule { }
