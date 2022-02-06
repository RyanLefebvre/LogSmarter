import { Pipe, PipeTransform } from '@angular/core';
import { NutritionConstanstsService } from '../services/nutrition-log/nutrition-constansts.service';

/**
 * Pipe used to check for insufficient data. i.e. when the value is null.
 * Used to transform a number of calories into a value that can be displayed 
 * to the user.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
@Pipe({
  name: 'CaloriePipe'
})
export class CaloriePipe implements PipeTransform {

  /**
   * @ignore
   */
  constructor(public energyConstants: NutritionConstanstsService) { }

  /**
   * Transforms an amount of calories into a string that can be displayed in the UI.
   * Forces value to be rounded to 0 decimal places even though this constraint should
   * already be met.
   * 
   * @param calorie_amount calories to be transformed.
   */
  transform(calorie_amount: number): string {
    try {
      if (calorie_amount == null) {
        return this.energyConstants.INSUFFICIENT_DATA_STRING;
      }
      else {
        return (Math.round(calorie_amount) + " kcal");
      }
    } catch (error) {
      return this.energyConstants.INSUFFICIENT_DATA_STRING
    }
  }

}
