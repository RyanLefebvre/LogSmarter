import { StateManagerService } from '../services/general/state-manager.service';
import { ConversionService } from '../services/general/conversion.service';
import { NutritionConstanstsService } from '../services/nutrition-log/nutrition-constansts.service';
import { WeightPipe } from './weight-pipe';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';

describe('WeightPipe', () => {
  let component: WeightPipe;
  let testHelpers: TestHelpers;

  beforeEach(() => {
    component = setup().default().build();
    testHelpers = new TestHelpers();
  });

  it('should return the INSUFFICIENT DATA string when transform is called with an invalid weight when transform is called', () => {
      expect(component.transform(0)).toEqual(component.constants.INSUFFICIENT_DATA_STRING);
  });

  it('should return the INSUFFICIENT DATA string if an error occurs when transform is called', () => {
    spyOn(component, 'getUnits').and.throwError(new TypeError);
    expect(component.transform(1)).toEqual(component.constants.INSUFFICIENT_DATA_STRING);
  });

  it('should return the user‘s weight in pounds rounded to the nearest decimal place as a string when transform is called', () => {
    const getWeightSpy: jasmine.Spy<(weight_lbs) => number> = spyOn(component, 'getWeight');
    const getUnitsSpy: jasmine.Spy<() => string> = spyOn(component, 'getUnits');

    component.transform(150);
    expect(getWeightSpy).toHaveBeenCalledWith(150);
    expect(getUnitsSpy).toHaveBeenCalled();
  });

  it('should return the unit for pounds if the user‘s number system is Imperial when getUnits is called', () => {
    const userWithImperial = testHelpers.createFreeUserProfile();
    userWithImperial.userPreferences.general.isImperial = true;
 
    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userWithImperial); 

    expect(component.getUnits()).toEqual(' lb');
  });

  it('should return the unit for kilograms if the user‘s number system is not Imperial when getUnits is called', () => {
    const userWithoutImperial = testHelpers.createFreeUserProfile();
    userWithoutImperial.userPreferences.general.isImperial = false;
    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userWithoutImperial); 

    expect(component.getUnits()).toEqual(' kg');
  });

  it('should return the round weight in pounds when getWeight is called if the user‘s number system is Imperial', () => {
    const weight = 165.58;
    const userWithImperial = testHelpers.createFreeUserProfile();
    userWithImperial.userPreferences.general.isImperial = true;
    const converterSpy: jasmine.Spy<(weight) => number> = spyOn(component.converter, 'roundNumberToOneDecimalPlace');
    
    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userWithImperial); 

    component.getWeight(weight);

    expect(converterSpy).toHaveBeenCalledWith(weight);
  });

  it('should return the round weight in pounds when getWeight is called if the user‘s number system is Imperial', () => {
    const weight = 165.58;
    const userWithoutImperial = testHelpers.createFreeUserProfile();
    userWithoutImperial.userPreferences.general.isImperial = false;
    const converterSpy: jasmine.Spy<(weight) => number> = spyOn(component.converter, 'convertLbsToKg');

    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userWithoutImperial);
    
    component.getWeight(weight);

    expect(converterSpy).toHaveBeenCalledWith(weight);
  });
});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const converter = autoSpy(ConversionService);
  const constants = autoSpy(NutritionConstanstsService);
  const builder = {
    stateManager,
    converter,
    constants,
    default() {
      return builder;
    },
    build() {
      return new WeightPipe(stateManager, converter, constants);
    }
  };

  jasmine.getEnv().allowRespy(true);

  return builder;
}
