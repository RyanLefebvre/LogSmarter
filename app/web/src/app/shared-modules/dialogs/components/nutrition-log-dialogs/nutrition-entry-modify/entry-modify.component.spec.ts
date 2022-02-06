import { FormBuilder } from '@angular/forms';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { Router } from '@angular/router';
import { EntryModifyComponent } from './entry-modify.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { DayEntry } from 'functions/src/classes/day-entry';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { ValidateCalories } from 'src/app/shared-validators/calorie-validator';
import { ValidateImperialWeight } from 'src/app/shared-validators/imperial-weight-validator';
import { ValidateMetricWeight } from 'src/app/shared-validators/metric-weight-validator';
import { EnergyPayload } from 'src/app/model-classes/nutrition-log/energy-payload';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';

describe('EntryModifyComponent', () => {

  let component: EntryModifyComponent;
  let testHelpers: TestHelpers = new TestHelpers();
  let hasExactRef;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
    component.payloadService.latestEntryIsIncomplete = () => false;
    hasExactRef = component.hasExactlyReachedMaxedEntriesForLog;
    component.hasExactlyReachedMaxedEntriesForLog = () => false;
    component.tierPermission.freeTrialOverAndUserHasNotPaid = () => false;
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("should call setFormControlsForDate and getParentLogPayload when ngOnInit() is called ", () => {
    component.data.date = new Date();
    component.setFormControlsForEntryAtDate = jasmine.createSpy();
    component.getParentLogPayload = jasmine.createSpy();
    component.ngOnInit();
    expect(component.setFormControlsForEntryAtDate).toHaveBeenCalledWith(component.data.date);
    expect(component.getParentLogPayload).toHaveBeenCalled();
  });

  it("should set the global payload variable to the value of the payload inside the components data param when getParentLogPayload() is called ", () => {
    const expectedPayload = "somePayload" as any;
    component.data.payload = expectedPayload;
    component.getParentLogPayload();
    expect(component.parentLogPayload).toBe(expectedPayload);
  });

  it("should set the dateChangeSubscription ref to the value of a subscription that resets form controls based on date in subscribeToDatePickerChanges", () => {
    let subBodyRef = null;
    const expectedSubValue = "IamASubscriptionReturnValue" as any;
    component.setFormControlsForEntryAtDate = jasmine.createSpy();
    component.dayEntryForm = {
      get: (something) => {
        return {
          valueChanges: {
            subscribe: (someLambda) => {
              subBodyRef = someLambda;
              return expectedSubValue
            }
          }
        }
      }
    } as any;
    component.subscribeToDatePickerChanges();
    expect(component.dateChangeSubscription).toBe(expectedSubValue);
    const datePassedIn = new Date()
    subBodyRef(datePassedIn);
    expect(component.setFormControlsForEntryAtDate).toHaveBeenCalledWith(datePassedIn);
  });

  it("should set the dayEntryForm to the entry at the date passed in and subscribe to date picker changes when setFormControlsForEntryAtDate() is called ", () => {
    const expectedFormValue = "someRnadomObject" as any;
    component.getDayEntryForm = jasmine.createSpy().and.callFake(() => expectedFormValue);
    component.subscribeToDatePickerChanges = jasmine.createSpy();
    const datePassedIn = new Date();
    component.setFormControlsForEntryAtDate(datePassedIn);
    expect(component.getDayEntryForm).toHaveBeenCalledWith(datePassedIn);
    expect(component.dayEntryForm).toBe(expectedFormValue);
    expect(component.subscribeToDatePickerChanges).toHaveBeenCalled();
  });

  it("should unsubscribe from the current dateChangeSubscription if one exists and setFormControlsForEntryAtDate() is called ", () => {
    component.dateChangeSubscription = {
      unsubscribe: jasmine.createSpy()
    } as any;
    const expectedFormValue = "someRnadomObject" as any;
    component.getDayEntryForm = jasmine.createSpy().and.callFake(() => expectedFormValue);
    component.subscribeToDatePickerChanges = jasmine.createSpy();
    const datePassedIn = new Date();
    component.setFormControlsForEntryAtDate(datePassedIn);
    expect(component.dateChangeSubscription.unsubscribe).toHaveBeenCalled();
  });

  it("should unsubscribe from the current dateChangeSubscription if one exists and ngOnDestroy() is called ", () => {
    component.dateChangeSubscription = {
      unsubscribe: jasmine.createSpy()
    } as any;
    component.ngOnDestroy();
    expect(component.dateChangeSubscription.unsubscribe).toHaveBeenCalled();
  });

  it("should close the dialog with the action passed in when closeDialog() is called ", () => {
    const action = "someRandomAction";
    component.closeDialog(action);
    expect(component.dialogRef.close).toHaveBeenCalledWith(action)
  });

  it("should return the result of the preferenceManagers getWeightUnits() function when getCorrectWeightUnits() is called ", () => {
    const expectedUnits = "fuckTons"
    component.currentNumberSystemIsImperial = jasmine.createSpy();
    component.preference.getWeightUnits = () => expectedUnits;
    expect(component.getCorrectWeightUnits()).toBe(expectedUnits);
  });

  it("should return users number sytem from their preferences when curretnNumberSystemIsImperial() is called  ", () => {
    component.preference.GENERAL_PREFS = "general";
    component.preference.NUMBER_SYSTEM = "numSys";
    const expectedNumberSystem = "myExpectedNumberSystem" as any;
    component.stateManager.getCurrentUser = () => {
      return {
        userPreferences: {
          [component.preference.GENERAL_PREFS]: {
            [component.preference.NUMBER_SYSTEM]: expectedNumberSystem
          }
        }
      } as any;
    }
    expect(component.currentNumberSystemIsImperial()).toBe(expectedNumberSystem);
  });

  it("should disable the confirm button is the day entry form is invalid  when disableConfirmButton() is called ", () => {
    component.dayEntryForm = {
      valid: false
    } as any;
    component.hasReachedorExceededMaxEntries = () => false;
    expect(component.disableConfirmButton()).toBe(true);
  });

  it("should disable the confirm button if the user has reached or exceeded their max number of logs when disableConfirmButton() is called ", () => {
    component.dayEntryForm = {
      valid: false
    } as any;
    component.hasReachedorExceededMaxEntries = () => true;
    expect(component.disableConfirmButton()).toBe(true);
  });

  it("should NOT disable the confirm button is the user has NOT reached or exceeded their max number of logs and the day entry form is valid  when disableConfirmButton() is called", () => {
    component.dayEntryForm = {
      valid: true
    } as any;
    component.hasReachedorExceededMaxEntries = () => false;
    expect(component.disableConfirmButton()).toBe(false);
  });

  it("should return true if the user has more entries than their tier allows when hasReachedOrExceededMaxEntries() is called", () => {
    component.getMaxEntriesForLog = () => 14;
    component.data.log = {
      dayEntries: testHelpers.getRandomEntryListOfLength(component.getMaxEntriesForLog() + 1)
    }
    expect(component.hasReachedorExceededMaxEntries()).toBe(true)
  });

  it("should return true if the user has the exact amount of entries their tier allows when hasReachedOrExceededMaxEntries() is called", () => {
    component.getMaxEntriesForLog = () => 14;
    component.data.log = {
      dayEntries: testHelpers.getRandomEntryListOfLength(component.getMaxEntriesForLog())
    }
    expect(component.hasReachedorExceededMaxEntries()).toBe(true)
  });


  it("should return false if the user has less entries their than tier allows when hasReachedOrExceededMaxEntries() is called", () => {
    component.getMaxEntriesForLog = () => 14;
    component.data.log = {
      dayEntries: testHelpers.getRandomEntryListOfLength(component.getMaxEntriesForLog() - 1)
    }
    expect(component.hasReachedorExceededMaxEntries()).toBe(false)
  });

  it("should return the max entries from the users tier when getMaxEntriesForLog() is called ", () => {
    component.tierPermission.MAX_DAY_ENTRIES_KEY = "dayEntries";
    const expectedMaxEntries = "someValue" as any;
    component.tierPermission.getUserTier = () => {
      return {
        [component.tierPermission.MAX_DAY_ENTRIES_KEY]: expectedMaxEntries
      }
    }
    expect(component.getMaxEntriesForLog()).toBe(expectedMaxEntries);
  });

  it("should return that 28 entries are allowed when getMaxEntriesForLog() is called and the user is free and numWeeksForFreeTrial is 4 ", () => {
    component.tierPermission.MAX_DAY_ENTRIES_KEY = "dayEntries";
    const unexpectedMaxEntries = "someValue" as any;
    component.tierPermission.getUserTier = () => {
      return {
        [component.tierPermission.MAX_DAY_ENTRIES_KEY]: unexpectedMaxEntries
      }
    }
    component.tierPermission.userHasActiveSubscription = () => false;
    component.tierPermission.getNumWeeksFreeTrial = () => 4;
    expect(component.getMaxEntriesForLog()).toBe(28);
  });

  it("should return the value of isInCreateMode() when disableDeleteButton() is called ", () => {
    const inCreateMode: any = "inCreateModeRightNow";
    component.isInCreateMode = () => inCreateMode;
    expect(component.disableDeleteButton()).toBe(inCreateMode);
  });

  it("should just close the dialog when deleteEntry() is called if the log has no entry to delete", async () => {
    const parentLog = testHelpers.getRandomNutritionLog();
    const expectedDate = new Date();
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: expectedDate }
      }
    } as any;
    parentLog.getEntryAtDate = (): any => null;
    component.data.log = parentLog;
    component.closeDialog = jasmine.createSpy();
    await component.deleteEntry();
    expect(component.closeDialog).toHaveBeenCalledWith(component.JUST_CLOSE);
  });

  it("should just close the dialog and show an error message when deleteEntry() is called if there is an error", async () => {
    component.closeDialog = jasmine.createSpy();
    await component.deleteEntry();
    expect(component.snackBar.showFailureMessage).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalledWith(component.JUST_CLOSE);
  });

  it("should disable closing, turn the spinner on, delete the entry from the log and close the dialog with delete after a timeout if deleteEntry() is called and there is an entry to delete ", async () => {
    const parentLog = testHelpers.getRandomNutritionLog();
    const expectedDate = new Date();
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: expectedDate }
      }
    } as any;
    const expectedEntry = testHelpers.getRandomEntry();
    parentLog.getEntryAtDate = (): any => (expectedEntry);
    component.closeDialog = jasmine.createSpy();
    component.data.log = parentLog;
    await component.deleteEntry();
    expect(component.dialogRef.disableClose).toBe(true);
    expect(component.showSpinner).toBe(true);
    expect(component.firebaseNutrition.deleteEntryFromLog).toHaveBeenCalledWith(expectedEntry, parentLog);
    jasmine.clock().tick((new ConstantsService().SPINNER_TIMEOUT + 1));
    expect(component.closeDialog).toHaveBeenCalledWith(component.CLOSE_DELETE);
  });

  it("should return false when isInCreateMode() is called if the dayEntryForm does not exist", () => {
    component.dayEntryForm = null;
    expect(component.isInCreateMode()).toBe(false);
  });

  it("should return false when isInCreateMode() is called if the dayEntryForm exists but does not have a date form control", () => {
    component.dayEntryForm = {
      controls: {
      }
    } as any;
    expect(component.isInCreateMode()).toBe(false);
  });

  it("should return false when isInCreateMode() is called if the data params log contains an entry at the current date", () => {
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: new Date() }
      }
    } as any;
    component.data.log = {
      getEntryAtDate: () => new DayEntry()
    } as any
    expect(component.isInCreateMode()).toBe(false);
  });

  it("should return true when isInCreateMode() is called if the data params log DOES NOT CONTAIN an entry at the current date", () => {
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: new Date() }
      }
    } as any;
    component.data.log = {
      getEntryAtDate: () => null
    } as any
    expect(component.isInCreateMode()).toBe(true);
  });

  it("should return false when isInEditMode() is called if the dayEntryForm does not exist", () => {
    component.dayEntryForm = null;
    expect(component.isInEditMode()).toBe(false);
  });

  it("should return false when isInEditMode() is called if the dayEntryForm exists but does not have a date form control", () => {
    component.dayEntryForm = {
      controls: {
      }
    } as any;
    expect(component.isInEditMode()).toBe(false);
  });

  it("should return true when isInEditMode() is called if the data params log contains an entry at the current date", () => {
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: new Date() }
      }
    } as any;
    component.data.log = {
      getEntryAtDate: () => new DayEntry()
    } as any
    expect(component.isInEditMode()).toBe(true);
  });

  it("should return false when isInEditMode() is called if the data params log DOES NOT CONTAIN an entry at the current date", () => {
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: new Date() }
      }
    } as any;
    component.data.log = {
      getEntryAtDate: () => null
    } as any
    expect(component.isInEditMode()).toBe(false);
  });

  it("should use the values of the form controls to the data in the entry when getDayEntryForm() is called if the entry exists", () => {
    component.fb.group = (group) => {
      return group as any;
    }
    component.preference = new PreferenceService({} as any);
    const expectedEntry = testHelpers.getRandomEntry();
    const testLog = testHelpers.getRandomNutritionLog();
    testLog.getEntryAtDate = () => expectedEntry;
    component.data.log = testLog;
    const testUser = new UserProfile();
    testUser.userPreferences = new PreferenceService({} as any).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => testUser;
    const grouped = component.getDayEntryForm(expectedEntry.date);
    expect(grouped[component.FORM_CONTROL_WEIGHT][0]).toBe(expectedEntry.weight);
    expect(grouped[component.FORM_CONTROL_CALORIES][0]).toBe(expectedEntry.calories);
    expect(grouped[component.FORM_CONTROL_DATE][0]['value']).toEqual(expectedEntry.date);
  });

  it("should use the calorie validator for calories when getDayEntryForm() is called", () => {
    component.fb.group = (group) => {
      return group as any;
    }
    component.preference = new PreferenceService({} as any);
    const expectedEntry = testHelpers.getRandomEntry();
    const testLog = testHelpers.getRandomNutritionLog();
    testLog.getEntryAtDate = () => expectedEntry;
    component.data.log = testLog;
    const testUser = new UserProfile();
    testUser.userPreferences = new PreferenceService({} as any).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => testUser;
    const grouped = component.getDayEntryForm(new Date());
    expect(grouped[component.FORM_CONTROL_CALORIES][1]).toBe(ValidateCalories);
  });

  it("should use the imperial weight validator for weight when getDayEntryForm() is called and the number system is imperial", () => {
    component.fb.group = (group) => {
      return group as any;
    }
    component.preference = new PreferenceService({} as any);
    const expectedEntry = testHelpers.getRandomEntry();
    const testLog = testHelpers.getRandomNutritionLog();
    testLog.getEntryAtDate = () => expectedEntry;
    component.data.log = testLog;
    const testUser = new UserProfile();
    testUser.userPreferences = new PreferenceService({} as any).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => testUser;
    const grouped = component.getDayEntryForm(new Date());
    expect(grouped[component.FORM_CONTROL_WEIGHT][1]).toBe(ValidateImperialWeight);
  });

  it("should use the imperial weight validator for weight when getDayEntryForm() is called and the number system is imperial", () => {
    component.fb.group = (group) => {
      return group as any;
    }
    component.preference = new PreferenceService({} as any);
    const expectedEntry = testHelpers.getRandomEntry();
    const testLog = testHelpers.getRandomNutritionLog();
    testLog.getEntryAtDate = () => expectedEntry;
    component.data.log = testLog;
    const testUser = new UserProfile();
    testUser.userPreferences = new PreferenceService({} as any).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => testUser;
    const grouped = component.getDayEntryForm(new Date());
    expect(grouped[component.FORM_CONTROL_WEIGHT][1]).toBe(ValidateImperialWeight);
  });

  it("should use the metric weight validator for weight when getDayEntryForm() is called and the number system is metric", () => {
    component.fb.group = (group) => {
      return group as any;
    }
    component.preference = new PreferenceService({} as any);
    const expectedEntry = testHelpers.getRandomEntry();
    const testLog = testHelpers.getRandomNutritionLog();
    testLog.getEntryAtDate = () => expectedEntry;
    component.data.log = testLog;
    const fakeConvertVal = "someFakeVal" as any;
    component.conversion.convertLbsToKg = () => fakeConvertVal;
    const testUser = new UserProfile();
    testUser.userPreferences = new PreferenceService({} as any).getDefaultPreferences();
    testUser.userPreferences[component.preference.GENERAL_PREFS][component.preference.NUMBER_SYSTEM] = component.preference.NUMBER_SYSTEM_METRIC
    component.stateManager.getCurrentUser = () => testUser;
    const grouped = component.getDayEntryForm(expectedEntry.date);
    expect(grouped[component.FORM_CONTROL_WEIGHT][0]).toBe(fakeConvertVal);
    expect(grouped[component.FORM_CONTROL_WEIGHT][1]).toBe(ValidateMetricWeight);
  });

  it("should just close the dialog if it is not in create mode or edit mode and confirm() is called ", async () => {
    component.isInCreateMode = () => false;
    component.isInEditMode = () => false;
    component.closeDialog = jasmine.createSpy();
    await component.confirm();
    expect(component.closeDialog).toHaveBeenCalledWith(component.JUST_CLOSE);
  });

  it("should show an error message and just close the dialog if it is not in create mode or edit mode and confirm() is called ", async () => {
    component.isInCreateMode = () => {
      throw { name: "someError" }
    }
    component.closeDialog = jasmine.createSpy();
    await component.confirm();
    expect(component.snackBar.showFailureMessage).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalledWith(component.JUST_CLOSE);
  });

  it("should add the entry to the log and close the dialog with a value of EDIT when confirm() is called and the component is in edit mode ", async () => {
    component.isInEditMode = () => true;
    component.isInCreateMode = () => false;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    component.currentNumberSystemIsImperial = () => true;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    component.firebaseNutrition.addEntryToLog = jasmine.createSpy().and.returnValue(true);
    const entrytoTest: DayEntry = await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(component.firebaseNutrition.addEntryToLog).toHaveBeenCalledWith(entrytoTest, fakeLog);
    expect(component.closeDialog).toHaveBeenCalledWith(component.CLOSE_EDIT);
  });

  it("should add the entry to the log and close the dialog with a value of CREATE when confirm() is called and the component is in create mode ", async () => {
    component.isInEditMode = () => false;
    component.isInCreateMode = () => true;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    component.currentNumberSystemIsImperial = () => true;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    component.firebaseNutrition.addEntryToLog = jasmine.createSpy().and.returnValue(true);
    const entryToTest: DayEntry = await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(component.firebaseNutrition.addEntryToLog).toHaveBeenCalledWith(entryToTest, fakeLog);
    expect(component.closeDialog).toHaveBeenCalledWith(component.CLOSE_CREATE);
  });

  it("should round the entries weight to one decimal place when confirm() is called", async () => {
    component.isInEditMode = () => false;
    component.isInCreateMode = () => true;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    component.currentNumberSystemIsImperial = () => true;
    component.conversion.roundNumberToOneDecimalPlace = () => "someExpectedValue" as any;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    const entryToTest: DayEntry = await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(entryToTest.weight).toBe(component.conversion.roundNumberToOneDecimalPlace(null));
  });

  it("should round the entries weight to one decimal place when confirm() is called", async () => {
    component.isInEditMode = () => false;
    component.isInCreateMode = () => true;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    component.currentNumberSystemIsImperial = () => true;
    const roundRef = Math.round
    Math.round = () => "someFakeVal" as any;
    component.conversion.roundNumberToOneDecimalPlace = () => "someExpectedValue" as any;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    const entryToTest: DayEntry = await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(entryToTest.calories).toBe(Math.round(null));
    Math.round = roundRef;
  });

  it("should convert the entries weight from KG to lbs if confirm() is called and the number system is metric", async () => {
    component.isInEditMode = () => false;
    component.isInCreateMode = () => true;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    component.conversion.convertKgToLbs = () => "SomeExpectedVal" as any
    component.conversion.roundNumberToOneDecimalPlace = (param) => param;
    component.currentNumberSystemIsImperial = () => false;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    const entryToTest: DayEntry = await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(entryToTest.weight).toBe(component.conversion.convertKgToLbs(null))
  });

  it("should round the calories to a whole number when confirm() is called", async () => {
    component.isInEditMode = () => false;
    component.isInCreateMode = () => true;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    const roundRef = Math.round
    Math.round = () => "someFakeVal" as any;
    component.currentNumberSystemIsImperial = () => false;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    const entrytoTest = await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(entrytoTest.calories).toBe(Math.round(null));
    Math.round = roundRef;
  });

  it("should submit a new entry with the current date as the entries date if there is no entry at the current date", async () => {
    component.isInEditMode = () => false;
    component.isInCreateMode = () => true;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    const roundRef = Math.round
    Math.round = () => "someFakeVal" as any;
    component.currentNumberSystemIsImperial = () => false;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => null;
    component.firebaseNutrition.addEntryToLog = (entry: DayEntry, log: NutritionLog) => {
      expect(entry.id == expectedDate.getTime() && entry.date.getTime() == expectedDate.getTime()).toBe(true);
      return null;
    }
    component.closeDialog = jasmine.createSpy();
    await component.confirm();
    Math.round = roundRef;
  });

  it("should set the entries estimatedTDEE and goalIntakeBoundaries to the parentPayloads members when confirm() is called in create mode", async () => {
    component.isInEditMode = () => false;
    component.isInCreateMode = () => true;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    const expectedCreationTdee = "someTdee" as any;
    const expectedGoalIntakeBoundaries = "someBoundaries" as any;
    component.parentLogPayload.estimatedTDEE = expectedCreationTdee;
    component.parentLogPayload.goalIntakeBoundaries = expectedGoalIntakeBoundaries;
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    component.currentNumberSystemIsImperial = () => false;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    const entryToTest: DayEntry = await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(entryToTest.goalIntakeBoundaries).toBe(expectedGoalIntakeBoundaries);
    expect(entryToTest.creationEstimatedTDEE).toBe(expectedCreationTdee);
  });

  it("should NOT set the entries estimatedTDEE and goalIntakeBoundaries to the parentPayloads members when confirm() is called in edit mode", async () => {
    component.isInEditMode = () => true;
    component.isInCreateMode = () => false;
    const fakeLog = testHelpers.getRandomNutritionLog();
    component.parentLogPayload = new EnergyPayload()
    const payloadCreationTDEE = "someTdee" as any;
    const payloadGoalIntakeBoundaries = "someBoundaries" as any;
    component.parentLogPayload.estimatedTDEE = payloadCreationTDEE;
    component.parentLogPayload.goalIntakeBoundaries = payloadGoalIntakeBoundaries;
    component.data.log = fakeLog;
    const expectedEntry = testHelpers.getRandomEntry();
    const expectedDate = expectedEntry.date;
    const expectedCalories = testHelpers.getRandomCalories();
    const expectedWeight = testHelpers.getRandomWeight();
    const entryCreationTDEE = "someOtherTdee" as any;
    const entryGoalIntakeBoundaries = "someOtherBoundaries" as any;
    expectedEntry.creationEstimatedTDEE = entryCreationTDEE;
    expectedEntry.goalIntakeBoundaries = entryGoalIntakeBoundaries;
    component.currentNumberSystemIsImperial = () => false;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: {
          value: expectedDate
        },
        [component.FORM_CONTROL_CALORIES]: {
          value: expectedCalories
        },
        [component.FORM_CONTROL_WEIGHT]: {
          value: expectedWeight
        }
      }
    } as any;
    fakeLog.getEntryAtDate = (date: Date) => {
      if (date.getTime() == expectedDate.getTime()) {
        return expectedEntry
      }
      else {
        return null;
      }
    }
    component.closeDialog = jasmine.createSpy();
    await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(expectedEntry.goalIntakeBoundaries).not.toBe(payloadGoalIntakeBoundaries);
    expect(expectedEntry.creationEstimatedTDEE).not.toBe(payloadCreationTDEE);
    expect(expectedEntry.goalIntakeBoundaries).toBe(entryGoalIntakeBoundaries);
    expect(expectedEntry.creationEstimatedTDEE).toBe(entryCreationTDEE);
  });

  it("should destroy without an issue if ngOnDestroy() is called and dateChangeSubscription null", () => {
    component.dateChangeSubscription = null;
    let errorHappened = false;
    try {
      component.ngOnDestroy();
    } catch (error) {
      errorHappened = true;
    }
    expect(errorHappened).toBe(false);
  });

  it("should not disable the confirm button if we allow submissions for a special case and disableConfirmButton() is called ", () => {
    component.payloadService.latestEntryIsIncomplete = () => true;
    component.hasExactlyReachedMaxedEntriesForLog = () => true;
    const canSubmit = false;
    expect(component.disableConfirmButton()).toBe(canSubmit);
  });

  it("should return true if the user has exactly reached their max number of logs and hasExactlyReachedMaxLogs() is called", () => {
    const arbitraryValue = 777;
    component.hasExactlyReachedMaxedEntriesForLog = hasExactRef
    component.getMaxEntriesForLog = () => arbitraryValue;
    component.data = {
      log: {
        dayEntries: {
          length: arbitraryValue
        }
      }
    }
    expect(component.hasExactlyReachedMaxedEntriesForLog()).toBe(true);
  });

  it("should return true if the user has exactly reached their max number of logs and hasExactlyReachedMaxLogs() is called", () => {
    const arbitraryValue = 777;
    component.hasExactlyReachedMaxedEntriesForLog = hasExactRef
    component.getMaxEntriesForLog = () => arbitraryValue;
    component.data = {
      log: {
        dayEntries: {
          length: (arbitraryValue + 1)
        }
      }
    }
    expect(component.hasExactlyReachedMaxedEntriesForLog()).toBe(false);
  });

  it("should not crash when getDayEntryForm() is called and a valid entry does not exist in the log", () => {
    component.data.log = null;
    component.fb.group = (thing) => thing as any;
    component.preference = new PreferenceService({} as any);
    component.stateManager.getCurrentUser = () => {
      const user = new UserProfile();
      user.userPreferences = component.preference.getDefaultPreferences();
      user.userPreferences.general.isImperial = false;
      return user;
    };
    const form = component.getDayEntryForm(new Date());
    expect(form).not.toBe(null);
  });

  it("should still confirm even if the component is not in edit or create mode ", async () => {
    component.isInCreateMode = () => false;
    component.isInEditMode = () => false;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: null },
        [component.FORM_CONTROL_WEIGHT]: { value: null },
        [component.FORM_CONTROL_CALORIES]: { value: null }
      }
    } as any;
    let crashed = false;
    try {
      await component.confirm();
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it("should still confirm even if the component is in edit mode ", async () => {
    component.isInCreateMode = () => false;
    component.isInEditMode = () => true;
    component.dayEntryForm = {
      controls: {
        [component.FORM_CONTROL_DATE]: { value: new Date() },
        [component.FORM_CONTROL_WEIGHT]: { value: null },
        [component.FORM_CONTROL_CALORIES]: { value: null }
      }
    } as any;
    let crashed = false;
    component.data.log = new NutritionLog();
    try {
      await component.confirm();
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it("should return true if shouldShowSpinnerHeader is called with the spinner action", () => {
    component.spinnerHeaderValue = "someValue";
    expect(component.shouldShowSpinnerHeader(component.spinnerHeaderValue)).toBe(true)
  });

  it("should return false if shouldShowSpinnerHeader is called without the spinner action", () => {
    component.spinnerHeaderValue = "someValue";
    expect(component.shouldShowSpinnerHeader(component.spinnerHeaderValue + " some other chars")).toBe(false)
  });

});

function setup() {
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const fb = autoSpy(FormBuilder);
  const conversion = autoSpy(ConversionService);
  const stateManager = autoSpy(StateManagerService);
  const preference = autoSpy(PreferenceService);
  const firebaseNutrition = autoSpy(FirebaseNutritionService);
  const tierPermission = autoSpy(TierPermissionsService);
  const snackBar = autoSpy(SnackBarService);
  const constants = autoSpy(ConstantsService);
  const router = autoSpy(Router);
  const payload = autoSpy(PayloadService);
  const environmentService = autoSpy(EnvironmentService);
  const builder = {
    dialogRef,
    data,
    fb,
    conversion,
    stateManager,
    preference,
    firebaseNutrition,
    tierPermission,
    snackBar,
    constants,
    router,
    payload,
    default() {
      return builder;
    },
    build() {
      return new EntryModifyComponent(dialogRef, data, fb, conversion, stateManager, preference, firebaseNutrition, tierPermission, snackBar, constants, payload, router, environmentService);
    }
  };

  return builder;
}
