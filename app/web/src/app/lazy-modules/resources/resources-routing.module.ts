import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResourceHolderComponent } from './components/resource-holder/resource-holder.component';

const routes: Routes = [{ path: '', component: ResourceHolderComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesRoutingModule { }
