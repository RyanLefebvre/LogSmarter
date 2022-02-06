import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageComponent } from './components/home-page/home-page.component';
import { AccountUpgradeComponent } from './components/account-upgrade/account-upgrade.component';

const routes: Routes = [
    { path: '', component: HomePageComponent },
    { path: 'subscription-message', component: AccountUpgradeComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LandingPageRoutingModule { }
