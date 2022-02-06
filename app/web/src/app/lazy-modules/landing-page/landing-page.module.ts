import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageComponent } from './components/home-page/home-page.component';
import { LandingPageRoutingModule } from './landing-page-routing.module';
import { MaterialModule } from 'src/app/shared-modules/material/material.module';
import { SocialModule } from 'src/app/shared-modules/social-dashboard/social-module';
import { AccountUpgradeComponent } from './components/account-upgrade/account-upgrade.component';


@NgModule({
  declarations: [
    HomePageComponent,
    AccountUpgradeComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    LandingPageRoutingModule,
    SocialModule
  ]
})
export class LandingPageModule { }
