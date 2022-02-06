import { Injectable } from '@angular/core';

/**
 * This service is used for any basic operations involving time like getting the 
 * number of msec in a day or calculating the date that is one day after a date.
 * Eliminates the need to reimplement and remember this logic.
 * 
 * Last edited by: Ryan Lefebvre 7/06/2020
 */
@Injectable({
  providedIn: 'root'
})
export class TimeService {

  /**
   * @ignore
   */
  constructor() { }

  /**
   * Returns the current time in msec.
   */
  getTimeStamp(): number {
    return (new Date()).getTime();
  }

  /**
   * Returns a date object that is exactly one day after the passed in date.
   * 
   * @param day date to get one day later then.
   */
  getOneDayLater(day: Date): Date {
    return new Date(day.getTime() + this.getDayInMillis());
  }

  /**
   * Returns the number of msec in a day.
   */
  getDayInMillis(): number {
    return (24 * 60 * 60 * 1000);
  }

  /**
   * Returns the number of msec in a week.
   */
  getWeekInMillis(): number {
    return 7 * this.getDayInMillis();
  }

  /**
   * Returns the number of msec in a year.
   */
  getYearInMillis(): number {
    return 365 * this.getDayInMillis();
  }

  /**
   * Returns true if two dates are in the same day. 
   * False otherwise. This function should be the 
   * only function in the application used for 
   * date comparisons.
   */
  datesAreOnSameDay(date1: Date, date2: Date): boolean {
    const isSameDay: boolean = (date1.getDate() === date2.getDate()
      && date1.getMonth() === date2.getMonth()
      && date1.getFullYear() === date2.getFullYear())
    return isSameDay;
  }

}
