import { Component, OnInit, OnDestroy } from '@angular/core';
import { StateManagerService } from './services/general/state-manager.service';
import { Router, NavigationEnd } from '@angular/router';
import { AuthenticationService } from './services/firebase/authentication.service';
import { filter } from 'rxjs/operators';
import { PreferenceService } from './services/general/preference.service';
import { SnackBarService } from './shared-modules/material/snack-bar-manager.service';
import { DialogCreatorService } from './shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from './services/general/tier-permissions.service';
import { Subscription } from 'rxjs';
import { UserProfile } from './model-classes/general/user-profile';
import { InAppPurchaseService } from './services/general/in-app-purchase.service';
import { PaymentService } from './services/firebase/payments.service';
import { EnvironmentService } from './services/general/environment.service';
import { FirebaseGeneralService } from './services/firebase/firebase-general.service';
import { MobilePushNotificationsService } from './services/general/mobile-push-notifications.service';
import { MobileHealthSyncService } from './services/general/mobile-health-sync.service';

/**
 * Top level component that serves as a container for all other components.
 * Contains miscellaneous logic for updating project based upon auth state 
 * of the current user and user preferences. Uses state manager to mask display
 * if it is detected that the user has lost their internet connection.
 * 
 * Last edited by: Ryan Lefebvre 6/26/2020
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  /**
   * Session storage key for storing and accessing the 
   * previous URL. Whenever a new url is loaded. It is stored in
   * session storage so that when the page reloads it can be navigated 
   * to and maintain the session state.
   */
  CURRENT_URL: string = "CURRENT_URL";

  /**
   * Session storage key for displaying welcome message to user.
   */
  WELCOME_MESSAGE: string = "WELCOME_MESSAGE";

  /**
   * Reference to deafult URL to fall back to on errors.
   */
  DEFAULT_URL: string = "";

  /**
   * Reference to authentication state changes from state manager service.
   */
  myAuthSubscription: Subscription = null;

  /**
  * Reference to changes in the active route of the application.
  */
  myRouterSubscription: Subscription = null;

  /**
  * Observable to be used by components and other services to listen 
  * for state changes of the current user profile.
  */
  myUserSubscription: Subscription = null;

  /**
  * True if one of the two account message dialogs has been shown. False otherwise. 
  * This prevents multiple dialogs from being opened on a given page load. This 
  * could happen when the user's auth state changes because we check to open the 
  * dialogs inside the body of the auth state subscription. 
  */
  hasShownAccountMessage: boolean = false;

  /**
   * Constant used to refere to a portion of the route for the subscription
   * message page that is unique.
   */
  SUBSCRIPTION_MESSAGE_ROUTE: string = "subscription-message";

  /**
   * Constant used to refere to a portion of the route for the vrify email 
   * page that is unique 
   */
  AUTH_VERIFY_ROUTE: string = "auth/verify"

  /**
   * Angular will throw errors for invalid navigations to the root segment of 
   * a route. This constant is used to check if the route is the root segment.
   */
  ROOT_SEGMENT: string = "/";

  /**
   * True if this page has already opened a dialog this session. False otherwise.
   */
  hasOpenedDialog: boolean = false;

  /**
   * Wrapper around loaction object so that it can be mocked in tests
   */
  LOCATION: any = location;


  /**
   * @ignore
   */
  constructor(
    public state: StateManagerService,
    public authManager: AuthenticationService,
    public router: Router,
    public preferences: PreferenceService,
    public snackBarManager: SnackBarService,
    public firebaseGeneral: FirebaseGeneralService,
    public dialogCreator: DialogCreatorService,
    public permissions: TierPermissionsService,
    public payments: PaymentService,
    public environmentService: EnvironmentService,
    public IAP: InAppPurchaseService,
    public push: MobilePushNotificationsService,
    public health: MobileHealthSyncService
  ) {
  }

  /**
   * @ignore
   */
  ngOnInit() {
    this.authStateRouteSubscription();
    this.storeCurrentRouteSubscription();
    this.currentUserSubscription();
    if (this.environmentService.isMobile) {
      this.setUpForMobile();
      this.watchForIndexDbError()
    }
  }

  /**
   * Adds a listener for a known error that occurs with the firebase SDK 
   * on ios devices. This is not a perfect solution, but it seems like
   * the google team has not fixed this yet. Once the error is encountered,
   * the page just force reloads.
   * 
   * Disabling offline persistence will cause this error to not occur, but
   * thats not a great option on mobile.
   */
  watchForIndexDbError(): void {
    const context = this;
    window.onerror = function (error: any) {
      context.LOCATION.reload();
    };
  }

  /**
   * Performs any setup that is necessary for just the mobile environment.
   */
  async setUpForMobile() {
    this.IAP.setUpStoreWhenDeviceReady();
    this.push.setUpPushManager();
    this.health.setUpHealthSync()
    const context = this;
    document.addEventListener("resume", () => {
      context.checkStatusOfIAPSubscriptionIfAppropriate(context.state.getCurrentUser());
      context.hasOpenedDialog = false;
      context.hasShownAccountMessage = false;
      context.IAP.zone.run(() => context.showAccountMessageDialog());
    }, false);
    this.disableBackButtonIfAndroid();
  }

  /**
   * Disables the back button if the environment is android. This is necessary because
   * in the android app, when the back button is pressed, the web app will go to the 
   * previous page but display the page that the user was on when they clicked to go back
   * underneath the previous page. No explanation why and the easiest thing to do here 
   * was disable the button.
   * 
   * Important to wait for the deviceready event to fire to avoid race conditions.
   */
  disableBackButtonIfAndroid(): void {
    if (this.environmentService.isAndroid) {
      document.addEventListener("deviceready", () => {
        document.addEventListener("backbutton", (backEvent: Event) => backEvent.preventDefault(), false);
      }, false);
    }
  }

  /**
   * @ignore unsubscribe from all non null subscriptions
   */
  ngOnDestroy() {
    if (this.myAuthSubscription) {
      this.myAuthSubscription.unsubscribe();
    }
    if (this.myRouterSubscription) {
      this.myRouterSubscription.unsubscribe();
    }
    if (this.myUserSubscription) {
      this.myUserSubscription.unsubscribe();
    }
  }

  /**
  * Logic for updating theme every time a new state change is detected for the current user.
  * If the user's preference does not exist, the function defaults to the truqouise theme.
  */
  currentUserSubscription(): void {
    const context = this;
    this.myUserSubscription = this.state.currentUserProfile.subscribe((curUser: UserProfile) => {
      const themePrefExists = (curUser && curUser.userPreferences && curUser.userPreferences.general
        && curUser.userPreferences.general.currentTheme);
      if (themePrefExists) {
        context.updateTheme(curUser.userPreferences.general.currentTheme);
      } else {
        context.updateTheme(context.preferences.COLOR_TURQOUSIE);
      }
      if (curUser) {
        context.checkStatusOfIAPSubscriptionIfAppropriate(context.state.getCurrentUser());
      }
    });
  }

  /**
   * Handles logic for storing current url in session storage. Every time a
   * new url is navigated to, it is stored as the 'current url' in session storage.
   * Then when the window is reloaded, the url can be accessed and renavigated to.
   * This allows the navigation to maintain state despite the window reloading.
   */
  storeCurrentRouteSubscription(): void {
    const context = this;
    this.myRouterSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)).subscribe(() => {
        sessionStorage.setItem(this.CURRENT_URL, context.router.url);
      });
  }

  /**
   * Handles logic for changing application route based on auth state of the application.
   * If the user is still loading, do nothing. If the user is not loading then we know that 
   * they are either authenticated or not authenticated. Check if there is a url to the previous 
   * page the user was on during this session. If the url exists, then attempt to navigate back 
   * to that url to maintain session state. If the url does not exist then fallback to the homepage 
   * to avoid any unintended behavior. If query params exist on the route, the route url needs to 
   * be cleaned to format the params correctly to be passed into router.navigate. 
   * 
   * This function will also call helper functions to check if any of the account 
   * permission dialogs need to be shown to inform the user of their account status 
   * changing in a way that would affect actions they are able to perform in the application.
   * This check is only done if the user's auth state is not loading and is authenticated. 
   * 
   * This is necessary to handle the auth guards that will bounce the user off their current 
   * route on a route reload depending on what page they are trying to access, the permissions 
   * on that page and what their authentication status is.
   * 
   * Special cases do exist when the user's successfully returns from an Octobat
   * Beanie session or needs to verify their email. In these cases we do not want to try to
   * reload the route and accidentally knock the user off of the page because the previous URL is null.
   * In this case, we allow the user to stay on the current page. This is safe regardless of auth status 
   * as well because we allow both authenticated and unauthenticated users to view the 
   * subscription-message page and the verify email page.
   * 
   * Lastly, we must handle a restriction imposed by angular that the base route cannot 
   * have any query paramters. If we detect that the previous URL was the base route, we 
   * make sure to exclude query params from the navigation.
   * 
   */
  authStateRouteSubscription(): void {
    const context = this;
    this.myAuthSubscription = this.state.currentUserAuth.subscribe(async (authState: string) => {

      const userIsNotLoading: boolean = (authState != context.state.USER_LOADING);
      const userIsAuthenticated: boolean = (authState == context.state.USER_AUTHENTICATED);

      if (userIsNotLoading) {

        let previousURL: string = sessionStorage.getItem(context.CURRENT_URL);
        const noPreviousURL: boolean = (previousURL == null);

        if (noPreviousURL) {
          previousURL = context.DEFAULT_URL;
        }

        const routeAndParams: string[] = context.getRouteWithQueryParams(previousURL);
        const route: string = routeAndParams[0];

        let params: {} = {};
        if (routeAndParams.length > 1) {
          for (let param = 1; param < routeAndParams.length; param++) {
            const cleanedParam: string[] = context.cleanParamForNavigate(routeAndParams[param]);
            const invalidParamDetected: boolean = cleanedParam.length < 2;
            if (invalidParamDetected) {
              params = {};
              param = routeAndParams.length;
            } else {
              const property: string = cleanedParam[0];
              const value: string = cleanedParam[1];
              params[property] = value;
            }
          }
        }

        const isRootSegment: boolean = (route == this.ROOT_SEGMENT);
        const isEmptyRoute: boolean = (route == "");
        const shouldNavWithoutParamsToAvoidError = (isRootSegment || isEmptyRoute);
        const onSubscriptionMessagePage: boolean = (this.router.url.includes(this.SUBSCRIPTION_MESSAGE_ROUTE) || window.location.href.includes(this.SUBSCRIPTION_MESSAGE_ROUTE));
        const onVerifyEmailPage: boolean = this.router.url.includes(this.AUTH_VERIFY_ROUTE);
        const onProtectedPage: boolean = (onSubscriptionMessagePage || onVerifyEmailPage);
        if (!onProtectedPage) {
          if (shouldNavWithoutParamsToAvoidError) {
            await this.router.navigate([route]);
          } else {
            await this.router.navigate([route, params]);
          }
        }

        if (userIsAuthenticated) {
          context.showWelcomeMessageIfAppropriate();
          context.showAccountMessageDialog();
        }

      }
    });
  }

  /**
   * Helper function for getting query params for a route. Returns 
   * an array where each index is a different query param. If no params 
   * exist or the route is an empty string, then an empty array is returned.
   * 
   * The first index of the array will always be the original route. followed by
   * each param. 
   * 
   * @param route The route to check for params
   */
  getRouteWithQueryParams(route: string): string[] {
    const PARAM_SEPARATOR = ";";
    let params: string[] = route.split(PARAM_SEPARATOR);
    return params;
  }

  /**
   * Helper function for converting a string query parameter into the 
   * JSON format that is needed to pass to router.navigate. Expecting a string
   * of the format 'property'='value'. If the string is not in this format 
   * and the call to split the raw param results in an array that has a 
   * length less than 2, an empty array is returned. Otherwise an 
   * array is returned with the following format ['property','value'].
   */
  cleanParamForNavigate(rawParam: string): string[] {
    const PROPERTY_VALUE_SEPERATOR = "=";
    let paramArr: string[] = rawParam.split(PROPERTY_VALUE_SEPERATOR);
    if (paramArr.length < 2) {
      return [];
    }
    else {
      return paramArr;
    }
  }

  /**
  * Scrolls window back to the top. Prevents opening a new 
  * URL halfway down the page. This function is called  for every activate 
  * event that is fired off tby the top level router-outlet component.
  */
  onActivate(): void {
    window.scroll(0, 0);
    const mayNeedToReverseRubberBanding: boolean = (this.environmentService.isMobile);
    if (mayNeedToReverseRubberBanding) {
      const sideNavContent: Element = (document.getElementsByClassName('mat-sidenav-content'))[0];
      if (sideNavContent) {
        sideNavContent.scrollTop = 0;
      }
    }
  }

  /**
  * Handles updating the global CSS file responsible for application theme.
  * This function updates the main-color and main-color-darker css variables 
  * which affect the majority of the styles in the project. 
  * 
  * @param newTheme theme to update application theme to.
  */
  updateTheme(newTheme: string): void {
    document.documentElement.style.setProperty('--main-color', newTheme);
    const darkerTheme: string = this.preferences.getDarkerTheme(newTheme);
    document.documentElement.style.setProperty('--main-color-darker', darkerTheme);
  }

  /**
  * Opens a snackbar saying hello to the user when they authenticate for the first 
  * time during a session. This is done by checking session storage to see if the value 
  * retrieved using the weclome key is not null. If the value is not null then do nothing
  * because the message has already been displayed. If the value is null then set that 
  * value in session storage to an arbitrary value and display a welcome message.
  * 
  * This function assumes that the user has been authenticated and should not be called 
  * otherwise. this is because, if the user is not authenticated. their profile could be null.
  */
  showWelcomeMessageIfAppropriate(): void {
    let hasNotWelcomedUser: boolean = (window.sessionStorage.getItem(this.WELCOME_MESSAGE) == null);
    if (hasNotWelcomedUser) {
      window.sessionStorage.setItem(this.WELCOME_MESSAGE, 'arbitrary value');
      let userName: string = "";
      if (this.state.currentUserProfile.value != null) {
        const currentUser: UserProfile = this.state.currentUserProfile.value;
        if (currentUser.username)
          userName = currentUser.username;
      }
      this.snackBarManager.showSuccessMessage(" Welcome back " + userName + "!");
    }
  }

  /**
  * Opens a dialog informing the user about their account. This dialog will contain information 
  * about their permissions. One of two dialogs is opened. Either the account warning dialog, or the 
  * unpaid subscription dialog. The only exception to a case where these dialogs should be displayed is
  * when the user is on the subscription message page. This page should not show either dialog because 
  * it is likeley there are webhooks being received on the backend that will update the user's subscription status.
  * The dialogs are opened with a 400 second delay because it looks more natural than not having a delay.
  */
  showAccountMessageDialog(): void {
    let currentUser: UserProfile = this.state.getCurrentUser();
    if (!currentUser) {
      return;//Prevents bug that we were seeing on adroid where current user was null and this was getting called
    }
    const notOnSubMsgPage: boolean = !((this.router.url.includes(this.SUBSCRIPTION_MESSAGE_ROUTE) || window.location.href.includes(this.SUBSCRIPTION_MESSAGE_ROUTE)));
    const notOnIAP: boolean = !(this.router.url.includes("mobile-subscription"));
    const notOnRestrictedPage: boolean = (notOnSubMsgPage && notOnIAP);
    const shouldShowAccountDialog: boolean = (this.permissions.showAccountWarning() || this.permissions.userSubscriptionUnpaid()) && notOnRestrictedPage;
    let context = this;
    const notOnAuthPage: boolean = !(window.location.href.includes("auth"));
    if (notOnAuthPage && notOnRestrictedPage) {
      currentUser = this.state.getCurrentUser();
      const usersFirstSignInAndIndividual: boolean = (!(currentUser.hasLoggedInBefore));
      if (usersFirstSignInAndIndividual && !this.hasOpenedDialog && notOnAuthPage) {
        context.hasOpenedDialog = true;
        setTimeout(() => {
          context.dialogCreator.openFirstTimeTipsDialog();
          currentUser.hasLoggedInBefore = true;
          currentUser = context.state.getCurrentUser();
          context.firebaseGeneral.updateUserProfileInDB(currentUser, null, null, true, true);
        }, 200);
      }
    }
    if (shouldShowAccountDialog && !this.hasOpenedDialog && notOnAuthPage) {
      context.hasOpenedDialog = true;
      setTimeout(() => {
        if (!context.hasShownAccountMessage) {
          context.hasShownAccountMessage = true;
          context.dialogCreator.openAppropritateAccountDialog(context.IAP);
        }
      }, 200);
    }

  }

  /**
   * This function makes a request to the backend to check the state of a user's IAP
   * subscription and update the state if necessary. It should only be called if the user's subPlatform 
   * property indicates that their most recent active subscription was made on iOS (aka an IAP subscription)
   * if the user is on web or android. If the user is on iOS, then this function is still called once per
   * session, but only if the user has an active IAP subscription.
   */
  async checkStatusOfIAPSubscriptionIfAppropriate(currentUser: UserProfile): Promise<any> {
    const haveAlreadyCheckedThisToday: string = this.state.getCache(this.payments.IAP_STATUS_CHECK_KEY);
    const shouldCheckThisSession: boolean = (!haveAlreadyCheckedThisToday || this.environmentService.isProduction == false);
    if (shouldCheckThisSession) {
      const mostRecentSubscriptionMadeOnIos = (currentUser && currentUser.subPlatform == this.payments.constantsService.PLATFORM_iOS);
      const shouldCheckStatus: boolean = mostRecentSubscriptionMadeOnIos;
      if (shouldCheckStatus) {
        this.state.setCache(this.payments.IAP_STATUS_CHECK_KEY, "someArbitraryValue", 1);
        await this.payments.checkStatusOfIAPSubscription();
      }
    }
  }

}
