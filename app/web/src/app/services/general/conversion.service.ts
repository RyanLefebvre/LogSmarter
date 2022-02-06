import { Injectable } from '@angular/core'
import { NutritionConstanstsService } from '../nutrition-log/nutrition-constansts.service';

/**
 * This service contains functions that convert measurements from one unit or measurement system to another.
 * 
 * Last edited by: Ryan Lefebvre 7/07/2020
 */
@Injectable({
  providedIn: 'root'
})
export class ConversionService {

  /**
   * @ignore
   */
  constructor(public constants: NutritionConstanstsService) {
  }

  /**
   * Converts a height represented in feet and inches to the equivalent height in only inches.
   * Feet and inches are both expected to be integers.
   * 
   * @param feet height measured in feet.
   * @param inches height measured in inches.
   */
  convertFeetAndInchesToInches(feet: number, inches: number): number {
    const feetIsNegativeorNull: boolean = (feet < 0) || (feet == this.constants.INSUFFICIENT_DATA);
    if (feetIsNegativeorNull) {
      feet = 0;
    }
    const inchesIsNegativeOrNull: boolean = (inches < 0) || (inches == this.constants.INSUFFICIENT_DATA);
    if (inchesIsNegativeOrNull) {
      inches = 0;
    }
    return ((feet * 12) + inches);
  }

  /**
   * Converts a height in inches into a display string in the format feet' inches".
   * Expects that inches is an integer. If inches is null or negative, then 
   * an empty string is returned.
   * 
   * @param heightInches  height in inches to be converted.
   */
  convertInchesToString(heightInches: number): string {
    const heightIsNullOrNegative: boolean = (heightInches == null || heightInches <= 0)
    if (heightIsNullOrNegative) {
      return "";
    }
    else {
      return Math.floor((heightInches / 12)) + "' " + Math.floor(heightInches % 12) + "\"";
    }
  }

  /**
   * Returns the number of whole feet that fit into a height in inches and discards
   * the remainder. If height is null or negative then null is returned.
   *  
   * @param heightInches the height in inches to be converted.
   */
  convertInchesToFeet(heightInches: number): number {
    const heightIsNullOrNegative: boolean = (heightInches == null || heightInches < 0);
    if (heightIsNullOrNegative) {
      return null;
    }
    else {
      return Math.floor(heightInches / 12);
    }
  }

  /**
   * Returns the number of inches that remain aftet the number of whole feet that fit into a height
   * in inches is calculated. If height is null or negative then null is returned.
   *  
   * @param heightInches the height in inches to be converted.
   */
  convertTotalInchesToRemainderInches(heightInches: number): number {
    const heightIsNullOrNegative: boolean = (heightInches == null || heightInches < 0);
    if (heightIsNullOrNegative) {
      return null;
    }
    else {
      return Math.floor(heightInches % 12);
    }
  }

  /**
   * Rounds a number to exactly one decimal place. Returns the original 
   * number if any error occurs.
   * 
   * @param num number to round.
   */
  roundNumberToOneDecimalPlace(num: number): number {
    try {
      const multiplier = Math.pow(10, 1)
      return Math.round(num * multiplier) / multiplier;
    } catch (error) {
      return num;
    }
  }

  /**
   * Converts a weight in lbs to the equivalent amount of weight in kg and rounds to one decimal place.
   * 
   * @param weight_lbs weight to convert from lbs to kg.
   */
  convertLbsToKg(weight_lbs: number): number {
    if (!weight_lbs) {
      return null;
    }
    return this.roundNumberToOneDecimalPlace(weight_lbs * 0.45359237);
  }

  /**
  * Converts a weight in kg to the equivalent amount of weight in lbs and rounds to one decimal place.
  * 
  * @param weight_kg weight to be converted from kg to lbs.
  */
  convertKgToLbs(weight_kg): number {
    return this.roundNumberToOneDecimalPlace(weight_kg / 0.45359237);
  }

  /**
  * Converts a height in IN to the equivalent amount of height in cm and rounds to one decimal place.
  * 
  * @param height_inches height to be converted from IN to cm.
  */
  convertInchesToCentimeters(height_inches: number): number {
    return this.roundNumberToOneDecimalPlace(height_inches * 2.54);
  }

  /**
  * Converts a height in CM to the equivalent amount of height in IN and rounds to one decimal place.
  * 
  * @param height_centimeters height to be converted from cm to IN.
  */
  convertCentimetersToInches(height_centimeters): number {
    return this.roundNumberToOneDecimalPlace(height_centimeters / 2.54);
  }

}
