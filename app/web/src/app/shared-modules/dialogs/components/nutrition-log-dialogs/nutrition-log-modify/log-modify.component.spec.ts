import { FormBuilder, Validators } from '@angular/forms';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { NutritionLogModifyComponent } from './log-modify.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { UserProfile } from 'src/app/model-classes/general/user-profile';

describe('NutritionLogModifyComponent', () => {

  let component: NutritionLogModifyComponent;
  let testHelpers: TestHelpers = new TestHelpers();

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should set the nutrLogForm to the result of a call to generateNutrLogForm() when ngOnInit() is called', () => {
    component.data.logToBeEdited = new NutritionLog();
    const expectedFormVal = "someValue" as any;
    component.generateNutrLogForm = jasmine.createSpy().and.callFake(() => expectedFormVal);
    component.ngOnInit();
    expect(component.nutrLogForm).toBe(expectedFormVal);
    expect(component.generateNutrLogForm).toHaveBeenCalledWith(component.data.logToBeEdited);
  });

  it("should call updateExistingLogForCurrentUser() when editExistingLog() is called ", () => {
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.editExistingLog(fakeLog, component);
    expect(component.firebaseNutritionManager.updateExistingLogForCurrentUser).toHaveBeenCalledWith(fakeLog);
  });

  it("should call editExistingLog() when createNewLog() is called ", () => {
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.createNewLog(fakeLog, component);
    expect(component.firebaseNutritionManager.addNutritionalLogToCurrentUser).toHaveBeenCalledWith(fakeLog);
  });

  it("should close the dialog when closeDialog() is called ", () => {
    component.closeDialog();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it("should return true if inEditMode() is called and the data passed in has a log ", () => {
    component.data.logToBeEdited = new NutritionLog();
    expect(component.inEditMode()).toBe(true);
  });

  it("should return false if inEditMode() is called and the data passed in has no log ", () => {
    component.data.logToBeEdited = null;
    expect(component.inEditMode()).toBe(false);
  });

  it("should return false if inCreateMode() is called and the data passed in has a log ", () => {
    component.data.logToBeEdited = new NutritionLog();
    expect(component.inCreateMode()).toBe(false);
  });

  it("should return true if inCreateMode() is called and the data passed in has no log ", () => {
    component.data.logToBeEdited = null;
    expect(component.inCreateMode()).toBe(true);
  });

  it("should generate a form with controls set to the values of the log passed in when generateNutrLogForm() is called ", () => {
    const fakeLog = testHelpers.getRandomNutritionLog();
    fakeLog.title = "someRandomTitle";
    fakeLog.goal = "someRandomGoal";
    component.fb.group = (param: any) => {
      return param
    };
    const form = component.generateNutrLogForm(fakeLog);
    expect(form[component.FORM_CONTROL_LOG_TITLE][0]).toBe(fakeLog.title);
    expect(form[component.FORM_CONTROL_LOG_GOAL][0]).toBe(fakeLog.goal);
  });

  it("should generate a form with controls set to null when generateNutrLogForm() is called with an empty log ", () => {
    component.fb.group = (param: any) => {
      return param
    };
    const form = component.generateNutrLogForm(null);
    expect(form[component.FORM_CONTROL_LOG_TITLE][0] == null).toBe(true);
    expect(form[component.FORM_CONTROL_LOG_GOAL][0] == null).toBe(true);
  });

  it("should require the user to enter a title and goal for their log when generateNutrLogForm() is called ", () => {
    const fakeLog = testHelpers.getRandomNutritionLog();
    fakeLog.title = "someRandomTitle";
    fakeLog.goal = "someRandomGoal";
    component.fb.group = (param: any) => {
      return param
    };
    const form = component.generateNutrLogForm(fakeLog);
    expect(form[component.FORM_CONTROL_LOG_TITLE][1]).toBe(Validators.required);
    expect(form[component.FORM_CONTROL_LOG_GOAL][1]).toBe(Validators.required);
  });

  it("shouldcatch errors, show a failure message and close the dialog when assignInputs() is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    await (component.assignInputs());
    expect(component.snackBar.showFailureMessage).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalled();
  });

  it("should disable closing when assign inputs is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    await (component.assignInputs());
    expect(component.dialogRef.disableClose).toBe(true);
  });

  it("should set the operationLogic to this.editExistingLog, show the spinner, wait for the operation logic then close the dialog if assignInputs() is called in edit mode ", async () => {
    component.inEditMode = () => true;
    component.editExistingLog = jasmine.createSpy();
    const expectedStartTdee = 69420;
    const expectedUser = new UserProfile();
    expectedUser.estimatedTDEE = expectedStartTdee;
    component.stateManager.getCurrentUser = () => expectedUser;
    const expectedTitle = "myTitle" as any;
    const expectedGoal = "myGoal" as any;
    component.nutrLogForm = {
      controls: {
        [component.FORM_CONTROL_LOG_TITLE]: { value: expectedTitle },
        [component.FORM_CONTROL_LOG_GOAL]: { value: expectedGoal }
      }
    } as any;
    component.data.logToBeEdited = new NutritionLog();
    await component.assignInputs();
    expect(component.showSpinner).toBe(true);
    expect(component.editExistingLog).toHaveBeenCalledWith(component.data.logToBeEdited, component);
    expect(component.firebaseGeneralManager.setUserMainNutrLog).not.toHaveBeenCalled();
  });

  it("should set the existing log as the user's main log  if assignInputs() is called in edit mode and isMain is true ", async () => {
    component.inEditMode = () => true;
    component.editExistingLog = jasmine.createSpy();
    component.data.isMain = true;
    const expectedStartTdee = 69420;
    const expectedUser = new UserProfile();
    expectedUser.estimatedTDEE = expectedStartTdee;
    component.stateManager.getCurrentUser = () => expectedUser;
    const expectedTitle = "myTitle" as any;
    const expectedGoal = "myGoal" as any;
    component.nutrLogForm = {
      controls: {
        [component.FORM_CONTROL_LOG_TITLE]: { value: expectedTitle },
        [component.FORM_CONTROL_LOG_GOAL]: { value: expectedGoal }
      }
    } as any;
    component.data.logToBeEdited = new NutritionLog();
    await component.assignInputs();
    expect(component.showSpinner).toBe(true);
    expect(component.editExistingLog).toHaveBeenCalledWith(component.data.logToBeEdited, component);
    expect(component.firebaseGeneralManager.setUserMainNutrLog).toHaveBeenCalled();
  });

  it("should set the operationLogic to this.createNewLog, create a new log, show the spinner, wait for the operation logic then close the dialog if assignInputs() is called in createmode ", async () => {
    component.inEditMode = () => false;
    component.inCreateMode = () => true;
    const expectedStartTdee = 69420;
    const expectedUser = new UserProfile();
    expectedUser.estimatedTDEE = expectedStartTdee;
    component.stateManager.getCurrentUser = () => expectedUser;
    const expectedTitle = "myTitle" as any;
    const expectedGoal = "myGoal" as any;
    component.nutrLogForm = {
      controls: {
        [component.FORM_CONTROL_LOG_TITLE]: { value: expectedTitle },
        [component.FORM_CONTROL_LOG_GOAL]: { value: expectedGoal }
      }
    } as any;
    component.data.logToBeEdited = null;
    expect(component.data.logToBeEdited).toBeFalsy();
    component.createNewLog = jasmine.createSpy().and.callFake((log, _) => {
      expect(log.title).toBe(expectedTitle);
      expect(log.goal).toBe(expectedGoal);
      expect(log.startTDEE).toBe(expectedStartTdee);
    })
    await component.assignInputs();
    expect(component.showSpinner).toBe(true);
    expect(component.createNewLog).toHaveBeenCalled();
    expect(component.firebaseGeneralManager.setUserMainNutrLog).not.toHaveBeenCalled();
  });

  it("should set the newly created log as the main log if assignInputs() is called in createmode and data.isMain is true", async () => {
    component.inEditMode = () => false;
    component.inCreateMode = () => true;
    component.data.isMain = true;
    const expectedStartTdee = 69420;
    const expectedUser = new UserProfile();
    expectedUser.estimatedTDEE = expectedStartTdee;
    component.stateManager.getCurrentUser = () => expectedUser;
    const expectedTitle = "myTitle" as any;
    const expectedGoal = "myGoal" as any;
    component.nutrLogForm = {
      controls: {
        [component.FORM_CONTROL_LOG_TITLE]: { value: expectedTitle },
        [component.FORM_CONTROL_LOG_GOAL]: { value: expectedGoal }
      }
    } as any;
    component.data.logToBeEdited = null;
    expect(component.data.logToBeEdited).toBeFalsy();
    component.createNewLog = jasmine.createSpy().and.callFake((log, _) => {
      expect(log.title).toBe(expectedTitle);
      expect(log.goal).toBe(expectedGoal);
      expect(log.startTDEE).toBe(expectedStartTdee);
    })
    await component.assignInputs();
    expect(component.showSpinner).toBe(true);
    expect(component.createNewLog).toHaveBeenCalled()
    expect(component.firebaseGeneralManager.setUserMainNutrLog).toHaveBeenCalled();
  });

  it("should still assign the inputs when assignInputs() is called even if it is not in create or edit mode ", async () => {
    component.inEditMode = () => false;
    component.inCreateMode = () => false;
    const expectedTitle = "myTitle" as any;
    const expectedGoal = "myGoal" as any;
    component.nutrLogForm = {
      controls: {
        [component.FORM_CONTROL_LOG_TITLE]: { value: expectedTitle },
        [component.FORM_CONTROL_LOG_GOAL]: { value: expectedGoal }
      }
    } as any;
    component.closeDialog = jasmine.createSpy();
    await component.assignInputs();
    expect(component.snackBar.showFailureMessage).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalled();
  });

});

function setup() {
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const fb = autoSpy(FormBuilder);
  const stateManager = autoSpy(StateManagerService);
  const firebaseGeneralManager = autoSpy(FirebaseGeneralService);
  const firebaseNutritionManager = autoSpy(FirebaseNutritionService);
  const snackBar = autoSpy(SnackBarService);
  const nutritionConstants = autoSpy(NutritionConstanstsService);
  const constants = autoSpy(ConstantsService);
  const builder = {
    dialogRef,
    data,
    fb,
    stateManager,
    firebaseGeneralManager,
    firebaseNutritionManager,
    snackBar,
    nutritionConstants,
    constants,
    default() {
      return builder;
    },
    build() {
      return new NutritionLogModifyComponent(dialogRef, data, fb, stateManager, firebaseGeneralManager, firebaseNutritionManager, snackBar, nutritionConstants, constants);
    }
  };

  return builder;
}
