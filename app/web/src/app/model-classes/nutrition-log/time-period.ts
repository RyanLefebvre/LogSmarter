import { DayEntry } from './day-entry';

/**
 * This class is essentially a watered down log. It is used when sorting entries by 
 * week/day or month to represent a collection of entries with a set start and end date.
 * Specifically used by the list-view component of the in depth log-display.
 * 
 * Last edited by: Ryan Lefebvre 6/26/2020
 */
export class TimePeriod {

    /**
     * List of day entries that the time period contains. Restrictions on 
     * length of the day entry list are enforced by time period length.
     * If the list of entries has a length of 0, the time period is considered
     * empty.
     */
    listOfEntries: DayEntry[] = [];

    /**
     * Start date of the time period. Null intiially but required 
     * to be a valid date by the list view grid.
     */
    startDate: Date = null;

    /**
     * Ending date of the time period. Null intiially but required 
     * to be a valid date by the list view grid.
     */
    endDate: Date = null;

}