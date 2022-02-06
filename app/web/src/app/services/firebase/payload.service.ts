import { Injectable } from '@angular/core';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { NutritionConstanstsService } from '../nutrition-log/nutrition-constansts.service';
import { CallableWrapperService } from './callable-wrapper.service';
import { StateManagerService } from '../general/state-manager.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { UserProfile } from 'functions/src/classes/user-profile';
import { DayEntry } from 'functions/src/classes/day-entry';
import { TimeService } from '../general/time-constant.service';
import { ObjectStorageService } from '../general/object-storage.service';

/**
 * This service is responsible for the algorithm  and feedback which is referred to as an energy payload because
 * it contains information related to the user's TDEE. It is expected that this service will only be used to 
 * make requests to get algoirthm results and an energy payload and that other services are responsible for any
 * logic related to parsing or operating on the payload.
 * 
 * Last edited by: Ryan Lefebvre 7/18/2020 
 */
@Injectable({
  providedIn: 'root'
})
export class PayloadService {

  /**
   * Name of firebase callable function for getting energy payload 
   */
  REQUEST_ENERGY_PAYLOAD: string = "requestEnergyPayload";

  /**
   * @ignore
   */
  constructor(
    public wrapper: CallableWrapperService,
    public stateManager: StateManagerService,
    public time: TimeService,
    public objectStorage: ObjectStorageService,
    public constants: NutritionConstanstsService) { }

  /**
  * Returns true if the latest entry in a nutrition log is incomplete. False otherwise.
  * Will return false if the log is empty.
  */
  latestEntryIsIncomplete(log: NutritionLog) {
    let latestEntry: DayEntry = this.getLatestEntry(log);
    if (!latestEntry) {
      return false;
    }
    else {
      return this.dayEntryIsIncomplete(latestEntry);
    }
  }

  /**
   * Returns the latest entry from a nutrition log. Null if one does not exist
   */
  getLatestEntry(log: NutritionLog): DayEntry {
    let latestEntry: DayEntry = null;
    if (log) {
      log.dayEntries.forEach((entry: DayEntry) => {
        if (!latestEntry) {
          latestEntry = entry;
        } else {
          if (entry.date.getTime() > latestEntry.date.getTime()) {
            latestEntry = entry;
          }
        }
      });
    }
    return latestEntry;
  }

  /**
   * Returns true if the day entry is incomplete false otherwise.
   */
  dayEntryIsIncomplete(dayEntry: DayEntry): boolean {
    const weightIsZero: boolean = (dayEntry.weight == 0);
    const hasNoWeight: boolean = (!dayEntry.weight && !weightIsZero);
    const kcalIsZero: boolean = (dayEntry.calories == 0);
    const hasNoKcal: boolean = (!dayEntry.calories && !kcalIsZero);
    return (hasNoWeight || hasNoKcal);
  }

  /**
   * Returns the results of running the LogSmarter TDEE estimation and Feedback algorithm 
   * on a user and their nutrition log. The returned value is expected to be a JSON that 
   * contains multiple pieces of feedback and stats for the user. If any error occurs, 
   * then the INSUFFICIENT_DATA constant is returned. 
   * 
   * @param nutritionLog Log to run algorithm on.
   */
  async getEnergyPayLoad(nutritionLog: NutritionLog): Promise<EnergyPayload> {
    const payLoadRequestBody = {
      log: nutritionLog,
      user: this.stateManager.getCurrentUser()
    };
    const HIDE_OFFLINE_ERROR: boolean = true;
    return await this.wrapper.firebaseCloudFunction(this.REQUEST_ENERGY_PAYLOAD, payLoadRequestBody, HIDE_OFFLINE_ERROR);
  }


}
