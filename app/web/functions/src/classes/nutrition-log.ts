import { DayEntry } from './day-entry';

/**
 * Represents a period of time that contains day entries.
 * 
 * Last edited by: Ryan Lefebvre 9/11/2020 
 */
export class NutritionLog {

    /**
     * Title of the log. Must be a valid string with less than or 
     * equal to 25 characters.
     */
    public title: string;

    /**
     * List of day entries that the log contains. Restrictions on 
     * length of the day entry list are enforced by tier permissions.
     * If the list of entries has a length of 0, the log is considered
     * empty.
     */
    public dayEntries: DayEntry[] = [];

    /**
     * Unique id set when the log is created. This value must be 
     * unique between logs for a given user, but does not need to be
     * unqiue between users. If unknown, defaults to todays date and time.
     */
    public id: number = (new Date()).getTime();

    /**
     * Timestamp that is updated for specific log and entry crud 
     * operations. This lets user's sort their logs by recency.
     * 
     * This variable will be set to a new timestamp when a logs
     * title is edited, an entry is added or deleted and if the 
     * log is set as the main log. 
     */
    public lastEdit: number = (new Date()).getTime();

    /**
     * A log can have on of three goals. Fat loss, muscle gain or 
     * to maintain weight. The value of this variable is null intially 
     * but must be set to one of the 3 goals when the log is created.
     * 
     * After the log is created, this variable is read only. This prevents
     * situations where user's do not realize that they should not start 
     * a new log for their new nutritional phases.
     */
    public goal: string = null;

    /**
     * This is the baseline estimat TDEE of the user when they created this log. This prevents a situation where
     * our best estimate of the user's TDEE has changed significantly and the user goes back to view
     * a log with old data. If their current TDEE were applied to their new data, then it would be a 
     * much different estimate than it was at the time they created the log.
     */
    public startTDEE: number = null;

    /**
     * Iterates through the log's list of day entries and returns the 
     * entry that has a date equal to the passed in parameter. If no 
     * entry exists with the same date, then null is returned.
     * 
     * @param date date of the etnry to be returned.
     */
    getEntryAtDate(date: Date): DayEntry {
        let entryToReturn: DayEntry = null;
        this.dayEntries.forEach((entry: DayEntry) => {
            if (date.toDateString() == entry.date.toDateString()) {
                entryToReturn = entry;
            }
        });
        return entryToReturn;
    }

}