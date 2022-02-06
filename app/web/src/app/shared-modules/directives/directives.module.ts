import { NgModule } from '@angular/core';
import { DisableControlDirective } from './disable-control';

@NgModule({
  declarations: [
    DisableControlDirective,
  ],
  exports: [
    DisableControlDirective,
  ]
})
export class DirectivesModule { }
