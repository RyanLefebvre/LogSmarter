import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeanieButtonComponent } from './components/beanie-button/beanie-button.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [
    BeanieButtonComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
  ],
  exports: [
    BeanieButtonComponent
  ]
})
export class BeanieButtonModule { }
