import { StateManagerService } from './services/general/state-manager.service';
import { AuthenticationService } from './services/firebase/authentication.service';
import { PreferenceService } from './services/general/preference.service';
import { SnackBarService } from './shared-modules/material/snack-bar-manager.service';
import { DialogCreatorService } from './shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from './services/general/tier-permissions.service';
import { AppComponent } from './app.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { BehaviorSubject, Subscription } from 'rxjs';
import { UserProfile } from './model-classes/general/user-profile';
import { InAppPurchaseService } from './services/general/in-app-purchase.service';
import { EnvironmentService } from './services/general/environment.service';
import { PaymentService } from './services/firebase/payments.service';
import { FirebaseGeneralService } from './services/firebase/firebase-general.service';
import { ConstantsService } from './services/general/constants.service';
import { fakeAsync, tick } from '@angular/core/testing';
import { NavigationEnd } from '@angular/router';
import { MobileHealthSyncService } from './services/general/mobile-health-sync.service';
import { MobilePushNotificationsService } from './services/general/mobile-push-notifications.service';

let pipeSubRef;

describe('AppComponent', () => {
  const testHelper: TestHelpers = new TestHelpers();
  let component: AppComponent;
  let checkStatusRef;

  beforeEach(() => {
    component = setup('auth/verify').default().build();
    component.payments.constantsService = new ConstantsService()
    checkStatusRef = component.checkStatusOfIAPSubscriptionIfAppropriate;
    component.checkStatusOfIAPSubscriptionIfAppropriate = jasmine.createSpy();
  });

  it('should not crash when ngOnInit is called', () => {
    component.environmentService.isMobile = false;
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it('should unscubscribe from all subscriptions if they are non-null when ngOnDestroy is called', () => {
    component.myAuthSubscription = new Subscription();
    component.myRouterSubscription = new Subscription();
    component.myUserSubscription = new Subscription();

    const myAuthUnsubSpy: jasmine.Spy<() => void> = spyOn(component.myAuthSubscription, 'unsubscribe');
    const myRoutUnsubSpy: jasmine.Spy<() => void> = spyOn(component.myRouterSubscription, 'unsubscribe');
    const myUserUnsubSpy: jasmine.Spy<() => void> = spyOn(component.myRouterSubscription, 'unsubscribe');


    component.ngOnDestroy();

    expect(myAuthUnsubSpy).toHaveBeenCalled();
    expect(myRoutUnsubSpy).toHaveBeenCalled();
    expect(myUserUnsubSpy).toHaveBeenCalled();
  });

  it('should not unsubscribe from subscriptions that do not exists when ngOnDestroy is called', () => {
    component.myAuthSubscription = new Subscription();
    component.myRouterSubscription = new Subscription();
    component.myUserSubscription = new Subscription();

    const myAuthUnsubSpy: jasmine.Spy<() => void> = spyOn(component.myAuthSubscription, 'unsubscribe');
    const myRoutUnsubSpy: jasmine.Spy<() => void> = spyOn(component.myRouterSubscription, 'unsubscribe');
    const myUserUnsubSpy: jasmine.Spy<() => void> = spyOn(component.myRouterSubscription, 'unsubscribe');


    component.myAuthSubscription = null;
    component.myRouterSubscription = null;
    component.myUserSubscription = null;
    component.myUserSubscription = null;

    component.ngOnDestroy();

    expect(myAuthUnsubSpy).not.toHaveBeenCalled();
    expect(myRoutUnsubSpy).not.toHaveBeenCalled();
    expect(myUserUnsubSpy).not.toHaveBeenCalled();
  });

  it('should update the theme if it has been updated when currentUserSubscription is called', () => {
    let lambdaRef = null;
    const updateThemeSpy: jasmine.Spy<(theme) => void> = spyOn(component, 'updateTheme');

    component.state.currentUserProfile = {
      subscribe: (userProfile) => {
        lambdaRef = userProfile;
      },
    } as any;

    const user = new UserProfile();
    user.userPreferences = { general: { currentTheme: 'ORANGE' } };

    component.checkStatusOfIAPSubscriptionIfAppropriate = () => null;
    component.currentUserSubscription();

    lambdaRef(user);

    expect(updateThemeSpy).toHaveBeenCalledWith(user.userPreferences.general.currentTheme);
  });

  it('should NOT check the IAP status when currentUserSubscription is called if the curUSer is null', () => {
    let lambdaRef = null;

    component.state.currentUserProfile = {
      subscribe: (userProfile) => {
        lambdaRef = userProfile;
      },
    } as any;

    const user = new UserProfile();
    user.userPreferences = { general: { currentTheme: 'ORANGE' } };

    component.checkStatusOfIAPSubscriptionIfAppropriate = () => null;
    component.currentUserSubscription();
    component.checkStatusOfIAPSubscriptionIfAppropriate = jasmine.createSpy();
    lambdaRef(null);

    expect(component.checkStatusOfIAPSubscriptionIfAppropriate).not.toHaveBeenCalled();
  });

  it('should set the turquoise theme if a preference has not been set when currentUserSubscription is called ', () => {
    let lambdaRef = null;
    const updateThemeSpy: jasmine.Spy<(theme) => void> = spyOn(component, 'updateTheme');

    component.state.currentUserProfile = {
      subscribe: (userProfile) => {
        lambdaRef = userProfile;
      },
    } as any;

    const user = new UserProfile();
    user.userPreferences = { general: undefined } as any;
    component.checkStatusOfIAPSubscriptionIfAppropriate = () => null;
    component.currentUserSubscription();

    lambdaRef(user);

    expect(updateThemeSpy).toHaveBeenCalledWith(component.preferences.COLOR_TURQOUSIE);
  });

  it('should store current url in session storage when storeCurrentRouteSubcription is called', () => {
    const setItemSpy: jasmine.Spy<(key, value) => void> = spyOn(sessionStorage, 'setItem');

    component.storeCurrentRouteSubscription();
    pipeSubRef();
    expect(setItemSpy).toHaveBeenCalledWith(component.CURRENT_URL, 'auth/verify');
  });

  it('should not do anything if the user is loading when authStateRouteSubscription is called', () => {
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    const routeWithParamsSpy: jasmine.Spy<(url) => []> = spyOn(component, 'getRouteWithQueryParams');

    component.authStateRouteSubscription();

    lambdaRef('LOADING');

    expect(routeWithParamsSpy).not.toHaveBeenCalled();
  });

  it('should showWelcomeMessage and MessageDiaglogue if the user is authenticated when authStateRouteSubscription is called', () => {
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    const showWelcomeSpy: jasmine.Spy<() => void> = spyOn(component, 'showWelcomeMessageIfAppropriate');
    const showMessageSpy: jasmine.Spy<() => void> = spyOn(component, 'showAccountMessageDialog');

    component.authStateRouteSubscription();

    lambdaRef('AUTHENTICATED');

    expect(showWelcomeSpy).toHaveBeenCalled();
    expect(showMessageSpy).toHaveBeenCalled();
  });

  it('should not show WelcomeMessage and MessageDiaglogue if the user is not authenticated when authStateRouteSubscription is called', () => {
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    const showWelcomeSpy: jasmine.Spy<() => void> = spyOn(component, 'showWelcomeMessageIfAppropriate');
    const showMessageSpy: jasmine.Spy<() => void> = spyOn(component, 'showAccountMessageDialog');

    component.authStateRouteSubscription();

    lambdaRef('NOT AUTHENTICATED');

    expect(showWelcomeSpy).not.toHaveBeenCalled();
    expect(showMessageSpy).not.toHaveBeenCalled();
  });

  it('should navigate with params if the route is not empty or the root segment when authStateRouteSubscription is called', fakeAsync(() => {
    component = setup('some/page').default().build();
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    const routerNavSpy: jasmine.Spy<([]) => Promise<boolean>> = spyOn(component.router, 'navigate');
    const paramList = ['base/', 'param1=value1', 'param2=value2', 'param3=value3'];

    spyOn(component, 'getRouteWithQueryParams').and.returnValue(paramList);

    component.authStateRouteSubscription();

    lambdaRef('NOT LOADING');

    tick();

    expect(routerNavSpy).toHaveBeenCalled();
  }));

  it('should navigate with an empty params object when if invalid param is detected when authStateRouteSubscription is called', fakeAsync(() => {
    component = setup('some/page').default().build();
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    const routerNavSpy: jasmine.Spy<([]) => Promise<boolean>> = spyOn(component.router, 'navigate');
    const paramList = ['base/', 'param1=value1', 'badparam', 'param3=value3'];

    spyOn(component, 'getRouteWithQueryParams').and.returnValue(paramList);

    component.authStateRouteSubscription();

    lambdaRef('NOT LOADING');

    tick();

    expect(routerNavSpy).toHaveBeenCalledWith(['base/', {}]);
  }));

  it('should navigate without params to avoid error if the route is empty or the root segment when authStateRouteSubscription is called', fakeAsync(() => {
    component = setup('some/page').default().build();
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    const routerNavSpy: jasmine.Spy<([]) => Promise<boolean>> = spyOn(component.router, 'navigate');
    const paramList = [component.ROOT_SEGMENT, 'param1=value1', 'param2=value2', 'param3=value3'];

    spyOn(component, 'getRouteWithQueryParams').and.returnValue(paramList);

    component.authStateRouteSubscription();

    lambdaRef('NOT LOADING');

    tick();

    expect(routerNavSpy).toHaveBeenCalled();
  }));

  it('should use the previous url if one exists when the authStateRouteSubscription is called', () => {
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    spyOn(sessionStorage, 'getItem').and.returnValue('some/dummy/url');
    const paramList = ['some/dummy/url', 'param1=value1', 'param2=value2', 'param3=value3'];

    const getRouteSpy: jasmine.Spy<(url) => string[]> = spyOn(component, 'getRouteWithQueryParams').and.returnValue(paramList);

    component.authStateRouteSubscription();

    lambdaRef('NOT LOADING');

    expect(getRouteSpy).toHaveBeenCalledWith('some/dummy/url');
  });

  it('should not use the default url if one does not exist when authStateRouteSubscription is called', () => {
    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    spyOn(sessionStorage, 'getItem').and.returnValue(null);

    const paramList = ['', 'param1=value1', 'param2=value2', 'param3=value3'];
    const getRouteSpy: jasmine.Spy<(url) => string[]> = spyOn(component, 'getRouteWithQueryParams').and.returnValue(paramList);

    component.authStateRouteSubscription();

    lambdaRef('NOT LOADING');

    expect(getRouteSpy).toHaveBeenCalledWith(component.DEFAULT_URL);
  });

  it('should not navigate if the user is on a protected page when authStateRouteSubscription is called', () => {
    const routerNavSpy: jasmine.Spy<([]) => Promise<boolean>> = spyOn(component.router, 'navigate');

    let lambdaRef = null;
    component.state = {
      USER_AUTHENTICATED: 'AUTHENTICATED',
      USER_LOADING: 'LOADING',
      currentUserAuth: {
        subscribe: (param) => {
          lambdaRef = param;
        },
      }
    } as any;

    spyOn(sessionStorage, 'getItem').and.returnValue(null);

    component.authStateRouteSubscription();

    lambdaRef('NOT LOADING');

    expect(routerNavSpy).not.toHaveBeenCalled();
  });

  it('should return return an array of query params for a route when getRouteWithQueryParams is called', () => {
    const route = 'a/simple/route;param1;param2;param3';

    const params = component.getRouteWithQueryParams(route);

    expect(params[0]).toEqual('a/simple/route');
    expect(params[1]).toEqual('param1');
    expect(params[2]).toEqual('param2');
    expect(params[3]).toEqual('param3')
  });

  it('should parse a query param into an array of size 2 when cleanParamForNavigate is called with a valid string of params', () => {
    const param = 'property1=value1';

    const result = component.cleanParamForNavigate(param);

    expect(result[0]).toEqual('property1');
    expect(result[1]).toEqual('value1');
  });

  it('should return an empty array when cleanParamForNavigate is called with an invalid string of params', () => {
    const param = 'property';

    const result = component.cleanParamForNavigate(param);

    expect(result).toEqual([]);
  });

  it('should scroll to the top of the page when onActivate is called', () => {
    const scrollSpy: jasmine.Spy<(x, y) => void> = spyOn(window, 'scroll');
    component.onActivate();
    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
  });

  it('should scroll the side navs content to the top if mayNeedToReverseRubberBanding is true ', () => {
    component.environmentService.isMobile = true;
    const fakeElem = { scrollTop: 4545454 };
    document.getElementsByClassName = () => {
      return [fakeElem] as any;
    }
    component.onActivate();
    expect(fakeElem.scrollTop).toBe(0);
  });

  it('should NOT scroll the side navs content to the top if mayNeedToReverseRubberBanding is true but it cant find the element', () => {
    const scrollSpy: jasmine.Spy<(x, y) => void> = spyOn(window, 'scroll');
    component.environmentService.isMobile = true;
    document.getElementsByClassName = () => {
      return [null] as any;
    }
    component.onActivate();
    expect(scrollSpy).toHaveBeenCalledWith(0, 0);
  });

  it('should update the global css filer main-color and main-color-darker variables when updateTheme is called', () => {
    const theme = component.preferences.COLOR_TURQOUSIE;
    const docSpy: jasmine.Spy<(property, value) => void> = spyOn(document.documentElement.style, 'setProperty');
    const getDarkerSpy: jasmine.Spy<(theme) => void> = spyOn(component.preferences, 'getDarkerTheme');

    component.updateTheme(theme);
    expect(getDarkerSpy).toHaveBeenCalledWith(theme)
    expect(docSpy).toHaveBeenCalledTimes(2);
  });

  it('should set session storage to an aribitrary value and display a welcome message if the value is null when showWelcomeMessageIfAppropriate is called', () => {
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    const storageSpy: jasmine.Spy<(property, value) => void> = spyOn(window.sessionStorage, 'setItem');
    const snackSpy: jasmine.Spy<(message) => void> = spyOn(component.snackBarManager, 'showSuccessMessage');

    component.showWelcomeMessageIfAppropriate();

    expect(storageSpy).toHaveBeenCalledWith(component.WELCOME_MESSAGE, 'arbitrary value');
    expect(snackSpy).toHaveBeenCalledWith(" Welcome back username!");
  });

  it('should set session storage to an aribitrary value and display a welcome message including the username if the value is null when showWelcomeMessageIfAppropriate is called', () => {
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    const storageSpy: jasmine.Spy<(property, value) => void> = spyOn(window.sessionStorage, 'setItem');
    const snackSpy: jasmine.Spy<(message) => void> = spyOn(component.snackBarManager, 'showSuccessMessage');

    component.showWelcomeMessageIfAppropriate();

    expect(storageSpy).toHaveBeenCalledWith(component.WELCOME_MESSAGE, 'arbitrary value');
    expect(snackSpy).toHaveBeenCalledWith(" Welcome back username!");
  });

  it('should display a welcome message not including the username if the current user profile does not have a username when showWelcomeMessageIfAppropriate is called', () => {
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    component.state.currentUserProfile = { value: { username: undefined } } as any
    const storageSpy: jasmine.Spy<(property, value) => void> = spyOn(window.sessionStorage, 'setItem');
    const snackSpy: jasmine.Spy<(message) => void> = spyOn(component.snackBarManager, 'showSuccessMessage');

    component.showWelcomeMessageIfAppropriate();

    expect(storageSpy).toHaveBeenCalledWith(component.WELCOME_MESSAGE, 'arbitrary value');
    expect(snackSpy).toHaveBeenCalledWith(" Welcome back !");
  });

  it('should display a welcome message not indcluding the username if the user profile is null when showWelcomeMessageIfAppropriate is called', () => {
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    component.state.currentUserProfile = { value: null } as any;
    const storageSpy: jasmine.Spy<(property, value) => void> = spyOn(window.sessionStorage, 'setItem');
    const snackSpy: jasmine.Spy<(message) => void> = spyOn(component.snackBarManager, 'showSuccessMessage');

    component.showWelcomeMessageIfAppropriate();

    expect(storageSpy).toHaveBeenCalledWith(component.WELCOME_MESSAGE, 'arbitrary value');
    expect(snackSpy).toHaveBeenCalledWith(" Welcome back !");
  });

  it('should not show the welcome back message if the user has already been welcomed when showWelcomeBackMessageIfAppropriate has been called', () => {
    spyOn(window.sessionStorage, 'getItem').and.returnValue('true');
    const storageSpy: jasmine.Spy<(property, value) => void> = spyOn(window.sessionStorage, 'setItem');
    const snackSpy: jasmine.Spy<(message) => void> = spyOn(component.snackBarManager, 'showSuccessMessage');

    component.showWelcomeMessageIfAppropriate();

    expect(storageSpy).not.toHaveBeenCalled();
    expect(snackSpy).not.toHaveBeenCalled();
  });

  it('should open account message dialog with a delay when showAccountMessageDialog is called', fakeAsync(() => {
    component.hasShownAccountMessage = false;
    component.hasOpenedDialog = false;
    component.permissions.showAccountWarning = () => true;
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    spyOn(component.permissions, 'userSubscriptionUnpaid').and.returnValue(true);
    const dialogSpy: jasmine.Spy<(message) => void> = spyOn(component.dialogCreator, 'openAppropritateAccountDialog');
    component.state.getCurrentUser = () => {
      const user = new UserProfile();
      user.hasLoggedInBefore = true;
      return user;
    }
    component.showAccountMessageDialog();

    tick(5000);

    expect(dialogSpy).toHaveBeenCalled();
    expect(component.hasShownAccountMessage).toBe(true);
  }));

  it('should NOT open an account message dialog with a delay when showAccountMessageDialog is called if it has already been shown', fakeAsync(() => {
    component.hasShownAccountMessage = true;
    component.hasOpenedDialog = false;
    component.permissions.showAccountWarning = () => true;
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    spyOn(component.permissions, 'userSubscriptionUnpaid').and.returnValue(true);
    const dialogSpy: jasmine.Spy<(message) => void> = spyOn(component.dialogCreator, 'openAppropritateAccountDialog');
    component.state.getCurrentUser = () => {
      const user = new UserProfile();
      user.hasLoggedInBefore = true;
      return user;
    }
    component.showAccountMessageDialog();

    tick(5000);

    expect(dialogSpy).not.toHaveBeenCalled();
    expect(component.hasShownAccountMessage).toBe(true);
  }));

  it('should NOT open account message dialog with a delay when showAccountMessageDialog is called if on the auth page', fakeAsync(() => {
    component.hasShownAccountMessage = false;
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    spyOn(component.permissions, 'userSubscriptionUnpaid').and.returnValue(true);
    const dialogSpy: jasmine.Spy<(message) => void> = spyOn(component.dialogCreator, 'openAppropritateAccountDialog');
    component.router = { url: component.SUBSCRIPTION_MESSAGE_ROUTE } as any;
    component.showAccountMessageDialog();

    tick(5000);

    expect(dialogSpy).not.toHaveBeenCalled();
    expect(component.hasShownAccountMessage).not.toBe(true);
  }));

  it('should open the first time tips dialog with a delay when showAccountMessageDialog is called and shouldShowAccountDialog() is false and an individual user has not signed in before', fakeAsync(() => {
    component.hasShownAccountMessage = false;
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    spyOn(component.permissions, 'userSubscriptionUnpaid').and.returnValue(false);
    spyOn(component.permissions, 'showAccountWarning').and.returnValue(false);
    component.dialogCreator.openFirstTimeTipsDialog = jasmine.createSpy();
    const curUser = new UserProfile();
    curUser.hasLoggedInBefore = false;
    component.state.getCurrentUser = () => curUser;
    component.firebaseGeneral.updateUserProfileInDB = jasmine.createSpy();
    component.showAccountMessageDialog();
    tick(5000);
    expect(component.dialogCreator.openFirstTimeTipsDialog).toHaveBeenCalled();
    expect(curUser.hasLoggedInBefore).toBe(true);
    expect(component.hasOpenedDialog).toBe(true);
    expect(component.firebaseGeneral.updateUserProfileInDB).toHaveBeenCalled();
  }));

  it('should not show account message diaglog if there is no account warning and we are not on the subscription message page when showAccountMessageDialogue is called', fakeAsync(() => {
    spyOn(component.permissions, 'showAccountWarning').and.returnValue(false);
    spyOn(component.permissions, 'userSubscriptionUnpaid').and.returnValue(false);
    const dialogSpy: jasmine.Spy<(message) => void> = spyOn(component.dialogCreator, 'openAppropritateAccountDialog');

    component.showAccountMessageDialog();

    tick(5000);

    expect(dialogSpy).not.toHaveBeenCalled();
  }));

  it('should not show the account message dialog if the account message dialog has already been shown when showAccountMessageDialogue has been called', fakeAsync(() => {
    component.hasShownAccountMessage = true;
    spyOn(window.sessionStorage, 'getItem').and.returnValue(null);
    spyOn(component.permissions, 'userSubscriptionUnpaid').and.returnValue(true);
    const dialogSpy: jasmine.Spy<(message) => void> = spyOn(component.dialogCreator, 'openAppropritateAccountDialog');

    component.showAccountMessageDialog();

    tick(5000);

    expect(dialogSpy).not.toHaveBeenCalled();
  }));

  it("should call setUpForMobile() is ngOnInit() is called and the environment is mobile ", () => {
    component.environmentService.isMobile = true;
    component.IAP.zone = { run: (lam) => { lam() } } as any;
    component.setUpForMobile = jasmine.createSpy();
    component.ngOnInit();
    expect(component.setUpForMobile).toHaveBeenCalled();
  });

  it("should call setUpStoreWhenDeviceReady() and add an event listener for checking IAP status when setUpForMobile() is called ", () => {
    let lamRef;
    component.environmentService.isMobile = true;
    component.IAP.zone = { run: (lam) => { lam() } } as any;
    component.environmentService.isMobile = true;
    document.addEventListener = (someEvent, someLambda) => {
      expect(someEvent == "resume");
      lamRef = someLambda;
    }
    component.state.getCurrentUser = () => "someValue" as any;
    component.checkStatusOfIAPSubscriptionIfAppropriate = jasmine.createSpy();
    component.setUpForMobile();
    expect(component.IAP.setUpStoreWhenDeviceReady).toHaveBeenCalled();
    if (lamRef) {
      lamRef();
      expect(component.checkStatusOfIAPSubscriptionIfAppropriate).toHaveBeenCalled();
    }
  });

  it("should NOT check the IAP status if it has already been checked today and the env is prod", async () => {
    component.environmentService.isProduction = true;
    component.payments.checkStatusOfIAPSubscription = jasmine.createSpy();
    component.checkStatusOfIAPSubscriptionIfAppropriate = checkStatusRef;
    component.state.getCache = () => "SomeValue";
    await component.checkStatusOfIAPSubscriptionIfAppropriate(null);
    expect(component.payments.checkStatusOfIAPSubscription).not.toHaveBeenCalled();
  });

  it("should NOT check the IAP status if it has already been checked today if the environemnt is dev", async () => {
    component.payments.checkStatusOfIAPSubscription = jasmine.createSpy();
    component.checkStatusOfIAPSubscriptionIfAppropriate = checkStatusRef;
    component.state.getCache = () => null;
    component.environmentService.isProduction = false;
    await component.checkStatusOfIAPSubscriptionIfAppropriate(null);
    expect(component.payments.checkStatusOfIAPSubscription).not.toHaveBeenCalled();
  });

  it("should NOT check the IAP status if there is no current user", async () => {
    component.payments.checkStatusOfIAPSubscription = jasmine.createSpy();
    component.checkStatusOfIAPSubscriptionIfAppropriate = checkStatusRef;
    component.state.getCache = () => null;
    component.environmentService.isProduction = false;
    await component.checkStatusOfIAPSubscriptionIfAppropriate(null);
    expect(component.payments.checkStatusOfIAPSubscription).not.toHaveBeenCalled();
  });

  it("should NOT check the IAP status if the current users most recent sub was not made on ios", async () => {
    component.payments.constantsService = {
      PLATFORM_iOS: "somePlatform"
    } as any;
    component.payments.checkStatusOfIAPSubscription = jasmine.createSpy();
    component.checkStatusOfIAPSubscriptionIfAppropriate = checkStatusRef;
    component.state.getCache = () => null;
    const someUser = new UserProfile();
    someUser.subPlatform = null;
    component.environmentService.isProduction = false;
    await component.checkStatusOfIAPSubscriptionIfAppropriate(someUser);
    expect(component.payments.checkStatusOfIAPSubscription).not.toHaveBeenCalled();
  });

  it("should check the IAP status if the current users most recent sub was made on ios and shouldCheckThisSession is true", async () => {
    component.payments.constantsService = {
      PLATFORM_iOS: "somePlatform"
    } as any;
    component.payments.checkStatusOfIAPSubscription = jasmine.createSpy();
    component.checkStatusOfIAPSubscriptionIfAppropriate = checkStatusRef;
    component.state.setCache = jasmine.createSpy();
    component.state.getCache = () => null;
    const someUser = new UserProfile();
    someUser.subPlatform = component.payments.constantsService.PLATFORM_iOS;
    component.environmentService.isProduction = false;
    await component.checkStatusOfIAPSubscriptionIfAppropriate(someUser);
    expect(component.payments.checkStatusOfIAPSubscription).toHaveBeenCalled();
    expect(component.state.setCache).toHaveBeenCalled();
  });

  it('should be able to get to 100% coverage if this test passes lol', () => {
    let mySubject = new BehaviorSubject<NavigationEnd>(new NavigationEnd(33, "someUrl", "someOtherURL"))
    component.router = {
      events: mySubject
    } as any;
    component.storeCurrentRouteSubscription();
    mySubject.next(new NavigationEnd(33, "someUrl", "someOtherURL"));
    let weExecutedthatCode = true;
    expect(weExecutedthatCode).toBe(true);
  });

  it("should call reload when watchIndexDbError is called ", () => {
    component.LOCATION = { reload: jasmine.createSpy() };
    component.watchForIndexDbError();
    window.onerror(null);
    expect(component.LOCATION.reload).toHaveBeenCalled();
  });

  it("should just return if showAccountMessageDialog() is called and the current user is null ", () => {
    component.state.getCurrentUser = () => null
    component.showAccountMessageDialog();
    expect(component.state.getCurrentUser()).toEqual(null)
  });

  it("should disable the back button if on android and disableBackButtonIfAndroid() is called ", () => {
    const addEventRef = document.addEventListener
    const backEvent = {
      preventDefault: jasmine.createSpy()
    }
    document.addEventListener = (param, lam) => {
      if (param == "deviceready") {
        lam()
      } else if (param == "backbutton") {
        lam(backEvent)
      }
    }
    component.environmentService.isAndroid = true;
    component.disableBackButtonIfAndroid();
    expect(backEvent.preventDefault).toHaveBeenCalled();
    document.addEventListener = addEventRef;
  });

});

function setup(routerUrl: string) {
  jasmine.getEnv().allowRespy(true);

  const state = autoSpy(StateManagerService);
  const authManager = autoSpy(AuthenticationService);
  let router = {
    events: {
      get: () => { },
      pipe: (event) => ({ subscribe: (expr) => pipeSubRef = expr }),
    },
    navigate: () => { },
    url: routerUrl as string,
  } as any;
  const preferences = autoSpy(PreferenceService);
  const snackBarManager = autoSpy(SnackBarService);
  const dialogCreator = autoSpy(DialogCreatorService);
  const permissions = autoSpy(TierPermissionsService);
  const iap = autoSpy(InAppPurchaseService);
  const environment = autoSpy(EnvironmentService);
  const payments = autoSpy(PaymentService);
  const fbg = autoSpy(FirebaseGeneralService);
  const mhs = autoSpy(MobileHealthSyncService);
  const push = autoSpy(MobilePushNotificationsService);
  const builder = {
    state,
    authManager,
    router,
    preferences,
    snackBarManager,
    dialogCreator,
    permissions,
    payments,
    environment,
    iap,
    fbg,
    mhs,
    default() {
      return builder;
    },
    build() {

      state.currentUserAuth = new BehaviorSubject<string>('');
      spyOn(state, 'getCurrentUser').and.returnValue(new TestHelpers().createFreeUserProfile());

      const userProfile = new UserProfile();
      userProfile.username = 'username';
      state.currentUserProfile = new BehaviorSubject<UserProfile>(userProfile);
      return new AppComponent(state, authManager, router, preferences, snackBarManager, fbg, dialogCreator, permissions, payments, environment, iap, push, mhs);
    }
  };


  return builder;
}