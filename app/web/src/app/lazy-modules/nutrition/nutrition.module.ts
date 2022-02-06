import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NutritionRoutingModule } from './nutrition-routing.module';

import { NutritionLogManagementComponent } from './components/nutrition-log-management/log-management.component';
import { GraphWidgetComponent } from './components/graph-widget/graph-widget.component';
import { InDepthNutritionLogDisplayComponent } from './components/in-depth-nutrition-display/in-depth-display.component';
import { ListViewComponent } from './components/list-view/list-view.component';
import { ListViewGridComponent } from './components/list-view-grid/list-view-grid.component';
import { NutritionLogInDepthComponent } from './components/nutrition-log-in-depth/log-in-depth.component';
import { MaterialModule } from 'src/app/shared-modules/material/material.module';
import { DirectivesModule } from 'src/app/shared-modules/directives/directives.module';
import { PipesModule } from 'src/app/shared-modules/pipes/pipes.module';
import { MyChartsModule } from 'src/app/shared-modules/charts/myCharts.module';

@NgModule({
  declarations: [
    NutritionLogManagementComponent,
    GraphWidgetComponent,
    InDepthNutritionLogDisplayComponent,
    ListViewComponent,
    ListViewGridComponent,
    NutritionLogInDepthComponent
  ],

  imports: [
    CommonModule,
    NutritionRoutingModule,
    MaterialModule,
    DirectivesModule,
    PipesModule,
    MyChartsModule,
  ],
  entryComponents: [
  ]
})
export class NutritionModule { }


