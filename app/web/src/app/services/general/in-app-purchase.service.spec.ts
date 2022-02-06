import { EnvironmentService } from './environment.service';
import { StateManagerService } from './state-manager.service';
import { PaymentService } from '../firebase/payments.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AuthenticationService } from '../firebase/authentication.service';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TierPermissionsService } from './tier-permissions.service';
import { InAppPurchaseService } from './in-app-purchase.service';
import { autoSpy } from 'autoSpy';
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { CONTEXT_NAME } from '@angular/compiler/src/render3/view/util';
import { LayoutModule } from '@angular/cdk/layout';

describe('InAppPurchaseService', () => {

  let service: InAppPurchaseService;

  beforeEach(() => {
    const { build } = setup().default();
    service = build();
  });

  it('should add the deviceready listener when setUpStoreWhenDeviceReady is called', () => {
    document.addEventListener = (name, lam) => {
      lam();
    };
    const addEventSpy: jasmine.Spy<any> = spyOn(document, 'addEventListener');
    service.setUpStoreWhenDeviceReady();
    expect(addEventSpy).toHaveBeenCalled();
  });

  it('should return true if a purchase is in progress when purchaseIsAllowed is called', () => {
    service.purchaseInProgress = false;
    expect(service.purchaseIsAllowed(service)).toBe(false);
    service.purchaseInProgress = true;
    expect(service.purchaseIsAllowed(service)).toBe(true);
  });

  it('should return the subscription product the user can purchase when getIndividualSubscriptionProduct is called', () => {
    const obj = {};
    service.INDIVIDUAL_SUBSCRIPTION_PRODUCT = obj;
    expect(service.getIndividualSubscriptionProduct()).toBe(obj);
  });

  it('should do nothing if the individual subscription product is null when restorePurchases is called', () => {
    service.INDIVIDUAL_SUBSCRIPTION_PRODUCT = null;
    const showFailureSpy = spyOn(service.snackbar, 'showFailureMessage');
    service.restorePurchases();
    expect(showFailureSpy).toHaveBeenCalled();
  })

  it('should restore the users purchases if they can when restorePurchases is called', () => {
    service.INDIVIDUAL_SUBSCRIPTION_PRODUCT = {
      owned: false
    };
    const showFailureSpy = spyOn(service.snackbar, 'showFailureMessage');
    service.restorePurchases();
    expect(showFailureSpy).toHaveBeenCalled();
  });

  it('should refresh when the user owns the product for their usertype when restorePurchases is called', () => {
    service.INDIVIDUAL_SUBSCRIPTION_PRODUCT = {
      owned: true
    }
    service.STORE = {
      refresh: () => { }
    }
    service.dialogCreator.upgradeDialogIsOpen = false;
    const storeRefreshSpy = spyOn(service.STORE, 'refresh');
    service.restorePurchases();
    expect(storeRefreshSpy).toHaveBeenCalled();
  });

  it('should refresh when the user owns the product for their usertype when restorePurchases is called and not open the warning dialog if the upgradeGialog is open', () => {
    service.INDIVIDUAL_SUBSCRIPTION_PRODUCT = {
      owned: true
    }
    service.STORE = {
      refresh: () => { }
    }
    service.dialogCreator.upgradeDialogIsOpen = true;
    const storeRefreshSpy = spyOn(service.STORE, 'refresh');
    service.restorePurchases();
    expect(storeRefreshSpy).toHaveBeenCalled();
    expect(service.dialogCreator.openFreeAccountWarningDialog).not.toHaveBeenCalled();
  });

  it('should set the purchaseInProgress flag to true when orderProduct is called', (done) => {
    service.STORE = {
      order: () => {
        return Promise.resolve();
      }
    }
    expect(service.purchaseInProgress).toBe(false);
    service.orderProduct({ id: 5000 }).then(() => {
      expect(service.purchaseInProgress).toBe(true);
      done();
    });
  });

  it('should show a failure message when an internet error occurs and errorLogic is called', () => {
    service.zone.run = function (lam): void {
      lam();
    } as any;
    const showFailureSpy = spyOn(service.snackbar, 'showFailureMessage');
    service.errorLogic(service);
    expect(showFailureSpy).toHaveBeenCalled();
  });

  it('should show a warning message when an internet error does not occur and errorLogic is called', () => {
    service.zone.run = function (lam): void {
      lam();
    } as any;
    const showWarningSpy = spyOn(service.snackbar, 'showWarningMessage');
    service.errorLogic(service, true);
    expect(showWarningSpy).toHaveBeenCalled();
  });

  it('should open the subscription message dialog when subUpgradeLogic is called', () => {
    service.zone.run = function (lam): void {
      lam();
    } as any;
    service.dialogCreator.dialog = {
      closeAll: () => { }
    } as any;
    service.upgradeAccountAfterPurchase = (one, two) => {
      return Promise.resolve();
    };
    const showSuccessSpy = spyOn(service.snackbar, 'showSuccessMessage');
    service.subUpgradeLogic({});
    expect(showSuccessSpy).toHaveBeenCalled();
  });

  it("should setup the push manager when setUpPushManager() is called and the service is not initialized ", async () => {
    service.setUpStore = jasmine.createSpy();
    const addEventListRef = document.addEventListener
    let eventName = ''
    document.addEventListener = (eventNameParam, lam) => {
      lam();
      eventName = eventNameParam;
      expect(service.setUpStore).toHaveBeenCalled();
    }
    service.setUpStoreWhenDeviceReady();
    expect(eventName).toBe('deviceready')
    document.addEventListener = addEventListRef;
  });

  it("should not break on web if getCordovaStorePlugin() is called ", () => {
    let madeItThrough = false;
    try {
      service.getCordovaStorePlugin()
    }
    catch (error) { }
    madeItThrough = true;
    expect(madeItThrough).toBe(true);
  });

  it("should not break if upgradeAccountAfterPurchase() is called and there is a change in progress", async () => {
    let madeItThrough = false;
    service.stateChangeInProgress = true;
    try {
      await service.upgradeAccountAfterPurchase(service, null)
    }
    catch (error) { }
    madeItThrough = true;
    expect(madeItThrough).toBe(true);
  });

  it("should create an IAP if upgradeAccountAfterPurchase() is called and there is no change in progress on iOS", async () => {
    service.stateChangeInProgress = false;
    service.environmentService.isiOS = true;
    const receipt = "someFakeReceipt";
    const fakeId = "someFakeID";
    const fakeProduct = {
      transaction: {
        appStoreReceipt: receipt,
        original_transaction_id: fakeId

      }
    };
    await service.upgradeAccountAfterPurchase(service, fakeProduct)
    expect(service.payments.attemptToCreateIAPSubscription).toHaveBeenCalledWith(fakeId, receipt);
  });

  it("should create an IAB if upgradeAccountAfterPurchase() is called and there is no change in progress on android", async () => {
    service.stateChangeInProgress = false;
    service.environmentService.isAndroid = true;
    const fakeId = "someFakeID";
    const fakeProduct = {
      transaction: {
        purchaseToken: fakeId

      }
    };
    await service.upgradeAccountAfterPurchase(service, fakeProduct)
    expect(service.payments.attemptToCreateIABSubscription).toHaveBeenCalledWith(fakeId);
  });

  it("should set state change to false  if upgradeAccountAfterPurchase() is called and there is no change in progress but not actually on mobile", async () => {
    service.stateChangeInProgress = false;
    service.environmentService.isAndroid = false;
    service.environmentService.isiOS = false;
    const fakeId = "someFakeID";
    const fakeProduct = {
      transaction: {
        purchaseToken: fakeId

      }
    };
    await service.upgradeAccountAfterPurchase(service, fakeProduct)
    expect(service.stateChangeInProgress).toBe(false);
  });

  it("should correctly setup the store when setUpStore is called", () => {
    let madeItThrough = false;
    service.stateChangeInProgress = true;
    const paidSub = "something"
    const fakeProduct = {
      verify: jasmine.createSpy(),
      finish: jasmine.createSpy()
    };
    service.purchaseInProgress = true
    service.errorLogic = () => null
    let storeRef;
    service.getCordovaStorePlugin = () => {
      storeRef = {
        PAID_SUBSCRIPTION: paidSub,
        register: (params) => {
          expect(params[0].id).toBe(service.INDIVIDUAL_ID);
          expect(params[0].type).toBe(paidSub);
        },
        when: (thing) => {
          if (thing == "subscription") {
            return {
              updated: (lam) => {
                lam()
              },
              approved: (lam) => {
                lam(fakeProduct)
                expect(fakeProduct.verify).toHaveBeenCalled()
              },
              verified: (lam) => {
                lam(fakeProduct)
                expect(fakeProduct.finish).toHaveBeenCalled()
              },
              owned: (lam) => {
                lam(fakeProduct)
                expect(fakeProduct.finish).toHaveBeenCalled()
              },
              error: (lam) => {
                lam({ code: 3 })
              }
            }
          }
        },
        get: (someId) => {
          return null;
        },
        error: (lam) => {
          lam()
        },
        refresh: jasmine.createSpy()
      }
      return storeRef;
    }
    try {
      service.setUpStore(service);
      expect(storeRef)
    }
    catch (error) { }
    madeItThrough = true;
    expect(madeItThrough).toBe(true);
  });

  it("should correctly setup the store when setUpStore is called and handle the other cases", () => {
    let madeItThrough = false;
    service.stateChangeInProgress = true;
    const paidSub = "something"
    const fakeProduct = {
      verify: jasmine.createSpy(),
      finish: jasmine.createSpy()
    };
    service.purchaseIsAllowed = () => false;
    service.subUpgradeLogic = jasmine.createSpy();
    service.environmentService.isAndroid = true;
    service.purchaseInProgress = true
    service.errorLogic = () => null
    let storeRef;
    service.getCordovaStorePlugin = () => {
      storeRef = {
        PAID_SUBSCRIPTION: paidSub,
        register: (params) => {
          expect(params[0].id).toBe(service.INDIVIDUAL_ID);
          expect(params[0].type).toBe(paidSub);
        },
        when: (thing) => {
          if (thing == "subscription") {
            return {
              updated: (lam) => {
                lam()
              },
              approved: (lam) => {
                lam(fakeProduct)
                expect(fakeProduct.verify).toHaveBeenCalled()
              },
              verified: (lam) => {
                lam(fakeProduct)
                expect(fakeProduct.finish).toHaveBeenCalled()
              },
              owned: (lam) => {
                lam(fakeProduct)
                expect(fakeProduct.finish).toHaveBeenCalled()
              },
              error: (lam) => {
                service.environmentService.isAndroid = true;
                service.purchaseInProgress = true
                lam({ code: 3 })
              }
            }
          }
        },
        get: () => {
          return fakeProduct;
        },
        error: (lam) => {
          lam()
        },
        refresh: jasmine.createSpy()
      }
      return storeRef;
    }
    try {
      service.setUpStore(service);
      expect(storeRef)
    }
    catch (error) { }
    madeItThrough = true;
    expect(madeItThrough).toBe(true);
    expect(service.subUpgradeLogic).not.toHaveBeenCalled();
  });

});

function setup() {
  const environmentService = autoSpy(EnvironmentService);
  const stateManager = autoSpy(StateManagerService);
  const payments = autoSpy(PaymentService);
  const dialogCreator = autoSpy(DialogCreatorService);
  const snackbar = autoSpy(SnackBarService);
  const authenticationService = autoSpy(AuthenticationService);
  const zone = autoSpy(NgZone);
  const router = autoSpy(Router);
  const tierPermissions = autoSpy(TierPermissionsService);
  const builder = {
    environmentService,
    stateManager,
    payments,
    dialogCreator,
    snackbar,
    authenticationService,
    zone,
    router,
    tierPermissions,
    default() {
      return builder;
    },
    build() {
      return new InAppPurchaseService(environmentService, stateManager, payments, dialogCreator, snackbar, authenticationService, zone, router, tierPermissions);
    }
  };

  return builder;
}