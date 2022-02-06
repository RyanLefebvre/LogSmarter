import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ConversionService } from './services/general/conversion.service';
import { StateManagerService } from './services/general/state-manager.service';
import { OnlyLoggedInUsersGuard } from './services/route-guards/only-logged-in-users-guard.service';
import { AuthenticationService } from './services/firebase/authentication.service';
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { OnlyNotLoggedInUsersGuard } from './services/route-guards/only-not-logged-in-users-guard.service';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from './app-level-components/navbar/navbar.component';
import { FooterComponent } from './app-level-components/footer/footer.component';
import { DirectivesModule } from './shared-modules/directives/directives.module';
import { MaterialModule } from './shared-modules/material/material.module';
import { PipesModule } from './shared-modules/pipes/pipes.module';
import { DialogsModule } from './shared-modules/dialogs/dialogs.module';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { environment } from '../environments/environment';
import { ThemeService } from 'ng2-charts';

/**
 * Top level of the LogSmarter routing hierarchy. Controls permissions to certain routes.
 */
const routes = [
  {
    path: '',
    loadChildren: () => import('./lazy-modules/landing-page/landing-page.module').then(m => m.LandingPageModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./lazy-modules/unauthorized/unauthorized.module').then(m => m.UnauthorizedModule)
  },
  {
    path: 'dashboard', canActivate: [OnlyLoggedInUsersGuard],
    loadChildren: () => import('./lazy-modules/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'nutrition-logs', canActivate: [OnlyLoggedInUsersGuard],
    loadChildren: () => import('./lazy-modules/nutrition/nutrition.module').then(m => m.NutritionModule)
  },
  {
    path: 'profile', canActivate: [OnlyLoggedInUsersGuard],
    loadChildren: () => import('./lazy-modules/profile/profile.module').then(m => m.ProfileModule)
  },
  {
    path: 'resources', canActivate: [OnlyLoggedInUsersGuard],
    loadChildren: () => import('./lazy-modules/resources/resources.module').then(m => m.ResourcesModule)
  },
  {
    path: 'info',
    loadChildren: () => import('./lazy-modules/footer/footer.module').then(m => m.FooterModule)
  },
  {
    path: '**', redirectTo: '', pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    FooterComponent
  ],
  imports: [
    RouterModule.forRoot(routes, { useHash: true, onSameUrlNavigation: 'reload', scrollPositionRestoration: 'top' }),
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireFunctionsModule,
    MaterialModule,
    DirectivesModule,
    BrowserModule,
    BrowserAnimationsModule,
    PipesModule,
    DialogsModule
  ],
  providers: [
    ConversionService,
    StateManagerService,
    OnlyNotLoggedInUsersGuard,
    OnlyLoggedInUsersGuard,
    AuthenticationService,
    ThemeService
  ],
  bootstrap: [AppComponent],
  entryComponents: []
})
export class AppModule { }