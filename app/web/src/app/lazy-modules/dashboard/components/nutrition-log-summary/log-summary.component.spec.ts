import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { NutritionLogSummaryComponent } from './log-summary.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';

describe('NutritionLogSummaryComponent', () => {
  const testHelper: TestHelpers = new TestHelpers();
  let component: NutritionLogSummaryComponent;

  beforeEach(() => {
    component = setup().default().build();
  });

  it('should not crash when ngOnInit is called', () => {
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it("should call fbNutr.getAutoPromptDate() when getAutoPromptDate() is called", () => {
    component.logModel = testHelper.getRandomNutritionLog();
    component.payload = new EnergyPayload();
    component.getAutoPromptDate();
    expect(component.fbNutr.getAutoPromptDate).toHaveBeenCalled();
  });

  it("should call dialogService.openNutritionEntryModifyDialog when openFinish() is called", () => {
    component.logModel = testHelper.getRandomNutritionLog();
    component.payload = new EnergyPayload();
    component.openFinish();
    expect(component.dialogService.openNutritionEntryModifyDialog).toHaveBeenCalled();
  });

  it("should call dialogService.openNutritionEntryModifyDialog when openFQuickAdd() is called", () => {
    component.logModel = testHelper.getRandomNutritionLog();
    component.payload = new EnergyPayload();
    component.openQuickAdd();
    expect(component.dialogService.openNutritionEntryModifyDialog).toHaveBeenCalled();
  });

  it("should call payloadService.latestEntryIsIncomplete when latestEntryIsIncomplete() is called ", () => {
    component.latestEntryIsIncomplete();
    expect(component.payloadService.latestEntryIsIncomplete).toHaveBeenCalled();
  });

});

function setup() {
  const fbNutr = autoSpy(FirebaseNutritionService);
  const dialogService = autoSpy(DialogCreatorService);
  const payload = autoSpy(PayloadService);
  const constants = autoSpy(NutritionConstanstsService);
  const builder = {
    fbNutr,
    dialogService,
    constants,
    default() {
      return builder;
    },
    build() {
      return new NutritionLogSummaryComponent(fbNutr, dialogService, payload, constants);
    }
  };

  return builder;
}
