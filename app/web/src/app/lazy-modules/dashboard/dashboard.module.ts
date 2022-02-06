import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/shared-modules/material/material.module';
import { NutritionLogSummaryComponent } from './components/nutrition-log-summary/log-summary.component';
import { PipesModule } from 'src/app/shared-modules/pipes/pipes.module';
import { SocialModule } from 'src/app/shared-modules/social-dashboard/social-module';
import { IndividualDashboardComponent } from './components/individual-dashboard/dashboard.component';
import { DashboardParentComponent } from './components/dashboard-parent/dashboard-parent.component';
import { ChartsModule } from 'ng2-charts';

const routes: Routes = [
  { path: '', component: DashboardParentComponent }
];

@NgModule({
  declarations: [IndividualDashboardComponent, NutritionLogSummaryComponent, DashboardParentComponent],
  imports: [
    CommonModule,
    MaterialModule,
    PipesModule,
    RouterModule.forChild(routes),
    SocialModule,
    ChartsModule
  ]
})
export class DashboardModule { }
