import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserProfileDisplayComponent } from './components/user-profile-display/user-profile-display.component';

const routes: Routes = [
  { path: '', component: UserProfileDisplayComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
