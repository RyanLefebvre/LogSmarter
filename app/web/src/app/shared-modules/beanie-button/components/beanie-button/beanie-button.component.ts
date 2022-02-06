import { Component, OnInit, ChangeDetectorRef, OnDestroy, Input, AfterViewInit, AfterContentInit, AfterViewChecked } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { ProfileControlService } from 'src/app/services/general/profile-control.service';
import { PaymentService } from 'src/app/services/firebase/payments.service';
import { Router } from '@angular/router';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { MatDialog } from '@angular/material';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';

/**
 * This component is just a button that contains the logic for routing a user to the 
 * Octobat Beanie Session payment portal. It is expected that this component is not 
 * displayed if the user is not authenticated because an unauthenticated user would 
 * not be able to do anything useful with a beanie session. If the user has a free 
 * account the button will take them to a beanie session that will let them create 
 * a subscription. If the user has a paid account then the button will take them 
 * to a portal where they can update their payment information. When the button 
 * is pressed a spinner is shown and the button is hidden until the user is re-routed
 * to the beanie session, if any errors occur, then the spinner is hidden and an error 
 * message is displayed to the user. 
 * 
 * Last edited by: Ryan Lefebvre 7/26/2020
 */
@Component({
  selector: 'app-beanie-button',
  templateUrl: './beanie-button.component.html',
  styleUrls: ['./beanie-button.component.css']
})
export class BeanieButtonComponent implements OnInit, OnDestroy {

  /**
   * This key is used to communicate with our backend and authorize 
   * access to an octobat beanie session coming from LogSmarter.
   */
  OCTOBAT_PUBLIC_KEY: string = this.environmentService.getOctobatPublicKey();

  /**
   * True if an Octobat beanie session portal is loading, false otherwise.
   * If this variable is true, then a spinner will be shown in the place of the 
   * button.
   */
  loadingPortal: boolean = true;

  /**
   * CSS class that is applied to the beanie button to identify it in the HTML.
   */
  BEANIE_BUTTON_CLASS: string = "beanie-button";

  /**
   * Message displayed underneath the mat-spinner in the log-smarter-spinner-wheel component.
   */
  spinnerMessage: string = "Loading subscription portal. This may take a moment.";

  /**
   * True if the button should be disabled false/null otherwise.
   */
  @Input()
  disabled: boolean;

  /**
   * True if everything should be hidden for an error when the octo script loads. False otherwise.
   */
  hideEverythingForError: boolean = false;

  /** 
   * Global reference to the OctobatBeanie constructor that is dynamically loaded. Having this exposed 
   * as a global variable allows us to write tests that mock this variable rather than trying to mock the
   * dynamically loaded class which as far as I can tell is actually impossible.
   */
  octoConstructor: (() => any) = null;

  /**
   * True if the portal func has been set. False otherwise.
   */
  portalFuncSetOnMobile:boolean = false;

  /**
   *@ignore
   */
  constructor(
    public stateManager: StateManagerService,
    public tierPermissionsManager: TierPermissionsService,
    public profileControl: ProfileControlService,
    public paymentManager: PaymentService,
    public snackBar: SnackBarService,
    public router: Router,
    public environmentService: EnvironmentService,
    public dialog: MatDialog,
    public iap: InAppPurchaseService,
    public dialogCreator: DialogCreatorService,
    public cdr: ChangeDetectorRef) { }

  /**
   * @ignore
   */
  ngOnInit() {
    if(this.environmentService.isWeb){
      this.createBeanieButton();
    }else{
      if(this.environmentService.isMobile && !this.portalFuncSetOnMobile){
        this.loadingPortal = false;
          setTimeout(()=>{
            this.setPortalFunction();
            this.portalFuncSetOnMobile = true;
            this.cdr.detectChanges()
        },100); 
      }
    }
  }

  /**
  * @ignore 
  */
  ngOnDestroy() {
  }

  /**
   * Creates a script and inserts it as the click handler for the beanie button. This is 
   * what allows the button to navigate the user to the Octobat Beanie Session when it is 
   * clicked. This code is copied and pasted from the Octobat Developer Dashboard.
   */
  createBeanieButton(): void {
    let context = this;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/0ctobat/octobat-beanie.js@0.0.8/dist/octobat-beanie.min.js';
    s.async = true;
    s.type = 'text/javascript';
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
    s.onload = () => {
      context.setOctoConstr();
      context.loadingPortal = false;
      context.cdr.detectChanges();
      context.setPortalFunction();
    }
    s.onerror = () => {
      this.hideEverythingForError = true;
    }
  }

  /**
   * This function is a workaround to get this file to 100% unit testing coverage.
   * For whatever reason. The ignore comment will still fail in jasmine. So we are 
   * able to use this pattern to fail in our unit tests without stopping exectuion 
   * of the testing suite. Because OctobatBeanie is dynamically loaded, it wont 
   * exist in the testing environment and will cause a lot of issues.
   */
  setOctoConstr(): void {
    try {
      // @ts-ignore : this will ignore the fact that Octobat isnt loaded at build time
      this.octoConstructor = OctobatBeanie;
    } catch (error) { }
  }

  /**
   * Iterates through elements with the class beanie-button and attaches 
   * the protalFunction as the click handler of the function. There should
   * only be one button with the beanie-button class but if there are more, 
   * of the buttons with the class will have the portal function attached as a
   * click handler. If the click handler is not defined as a lambda, then 
   * errors are thrown caused from a change in the context of the 'this' 
   * keyword. To avoid this a simple lambda is defined that returns the result
   * of the portal function.
   */
  setPortalFunction(): void {
    let checkoutButtons = document.getElementsByClassName(this.BEANIE_BUTTON_CLASS);
    const context = this;
    const currentEnvIsMobile: boolean = (context.environmentService.isMobile == true);
    let PORTAL_FUNC: (() => any) = null;
    if (currentEnvIsMobile) {
      PORTAL_FUNC = () => {context.dialogCreator.openFreeAccountWarningDialog(context.iap)};
    } else {
      PORTAL_FUNC = async () => { return context.goToBeanieSession() }
    }
    for (let button = 0; button < checkoutButtons.length; button++) {
      checkoutButtons[button].addEventListener('click', PORTAL_FUNC);
    }
  }

  /**
   * Click handler for beanie button. Redirects user to beanie session,
   * if an error occurs, then an error message saying failed to load portal 
   * is displayed. An ignore comment is necessary because Octobat does not 
   * have a package to install to get their object types and the script for 
   * octobat is dynamically loaded at runtime and injected into the apllication.
   */
  async goToBeanieSession(): Promise<void> {
    this.loadingPortal = true;
    const FAILED_TO_LOAD: string = "Failed to load portal";
    const context = this;
    try {
      // @ts-ignore : this will ignore the fact that Octobat isnt loaded at build time
      var beanie = this.octoConstructor(context.OCTOBAT_PUBLIC_KEY);
      context.profileControl.beginEditing(context.profileControl.EDITING_PORTAL);
      context.loadingPortal = true;
      const beanieSesh: any = await context.paymentManager.getBeanieSessionForUser();
      const beanieSessionId = beanieSesh.id;
      const result = await beanie.redirectToBeanie({ sessionId: beanieSessionId });
      if (result.error) {
        context.snackBar.showFailureMessage(FAILED_TO_LOAD);
        context.profileControl.doneEditing();
      }
    }
    catch (error) {
      context.snackBar.showFailureMessage(FAILED_TO_LOAD);
      context.loadingPortal = false;
      context.profileControl.doneEditing();
      context.createBeanieButton();
    }
  }

  /**
   * The Beanie button should be disabled if there is a form on the profile
   * page being edited and the user is on the profile page or if the user has
   * an active subscription.
   * 
   * The button should also be disabled if it is specified as an input param.
   */
  disableBeanieButton(): boolean {
    if (this.disabled) {
      return true;
    }
    else {
      const onProfilePage: boolean = this.router.url.includes("profile");
      const profilePageBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.NOT_EDITING);
      const onProfPageAndEditing: boolean = (onProfilePage && profilePageBeingEdited);
      const userHasActiveSub: boolean = this.tierPermissionsManager.userHasActiveSubscription();
      const disableBeanieButton: boolean = (onProfPageAndEditing || userHasActiveSub);
      return disableBeanieButton;
    }
  }

}
