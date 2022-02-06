import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterRoutingModule } from './footer-routing.module';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { MaterialModule } from 'src/app/shared-modules/material/material.module';
import { TextModule } from 'src/app/shared-modules/text/text.module';
import { BeanieButtonModule } from 'src/app/shared-modules/beanie-button/beanie-button.module';


@NgModule({
  declarations: [
    TermsComponent,
    PrivacyComponent], 
  imports: [
    CommonModule,
    FooterRoutingModule,
    MaterialModule,
    TextModule,
    BeanieButtonModule
  ],
})
export class FooterModule { }
