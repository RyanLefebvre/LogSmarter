import { NgModule } from '@angular/core';
//for chart.js
import { ChartsModule } from 'ng2-charts';

@NgModule({
  exports: [
    ChartsModule
  ]
})
export class MyChartsModule { }
