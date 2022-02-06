import { NutritionConstanstsService } from '../services/nutrition-log/nutrition-constansts.service';
import { CaloriePipe } from './calorie-pipe';
import { autoSpy } from 'autoSpy';

describe('CaloriePipe', () => {
  let component: CaloriePipe;

  beforeEach(() => {
     component= setup().default().build();
  });

  it('should return the number of calories (rounded to the nearest whole number) to a string when transform is called ', () => {
    expect(component.transform(2999.76)).toEqual('3000 kcal');
  }); 

  it('should return the insufficient data constant when transform is called with a null argument', () => {
    expect(component.transform(null)).toEqual(component.energyConstants.INSUFFICIENT_DATA_STRING);
  })

  it('should return the insufficient data constant when Math.round throws an error', () => {
    spyOn(Math, 'round').and.throwError(new TypeError);
    expect(component.transform(3000)).toEqual(component.energyConstants.INSUFFICIENT_DATA_STRING);
  });
});

function setup() {
  const energyConstants = autoSpy(NutritionConstanstsService);
  const builder = {
    energyConstants,
    default() {
      return builder;
    },
    build() {
      return new CaloriePipe(energyConstants);
    }
  };

  return builder;
}
