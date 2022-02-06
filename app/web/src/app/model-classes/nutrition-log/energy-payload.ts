import { FeedbackCategory } from "./feedback-category";

/**
 * Collection of statistics and feedback generated from the LogSmarter algorithm.
 * Statistics are calculated based on the nutrition log and user profile sent to 
 * firebase. This class is used to bundle all of the information together in one
 * request so it can all be sent to the client in one object.
 * 
 * Last edited by: Ryan Lefebvre 8/02/2020
 */
export class EnergyPayload {

    /**
     * Starting weight for the user's log calculated using constraints detailed in algorithm documentation.
     */
    startWeight: number = null;

    /**
     * Current weight for the user's log calculated using constraints detailed in algorithm documentation.
     */
    currentWeight: number = null;

    /**
     * Most current version of a user's baseline TDEE estimate.
     */
    estimatedTDEE: number = null;

    /**
     * Message that informs the user the rate at which they are gaining or losing weight per week.
     */
    gainLossRate: string = null;

    /**
     * Message that displays what user's goal intake range is.
     */
    goalIntakeRange: string = null;

    /**
     * Upper and lower boundary for a user's goal intake based on the user's selected log goal and nutrition
     * surplus and deficit preferences.
     */
    goalIntakeBoundaries: number[] = null;

    /**
     * Date of the first entry in the log this payload was calculated for
     */
    startDate: number = null;

    /**
     * Date of the last entry in the log that this payload was calculated for.
     */
    latestDate: number = null;

    /**
     * Minimum number of calories recorded in a day entry during the log.
     */
    minCalories: number = null;

    /**
     * Average number of calories recorded in a day entry during the log.
     */
    avgCalories: number = null;

    /**
     * Maximum number of calories recorded in a day entry during the log.
     */
    maxCalories: number = null;

    /**
     * Minimum weight recorded in a day entry during the log.
     */
    minWeight: number = null;

    /**
     * Average weight recorded in a day entry during the log.
     */
    avgWeight: number = null;

    /**
     * Maximum weight recorded in a day entry during the log.
     */
    maxWeight: number = null;

    /**
     * Contains a list of feedback categories that group the feedback returned from the analyses performed 
     * by the LogSmarter algorithm together based upon what they are analyzing.
     */
    analysis: FeedbackCategory[] = null;

}