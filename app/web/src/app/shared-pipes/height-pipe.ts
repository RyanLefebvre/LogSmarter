import { Pipe, PipeTransform } from '@angular/core';
import { ConversionService } from '../services/general/conversion.service';
import { StateManagerService } from '../services/general/state-manager.service';

/**
 * Pipe used to display height in a readable format to the user based on 
 * the current number sytem. Height is always stored in inches. If the user's 
 * number system preference is imperial, then the format is feet' inches"". If
 * the user's number system preference is metric then height is displayed in cm.
 * 
 * If the height is an invalid value. i.e. it is null or negative, then an empty 
 * string is returned.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
@Pipe({ name: 'HeightPipe', pure: false })
export class HeightPipe implements PipeTransform {

  /**
   * @ignore
   */
  constructor(public stateManager: StateManagerService, public converter: ConversionService) { }

  /**
   * Transforms height stored in inches into something that can 
   * be displayed in the UI.
   * 
   * @param height_inches height to be transformed.
   */
  transform(height_inches: number): string {

    const heightisNull: boolean = height_inches == null;
    const heightLessThanOrEqZero: boolean = height_inches <= 0;
    const heightInvalid: boolean = (heightisNull || heightLessThanOrEqZero);
    const invalidHeight: string = "";

    if (heightInvalid) {
      return invalidHeight;
    } else {
      try {
        const isImperial = this.stateManager.getCurrentUser().userPreferences.general.isImperial;
        if (isImperial) {
          return this.converter.convertInchesToString(height_inches);
        } else {
          return this.converter.convertInchesToCentimeters(height_inches) + " cm";
        }
      } catch (error) {
        return invalidHeight;
      }
    }
  }

}
