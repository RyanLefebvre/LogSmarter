import { MatDialog } from '@angular/material';
import { StateManagerService } from '../../services/general/state-manager.service';
import { AuthenticationService } from '../../services/firebase/authentication.service';
import { NgZone } from '@angular/core';
import { SnackBarService } from '../material/snack-bar-manager.service';
import { Router } from '@angular/router';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { DialogCreatorService } from './dialog-creator.service';
import { autoSpy } from 'autoSpy';
import { TermsDialogComponent } from './components/general-dialogs/terms-dialog/terms-dialog.component';
import { ForgotPasswordComponent } from './components/general-dialogs/forgot-password-dialog/forgot-password.component';
import { SubscriptionMessageDialogComponent } from './components/general-dialogs/subscription-message-dialog/subscription-message-dialog.component';
import { ReAuthenticateDialogComponent } from './components/general-dialogs/re-authenticate-dialog/re-authenticate-dialog.component';
import { ConfirmationDialogComponent } from './components/general-dialogs/confirmation-dialog/confirmation-dialog.component';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { NutritionLogModifyComponent } from './components/nutrition-log-dialogs/nutrition-log-modify/log-modify.component';
import { PayloadAnalyzerComponent } from './components/nutrition-log-dialogs/payload-analyzer/payload-analyzer.component';
import { EntryModifyComponent } from './components/nutrition-log-dialogs/nutrition-entry-modify/entry-modify.component';
import { MainLogDialogComponent } from './components/nutrition-log-dialogs/main-log-dialog/main-log-dialog.component';
import { LogManagementDialogComponent } from './components/nutrition-log-dialogs/log-management-dialog/log-management-dialog.component';
import { WaitForOperationDialog } from './components/general-dialogs/wait-for-operation/wait-for-operation.component';
import { FirstTimeTipsComponent } from './components/general-dialogs/first-time-tips-dialog/first-time-tips.component';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { MobileHealthSyncService } from 'src/app/services/general/mobile-health-sync.service';
import { of } from 'rxjs';
import { EnergyPayload } from 'functions/src/classes/energy-payload';

describe('DialogCreatorService', () => {

  let dialogCreator: DialogCreatorService = null;
  let testHelpers = new TestHelpers();
  let fakeIAP: any;

  beforeEach(() => {
    const { build } = setup().default();
    fakeIAP = {} as any;
    dialogCreator = build();
  });

  it("should return getDialogDataOptions(null) if getDefaultDialogOptions() is called ", () => {
    const expectedRetVal = "someRandomValue";
    dialogCreator.getDialogDataOptions = (someVal) => {
      if (someVal == null) {
        return expectedRetVal;
      } else {
        return "someValueWeArentExpecting";
      }
    }
    const actualRetVal = dialogCreator.getDefaultDialogOptions();
    expect(actualRetVal).toBe(expectedRetVal);
  });

  it("should make the class full bleed in getDialogDataOptions() if fullBleed is true ", () => {
    const actualRetVal = dialogCreator.getDialogDataOptions({}, true);
    expect(actualRetVal.panelClass).toBe('app-full-bleed-dialog');
  });

  it("should NOT make the class full bleed in getDialogDataOptions() if fullBleed is falsy ", () => {
    const actualRetVal = dialogCreator.getDialogDataOptions({});
    expect(actualRetVal.panelClass).not.toBe('app-full-bleed-dialog');
  });

  it("should return anobject with an empty data property if getDefaultDialogOptions() is called ", () => {
    expect(
      (dialogCreator.getDefaultDialogOptions()).data
    ).toEqual(
      {}
    );
  });

  it("should open the terms dialog with the default options when openTermsDialog() is called ", () => {
    const defaultOpts: any = { someVal: "someProp" };
    dialogCreator.getDefaultDialogOptions = () => defaultOpts;
    dialogCreator.openTermsDialog();
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(TermsDialogComponent, defaultOpts);
  });

  it("should open the password reset dialog with whatever email is passed in when openPasswordResetDialog() is called ", () => {
    const expectedEmail = "JoeRogan@ChimpsDoingDMT.com";
    const expectedOpts: any = { email: expectedEmail };
    dialogCreator.getDialogDataOptions = someData => {
      if (someData.email && (someData.email == expectedEmail)) {
        return expectedOpts;
      } else {
        return null;
      }
    };
    dialogCreator.openPasswordResetDialog(expectedEmail);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(ForgotPasswordComponent, expectedOpts);
  });

  it("should open the subscription message dialog when openAppropriateAccountDialog() is called and the user's subscription is unpaid ", () => {
    dialogCreator.tierPermissionService.userSubscriptionUnpaid = () => true;
    dialogCreator.openSubscriptionMessageDialog = jasmine.createSpy();
    dialogCreator.openAppropritateAccountDialog(fakeIAP);
    expect(dialogCreator.openSubscriptionMessageDialog).toHaveBeenCalled();
  });

  it("should open the subscription message dialog when openAppropriateAccountDialog() is called and the user's subscription is unpaid (2)", () => {
    dialogCreator.environmentService.isMobile = true;
    fakeIAP['INDIVIDUAL_SUBSCRIPTION_PRODUCT'] = {
      canPurchase: true
    };
    dialogCreator.dialog.open = jasmine.createSpy().and.returnValue({
      afterClosed: function () {
        return of();
      }
    });
    dialogCreator.tierPermissionService.userSubscriptionUnpaid = () => false;
    dialogCreator.openFreeAccountWarningDialog = jasmine.createSpy();
    dialogCreator.openAppropritateAccountDialog(fakeIAP);
    expect(dialogCreator.openFreeAccountWarningDialog).toHaveBeenCalled();
  });

  it("should sroll to the top if on the sub message page and openFreeAccountWarningDialog is called", () => {
    const scrollRef = window.scroll
    window.scroll = jasmine.createSpy();
    dialogCreator.onSubMessagePage = () => true;
    dialogCreator.environmentService.isMobile = true;
    dialogCreator.dialog.open = () => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lam) => {
              lam(null);
            }
          }
        }
      } as any
    }
    dialogCreator.openFreeAccountWarningDialog(null as any);
    expect(window.scroll).toHaveBeenCalled();
    window.scroll = scrollRef;
  });

  it("should show a failure message and just return if the health service is not available and openMobileHealthSyncDialog() is called", async () => {
    dialogCreator.health.healthIsAvailable = async () => false;
    dialogCreator.health.promptInstall = async () => true
    await dialogCreator.openMobileHealthSyncDialog(new NutritionLog(), new EnergyPayload());
    expect(dialogCreator.snackBarManager.showFailureMessage).toHaveBeenCalled()
  });

  it("should show a failure message and just return if the health service is  available and openMobileHealthSyncDialog() is called but data isnt", async () => {
    dialogCreator.health.healthIsAvailable = async () => true;
    dialogCreator.health.healthDataAvailable = async () => false;
    dialogCreator.health.promptInstall = async () => true
    await dialogCreator.openMobileHealthSyncDialog(new NutritionLog(), new EnergyPayload());
    expect(dialogCreator.snackBarManager.showFailureMessage).toHaveBeenCalled()
  });

  it("should just close if the dataisAvailable but syncSuccessful is not true when openMobileHealthSyncDialog() is called", async () => {
    dialogCreator.health.healthIsAvailable = async () => true;
    dialogCreator.health.healthDataAvailable = async () => true;
    dialogCreator.dialog.open = () => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lam) => {
              lam(null);
            }
          }
        }
      } as any
    }
    dialogCreator.openGetEnergypayloadDialog = jasmine.createSpy();
    dialogCreator.health.promptInstall = async () => true
    await dialogCreator.openMobileHealthSyncDialog(new NutritionLog(), new EnergyPayload());
    expect(dialogCreator.snackBarManager.showSuccessMessage).not.toHaveBeenCalled();
    expect(dialogCreator.openGetEnergypayloadDialog).not.toHaveBeenCalled();
  });

  it("should show a successMSG on ios if the dataisAvailable and syncSuccessful is true when openMobileHealthSyncDialog() is called", async () => {
    dialogCreator.health.healthIsAvailable = async () => true;
    dialogCreator.health.healthDataAvailable = async () => true;
    dialogCreator.environmentService.isiOS = true;
    dialogCreator.dialog.open = () => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lam) => {
              lam(true);
            }
          }
        }
      } as any
    }
    dialogCreator.openGetEnergypayloadDialog = jasmine.createSpy();
    dialogCreator.health.promptInstall = async () => true
    await dialogCreator.openMobileHealthSyncDialog(new NutritionLog(), new EnergyPayload());
    expect(dialogCreator.snackBarManager.showSuccessMessage).toHaveBeenCalled();
    expect(dialogCreator.openGetEnergypayloadDialog).toHaveBeenCalled();
  });

  it("should show a successMSG on android if the dataisAvailable and syncSuccessful is true when openMobileHealthSyncDialog() is called", async () => {
    dialogCreator.health.healthIsAvailable = async () => true;
    dialogCreator.health.healthDataAvailable = async () => true;
    dialogCreator.environmentService.isAndroid = true;
    dialogCreator.dialog.open = () => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lam) => {
              lam(true);
            }
          }
        }
      } as any
    }
    dialogCreator.openGetEnergypayloadDialog = jasmine.createSpy();
    dialogCreator.health.promptInstall = async () => true
    await dialogCreator.openMobileHealthSyncDialog(new NutritionLog(), new EnergyPayload());
    expect(dialogCreator.snackBarManager.showSuccessMessage).toHaveBeenCalled();
    expect(dialogCreator.openGetEnergypayloadDialog).toHaveBeenCalled();
  });

  it("should show a failure message and return when google fit is not installed on android", async () => {
    dialogCreator.environmentService.isAndroid = true;
    dialogCreator.health.promptInstall = async () => false;
    await dialogCreator.openMobileHealthSyncDialog(new NutritionLog(), new EnergyPayload());
    expect(dialogCreator.snackBarManager.showFailureMessage).toHaveBeenCalled();
  })

  it("should not call openFreeAccountWarningDialog() when openAppropriateAccountDialog() is called and the sub is paid but it is unsafe to auto open", () => {
    dialogCreator.tierPermissionService.userSubscriptionUnpaid = () => false;
    dialogCreator.environmentService.isMobile = false;
    dialogCreator.environmentService.isWeb = false;
    dialogCreator.openFreeAccountWarningDialog = jasmine.createSpy();
    dialogCreator.openAppropritateAccountDialog(null);
    expect(dialogCreator.openFreeAccountWarningDialog).not.toHaveBeenCalled();
  });

  it("should not call openFreeAccountWarningDialog() when openAppropriateAccountDialog() is called and the sub is paid but it is unsafe to auto open", () => {
    dialogCreator.tierPermissionService.userSubscriptionUnpaid = () => false;
    dialogCreator.environmentService.isMobile = false;
    dialogCreator.environmentService.isWeb = false;
    dialogCreator.openFreeAccountWarningDialog = jasmine.createSpy();
    dialogCreator.openAppropritateAccountDialog(null);
    expect(dialogCreator.openFreeAccountWarningDialog).not.toHaveBeenCalled();
  });

  it("should open the subscription message dialog with the params passed in when openSubscriptionMessageDialog() is called ", () => {
    const errorTitle = "you got error";
    const errorMessage = "why did you do this";
    const showContact = true;
    const expectedOptions = { expected: true } as any;
    dialogCreator.getDialogDataOptions = (someOptions) => {
      const correctTitle = (someOptions.title && (someOptions.title == errorTitle));
      const correctMessage = (someOptions.message && (someOptions.message == errorMessage));
      const correctShowContact = (someOptions.showContact && (someOptions.showContact == showContact));
      const calledThisWithCorrectStuff = correctTitle && correctMessage && correctShowContact;
      if (calledThisWithCorrectStuff) {
        return expectedOptions;
      } else {
        return {}
      }
    }
    dialogCreator.openSubscriptionMessageDialog(errorTitle, errorMessage, showContact);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(SubscriptionMessageDialogComponent, expectedOptions);
  });

  it("should open the free account warning dialog when openFreeAccountWarningDialog() is called ", () => {
    const defaultOpts: any = { someVal: "someProp" };
    let callBackRef: (() => any);
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (subBody) => {
              callBackRef = subBody
            }
          }
        }
      }
    })
    dialogCreator.openFreeAccountWarningDialog(fakeIAP);
    expect(dialogCreator.dialog.open).toHaveBeenCalled();
    expect(dialogCreator.upgradeDialogIsOpen).toBe(true);
  });

  it("should wait for the closing logic, set upgradeDialogOpen to false and scroll to the top in the afterClosed of openFreeAccountWarningDialog() is called ", () => {
    let callBackRef: ((any?) => any);
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (subBody) => {
              callBackRef = subBody
            }
          }
        }
      }
    })
    dialogCreator.openFreeAccountWarningDialog(fakeIAP);
    const spyToWaitFor = jasmine.createSpy();
    (window as any).scroll = (x, y) => {
      expect(x).toBe(0);
      expect(y).toBe(0);
    }
    callBackRef();
    callBackRef(spyToWaitFor);
    expect(spyToWaitFor).toHaveBeenCalled();
    expect(dialogCreator.upgradeDialogIsOpen).toBe(false);
  });


  it("should open the reAuthenticationDialog with the passed in operation message when openReauthDialog() is called  ", () => {
    let callBackRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (subBody) => {
              callBackRef = subBody
            }
          }
        }
      }
    });

    const expectedData = "someExpectedData" as any;
    dialogCreator.getDialogDataOptions = (someData) => {
      if (someData && someData.operationMessage == expectedData) {
        return expectedData;
      } else {
        return null;
      }
    }
    dialogCreator.openReauthDialog(expectedData);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(ReAuthenticateDialogComponent, expectedData);
  });

  it("should resolve to true when openReAuthDialog is called if the user reauthenticates successfully  ", async () => {
    let callBackRef: ((someVal: boolean) => void) = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (subBody) => {
              callBackRef = subBody
            }
          }
        }
      }
    });

    const expectedData = "someExpectedData" as any;
    dialogCreator.getDialogDataOptions = (someData) => {
      if (someData && someData.operationMessage == expectedData) {
        return expectedData;
      } else {
        return null;
      }
    }
    const refToPromise = dialogCreator.openReauthDialog(expectedData);
    callBackRef(true);
    refToPromise.then(authenticated => {
      expect(authenticated).toBe(true);
    })
  });

  it("should resolve to false when openReAuthDialog is called if the user DOES NOT reauthenticates successfully  ", async () => {
    let callBackRef: ((someVal: boolean) => void) = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (subBody) => {
              callBackRef = subBody
            }
          }
        }
      }
    });

    const expectedData = "someExpectedData" as any;
    dialogCreator.getDialogDataOptions = (someData) => {
      if (someData && someData.operationMessage == expectedData) {
        return expectedData;
      } else {
        return null;
      }
    }
    const refToPromise = dialogCreator.openReauthDialog(expectedData);
    callBackRef(false);
    refToPromise.then(authenticated => {
      expect(authenticated).toBe(false);
    })
  });

  it("should resolve to false when openReAuthDialog is called if there is an error  ", async () => {
    dialogCreator.dialog.open = jasmine.createSpy().and.throwError("some error");
    const refToPromise = dialogCreator.openReauthDialog(null);
    refToPromise.then(authenticated => {
      expect(authenticated).toBe(false);
    })
  });

  it("should open the confirmation dialog with the params passed in when openConfirmationDialog() is called ", () => {
    const title = "someRandomTitle";
    const message = "someRandomMessage";
    const confLogic = "someVal" as any;
    const spinMsg = "someMessage";
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (params) => {
      const hasTitle = params.title && params.title == title;
      const hasMessage = params.message && params.message == message;
      const hasLogic = params.confirmationLogic && params.confirmationLogic == confLogic;
      const hasSpinMsg = params.spinnerMessage && params.spinnerMessage == spinMsg;
      const passedInCorrectly = (hasTitle && hasMessage && hasLogic && hasSpinMsg);
      if (passedInCorrectly) {
        return expectedOpts
      } else {
        return null;
      }
    }
    dialogCreator.openConfirmationDialog(title, message, confLogic, spinMsg);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, expectedOpts);
  });

  it("should open the confirmation dialog when asking the user if they want to delete their profile ", async () => {
    dialogCreator.openConfirmationDialog = jasmine.createSpy();
    dialogCreator.openDeleteProfileDialog();
    expect(dialogCreator.openConfirmationDialog).toHaveBeenCalled();
  });

  it("should delete the current user in the openDeleteProfileDialog() callback ", async () => {
    dialogCreator.openConfirmationDialog = jasmine.createSpy();
    dialogCreator.openDeleteProfileDialog();
    expect(dialogCreator.openConfirmationDialog).toHaveBeenCalled();
  });

  it("should call the delete current user function when the callback function for the DeleteProfileDialog is exectued ", async () => {
    let callbackFunc = null;
    dialogCreator.openConfirmationDialog = jasmine.createSpy().and.callFake((title, msg, logic, message) => {
      callbackFunc = logic;
    });
    dialogCreator.openDeleteProfileDialog();
    await callbackFunc();
    expect(dialogCreator.auth.deleteCurrentUser).toHaveBeenCalled();
  });

  it("should open the confirmation dialog when asking the user if they want to delete any of their logs ", () => {
    dialogCreator.openConfirmationDialog = jasmine.createSpy();
    dialogCreator.openDeleteLogDialog(new NutritionLog());
    expect(dialogCreator.openConfirmationDialog).toHaveBeenCalled();
  });

  it("should call the delete log function when the callback function for the DeleteProfileDialog is exectued ", async () => {
    let callbackFunc = null;
    dialogCreator.openConfirmationDialog = jasmine.createSpy().and.callFake((title, msg, logic, message) => {
      callbackFunc = logic;
    });
    dialogCreator.openDeleteLogDialog(null);
    await callbackFunc();
    expect(dialogCreator.firebaseNutr.deleteLogFromCurrentUser).toHaveBeenCalled();
  });

  it("should open the NutritionLogModify component with the passed in params when openNutritionLogModifyDialog() is called  ", () => {
    const log = testHelpers.getRandomNutritionLog();
    const isMainLog: any = "isNotMainLog";
    const expectedOpts: any = "someExpectedOpts";
    dialogCreator.getDialogDataOptions = (data) => {
      if ((data.logToBeEdited && data.logToBeEdited == log) && (data.isMain && data.isMain == isMainLog)) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    dialogCreator.openNutritionLogModifyDialog(log, isMainLog);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(NutritionLogModifyComponent, expectedOpts);
  });

  it("should open the NutritionLogModify dialog with null and true when openCreateMainLogDialog() is called  ", () => {
    dialogCreator.openNutritionLogModifyDialog = jasmine.createSpy();
    dialogCreator.openCreateMainLogDialog();
    expect(dialogCreator.openNutritionLogModifyDialog).toHaveBeenCalledWith(null, true);
  });

  it("should open the NutritionLogModify dialog with null and false when openCreateRegularLogDialog() is called  ", () => {
    dialogCreator.openNutritionLogModifyDialog = jasmine.createSpy();
    dialogCreator.openCreateRegularLogDialog();
    expect(dialogCreator.openNutritionLogModifyDialog).toHaveBeenCalledWith(null, false);
  });

  it("should open the NutritionLogModify dialog with the log passed in and false when openCreateRegularLogDialog() is called  ", () => {
    const log = testHelpers.getRandomNutritionLog();
    dialogCreator.openNutritionLogModifyDialog = jasmine.createSpy();
    dialogCreator.openEditExistingLogDialog(log);
    expect(dialogCreator.openNutritionLogModifyDialog).toHaveBeenCalledWith(log, false);
  });

  it("should open the energy payload dialog with the log and payload passed in as data when openEnergyPayloadDialog() is called  ", () => {
    const log = testHelpers.getRandomNutritionLog();
    const payLoad = "someRandomPayload" as any;
    let correctComp = false;
    let correctOpts = false;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake((component, options) => {
      if (component == PayloadAnalyzerComponent) {
        correctComp = true;
      }
      if (options && options.data && options.data.payload == payLoad && options.data.log == log) {
        correctOpts = true;
      }
    });
    dialogCreator.openEnergyPayloadDialog(log, payLoad);
    expect(correctOpts).toBe(true);
    expect(correctComp).toBe(true);
  });

  it("should open the energy payload dialog with no payload forcing a request to be made when openGetEnergyPayloadDialog() is called ", () => {
    const log = testHelpers.getRandomNutritionLog();
    dialogCreator.openEnergyPayloadDialog = jasmine.createSpy();
    dialogCreator.openGetEnergypayloadDialog(log);
    expect(dialogCreator.openEnergyPayloadDialog).toHaveBeenCalledWith(log, null);
  });

  it("should open the nutrition entry modify dialog with the date, parentlog and parent payload when openNutritionEntryModifyDialog() is called ", () => {
    const dateOfEntry = testHelpers.getRandomDate();
    const log = testHelpers.getRandomNutritionLog();
    const payload = "someRandompayload " as any;
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (options) => {
      const correctDate = options.date == dateOfEntry;
      const correctLog = options.log == log;
      const correctPayload = options.payload == payload;
      if (correctDate && correctLog && correctPayload) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    let subBodyRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    })
    dialogCreator.openNutritionEntryModifyDialog(dateOfEntry, log, payload);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(EntryModifyComponent, expectedOpts);
  });

  it("should open the getEnergyPayloadDialog() when openNutritionEntryModifyDialog() is called if the closing operation is edit", () => {
    const dateOfEntry = testHelpers.getRandomDate();
    const log = testHelpers.getRandomNutritionLog();
    const payload = "someRandompayload " as any;
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (options) => {
      const correctDate = options.date == dateOfEntry;
      const correctLog = options.log == log;
      const correctPayload = options.payload == payload;
      if (correctDate && correctLog && correctPayload) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    let subBodyRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    })
    dialogCreator.openNutritionEntryModifyDialog(dateOfEntry, log, payload);
    dialogCreator.openGetEnergypayloadDialog = jasmine.createSpy();
    subBodyRef("edit");
    expect(dialogCreator.openGetEnergypayloadDialog).toHaveBeenCalledWith(log);
  });

  it("should open the getEnergyPayloadDialog() when openNutritionEntryModifyDialog() is called if the closing operation is create", () => {
    const dateOfEntry = testHelpers.getRandomDate();
    const log = testHelpers.getRandomNutritionLog();
    const payload = "someRandompayload " as any;
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (options) => {
      const correctDate = options.date == dateOfEntry;
      const correctLog = options.log == log;
      const correctPayload = options.payload == payload;
      if (correctDate && correctLog && correctPayload) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    let subBodyRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    })
    dialogCreator.openNutritionEntryModifyDialog(dateOfEntry, log, payload);
    dialogCreator.openGetEnergypayloadDialog = jasmine.createSpy();
    subBodyRef("create");
    expect(dialogCreator.openGetEnergypayloadDialog).toHaveBeenCalledWith(log);
  });

  it("should open the getEnergyPayloadDialog() when openNutritionEntryModifyDialog() is called if the closing operation is NOT create or edit", () => {
    const dateOfEntry = testHelpers.getRandomDate();
    const log = testHelpers.getRandomNutritionLog();
    const payload = "someRandompayload " as any;
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (options) => {
      const correctDate = options.date == dateOfEntry;
      const correctLog = options.log == log;
      const correctPayload = options.payload == payload;
      if (correctDate && correctLog && correctPayload) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    let subBodyRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    })
    dialogCreator.openNutritionEntryModifyDialog(dateOfEntry, log, payload);
    dialogCreator.openGetEnergypayloadDialog = jasmine.createSpy();
    subBodyRef("NOT CREATE OR EDIT ");
    expect(dialogCreator.openGetEnergypayloadDialog).not.toHaveBeenCalled();
  });

  it("should open a dialog with the main log dialog component and the default dialog options when openMainLogDialog() is called ", () => {
    const defaultOpts = "someOpts" as any;
    dialogCreator.getDefaultDialogOptions = () => defaultOpts;
    let subBodyRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openMainLogDialog();
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(MainLogDialogComponent, defaultOpts);
  });

  it("should call openCreateMainLogDialog() when openMainLogDialog() is called if the closing operation is createNew", () => {
    const defaultOpts = "someOpts" as any;
    dialogCreator.getDefaultDialogOptions = () => defaultOpts;
    let subBodyRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openMainLogDialog();
    dialogCreator.openCreateMainLogDialog = jasmine.createSpy();
    subBodyRef("createNew");
    expect(dialogCreator.openCreateMainLogDialog).toHaveBeenCalled();
  });

  it("should NOT call openCreateMainLogDialog() when openMainLogDialog() is called if the closing operation is NOT createNew", () => {
    const defaultOpts = "someOpts" as any;
    dialogCreator.getDefaultDialogOptions = () => defaultOpts;
    let subBodyRef = null;
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openMainLogDialog();
    dialogCreator.openCreateMainLogDialog = jasmine.createSpy();
    subBodyRef("NOTcreateNew");
    expect(dialogCreator.openCreateMainLogDialog).not.toHaveBeenCalled();
  });

  it("should open the log management dialog with the log passed in as a param when openLogManagementDialog() is called", () => {
    let subBodyRef = null;
    const log = testHelpers.getRandomNutritionLog();
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (data) => {
      if (data.logModel == log) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openLogManagementDialog(log);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(LogManagementDialogComponent, expectedOpts);
  });

  it("should open the editLogDialog in the callback function of the logManagementDialog if the buttonPressed is edit", () => {
    let subBodyRef = null;
    const log = testHelpers.getRandomNutritionLog();
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (data) => {
      if (data.logModel == log) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openLogManagementDialog(log);
    dialogCreator.openEditExistingLogDialog = jasmine.createSpy();
    subBodyRef("edit")
    expect(dialogCreator.openEditExistingLogDialog).toHaveBeenCalledWith(log);
  });

  it("should open the FTT dialog in the callback function of the logManagementDialog if the buttonPressed is tips", () => {
    let subBodyRef = null;
    const log = testHelpers.getRandomNutritionLog();
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (data) => {
      if (data.logModel == log) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openLogManagementDialog(log);
    dialogCreator.openFirstTimeTipsDialog = jasmine.createSpy();
    subBodyRef("tips")
    expect(dialogCreator.openFirstTimeTipsDialog).toHaveBeenCalled();
  });

  it("should open the waitForOperationDialog when openWaitForOperationDialog() is called ", async () => {
    let subBodyRef = null;
    const fakeDataOptions = "someRandomValue" as any;
    const expectedLogic: (() => any) = () => "something";
    const expectedOperationName = "myFunction";
    const expectedIcon = "someIcon";
    const expectedMessage = "my spinner message";
    dialogCreator.getDialogDataOptions = (someObj: any) => {
      expect(someObj.logic).toBe(expectedLogic);
      expect(someObj.operationName).toBe(expectedOperationName);
      expect(someObj.matIcon).toBe(expectedIcon);
      expect(someObj.spinnerMessage).toBe(expectedMessage)
      return fakeDataOptions;
    };
    (window as any).scroll = jasmine.createSpy();
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    let returnPromise = dialogCreator.openWaitForOperationDialog(expectedLogic, expectedOperationName, expectedIcon, expectedMessage);
    subBodyRef();
    const successfulReturn = await returnPromise;
    expect(successfulReturn).toBe(true);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(WaitForOperationDialog, fakeDataOptions);
    expect(window.scroll).not.toHaveBeenCalled();
  });

  it("should open the waitForOperationDialog when openWaitForOperationDialog() is called and scrollToTop if scroll to top is passed in ", async () => {
    let subBodyRef = null;
    const fakeDataOptions = "someRandomValue" as any;
    const expectedLogic: (() => any) = () => "something";
    const expectedOperationName = "myFunction";
    const expectedIcon = "someIcon";
    const expectedMessage = "my spinner message";
    dialogCreator.getDialogDataOptions = (someObj: any) => {
      expect(someObj.logic).toBe(expectedLogic);
      expect(someObj.operationName).toBe(expectedOperationName);
      expect(someObj.matIcon).toBe(expectedIcon);
      expect(someObj.spinnerMessage).toBe(expectedMessage)
      return fakeDataOptions;
    };
    (window as any).scroll = jasmine.createSpy();
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    let returnPromise = dialogCreator.openWaitForOperationDialog(expectedLogic, expectedOperationName, expectedIcon, expectedMessage, true);
    subBodyRef();
    const successfulReturn = await returnPromise;
    expect(successfulReturn).toBe(true);
    expect(dialogCreator.dialog.open).toHaveBeenCalledWith(WaitForOperationDialog, fakeDataOptions);
    expect(window.scroll).toHaveBeenCalled();
  });

  it("should catch any errors when openWaitForOperationDialog() is called and an error occurs ", async () => {
    let subBodyRef = null;
    const fakeDataOptions = "someRandomValue" as any;
    const expectedLogic: (() => any) = () => "something";
    const expectedOperationName = "myFunction";
    const expectedIcon = "someIcon";
    const expectedMessage = "my spinner message";
    dialogCreator.getDialogDataOptions = (someObj: any) => {
      expect(someObj.logic).toBe(expectedLogic);
      expect(someObj.operationName).toBe(expectedOperationName);
      expect(someObj.matIcon).toBe(expectedIcon);
      expect(someObj.spinnerMessage).toBe(expectedMessage)
      return fakeDataOptions;
    };
    (window as any).scroll = jasmine.createSpy();
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
              throw "someError";
            }
          }
        }
      }
    });
    let returnPromise = dialogCreator.openWaitForOperationDialog(expectedLogic, expectedOperationName, expectedIcon, expectedMessage, true);
    subBodyRef();
    const unsuccessful = await returnPromise;
    expect(unsuccessful).toBe(false);
  });

  it("should open the wait for operation dialog with whatever logic is passed in when openPreferenceStateChangeDialog() is called ", async () => {
    const expectedLogic = async () => "someObj";
    dialogCreator.openWaitForOperationDialog = jasmine.createSpy().and.callFake((logic, opName, opIcon, opMessage) => {
      expect(logic).toBe(expectedLogic);
      expect(opName).toBe("PREFERENCES");
      expect(opIcon).toBe("perm_identity");
      expect(opMessage).toBe("Updating your preference information. This may take a second.");
    });
    await dialogCreator.openPreferenceStateChangeDialog(expectedLogic);
    expect(dialogCreator.openWaitForOperationDialog).toHaveBeenCalled();
  });

  it("should open the wait for operation dialog with whatever logic is passed in when opeProfileStateChangeDialog() is called ", async () => {
    const expectedLogic = async () => "someObj";
    dialogCreator.openWaitForOperationDialog = jasmine.createSpy().and.callFake((logic, opName, opIcon, opMessage) => {
      expect(logic).toBe(expectedLogic);
      expect(opName).toBe("PROFILE");
      expect(opIcon).toBe("perm_identity");
      expect(opMessage).toBe("Updating your profile information. This may take a second.");
    });
    await dialogCreator.openProfileStateChangeDialog(expectedLogic);
    expect(dialogCreator.openWaitForOperationDialog).toHaveBeenCalled();
  });

  it("should open the wait for operation dialog with whatever logic is passed in when opeProfileStateChangeDialog() is called ", async () => {
    const expectedLogic = async () => "someObj";
    dialogCreator.openWaitForOperationDialog = jasmine.createSpy().and.callFake((logic, opName, opIcon, opMessage) => {
      expect(logic).toBe(expectedLogic);
      expect(opName).toBe("SUBSCRIPTION");
      expect(opIcon).toBe("card_giftcard");
      expect(opMessage).toBe("Updating your account's subscription information. This may take a second.");
    });
    await dialogCreator.openSubscriptionStateChangeDialog(expectedLogic);
    expect(dialogCreator.openWaitForOperationDialog).toHaveBeenCalled();
  });

  it("should open the first time tips dialog when openFirstTimeTipsDialog() is called ", () => {
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake((component, options) => {
      expect(component).toBe(FirstTimeTipsComponent);
    });
    dialogCreator.openFirstTimeTipsDialog();
    expect(dialogCreator.dialog.open).toHaveBeenCalled();
  });

  it("should NOT open the editLogDialog in the callback function of the logManagementDialog if the buttonPressed is NOT edit", () => {
    let subBodyRef = null;
    const log = testHelpers.getRandomNutritionLog();
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (data) => {
      if (data.logModel == log) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openLogManagementDialog(log);
    dialogCreator.openEditExistingLogDialog = jasmine.createSpy();
    subBodyRef("NOTedit")
    expect(dialogCreator.openEditExistingLogDialog).not.toHaveBeenCalledWith(log);
  });

  it("should open the deleteLogDialog in the callback function of the logManagementDialog if the buttonPressed is delete", () => {
    let subBodyRef = null;
    const log = testHelpers.getRandomNutritionLog();
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (data) => {
      if (data.logModel == log) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openLogManagementDialog(log);
    dialogCreator.openDeleteLogDialog = jasmine.createSpy();
    subBodyRef("delete")
    expect(dialogCreator.openDeleteLogDialog).toHaveBeenCalledWith(log);
  });

  it("should NOT open the deleteLogDialog in the callback function of the logManagementDialog if the buttonPressed is NOT delete", () => {
    let subBodyRef = null;
    const log = testHelpers.getRandomNutritionLog();
    const expectedOpts = "someExpectedOpts" as any;
    dialogCreator.getDialogDataOptions = (data) => {
      if (data.logModel == log) {
        return expectedOpts;
      } else {
        return null;
      }
    }
    dialogCreator.dialog.open = jasmine.createSpy().and.callFake(() => {
      return {
        afterClosed: () => {
          return {
            subscribe: (lambda) => {
              subBodyRef = lambda;
            }
          }
        }
      }
    });
    dialogCreator.openLogManagementDialog(log);
    dialogCreator.openDeleteLogDialog = jasmine.createSpy();
    subBodyRef("NOTDelete")
    expect(dialogCreator.openDeleteLogDialog).not.toHaveBeenCalledWith(log);
  });

  it('should NOT open the energy payload dialog regardless of environment when openMobileHealthSyncDialog() is called and sync successful is not true', () => {
    dialogCreator.health.requestAuthorization = jasmine.createSpy().and.returnValue(of(false));
    dialogCreator.health.healthIsAvailable = jasmine.createSpy().and.returnValue(of(true));
    dialogCreator.health.healthDataAvailable = jasmine.createSpy().and.returnValue(of(true));
    dialogCreator.dialog.open = jasmine.createSpy().and.returnValue({
      afterClosed: function () {
        return of(true);
      }
    });
    dialogCreator.openGetEnergypayloadDialog = jasmine.createSpy();
    dialogCreator.health.promptInstall = async () => true
    dialogCreator.openMobileHealthSyncDialog(testHelpers.getRandomNutritionLog(), null);
    expect(dialogCreator.openGetEnergypayloadDialog).not.toHaveBeenCalled();
  });

});

function setup() {
  const dialog = autoSpy(MatDialog);
  const stateManager = autoSpy(StateManagerService);
  const auth = autoSpy(AuthenticationService);
  const ngZone = autoSpy(NgZone);
  const snackBarManager = autoSpy(SnackBarService);
  const router = autoSpy(Router);
  const fbNutr = autoSpy(FirebaseNutritionService);
  const tierPermissionService = autoSpy(TierPermissionsService);
  const firebaseNutr = autoSpy(FirebaseNutritionService);
  const environment = autoSpy(EnvironmentService);
  const healthSyncService = autoSpy(MobileHealthSyncService);
  const builder = {
    dialog,
    stateManager,
    auth,
    ngZone,
    snackBarManager,
    router,
    fbNutr,
    tierPermissionService,
    firebaseNutr,
    default() {
      return builder;
    },
    build() {
      return new DialogCreatorService(dialog, stateManager, auth, ngZone, snackBarManager, router, fbNutr, tierPermissionService, firebaseNutr, environment, healthSyncService);
    }
  };

  return builder;
}