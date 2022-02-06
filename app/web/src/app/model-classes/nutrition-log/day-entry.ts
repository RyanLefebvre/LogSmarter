
/**
 * Represents one day of user stored information
 * only required info is date to identify when the 
 * entry actually happened in the log.
 * 
 * Last edited by: Ryan Lefebvre 9/11/2020
 */
export class DayEntry {

    /**
     * Date the entry was created. Always defaults to todays date 
     * for new entry. If unknown, defaults to today's date.
     */
    date: Date = new Date();

    /**
     * Unique id for an entry. Entries across logs are not required to be unqiue 
     * but entries within logs are. An additional restriction on entries is that 
     * a log can only contain one entry per day. If unknown, defaults to today's date.
     */
    id: number = (new Date()).getTime();

    /**
     * The user's weight in pounds recorded on a given day. Same restrictions as 
     * the user's body weight. Must be positive and less than or equal to 999. If 
     * the weight is not reported, this variable is null.
     */
    weight: number = null;

    /**
     * The user's total calorie intake for a given day. Must be a number greater than or 
     * equal to 0 and less than or equal to 10,000. If calorie intake is not reported than
     * this variable is null.
     */
    calories: number = null;

    /**
     * The user's estimated TDEE when the day entry was created. Used to display what the goal 
     * intake was for a user on a given date. This field is slightly confusing because this 
     * value is not the TDEE for the log with this entry included. It is the TDEE of the log 
     * before this entry was included. This means when it is graphed, the entry before this entry 
     * should be aligned with this value for TDEE on the graph. If this entry is the latest 
     * entry then its TDEE is the TDEE in the energy payload. If this entry is not the latest 
     * entry then its TDEE is the TDEE of the entry located at parentLog.dayEntries[entry.idx+1];
     */
    creationEstimatedTDEE: number = null;

    /**
     * Tuple that contains the constants that need to be added to or subtracted from the user's 
     * creation estimated tdee to get their goal intake. Format is [lower value, higher value]
     */
    goalIntakeBoundaries: number[] = null;

}


