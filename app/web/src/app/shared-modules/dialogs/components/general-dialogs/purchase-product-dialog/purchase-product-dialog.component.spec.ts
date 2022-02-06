import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { Router } from '@angular/router';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { PurchaseProductComponent } from './purchase-product-dialog.component';
import { autoSpy } from 'autoSpy';
import { MatDialogRef } from '@angular/material';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { TimeService } from 'src/app/services/general/time-constant.service';

describe('PurchaseProductComponent', () => {

  let component: PurchaseProductComponent;
  let fakeIAP: InAppPurchaseService = {} as any;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
  });

  it('should disable closing on the dialog and set the IAP service to the one passed in when ngOnInit() is called', () => {
    component.data.iap = fakeIAP;
    component.getProduct = () => {
      return {
        owned: false,
        canPurchase: false
      }
    }
    component.ngOnInit();
    expect(component.dialogRef.disableClose).toBe(true);
    expect(component.IAP).toBe(fakeIAP);
  });


  it('should close the dialog when the environment is mobile and the IAP does not load', () => {
    component.data.iap = { store: null };
    component.environmentService.isMobile = true;
    component.getProduct = () => {
      return {
        owned: false,
        canPurchase: false
      }
    }
    component.ngOnInit();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it("should return the products selling points when getProductSellingPoints() is called ", () => {
    expect(component.getProductSellingPoints()).toBe(component.INDIV_SELLING_POINTS);
  });

  it("should return the web product if getProduct() is called and the environment is web ", () => {
    component.environmentService.isWeb = true;
    expect(component.environmentService.isWeb).toBe(true);
    expect(component.getProduct()).toBe(component.INDIVIDUAL_PRODUCT_WEB);
  });

  it("should close the dialog and tell the closeing function to go the terms when goToTerms() is called", () => {
    let lambdaRef = () => null;
    let closeWasCalled = false;
    component.dialogRef.close = (someLambda) => {
      closeWasCalled = true;
      lambdaRef = someLambda;
    };
    (component.router as any).navigate = (route: string) => expect(route == '/info/terms').toBe(true);
    component.goToTerms();
    expect(closeWasCalled).toBe(true);
    lambdaRef();
  });

  it("should close the dialog and tell the closeing function to go the privacy policy when goToPrivacy() is called", () => {
    let lambdaRef = () => null;
    let closeWasCalled = false;
    component.dialogRef.close = (someLambda) => {
      closeWasCalled = true;
      lambdaRef = someLambda;
    };
    (component.router as any).navigate = (route: string) => expect(route == '/info/privacy').toBe(true);
    component.goToPrivacy();
    expect(closeWasCalled).toBe(true);
    lambdaRef();
  });

  it("should return a call to permissions.userSubscriptionIsUnpaid() when userIsUnpaid() is called", () => {
    component.permissions.userSubscriptionUnpaid = () => "userIsUnpaidOrSomething" as any;
    expect(component.userIsUnpaid()).toBe(component.permissions.userSubscriptionUnpaid());
  });

  it("should do nothing when handlePurchaseClick() is called if the components IAP is null", async () => {
    component.getProduct = jasmine.createSpy();
    component.IAP = null;
    await component.handlePurchaseClick();
    expect(component.getProduct).not.toHaveBeenCalled();
  });

  it("should order the current product if handlePurchaseClick() is called and iap is not null", async () => {
    const expectedProduct = "someProduct" as any;
    component.getProduct = () => expectedProduct
    let orderCalled = false;
    component.IAP = {
      orderProduct: (someProduct: any) => {
        orderCalled = true;
        expect(someProduct).toBe(component.getProduct())
      }
    } as any;
    await component.handlePurchaseClick();
    expect(orderCalled).toBe(true);
  });

  it("should return false if there is no IAP and purchaseInProgress() is called", () => {
    component.IAP = null;
    expect(component.purchaseInProgress()).toBe(false);
  });

  it("should return true if there is an IAP and the IAP indicates there is a purchaseInProgress and purchaseInProgress() is called ", () => {
    component.IAP = {
      purchaseInProgress: true
    } as any;
    expect(component.purchaseInProgress()).toBe(true);
  });

  it("should return true if there is an IAP and the IAP indicates there is a state change in progress and purchaseInProgress() is called ", () => {
    component.IAP = {
      stateChangeInProgress: true
    } as any;
    expect(component.purchaseInProgress()).toBe(true);
  });

  it("should close if the product is null and get product is called mobile ", () => {
    component.environmentService.isMobile = true;
    component.IAP = null;
    expect(component.getProduct()).toBe(undefined);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it("should close if the product is null and get product is called on not mobile or web ", () => {
    component.environmentService.isMobile = false;
    component.environmentService.isWeb = false;
    component.IAP = null;
    expect(component.getProduct()).toBe(undefined);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it("should NOT show a warning message and close if the product is NOT already owned and get product is called ", () => {
    component.environmentService.isMobile = true;
    const fakeProd = {
      owned: true
    };
    component.IAP = {
      getIndividualSubscriptionProduct: () => {
        return fakeProd
      }
    } as any;
    expect(component.getProduct()).toBe(component.IAP.getIndividualSubscriptionProduct());
    expect(component.snackbar.showWarningMessage).not.toHaveBeenCalled();
  });

});

function setup() {
  const permissions = autoSpy(TierPermissionsService);
  const stateManager = autoSpy(StateManagerService);
  const dialogRef = autoSpy(MatDialogRef) as any;
  const router = autoSpy(Router);
  const environmentService = autoSpy(EnvironmentService);
  const timeService = autoSpy(TimeService)
  const snackbar = autoSpy(SnackBarService);
  const data = {} as any;
  const auth = autoSpy(AuthenticationService);
  const builder = {
    permissions,
    stateManager,
    dialogRef,
    router,
    environmentService,
    snackbar,
    data,
    auth,
    default() {
      return builder;
    },
    build() {
      return new PurchaseProductComponent(permissions, stateManager, dialogRef, router, environmentService, snackbar, timeService, data, auth);
    }
  };

  return builder;
}
