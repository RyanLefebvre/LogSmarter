import { PipesModule } from 'src/app/shared-modules/pipes/pipes.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialDashboardComponent } from './components/social-dashboard/social-dashboard.component';
import { MaterialModule } from '../material/material.module';
import { EmbedPanelComponent } from './components/embed-panel/embed-panel.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    PipesModule
  ],
  declarations: [
    EmbedPanelComponent,
    SocialDashboardComponent
  ],
  exports: [
    SocialDashboardComponent
  ],
  providers: [
  ]
})
export class SocialModule { }
