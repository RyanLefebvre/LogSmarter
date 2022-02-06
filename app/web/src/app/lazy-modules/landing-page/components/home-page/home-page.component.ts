import { Component, OnInit, OnDestroy } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { Router } from '@angular/router';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * This component is the logsmarter homepage. It is split into a 
 * few main sections. Most important is the desciption of what LogSmarter 
 * is at the very top. Followed by brief selling points of the software 
 * and then a call to action with a register button.
 * 
 * The only functional requirement of the home page is to disable the register 
 * button once the user authenticates. This prevents a button that would lead to 
 * route the user does not have permissions for from being clickable.
 * 
 * Last edited by: Ryan Lefebvre 6/20/2020
 */
@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit, OnDestroy {

  /**
   * @ignore
   */
  constructor(
    public stateManager: StateManagerService,
    public router: Router,
    public environmentService: EnvironmentService) {
    this.stateManager.userIsAuthenticated();
    this.stateManager.userIsNotAuthenticated();
  }

  /**
   * @ignore
   */
  ngOnInit() {
    this.stateManager.hideDocumentOverflow();
  }

  /**
   * @ignore
   */
  ngOnDestroy() {
    this.stateManager.revertHideOverflow();
  }

  /**
   * Helper function for register button to navigate 
   * to the register form in the call to action section.
   */
  goToRegister(): void {
    this.stateManager.goToRegister();
  }

  /**
   * Helper function for sign in button that redirects
   * users to the sign in page.
   */
  goToSignIn(): void {
    this.router.navigate(['/auth/login'])
  }

  /**
  * Closes the dialog with a lambda called by the after close function that will
  * take the user to the terms of service page.
  */
  goToTerms(): void {
    this.router.navigate(['/info/terms']);
  }

  /**
   * Closes the dialog with a lambda called by the after close function that will
   * take the user to the privacy policy page.
   */
  goToPrivacy(): void {
    this.router.navigate(['/info/privacy']);
  }

  /**
   * Takes the user back to the dashboard;
   */
  goToDash(): void {
    this.router.navigate(['/dashboard']);
  }

}
