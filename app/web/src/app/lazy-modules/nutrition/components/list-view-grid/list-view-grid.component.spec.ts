import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { ListViewGridComponent } from './list-view-grid.component';
import { autoSpy } from 'autoSpy';
import { TimePeriod } from 'src/app/model-classes/nutrition-log/time-period';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { EnvironmentService } from 'src/app/services/general/environment.service';

describe('ListViewGridComponent', () => {

  let component: ListViewGridComponent;
  let testHelpers = new TestHelpers();

  beforeEach(() => {
    component = setup().default().build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should not crash when ngOnInit() is called', () => {
    let somethingBadHappened = false;
    try {
      component.ngOnInit();
    } catch (error) {
      somethingBadHappened = true;
    }
    expect(somethingBadHappened).toBe(false);
  });

  it("should use the dialogCreator to open an entry modify dialog if openEntryModify() is called ", () => {
    component.openEntryModify(new Date());
    expect(component.dialogCreator.openNutritionEntryModifyDialog).toHaveBeenCalled();
  });

  it("should return the date passed in if it is not null when filterEndDate() is called", () => {
    const randomNonNullDate = testHelpers.getRandomDate();
    const filteredDate = component.filterEndDate(randomNonNullDate);
    const itIsTheSame = (randomNonNullDate === filteredDate);
    expect(itIsTheSame).toBe(true);
  });

  it("should return the timePeriods startDate plus six times one day if date passed into filterEndDate() is null", () => {
    component.timePeriod = new TimePeriod();
    component.timePeriod.startDate = testHelpers.getRandomDate();
    component.time.getDayInMillis = () => 1000;
    const sixDaysInMillis = 6 * component.time.getDayInMillis();
    const expectedValue = new Date(sixDaysInMillis + component.timePeriod.startDate.getTime());
    const filteredDate = component.filterEndDate(null);
    const itIsTheExpectedValue = (expectedValue.getTime() === filteredDate.getTime());
    expect(itIsTheExpectedValue).toBe(true);
  });

  it("should return whatever !(environment.isMobile) is when stickyColHeaders() is called ", () => {
    component.environment.isMobile =true;
    expect(component.stickyColHeaders()).toBe(false);
    component.environment.isMobile =false;
    expect(component.stickyColHeaders()).toBe(true);
  });

});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const preferenceManager = autoSpy(PreferenceService);
  const dialogCreator = autoSpy(DialogCreatorService);
  const environment = autoSpy(EnvironmentService);
  const time = autoSpy(TimeService);
  const builder = {
    stateManager,
    preferenceManager,
    dialogCreator,
    time,
    default() {
      return builder;
    },
    build() {
      return new ListViewGridComponent(stateManager, preferenceManager, dialogCreator, time, environment);
    }
  };

  return builder;
}
