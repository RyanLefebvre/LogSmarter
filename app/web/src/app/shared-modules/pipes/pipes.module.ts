import { NgModule } from '@angular/core';
import { WeightPipe } from 'src/app/shared-pipes/weight-pipe';
import { HeightPipe } from 'src/app/shared-pipes/height-pipe';
import { CaloriePipe } from 'src/app/shared-pipes/calorie-pipe';
import { DatePipe } from '@angular/common';
import { SafePipe } from 'src/app/shared-pipes/safe-url-pipe';

@NgModule({
  declarations: [
    WeightPipe,
    HeightPipe,
    CaloriePipe,
    SafePipe
  ],
  providers: [
    WeightPipe,
    HeightPipe,
    CaloriePipe,
    DatePipe,
    SafePipe
  ],
  exports: [
    WeightPipe,
    HeightPipe,
    CaloriePipe,
    SafePipe
  ]
})
export class PipesModule { }
