import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsTextComponent } from './components/terms/terms.component';
import { MaterialModule } from '../material/material.module';



@NgModule({
  declarations: [TermsTextComponent],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [TermsTextComponent]
})
export class TextModule { }
