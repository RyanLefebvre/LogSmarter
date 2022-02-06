import { Pipe, PipeTransform } from '@angular/core';
import { ConversionService } from '../services/general/conversion.service';
import { StateManagerService } from '../services/general/state-manager.service';
import { NutritionConstanstsService } from '../services/nutrition-log/nutrition-constansts.service';

/**
 * Pipe used to display weight in a readable format to the user based on 
 * the current number sytem. Weight is always stored in lbs. If the user's 
 * number system preference is imperial, then the format is weight lbs. If
 * the user's number system preference is metric then format is weight kg.
 * 
 * If the weight is an invalid value. i.e. it is null or negative, then an empty 
 * string is returned.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
@Pipe({ name: 'WeightPipe', pure: false })
export class WeightPipe implements PipeTransform {

  /**
   * @ignore
   */
  constructor(public stateManager: StateManagerService, public converter: ConversionService, public constants: NutritionConstanstsService) { }

  /**
   * Transforms a user's weight in lbs into a string that can be displayed in the UI.
   * Forces the value to be rounded to 1 decimal place even though this constraint should
   * already be met.
   * 
   * @param weight_lbs weight to be transformed. 
   */
  transform(weight_lbs: number): string {

    const weightisNull: boolean = weight_lbs == null;
    const weightisLessThanOrEqZero: boolean = weight_lbs <= 0
    const weightInvalid: boolean = (weightisNull || weightisLessThanOrEqZero);
    const invalidWeight: string = this.constants.INSUFFICIENT_DATA_STRING;

    if (weightInvalid) {
      return invalidWeight;
    }
    else {
      try {
        return this.getWeight(weight_lbs) + this.getUnits();
      } catch (error) {
        return invalidWeight;
      }
    }
  }

  /**
   * Returns the correct units for weight based on the user's number system preference.
   */
  getUnits(): string {
    if (this.stateManager.getCurrentUser().userPreferences.general.isImperial) {
      return " lb";
    }
    else {
      return " kg";
    }
  }

  /**
   * Returns the correct number to be appended to a weight unit based on the 
   * user's number system preference. i.e. if metric then number is a weight in 
   * kg. If imperial, then a number in lbs is returned.
   * 
   * @param weight_lbs user's weight in lbs
   */
  getWeight(weight_lbs: number) {
    if (this.stateManager.getCurrentUser().userPreferences.general.isImperial == true) {
      return this.converter.roundNumberToOneDecimalPlace(weight_lbs);
    }
    else {
      return this.converter.convertLbsToKg(weight_lbs);
    }
  }
}
