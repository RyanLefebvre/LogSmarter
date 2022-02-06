import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FirebaseNutritionService } from './firebase-nutrition.service';
import { ObjectStorageService } from '../general/object-storage.service';
import { PayloadService } from './payload.service';
import { StateManagerService } from '../general/state-manager.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';

/**
 * Creating and maintaining a subscription to an observable for a user's 
 * nutrition log is complex because the nutrition log's summary and entries are
 * stored seperately. This service is responsible for creating an observable for a 
 * log that will emit a new Nutrition Log any time that the state of log changes. 
 * This means that a new value is emitted any time that the log's summary or entries 
 * are edited.
 * 
 * It is expected that the class using this service will kill the subscription after 
 * it is done using the service using the kill subscriptions function. If the subscription
 * is not killed, then the same observable used for the last subscription will begin emitting
 * state changes for a new log.
 * 
 * Last edited by: Ryan Lefebvre 7/04/2020
 */
@Injectable({
  providedIn: 'root'
})
export class LogSubscriptionCreatorService {

  /**
   * id of the log that this service is creating an observable for.
   */
  public logId: number = null;

  /**
   * This is the most up to date state of the log that this service is creating an observable for.
   */
  public nutrLog: NutritionLog = null;

  /**
   * Observable that will emit a tuple containing a nutrtion log and an energy payload any time the log
   * this service is set to create an observable for has its state changed. The payload of this
   * observable is a tuple with two properties, a nutrition log and the energy payload associated with
   * that nutrition log. The payload is essentially a big JSON full of stats for the log.
   */
  public logStateChangeHandler: BehaviorSubject<[NutritionLog, EnergyPayload]> = null;

  /**
   * Reference to a subscription for the log's summary that this class is creating an observable for.
   */
  private logSubRef: Subscription = null;

  /**
   * Reference to a subscription for the log's day entry list that this class is creating an observable for.
   */
  private entrySubRef: Subscription = null;

  /**
   * True if the initial request for the log's day entry list has been received. False otherwise.
   */
  public initialEntriesReceived: boolean = false;

  /**
  * True if the initial request for the log's summar has been received. False otherwise.
  */
  public initialSummaryReceived: boolean = false;

  /**
   * Index of the nutrition log in the tuple that is emitted from the log susbcription observable.
   */
  NUTR_LOG_IDX = 0;

  /**
   * Index of the energy payload in the tuple that is emitted from the log susbcription observable.
   */
  ENERGY_PAYLOAD_IDX = 1;

  /**
   * @ignore
   */
  constructor(
    public payload: PayloadService,
    public stateManager: StateManagerService,
    public fbNutr: FirebaseNutritionService,
    public objectManager: ObjectStorageService) {
  }

  /**
  * Kills all subscriptions needed to make this service function. Resets all relevant variables to their initial value.
  */
  killSubscriptions(): void {
    this.logId = null;
    this.initialEntriesReceived = false;
    this.initialSummaryReceived = false;
    this.nutrLog = null;
    if (this.entrySubRef) {
      this.entrySubRef.unsubscribe();
    }
    if (this.logSubRef) {
      this.logSubRef.unsubscribe();
    }
    this.logStateChangeHandler = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
  }

  /**
  * Sends updates about log state to other services and components 
  * if the initial request for log entries and summary have been 
  * completed successfully.
  */
  async updateLogStateIfComplete(): Promise<void> {
    if (this.initialEntriesReceived && this.initialSummaryReceived) {
      const energyPayload: EnergyPayload = await this.payload.getEnergyPayLoad(this.nutrLog);
      const nextLogStateChangeValue: [NutritionLog, EnergyPayload] = [this.nutrLog, energyPayload];
      this.logStateChangeHandler.next(nextLogStateChangeValue);
    }
  }

  /**
  * Creates or resets a reference to a subscription to any changes to a log's summary or entries.
  * 
  * A log's entry and its summary are stored separately in the database. This means 
  * they need to be retrieved asynchronously from each other. This function sets a 
  * subscription to a log's summary and entries that updates an observable with the
  * new state of that log any time the logs summary or entries are modified. 
  * 
  * First check if a new observable is needed. A new observable is needed if the logid or 
  * the uid has changed since the last time this function has called. If they have not, then
  * return the current observable.
  * 
  * Otherwise, set the global logid and uid to match the new parameters. Then 
  * make a request to get the logs summary. In the body of the subscription, if the log's summary
  * does not exist, create a new log with the same properties as the summary. Otherwise, edit the
  * existing log to match the new log summary properties. If this is the initial request for the
  * log summary, a flag is set to indicate the summary has been received. Any error or null value
  * during this process will result in the log being set back to null. If both the summary and entries
  * have been received the updates are pushed through the observable.
  * 
  * Another subscription is set for the logs entries. Similar to the summary, if the entries are null
  * or an error is thrown, the log will be set back to null. If this is the initial request for the
  * log entries, a flag is set to indicate the entries have been received. Any error or null value
  * during this process will result in the log being set back to null. If both the summary and entries
  * have been received the updates are pushed through the observable.
  * 
  * Lastly, the global observable is returned as a promise. This is specicially done once the entries 
  * and summary are both received to avoid a situation where one arrives before the other causing the 
  * log to have a false state.
  * 
  * @param logId id of the log for the current user to get a subscription to.
  */
  async setLogSubscription(logId: number): Promise<BehaviorSubject<[NutritionLog, EnergyPayload]>> {
    const context = this;
    const subIsNull: boolean = (this.logStateChangeHandler == null);
    const newParams: boolean = (this.logId != logId);
    const needNewSubscription: boolean = (subIsNull || newParams);

    if (needNewSubscription) {
      context.logId = logId;

      this.logStateChangeHandler = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);

      await new Promise<void>((resolve, _) => {
        context.logSubRef = context.fbNutr.getNutrLogSummarySubscription(context.logId)
          .subscribe(async (summary: NutritionLog) => {
            try {
              if (!context.nutrLog) {
                context.nutrLog = summary;
              } else {
                context.nutrLog.title = summary.title;
                context.nutrLog.id = summary.id;
                context.nutrLog.lastEdit = summary.lastEdit;
              }
              if (!context.initialSummaryReceived) {
                resolve();
                context.initialSummaryReceived = true;
              }
            } catch (error) {
              context.nutrLog = null;
              resolve();
            }
            await context.updateLogStateIfComplete();
          });
      });

      await new Promise<void>((resolve, _) => {
        context.entrySubRef = context.fbNutr.getNutrLogEntriesSubscription(context.logId)
          .subscribe(async (entries: DayEntry[]) => {
            try {
              if (context.nutrLog && entries.length > 0) {
                context.nutrLog.dayEntries = entries;
              }
              if (!this.initialEntriesReceived) {
                resolve();
                this.initialEntriesReceived = true;
              }
            }
            catch (error) {
              context.nutrLog = null;
              resolve();
            }
            await context.updateLogStateIfComplete();
          });
      });
    }
    return this.logStateChangeHandler;
  }

}
