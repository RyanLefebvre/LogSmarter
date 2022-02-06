import { Injectable } from '@angular/core';
import { FormControlPair } from 'src/app/model-classes/general/form-control-pair';

/**
 * Serves as a wrapper around constant values in the user profile.
 * This class has nothing to do with application state. Constants
 * exported from this class include activity level and gender.
 * 
 * Last edited by: Ryan Lefebvre 6/24/2020
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  /**
   * Key used to refer to user gender when male.
   */
  GENDER_MALE: boolean = true;

  /**
  * Name displayed for male gender option of form controls.
  */
  GENDER_MALE_DISPLAY_NAME: string = "Male";

  /**
   * Form control for female gender.
   */
  FORM_CONTROL_MALE: FormControlPair = new FormControlPair(this.GENDER_MALE, this.GENDER_MALE_DISPLAY_NAME);

  /**
   * Key used to refer to user gender when female.
   */
  GENDER_FEMALE: boolean = false;

  /**
   * Name displayed for female gender option of form controls.
   */
  GENDER_FEMALE_DISPLAY_NAME: string = "Female";

  /**
   * Form control for female gender.
   */
  FORM_CONTROL_FEMALE = new FormControlPair(this.GENDER_FEMALE,
    this.GENDER_FEMALE_DISPLAY_NAME);

  /**
   * Key used to refer to user activity level when sedentary.
   */
  ACTIVITY_LEVEL_SEDENTARY: string = "sedentary";

  /**
   * Name displayed for activity level sedentary option of form controls.
   */
  ACTIVITY_LEVEL_SEDENTARY_DISPLAY_NAME: string = "Sedentary";

  /**
   * Form control for sedentary activity level.
   */
  FORM_CONTROL_ACTIVITY_LEVEL_SEDENTARY: FormControlPair = new FormControlPair(this.ACTIVITY_LEVEL_SEDENTARY,
    this.ACTIVITY_LEVEL_SEDENTARY_DISPLAY_NAME);

  /**
  * Key used to refer to user activity level when lightly active.
  */
  ACTIVITY_LEVEL_LIGHTLY_ACTIVE: string = "lightlyActive";

  /**
   * Name displayed for activity level lightly active option of form controls.
   */
  ACTIVITY_LEVEL_LIGHTLY_ACTIVE_DISPLAY_NAME: string = "Lightly active";

  /**
   * Form control for lightly active activity level.
   */
  FORM_CONTROL_ACTIVITY_LEVEL_LIGHTLY_ACTIVE: FormControlPair = new FormControlPair(this.ACTIVITY_LEVEL_LIGHTLY_ACTIVE,
    this.ACTIVITY_LEVEL_LIGHTLY_ACTIVE_DISPLAY_NAME);

  /**
  * Key used to refer to user activity level when  active.
  */
  ACTIVITY_LEVEL_ACTIVE: string = "active";

  /**
   * Name displayed for activity level active option of form controls.
   */
  ACTIVITY_LEVEL_ACTIVE_DISPLAY_NAME: string = "Active";

  /**
   * Form control for active activity level.
   */
  FORM_CONTROL_ACTIVITY_LEVEL_ACTIVE: FormControlPair = new FormControlPair(this.ACTIVITY_LEVEL_ACTIVE,
    this.ACTIVITY_LEVEL_ACTIVE_DISPLAY_NAME);

  /**
  * Key used to refer to user activity level when very active.
  */
  ACTIVITY_LEVEL_VERY_ACTIVE: string = "veryActive";

  /**
   * Name displayed for activity level very active option of form controls.
   */
  ACTIVITY_LEVEL_VERY_ACTIVE_DISPLAY_NAME: string = "Very active";

  /**
   * Form control for very active activity level.
   */
  FORM_CONTROL_ACTIVITY_LEVEL_VERY_ACTIVE: FormControlPair = new FormControlPair(this.ACTIVITY_LEVEL_VERY_ACTIVE,
    this.ACTIVITY_LEVEL_VERY_ACTIVE_DISPLAY_NAME);

  /**
   * Returns a list of form controls that contains all valid genders.
   */
  getGenderFormControls(): FormControlPair[] {
    const genders: FormControlPair[] = [
      this.FORM_CONTROL_MALE,
      this.FORM_CONTROL_FEMALE
    ];
    return genders;
  }

  /**
   * Returns a list of form controls that contains all valid activity levels.
   */
  getActivtiyLevelFormControls(): FormControlPair[] {
    const activityLevels: FormControlPair[] = [
      this.FORM_CONTROL_ACTIVITY_LEVEL_SEDENTARY,
      this.FORM_CONTROL_ACTIVITY_LEVEL_LIGHTLY_ACTIVE,
      this.FORM_CONTROL_ACTIVITY_LEVEL_ACTIVE,
      this.FORM_CONTROL_ACTIVITY_LEVEL_VERY_ACTIVE
    ];
    return activityLevels;
  }

  /**
   * Returns the display name of an activity level given its camel case representation
   * @param activityLevel activityLevel
   */
  activityLevelDisplayName(activityLevel: string): string {
    switch (activityLevel) {
      case this.ACTIVITY_LEVEL_SEDENTARY:
        return this.ACTIVITY_LEVEL_SEDENTARY_DISPLAY_NAME;
      case this.ACTIVITY_LEVEL_LIGHTLY_ACTIVE:
        return this.ACTIVITY_LEVEL_LIGHTLY_ACTIVE_DISPLAY_NAME;
      case this.ACTIVITY_LEVEL_ACTIVE:
        return this.ACTIVITY_LEVEL_ACTIVE_DISPLAY_NAME;
      case this.ACTIVITY_LEVEL_VERY_ACTIVE:
        return this.ACTIVITY_LEVEL_VERY_ACTIVE_DISPLAY_NAME;
      default:
        return null;
    }
  }

  /**
   * @ignore
   */
  constructor() { }
}
