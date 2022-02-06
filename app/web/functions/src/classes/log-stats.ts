import * as energy from '../constants/energyConstants';

/**
 * This class is a wrapper around all the log statistics that need to be calculated 
 * to run the TDEE estimation and feedback algorithm. Helps to reduce repeat calculations.
 * 
 * Last edited by: Ryan Lefebvre 7/20/2020
 */
export class LogStats {

    /**
     * True if the log meets minimum day entry threshold. False otherwise.
     */
    meetsMDET: boolean = false;

    /**
     * Starting weight for the user's log. Calculated using constraints explained 
     * LogSmarter algorithm documentation.
     */
    startWeight: number = null;

    /**
    * Current weight for the user's log. Calculated using constraints explained 
    * LogSmarter algorithm documentation.
    */
    currentWeight: number = null;

    /**
     * Absolute value of the difference between start weight and current weight for the user's log.
     */
    weightDifferenceStartToCurrent: number = null;

    /**
     * Category of weight change for the user's log. Three potential categories, gained weight,
     * lost weight or maintained weight.
     */
    weightChangeCategory: string = energy.MAINTAINED_WEIGHT;

    /**
    * True if the user's over all weight change is considered optimal for their goal. For 
    * example, if the user's goal was to gain weight and they gained weight, then this variable 
    * would be true. False otherwise.
    */
    weightChangeOnTrackForGoal: boolean = false;

    /**
     * Average weekly change in lbs of weight for the user's log.
     */
    weeklyWeightChange: number = null;

    /**
     * Average weekly percent change relative to starting body weight for the user in lbs. 
     * Calculated as (weeklyWeightChange/StartWeight).
     */
    weeklyPercentChange: number = null;

    /**
     * Total change in body weight as a percentage of starting weight. Calculated as 
     * the absolute value of (starWeight - curentWeight) / startWeight.
     */
    totalPercentWeightChange: number = null;

    /**
     * Average calorie intake for the user's log. 
     */
    avgKcalIntake: number = null;

}

