import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NutritionLogManagementComponent } from './components/nutrition-log-management/log-management.component'
import { NutritionLogInDepthComponent } from './components/nutrition-log-in-depth/log-in-depth.component';

const routes: Routes = [
  { path: '', component: NutritionLogManagementComponent },
  { path: 'InDepth', component: NutritionLogInDepthComponent, }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NutritionRoutingModule { }
