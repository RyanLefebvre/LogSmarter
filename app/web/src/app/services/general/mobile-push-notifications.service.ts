import { Injectable } from '@angular/core';

/**
 * This service is used for all functionality related to mobile push notifications. 
 * It is a wrapper around the following cordova plugin:
 *    https://github.com/katzer/cordova-plugin-local-notifications
 * 
 * This service will break on web and none of the push function logic should
 * be exposed to web users. All memory of scheduled push notifications are
 * stored in the memory of the device. This meant that no updates to the 
 * user profile were necessary to implement this service and that configurations
 * will not persist across platforms.
 * 
 * Last edited by: Ryan Lefebvre 1/23/2021
 */
@Injectable({
  providedIn: 'root'
})
export class MobilePushNotificationsService {

  /**
   * Wrapper around the local notifications object
   * to avoid lots of typescript errors in this service.
   * */
  PUSH_NOTIFICATION: any = null;

  /**
   * @ignore
   */
  constructor() { }

  /**
   * This function is called by the setUpForMobile function and waits 
   * for the device ready event to fire. Once that event fires, cordova
   * plugins will be available and the PUSH_NOTIFICATIONS global object
   * is assigned to the cordova plugin for managing the push notifications.
   */
  setUpPushManager() {
    const context: MobilePushNotificationsService = this;
    document.addEventListener('deviceready', () => {
      context.PUSH_NOTIFICATION = context.getCordovaPushPlugin();
    });
  }

  /**
   * Returns the push store plugin in a format that is
   * easier to mock when unit testing and to ignore the fact
   * that the cordova object will not exist on web
   */
  getCordovaPushPlugin(): any {
    // @ts-ignore 
    return cordova.plugins.notification.local;
  }

  /**
   * Returns true if the user has granted permissions for the 
   * app to schedule recurring push notifications. False otherwise.
   * Will know if the user has changed their preferences in the system
   * settings.
   */
  async hasPermissions(): Promise<boolean> {
    let doesHavePermission: boolean = false;
    const thisServiceWasSetupCorrectly: boolean = (this.PUSH_NOTIFICATION != null);
    if (thisServiceWasSetupCorrectly) {
      const permissionsPromise = new Promise<boolean>(async (resolve, reject) => {
        const listenForPermissions = async (hasIosPermissions) => { resolve(hasIosPermissions); }
        await (this.PUSH_NOTIFICATION.hasPermission(listenForPermissions));
      });
      doesHavePermission = await permissionsPromise;
    }
    return doesHavePermission;
  }

  /**
   * Makes a request using the native ios dialog for allowing push notifications in our app.
   * If the dialog has already been shown once, then it will not be shown again. This means 
   * that the function will behave exactly the same as the hasPermissions function in this
   * service after its first call from the point when the app is installed.
   */
  async requestPermissions(): Promise<boolean> {
    let wasGrantedPermissions: boolean = false;
    const thisServiceWasSetupCorrectly: boolean = (this.PUSH_NOTIFICATION != null);
    if (thisServiceWasSetupCorrectly) {
      const permissionsPromise = new Promise<boolean>(async (resolve, reject) => {
        const listenForPermissions = async (hasIosPermissions) => { resolve(hasIosPermissions); }
        await (this.PUSH_NOTIFICATION.requestPermission(listenForPermissions));
      });
      wasGrantedPermissions = await permissionsPromise;
    }
    return wasGrantedPermissions;
  }

  /**
  * Gets all of the scheduled notifications created with this plugin.
 */
  async getScheduledNotificiations(): Promise<any> {
    let notifications: any[] = [];
    const thisServiceWasSetupCorrectly: boolean = (this.PUSH_NOTIFICATION != null);
    if (thisServiceWasSetupCorrectly) {
      const notificationsPromise = new Promise<any>(async (resolve, reject) => {
        const listenForPermissions = async (notificationList) => { resolve(notificationList); }
        await (this.PUSH_NOTIFICATION.getScheduled(listenForPermissions));
      });
      notifications = await notificationsPromise;
    }
    return notifications;
  }

  /**
   * Function for clearing all reminders with matching IDs. Given an array of 
   * IDs, all task with ID's that are included in the array passed in will be canceled.
   * 
   * @param reminderIDs A list of IDs of the reminders that should be cancelled.
   */
  async clearReminders(reminderIDs: any[]): Promise<void> {
    let schedulePromise = new Promise<void>((resolve, reject) => {
      const avoidPassingListOfEmptyReminderIDs: boolean = (reminderIDs.length > 0);
      if (avoidPassingListOfEmptyReminderIDs) {
        this.PUSH_NOTIFICATION.cancel(reminderIDs, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
    return await schedulePromise;
  }

  /**
  * Given a list of reminders, created using the createReminder function, this
  * function will shcedule those reminders to appear as push notifications in
  * the future.
  * 
  * @param reminders list of reminders to schedule.
  */
  async scheduleReminders(reminders: any[]): Promise<void> {
    let schedulePromise = new Promise<void>((resolve, reject) => {
      const avoidPassingListOfEmptyReminders: boolean = (reminders.length > 0);
      if (avoidPassingListOfEmptyReminders) {
        this.PUSH_NOTIFICATION.schedule(reminders, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
    return await schedulePromise;

  }

  /**
   * Creates the definition of a reminder object that can be passed into the 
   * cordova plugins schedule function to create recurring functions at specific
   * times and intervals. Hours/minutes are millitary time, so to specify a PM time,
   * the hous field must be > 12.
   * 
   * @param id              ID for the notification, used to retrieve this notification from storage.
   * @param title           Title of the push notification that appears in the top left.
   * @param message         Message contained in the body of the push notification, under the title.
   * @param hourOfRepeat    Hour of when the push noptification will be sent.
   * @param minutesOfRepeat Minutes of the time when the push notification will be sent.
   */
  createReminder(id: number, title: string, message: string, hourOfRepeat?: string, minutesOfRepeat?: string): any {
    return {
      id: id,
      title: title,
      text: message,
      trigger: {
        every: {
          hour: hourOfRepeat,
          minute: minutesOfRepeat
        }
      }
    }
  }

}
