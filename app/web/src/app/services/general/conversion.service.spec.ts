import { TestHelpers } from './testHelpers';
import { NutritionConstanstsService } from '../nutrition-log/nutrition-constansts.service';
import { ConversionService } from './conversion.service';
import { autoSpy } from 'autoSpy';

describe('ConversionService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: ConversionService;

  beforeEach(() => {
    service = setup().build();
  });

  it('should convert feet and inches to inches when convertFeetAndInchesToInches is called', () => {
    expect(service.convertFeetAndInchesToInches(6, -1)).toBe(72);
    expect(service.convertFeetAndInchesToInches(-1, 9)).toBe(9);
    expect(service.convertFeetAndInchesToInches(6, 9)).toBe(81);
  });

  it("should return null when convertLbsToKg is called and null is passed in ", () => {
    expect(service.convertLbsToKg(null)).toBe(null);
  });

  it('should return inches in a readalbe format when convertInchesToString is called', () => {
    expect(service.convertInchesToString(null)).toBe("");
    expect(service.convertInchesToString(-1)).toBe("");
    expect(service.convertInchesToString(service.convertFeetAndInchesToInches(5, 8))).toBeDefined();
  });

  it('should convert inches to feet when convertInchesToFeet is called', () => {
    expect(service.convertInchesToFeet(null)).toBeNull();
    expect(service.convertInchesToFeet(-1)).toBeNull();
    expect(service.convertInchesToFeet(5)).toBe(0);
    expect(service.convertInchesToFeet(12)).toBe(1);
  });

  it('should convert total inches to remainder inches when convertTotalInchesToRemainderInches is called', () => {
    expect(service.convertTotalInchesToRemainderInches(null)).toBeNull();
    expect(service.convertTotalInchesToRemainderInches(-1)).toBeNull();
    expect(service.convertTotalInchesToRemainderInches(5)).toBe(5);
    expect(service.convertTotalInchesToRemainderInches(12)).toBe(0);
    expect(service.convertTotalInchesToRemainderInches(15)).toBe(3);
  });

  it('should round number to one decimal place when roundNumberToOneDecimalPlace is called', () => {
    expect(service.roundNumberToOneDecimalPlace(1.25)).toBe(1.3);
    const powSpy = spyOn(Math, 'pow').and.throwError("fake error because erroring here isnt even possible")
    expect(service.roundNumberToOneDecimalPlace(null)).toBe(null);
  });

  it('should convert lbs to kg when convertLbsToKg is called', () => {
    expect(service.convertLbsToKg(5.1)).toBe(2.3);
  });

  it('should convert kg to lbs convertKgToLbs is called', () => {
    expect(service.convertKgToLbs(2.3)).toBe(5.1);
  });

  it('should convert inches to centimeters convertInchesToCentimeters is called', () => {
    expect(service.convertInchesToCentimeters(10.9)).toBe(27.7);
  });

  it('should convert centimeters to inches convertCentimetersToInches is called', () => {
    expect(service.convertCentimetersToInches(27.7)).toBe(10.9);
  });

});

function setup() {
  const constants = autoSpy(NutritionConstanstsService);
  const builder = {
    constants,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new ConversionService(constants);
    }
  };

  return builder;
}
