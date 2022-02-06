import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesRoutingModule } from './resources-routing.module';
import { ResourceHolderComponent } from './components/resource-holder/resource-holder.component';
import { MaterialModule } from 'src/app/shared-modules/material/material.module';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { PipesModule } from 'src/app/shared-modules/pipes/pipes.module';
import { WhatIsTDEEComponent } from './components/what-is-tdee/what-is-tdee.component';
import { ActivityLevelGuideComponent } from './components/activity-level-guide/activity-level-guide.component';
import { PeriodizationComponent } from './components/periodization/periodization.component';
import { BulkingComponent } from './components/bulking/bulking.component';
import { CuttingComponent } from './components/cutting/cutting.component';
import { BulkOrCutComponent } from './components/bulk-or-cut/bulk-or-cut.component';

@NgModule({
  declarations: [
    ResourceHolderComponent,
    WhatIsTDEEComponent,
    ActivityLevelGuideComponent,
    PeriodizationComponent,
    BulkingComponent,
    CuttingComponent,
    BulkOrCutComponent
  ],
  imports: [
    CommonModule,
    ResourcesRoutingModule,
    MaterialModule,
    AngularFireStorageModule,
    PipesModule
  ]
})
export class ResourcesModule { }
