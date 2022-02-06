import { Injectable } from '@angular/core';
import { FormControlPair } from 'src/app/model-classes/general/form-control-pair';
import { EnvironmentService } from './environment.service';

/**
 * Handles all operations related to default preferences. Maintains wrapper functions around 
 * preferences in case they change in the future to isolate logic around the preferences JSON.
 * Currently supports general and nutrition preferences. This service does not deal with the sate of 
 * the current user. That logic is in the StateManager service and if the the current authenticated 
 * user's preferences are needed, that service should be used instead.
 * 
 * Last edited by: Ryan Lefebvre 6/24/2020
 */
@Injectable({
  providedIn: 'root'
})
export class PreferenceService {

  /**
   * Key used for general preference category inside the user preferences JSON.
   */
  GENERAL_PREFS: string = "general";

  /**
   * Key used for theme color preference inside the general preferences JSON.
   */
  THEME_COLOR: string = "currentTheme";

  /**
   * Key used for theme color preference value when set to turqouise.
   */
  COLOR_TURQOUSIE: string = "#43dbbd";

  /**
  * Key used for darker version of theme color preference value when set to turqouise.
  */
  COLOR_DARK_TURQOUSIE: string = "#3B896D";

  /**
   * Key used for theme color preference display name when set to turqouise.
   */
  DISPLAY_NAME_COLOR_TURQOUSIE: string = "Turquoise";

  /**
   * Wrapper around actual value and display name of turqousie preference.
   */
  FORM_CONTROL_PAIR_TURQOUISE: FormControlPair = new FormControlPair(this.COLOR_TURQOUSIE, this.DISPLAY_NAME_COLOR_TURQOUSIE);

  /**
  * Key used for theme color preference value when set to orange.
  */
  COLOR_ORANGE: string = "#f59f00";

  /**
  * Key used for darker version of theme color preference value when set to orange.
  */
  COLOR_DARK_ORANGE: string = "#c27b2b";

  /**
   * Key used for theme color preference display name when set to orange.
   */
  DISPLAY_NAME_COLOR_ORANGE: string = "Orange";

  /**
   * Wrapper around actual value and display name of orange preference.
   */
  FORM_CONTROL_PAIR_ORANGE: FormControlPair = new FormControlPair(this.COLOR_ORANGE, this.DISPLAY_NAME_COLOR_ORANGE);

  /**
  * Key used for theme color preference value when set to pink.
  */
  COLOR_PINK: string = "#ff12ac";

  /**
  * Key used for darker version of theme color preference value when set to pink.
  */
  COLOR_DARK_PINK: string = "#c73a95";

  /**
   * Key used for theme color preference display name when set to pink.
   */
  DISPLAY_NAME_COLOR_PINK: string = "Pink";

  /**
   * Wrapper around actual value and display name of pink preference.
   */
  FORM_CONTROL_PAIR_PINK: FormControlPair = new FormControlPair(this.COLOR_PINK, this.DISPLAY_NAME_COLOR_PINK);

  /**
  * Key used for theme color preference value when set to yellow.
  */
  COLOR_GOLD: string = "#edd768";

  /**
  * Key used for darker version of theme color preference value when set to yellow.
  */
  COLOR_DARK_GOLD: string = "#ab9b49";

  /**
   * Key used for theme color preference display name when set to yellow.
   */
  DISPLAY_NAME_COLOR_GOLD: string = "Gold";

  /**
   * Wrapper around actual value and display name of yellow preference.
   */
  FORM_CONTROL_PAIR_GOLD: FormControlPair = new FormControlPair(this.COLOR_GOLD, this.DISPLAY_NAME_COLOR_GOLD);

  /**
  * Key used for theme color preference value when set to yellow.
  */
  COLOR_PURPLE: string = "#9900ff";

  /**
  * Key used for darker version of theme color preference value when set to yellow.
  */
  COLOR_DARK_PURPLE: string = "#3f0069";

  /**
   * Key used for theme color preference display name when set to yellow.
   */
  DISPLAY_NAME_COLOR_PURPLE: string = "Purple";

  /**
   * Wrapper around actual value and display name of yellow preference.
   */
  FORM_CONTROL_PAIR_PURPLE: FormControlPair = new FormControlPair(this.COLOR_PURPLE, this.DISPLAY_NAME_COLOR_PURPLE);

  /**
  * Key used for theme color preference value when set to blue.
  */
  COLOR_BLUE: string = "#34b4eb";

  /**
  * Key used for darker version of theme color preference value when set to blue.
  */
  COLOR_DARK_BLUE: string = "#196180";

  /**
   * Key used for theme color preference display name when set to blue.
   */
  DISPLAY_NAME_COLOR_BLUE: string = "Blue";

  /**
   * Wrapper around actual value and display name of blue preference.
   */
  FORM_CONTROL_PAIR_BLUE: FormControlPair = new FormControlPair(this.COLOR_BLUE, this.DISPLAY_NAME_COLOR_BLUE);

  /**
  * Key used for theme color preference value when set to grey.
  */
  COLOR_GREY: string = "#92a0a6";

  /**
  * Key used for darker version of theme color preference value when set to grey.
  */
  COLOR_DARK_GREY: string = "#535b5e";

  /**
   * Key used for theme color preference display name when set to grey.
   */
  DISPLAY_NAME_COLOR_GREY: string = "Grey";

  /**
   * Wrapper around actual value and display name of greypreference.
   */
  FORM_CONTROL_PAIR_GREY: FormControlPair = new FormControlPair(this.COLOR_GREY, this.DISPLAY_NAME_COLOR_GREY);

  /**
  * Key used for number system preference inside the general preferences JSON.
  */
  NUMBER_SYSTEM: string = "isImperial";

  /**
  * Key used for number system preference value when set to imperial.
  */
  NUMBER_SYSTEM_IMPERIAL: boolean = true;

  /**
   * Key used for number system preference display name when set to imperial.
   */
  DISPLAY_NAME_NUMBER_IMPERIAL: string = "Imperial";

  /**
   * Wrapper around actual value and display name of imperial preference.
   */
  FORM_CONTROL_PAIR_NUMBER_IMPERIAL: FormControlPair = new FormControlPair(this.NUMBER_SYSTEM_IMPERIAL, this.DISPLAY_NAME_NUMBER_IMPERIAL);

  /**
  * Key used for number system preference value when set to metric.
  */
  NUMBER_SYSTEM_METRIC: boolean = false;

  /**
   * Key used for number system preference display name when set to metric.
   */
  DISPLAY_NAME_NUMBER_METRIC: string = "Metric";

  /**
   * Wrapper around actual value and display name of metric preference.
   */
  FORM_CONTROL_PAIR_NUMBER_METRIC: FormControlPair = new FormControlPair(this.NUMBER_SYSTEM_METRIC, this.DISPLAY_NAME_NUMBER_METRIC);

  /**
   * Key used for email notifications preference inside the general preferences JSON.
   */
  EMAIL_NOTIFICATIONS: string = "emailNotifications";

  /**
  * Key used for email notification preference value when set to on.
  */
  EMAIL_NOTIFICATIONS_ON: boolean = true;

  /**
    * Key used for email notification display name when set to on.
    */
  DISPLAY_NAME_EMAIL_ON: string = "On";

  /**
  * Wrapper around actual value and display name of email notification preference when set to on.
  */
  FORM_CONTROL_PAIR_EMAIL_ON: FormControlPair = new FormControlPair(this.EMAIL_NOTIFICATIONS_ON, this.DISPLAY_NAME_EMAIL_ON);

  /**
  * Key used for email notification preference value when set to off.
  */
  EMAIL_NOTIFICATIONS_OFF: boolean = false;

  /**
    * Key used for email notification display name when set to off.
    */
  DISPLAY_NAME_EMAIL_OFF: string = "Off";

  /**
  * Wrapper around actual value and display name of email notification preference when set to off.
  */
  FORM_CONTROL_PAIR_EMAIL_OFF: FormControlPair = new FormControlPair(this.EMAIL_NOTIFICATIONS_OFF, this.DISPLAY_NAME_EMAIL_OFF);

  /**
   * Key used for nutrition preference category inside the user preferences JSON.
   */
  NUTR_PREFS: string = "nutrition";

  /**
   * Key used for sort mode inside the nutrition preferences JSON.
   */
  SORT_MODE: string = "sortMode"

  /**
  * Key used for sort mode preference value when set to day.
  */
  SORT_MODE_DAY: string = "day";

  /**
  * Key used for sort mode display name when set to day.
  */
  DISPLAY_NAME_SORT_MODE_DAY: string = "Day";

  /**
  * Wrapper around actual value and display name of sort mode preference when set to day.
  */
  FORM_CONTROL_PAIR_SORT_MODE_DAY: FormControlPair = new FormControlPair(this.SORT_MODE_DAY, this.DISPLAY_NAME_SORT_MODE_DAY);

  /**
  * Key used for sort mode preference value when set to week.
  */
  SORT_MODE_WEEK: string = "week";

  /**
  * Key used for sort mode isplay name when set to day.
  */
  DISPLAY_NAME_SORT_MODE_WEEK: string = "Week";

  /**
  * Wrapper around actual value and display name of sort mode preference when set to week.
  */
  FORM_CONTROL_PAIR_SORT_MODE_WEEK: FormControlPair = new FormControlPair(this.SORT_MODE_WEEK, this.DISPLAY_NAME_SORT_MODE_WEEK);

  /**
   * Key used for order mode inside the nutrition preferences JSON.
   */
  ORDER_MODE: string = "orderMode"

  /**
  * Key used for order mode preference value when set to descending.
  */
  ORDER_MODE_DESC: string = "descending";

  /**
  * Key used for order mode display name when set to descending.
  */
  DISPLAY_NAME_ORDER_MODE_DESC: string = "Descending";

  /**
  * Wrapper around actual value and display name of order mode preference when set to descending.
  */
  FORM_CONTROL_PAIR_ORDER_MODE_DESC: FormControlPair = new FormControlPair(this.ORDER_MODE_DESC, this.DISPLAY_NAME_ORDER_MODE_DESC);

  /**
  * Key used for order mode preference value when set to ascending.
  */
  ORDER_MODE_ASC: string = "ascending";

  /**
  * Key used for order mode display name when set to ascending.
  */
  DISPLAY_NAME_ORDER_MODE_ASC: string = "Ascending";

  /**
  * Wrapper around actual value and display name of order mode preference when set to ascending.
  */
  FORM_CONTROL_PAIR_ORDER_MODE_ASC: FormControlPair = new FormControlPair(this.ORDER_MODE_ASC, this.DISPLAY_NAME_ORDER_MODE_ASC);

  /**
   * Key used for graph mode inside the nutrition preferences JSON.
   */
  GRAPH_MODE: string = "graphMode";

  /**
  * Key used for graph mode preference value when set to line.
  */
  GRAPH_MODE_LINE: string = "line";

  /**
  * Key used for graph mode display name when set to line.
  */
  DISPLAY_NAME_GRAPH_MODE_LINE: string = "Line";

  /**
  * Wrapper around actual value and display name of graph mode preference when set to line.
  */
  FORM_CONTROL_PAIR_GRAPH_MODE_LINE: FormControlPair = new FormControlPair(this.GRAPH_MODE_LINE, this.DISPLAY_NAME_GRAPH_MODE_LINE);

  /**
  * Key used for graph mode preference value when set to scatter.
  */
  GRAPH_MODE_SCATTER: string = "scatter";

  /**
  * Key used for graph mode display name when set to scatter.
  */
  DISPLAY_NAME_GRAPH_MODE_SCATTER: string = "Scatter";

  /**
  * Wrapper around actual value and display name of graph mode preference when set to scatter..
  */
  FORM_CONTROL_PAIR_GRAPH_MODE_SCATTER: FormControlPair = new FormControlPair(this.GRAPH_MODE_SCATTER, this.DISPLAY_NAME_GRAPH_MODE_SCATTER);

  /**
   * Key used for surplus preference inside the nutrition preferences JSON.
   */
  SURPLUS: string = "surplus";

  /**
  * Key used for surplus preference value when set to conservative (100-250 kcal).
  */
  SURPLUS_CONSERVATIVE: string = "conservative";

  /**
   * Key used for surplus mode when set to conservative.
   */
  DISPLAY_NAME_SURPLUS_CONSERVATIVE: string = "Conservative";

  /**
  * Wrapper around actual value and display name of surplus preference when set to conservative.
  */
  FORM_CONTROL_SURPLUS_CONSERVATIVE: FormControlPair = new FormControlPair(this.SURPLUS_CONSERVATIVE, this.DISPLAY_NAME_SURPLUS_CONSERVATIVE);

  /**
  * Key used for surplus preference value when set to moderate (250-500 kcal).
  */
  SURPLUS_MODERATE: string = "moderate";

  /**
  * Key used for surplus mode when set to moderate.
  */
  DISPLAY_NAME_SURPLUS_MODERATE: string = "Moderate";

  /**
  * Wrapper around actual value and display name of surplus preference when set to moderate.
  */
  FORM_CONTROL_SURPLUS_MODERATE: FormControlPair = new FormControlPair(this.SURPLUS_MODERATE, this.DISPLAY_NAME_SURPLUS_MODERATE);

  /**
  * Key used for surplus preference value when set to aggressive (500-750 kcal).
  */
  SURPLUS_AGGRESSIVE: string = "aggressive";

  /**
  * Key used for surplus mode when set to aggressive.
  */
  DISPLAY_NAME_SURPLUS_AGGRESIVE: string = "Aggressive";

  /**
  * Wrapper around actual value and display name of surplus preference when set to aggressive.
  */
  FORM_CONTROL_SURPLUS_AGGRESSIVE: FormControlPair = new FormControlPair(this.SURPLUS_AGGRESSIVE, this.DISPLAY_NAME_SURPLUS_AGGRESIVE);

  /**
   * Key used for deficit preference inside the nutrition preferences JSON.
   */
  DEFICIT: string = "deficit";

  /**
  * Key used for deficit preference value when set to conservative (200-300 kcal).
  */
  DEFICIT_CONSERVATIVE: string = "conservative";

  /**
   * Key used for deficit mode when set to conservative.
   */
  DISPLAY_NAME_DEFICIT_CONSERVATIVE: string = "Conservative";

  /**
  * Wrapper around actual value and display name of deficit preference when set to aggressive.
  */
  FORM_CONTROL_DEFICIT_CONSERVATIVE: FormControlPair = new FormControlPair(this.DEFICIT_CONSERVATIVE, this.DISPLAY_NAME_DEFICIT_CONSERVATIVE);

  /**
  * Key used for deficit preference value when set to moderate (300-500 kcal).
  */
  DEFICIT_MODERATE: string = "moderate";

  /**
    * Key used for deficit mode when set to moderate.
    */
  DISPLAY_NAME_DEFICIT_MODERATE: string = "Moderate";

  /**
  * Wrapper around actual value and display name of deficit preference when set to aggressive.
  */
  FORM_CONTROL_DEFICIT_MODERATE: FormControlPair = new FormControlPair(this.DEFICIT_MODERATE, this.DISPLAY_NAME_DEFICIT_MODERATE);

  /**
  * Key used for deficit preference value when set to aggressive (500-750 kcal).
  */
  DEFICIT_AGGRESSIVE: string = "aggressive";

  /**
    * Key used for deficit mode when set to aggressive.
    */
  DISPLAY_NAME_DEFICIT_AGGRESSIVE: string = "Aggressive";

  /**
  * Wrapper around actual value and display name of deficit preference when set to aggressive.
  */
  FORM_CONTROL_DEFICIT_AGGRESSIVE: FormControlPair = new FormControlPair(this.DEFICIT_AGGRESSIVE, this.DISPLAY_NAME_DEFICIT_AGGRESSIVE);

  /**
  * Key used for deficit preference value when set to very aggressive (750-1000 kcal).
  */
  DEFICIT_VERY_AGGRESSIVE: string = "veryAggressive";

  /**
    * Key used for deficit mode when set to very aggressive.
    */
  DISPLAY_NAME_DEFICIT_VERY_AGGRESSIVE: string = "Very Aggressive";

  /**
  * Wrapper around actual value and display name of deficit preference when set to very aggressive.
  */
  FORM_CONTROL_DEFICIT_VERY_AGGRESSIVE: FormControlPair = new FormControlPair(this.DEFICIT_VERY_AGGRESSIVE, this.DISPLAY_NAME_DEFICIT_VERY_AGGRESSIVE);

  /**
   * Units used for weight when the number system is metric.
   */
  WEIGHT_UNITS_METRIC: string = "kg";

  /**
   * Units used for weight when the number system is imperial.
   */
  WEIGHT_UNITS_IMPERIAL: string = "lb";

  /**
   * @ignore
   */
  public constructor(public environmentService:EnvironmentService) { }

  /**
   * Returns a JSON that is complete with default values for 
   * the user's preferences. User preferences are contained in catgeories 
   * The categories are represented by key value pairs in the outer JSON. 
   * the value for the categories in the outer JSON is a nested JSON that 
   * contain key value pairs that represent the user's preferences. 
   * 
   * There are currently two categories of preferences, general preferences and
   * nutrition preferences. General preferences include the number system, current theme
   * and whether or not to send email notifications. Nutrition preferences include 
   * sort mode of log entries, order mode of log entries, what type of graph is displayed
   * on the in depth log page, size of the users surplus and size of the user's deficit. 
   * 
   * Last edited by: Ryan Lefebvre 6/24/2020
   */
  getDefaultPreferences(): {} {
    return {
      [this.GENERAL_PREFS]: {
        [this.NUMBER_SYSTEM]: this.NUMBER_SYSTEM_IMPERIAL,
        [this.THEME_COLOR]: this.COLOR_TURQOUSIE,
        [this.EMAIL_NOTIFICATIONS]: this.EMAIL_NOTIFICATIONS_ON
      },
      [this.NUTR_PREFS]: {
        [this.SORT_MODE]: this.SORT_MODE_DAY,
        [this.ORDER_MODE]: this.ORDER_MODE_DESC,
        [this.GRAPH_MODE]: this.GRAPH_MODE_LINE,
        [this.SURPLUS]: this.SURPLUS_MODERATE,
        [this.DEFICIT]: this.DEFICIT_MODERATE
      }
    }
  }

  /**
   * Returns true if the number system is considered a valid number system. False otherwise.
   * 
   * @param potentialNumberSystem number system preference to be checked for validity.
   */
  isValidNumberSystem(potentialNumberSystem: boolean): boolean {
    return this.getValidNumberSystems().includes(potentialNumberSystem);
  }

  /**
   * Returns an array that contains all valid options for number system preferences.
   * 
   */
  getValidNumberSystems(): boolean[] {
    const validNumberSystems: boolean[] = [
      this.NUMBER_SYSTEM_IMPERIAL,
      this.NUMBER_SYSTEM_METRIC];
    return validNumberSystems;
  }

  /**
   * Returns a list of FormControlPair objects for the valid number systems.
   */
  getNumberSystemFormControls(): FormControlPair[] {
    const numberSystemControls: FormControlPair[] = [
      this.FORM_CONTROL_PAIR_NUMBER_IMPERIAL,
      this.FORM_CONTROL_PAIR_NUMBER_METRIC
    ];
    return numberSystemControls;
  }

  /**
   * Returns true if the theme color is considered a valid theme color. False otherwise.
   * 
   * @param potentialThemeColor theme color to be checked for validity.
   */
  isValidThemeColor(potentialThemeColor: string): boolean {
    return this.getValidThemeColors().includes(potentialThemeColor);
  }

  /**
   * Returns an array that contains all valid options for theme color preferences.
   */
  getValidThemeColors(): string[] {
    const validThemeColors: string[] = [
      this.COLOR_TURQOUSIE,
      this.COLOR_ORANGE,
      this.COLOR_PINK,
      this.COLOR_GOLD,
      this.COLOR_BLUE,
      this.COLOR_PURPLE,
      this.COLOR_GREY];
    return validThemeColors;
  }

  /**
   * Returns a list of FormControlPair objects for the valid theme colors.
   */
  getThemeColorFormControls(isGold?: boolean): FormControlPair[] {
    let themeColorControls: FormControlPair[]
    if(this.environmentService.isMobile){
      themeColorControls = [this.FORM_CONTROL_PAIR_TURQOUISE, this.FORM_CONTROL_PAIR_BLUE];
    }
    else{themeColorControls = [
        this.FORM_CONTROL_PAIR_TURQOUISE,
        this.FORM_CONTROL_PAIR_ORANGE,
        this.FORM_CONTROL_PAIR_PINK,
        this.FORM_CONTROL_PAIR_BLUE,
        this.FORM_CONTROL_PAIR_GREY,
        this.FORM_CONTROL_PAIR_PURPLE
      ];
    }
    if (isGold) {
      themeColorControls.push(this.FORM_CONTROL_PAIR_GOLD);
    }
    return themeColorControls;
  }

  /**
   * Returns true if the email status is considered a valid email status. False otherwise.
   * 
   * @param potentialEmailStatus email status to be checked for validity.
   */
  isValidEmailStatusPreference(potentialEmailStatus: boolean): boolean {
    return this.getValidEmailNotificationStatus().includes(potentialEmailStatus);
  }

  /**
   * Returns an array that contains all valid options for email status preferences.
   */
  getValidEmailNotificationStatus(): boolean[] {
    const validEmailNotifications: boolean[] = [
      this.EMAIL_NOTIFICATIONS_ON,
      this.EMAIL_NOTIFICATIONS_OFF];
    return validEmailNotifications;
  }

  /**
   * Returns a list of FormControlPair objects for the valid email status's.
   */
  getEmailStatusFormControls(): FormControlPair[] {
    const emailStatusControls: FormControlPair[] = [
      this.FORM_CONTROL_PAIR_EMAIL_ON,
      this.FORM_CONTROL_PAIR_EMAIL_OFF
    ];
    return emailStatusControls;
  }

  /**
   * Returns true if the sort mode is considered a valid sort mode. False otherwise.
   * 
   * @param potentialSortMode sort mode to be checked for validity.
   */
  isValidSortModePreference(potentialSortMode: string): boolean {
    return this.getValidSortModes().includes(potentialSortMode);
  }

  /**
   * Returns an array that contains all valid options for day entry sort mode preferences.
   * 
   */
  getValidSortModes(): string[] {
    const validSortModes: string[] = [
      this.SORT_MODE_DAY,
      this.SORT_MODE_WEEK];
    return validSortModes;
  }

  /**
   * Returns a list of FormControlPair objects for the valid sort modes.
   */
  getSortModeFormControls(): FormControlPair[] {
    const emailStatusControls: FormControlPair[] = [
      this.FORM_CONTROL_PAIR_SORT_MODE_DAY,
      this.FORM_CONTROL_PAIR_SORT_MODE_WEEK
    ];
    return emailStatusControls;
  }

  /**
 * Returns true if the order mode is considered a valid order mode. False otherwise.
 * 
 * @param potentialOrderMode order mode to be checked for validity.
 */
  isValidOrderModePreference(potentialOrderMode: string): boolean {
    return this.getValidOrderModes().includes(potentialOrderMode);
  }

  /**
   * Returns an array that contains all valid options for day entry order mode preferences.
   * 
   */
  getValidOrderModes(): string[] {
    const validOrderModes: string[] = [
      this.ORDER_MODE_ASC,
      this.ORDER_MODE_DESC];
    return validOrderModes;
  }

  /**
  * Returns a list of FormControlPair objects for the valid order modes.
  */
  getOrderModeFormControls(): FormControlPair[] {
    const orderModeFormControls: FormControlPair[] = [
      this.FORM_CONTROL_PAIR_ORDER_MODE_DESC,
      this.FORM_CONTROL_PAIR_ORDER_MODE_ASC
    ];
    return orderModeFormControls;
  }


  /**
   * Returns true if the graph mode is considered a valid graph mode. False otherwise.
   * 
   * @param potentialGraphMode graph to be checked for validity.
   */
  isValidGraphModePreference(potentialGraphMode: string): boolean {
    return this.getValidGraphModes().includes(potentialGraphMode);
  }

  /**
   * Returns an array that contains all valid options for log in depth graph mode preferences.
   */
  getValidGraphModes(): string[] {
    const validGraphModes: string[] = [
      this.GRAPH_MODE_LINE,
      this.GRAPH_MODE_SCATTER];
    return validGraphModes;
  }

  /**
  * Returns a list of FormControlPair objects for the valid graph modes.
  */
  getGraphModeFormControls(): FormControlPair[] {
    const graphModeFormControls: FormControlPair[] = [
      this.FORM_CONTROL_PAIR_GRAPH_MODE_LINE,
      this.FORM_CONTROL_PAIR_GRAPH_MODE_SCATTER
    ];
    return graphModeFormControls;
  }

  /**
   * Returns true if the surplus is considered a valid surplus preference. False otherwise.
   * 
   * @param potentialSurplusPreference surplus to be checked for validity.
   */
  isValidSurplusPreference(potentialSurplusPreference: string): boolean {
    return this.getValidSurplusPreferences().includes(potentialSurplusPreference);
  }

  /**
   * Returns an array that contains all valid options for surplus mode preferences.
   */
  getValidSurplusPreferences(): string[] {
    const validSurplusModes: string[] = [
      this.SURPLUS_CONSERVATIVE,
      this.SURPLUS_MODERATE,
      this.SURPLUS_AGGRESSIVE];
    return validSurplusModes;
  }

  /**
  * Returns a list of FormControlPair objects for the valid surplus sizes.
  */
  getSurplusFormControls(): FormControlPair[] {
    const surplusSizeControls: FormControlPair[] = [
      this.FORM_CONTROL_SURPLUS_CONSERVATIVE,
      this.FORM_CONTROL_SURPLUS_MODERATE,
      this.FORM_CONTROL_SURPLUS_AGGRESSIVE,
    ];
    return surplusSizeControls;
  }

  /**
   * Returns true if the deficit is considered a valid deficit preference. False otherwise.
   * 
   * @param potentialDeficitPreference deficit to be checked for validity.
   */
  isValidDeficitPreference(potentialDeficitPreference: string): boolean {
    return this.getValidDeficitPreferences().includes(potentialDeficitPreference);
  }

  /**
   * Returns an array that contains all valid options for deficit mode preferences.
   */
  getValidDeficitPreferences(): string[] {
    const validDeficitPreferences: string[] = [
      this.DEFICIT_CONSERVATIVE,
      this.DEFICIT_MODERATE,
      this.DEFICIT_AGGRESSIVE,
      this.DEFICIT_VERY_AGGRESSIVE
    ];
    return validDeficitPreferences;
  }

  /**
  * Returns a list of FormControlPair objects for the valid deficit sizes.
  */
  getDeficitFormControls(): FormControlPair[] {
    const deficitSizeControls: FormControlPair[] = [
      this.FORM_CONTROL_DEFICIT_CONSERVATIVE,
      this.FORM_CONTROL_DEFICIT_MODERATE,
      this.FORM_CONTROL_DEFICIT_AGGRESSIVE,
      this.FORM_CONTROL_DEFICIT_VERY_AGGRESSIVE,
    ];
    return deficitSizeControls;
  }

  /**
   * Returns the correct units for weight as a string based on the number system passed 
   * in as a paramter. If an invalid number system is passed in, i.e. a value
   * that is not imperial or metric, then an empty string is returned.
   * 
   * @param numberSystem number system that correct units are being requested for.
   */
  getWeightUnits(numberSystem: boolean): string {
    if (numberSystem == this.NUMBER_SYSTEM_METRIC) {
      return this.WEIGHT_UNITS_METRIC;
    }
    else if (numberSystem == this.NUMBER_SYSTEM_IMPERIAL) {
      return this.WEIGHT_UNITS_IMPERIAL;
    }
    else {
      const noUnits: string = "";
      return noUnits;
    }
  }

  /**
   * Helper function for getting the darker version of the 
   * user's preferred theme. Each theme color option is associated
   * with a darker version of the color that is used for hovering over 
   * buttons or text. If this function is passed a valid theme color, then
   * it's associated darker version will be returned. If an invalid theme
   * color is passed in, then the invalid color is just returned.
   * 
   * @param themeColor hex value of color to get darker version of.
   */
  getDarkerTheme(themeColor: string): string {
    if (themeColor == this.COLOR_TURQOUSIE) {
      return this.COLOR_DARK_TURQOUSIE;
    }
    if (themeColor == this.COLOR_ORANGE) {
      return this.COLOR_DARK_ORANGE;
    }
    if (themeColor == this.COLOR_PINK) {
      return this.COLOR_DARK_PINK;
    }
    if (themeColor == this.COLOR_GOLD) {
      return this.COLOR_DARK_GOLD;
    }
    if (themeColor == this.COLOR_BLUE) {
      return this.COLOR_DARK_BLUE;
    }
    if (themeColor == this.COLOR_GREY) {
      return this.COLOR_DARK_GREY;
    }
    if (themeColor == this.COLOR_PURPLE) {
      return this.COLOR_DARK_PURPLE;
    }
    else {
      return themeColor;
    }
  }

}

