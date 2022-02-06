import { Injectable } from '@angular/core';
import { FormControlPair } from 'src/app/model-classes/general/form-control-pair';

/**
 * This service is responsible for any constants needed between multiple services that relate to nutrition 
 * logs or TDEE estimation. Any operations to retrieve or display those values should go through this service.
 * 
 * Last edited by: Ryan Lefebvre 7/08/2020
 */
@Injectable({
  providedIn: 'root'
})
export class NutritionConstanstsService {

  /**
   * Constant value used to refer to when a calculation cannot be performed or an error occured during a calculation.
   */
  INSUFFICIENT_DATA: null = null;

  /**
   * Constant used for displaying the result of calculation that had insufficient data.
   */
  INSUFFICIENT_DATA_STRING: string = "-";

  /**
   * Key used to refer to the log goal of fat loss.
   */
  GOAL_FAT_LOSS: string = "fatLoss";

  /**
   * String that can be displayed to the user if their log goal is fat loss.
   */
  DISPLAY_GOAL_FAT_LOSS: string = "Fat Loss";

  /**
   * Wrapper around actual value and display name of log goal when set to fat loss.
   */
  FORM_CONTROL_FAT_LOSS: FormControlPair = new FormControlPair(this.GOAL_FAT_LOSS, this.DISPLAY_GOAL_FAT_LOSS);

  /**
   * Key used to refer to the log goal of muscle gain.
   */
  GOAL_MUSCLE_GAIN: string = "muscleGain";

  /**
   * String that can be displayed to the user if their log goal is muscle gain.
   */
  DISPLAY_GOAL_MUSCLE_GAIN: string = "Muscle Gain";

  /**
   * Wrapper around actual value and display name of log goal when set to muscle gain.
   */
  FORM_CONTROL_MUSCLE_GAIN: FormControlPair = new FormControlPair(this.GOAL_MUSCLE_GAIN, this.DISPLAY_GOAL_MUSCLE_GAIN);

  /**
 * Key used to refer to the log goal of maintaining weight.
 */
  GOAL_MAINTAIN: string = "maintain";

  /**
   * String that can be displayed to the user if their log goal is to maintain weight.
   */
  DISPLAY_GOAL_MAINTAIN_WEIGHT: string = "Maintain Weight";

  /**
   * Wrapper around actual value and display name of log goal when set to muscle gain.
   */
  FORM_CONTROL_MAINTAIN: FormControlPair = new FormControlPair(this.GOAL_MAINTAIN, this.DISPLAY_GOAL_MAINTAIN_WEIGHT);

  /**
   * @ignore
   */
  constructor() { }

  /**
   * Returns a string that can be displayed in the UI to reprresent the user's log goal.
   * If logGoal is not a valid goal then the string representation of insufficient data 
   * is returned.
   * 
   * @param logGoal the actual value of the goal to get the display name of.
   */
  getDisplayForGoal(logGoal: string): string {
    let displayGoal: string = this.INSUFFICIENT_DATA_STRING;
    if (logGoal == this.GOAL_FAT_LOSS) {
      displayGoal = this.DISPLAY_GOAL_FAT_LOSS;
    }
    else if (logGoal == this.GOAL_MAINTAIN) {
      displayGoal = this.DISPLAY_GOAL_MAINTAIN_WEIGHT;
    }
    else if (logGoal == this.GOAL_MUSCLE_GAIN) {
      displayGoal = this.DISPLAY_GOAL_MUSCLE_GAIN;
    }
    return displayGoal;
  }

  /**
  * Returns a list of FormControlPair objects for the valid log goals.
  */
  getLogGoalFormControls(): FormControlPair[] {
    const numberSystemControls: FormControlPair[] = [
      this.FORM_CONTROL_FAT_LOSS,
      this.FORM_CONTROL_MUSCLE_GAIN,
      this.FORM_CONTROL_MAINTAIN
    ];
    return numberSystemControls;
  }
}
