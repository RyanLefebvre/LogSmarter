import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { MobilePushNotificationsService } from 'src/app/services/general/mobile-push-notifications.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { ProfileControlService } from 'src/app/services/general/profile-control.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';

/**
 * This component creates a form that allows the user to set the time of 
 * automated reminders for logging calorie intake and body weight. It is 
 * only expected to be exposed on mobile, this is because it uses push
 * notifications and will not work on web. If the user has not given our
 * mobile app permissions to send push notifications, then the form will
 * reject any edit attempts and ask the user to go to the system settings.
 * 
 * Last edited by: Ryan Lefebvre 1/23/2021
 */
@Component({
  selector: 'app-mobile-reminder-config',
  templateUrl: './mobile-reminder-config.component.html',
  styleUrls: ['./mobile-reminder-config.component.css']
})
export class MobileReminderConfigComponent implements OnInit {

  /**
   * Group of form controls for the user's general preferences. 
   * These include, number system, theme and whether or not the 
   * user should receive email notifications. These are all 
   * catagorical variables with default values. This means that 
   * no validation needs to be done on the controls.
   */
  remindersForm: FormGroup = null;

  /**
   * Reference to a subscription to the observable that 
   * emits which form is currently being edited on the 
   * user profile page.
   */
  myCurrentlyBeingEditedSubscription: Subscription = null;

  /**
   * Reference to a subscription to the observable that 
   * emits which form is currently being edited on the 
   * user profile page.
   */
  myCurrentUserSubscription: Subscription = null;

  /**
   * True if the nutrition preferences form spinner should
   * be shown indicating that the form is submitting.
   */
  showSpinner: boolean = false;

  /**
   * Form control used to set up the user's weight reminders
   */
  WEIGHT_REMINDER_CONTROL: string = "weightReminder";

  /**
  * Title displayed in UI for weight reminders
  */
  WEIGHT_REMINDER_TITLE: string = "Time to log your weight!";

  /**
  * Message displayed in UI for weight reminders
  */
  WEIGHT_REMINDER_MESSAGE: string = "Try to weigh yourself at the same time each day under the same conditions.";

  /**
   * Form control used to set up the user's calories reminders
   */
  CALORIE_REMINDER_CONTROL: string = "calorieReminder";

  /**
  * Title displayed in UI for weight reminders
  */
  CALORIE_REMINDER_TITLE: string = "Time to log your calories!";

  /**
  * Message displayed in UI for weight reminders
  */
  CALORIE_REMINDER_MESSAGE: string = "For best results, eat within your goal intake range each day";

  /**
   * The ID passed to the push notification scheduler to get
   * notifications related to weigh ins.
   */
  WEIGHT_REMINDER_ID: number = 69420;

  /**
  * The ID passed to the push notification scheduler to get
  * notifications related to calorie intakes.
  */
  CALORIE_REMINDER_ID: number = 133780085;

  /**
   * @ignore
   */
  constructor
    (private fb: FormBuilder,
      public firebaseManager: FirebaseGeneralService,
      public prefs: PreferenceService,
      public stateManager: StateManagerService,
      public profileControl: ProfileControlService,
      public snackBar: SnackBarService,
      public pushNotifications: MobilePushNotificationsService,
      public dialog: DialogCreatorService,
      public cdr: ChangeDetectorRef) {
  }

  /**
   * @ignore
   */
  ngOnInit() {
    this.setFormsToCurrentuserState();
    this.currentUserSubscription();
    this.formBeingEditedSubscription();
  }

  /**
   * @ignore kill subscriptions.
   */
  ngOnDestroy(): void {
    this.myCurrentlyBeingEditedSubscription.unsubscribe();
  }

  /**
   * Resets the values of all form controls in all 
   * preference forms to the current values in the user's profile.
   */
  setFormsToCurrentuserState(): void {
    this.generateReminderForm();
  }

  /**
   * Handles logic for responding to state changes from the 
   * observable that emits which forms are being edited. 
   * Makes sure that every time a form is toggled in or out of 
   * edit mode that new forms are generated so that the controls
   * display the current user state.
   */
  formBeingEditedSubscription(): void {
    const context = this;
    this.myCurrentlyBeingEditedSubscription =
      this.profileControl.currentlyBeingEdited.subscribe(() => {
        context.setFormsToCurrentuserState();
      });
  }

  /**
   * Handles logic for responding to state changes of the current authenticated
   * user's user profile.Makes sure that every time the user's profile is updated
   * that new forms are generated so that the controls display the current user state.
   */
  currentUserSubscription(): void {
    const context = this;
    this.myCurrentUserSubscription =
      this.profileControl.currentlyBeingEdited.subscribe(() => {
        context.setFormsToCurrentuserState();
      });
  }

  /**
   * Handles submission of the reminders form which contains two HTML5 time inputs. Each input has its
   * current value extracted and parse into an array that contains two integers. At idx 0 in each controls
   * respective array, is the hours and at idx 1 is the minutes of the time they are scheduled to recurr at.
   * 
   * If the reminders are not set or cleared by pressing reset on the input, then the array containing the 
   * time definitions will be empty. Regardless of the current configuration, once this function is submitted,
   * it wipes existing weight and calorie notificationsn that are scheduled and overwrites them with whatever 
   * values are currently in the sync form.
   * 
   * This allows the user to set or clear the existing sync configuration through our app instead of only
   * being able to disable push notifications through their system settings.
   * 
   * If any error occurs, then the form is taken out of edit mode and an error message is displayed.
   */
  async submitReminder(): Promise<void> {
    try {
      this.showSpinner = true;
      let weightHoursMinutes = [];
      let caloriesHoursMinutes = [];
      const HOURS_IDX: number = 0;
      const MINUTES_IDX: number = 1;
      let weightReminderValue = (this.remindersForm.controls[this.WEIGHT_REMINDER_CONTROL].value);
      if (weightReminderValue) {
        weightReminderValue += "";
        weightHoursMinutes = weightReminderValue.split(":").map(strNum => parseInt(strNum));
      }
      let calorieReminderValue = (this.remindersForm.controls[this.CALORIE_REMINDER_CONTROL].value);
      if (calorieReminderValue) {
        calorieReminderValue += "";
        caloriesHoursMinutes = calorieReminderValue.split(":").map(strNum => parseInt(strNum));
      }
      let remindersToSet: any[] = [];
      const canSetWeightReminder = (!(!weightReminderValue || weightReminderValue.length < 2));
      if (canSetWeightReminder) {
        remindersToSet.push(this.pushNotifications.createReminder(this.WEIGHT_REMINDER_ID, this.WEIGHT_REMINDER_TITLE, this.WEIGHT_REMINDER_MESSAGE, weightHoursMinutes[HOURS_IDX], weightHoursMinutes[MINUTES_IDX]));
      }
      const canSetCaloriesReminder = (!(!calorieReminderValue || caloriesHoursMinutes.length < 2));
      if (canSetCaloriesReminder) {
        remindersToSet.push(this.pushNotifications.createReminder(this.CALORIE_REMINDER_ID, this.CALORIE_REMINDER_TITLE, this.CALORIE_REMINDER_MESSAGE, caloriesHoursMinutes[HOURS_IDX], caloriesHoursMinutes[MINUTES_IDX]));
      }
      await this.pushNotifications.clearReminders([this.WEIGHT_REMINDER_ID, this.CALORIE_REMINDER_ID])
      await this.pushNotifications.scheduleReminders(remindersToSet);
      this.showSpinner = false;
      this.snackBar.showSuccessMessage("Reminders updated sucessfully.");
    } catch (erorr) {
      this.snackBar.showFailureMessage("Failed to update reminders");
      this.showSpinner = false;
    }
    this.profileControl.doneEditing();
  }

  /**
   * Generates a new reminders form and fills the values of the form controls 
   * with the state of the current list of scheduled tasks. Reminder's times must be parsed
   * out of the format they are stored in, which is the same format as the objects
   * created in the PushNotificationService using createReminder() are stored in. 
   * 
   * One quirk with this function is that HTML time inputs need the LHS of a time that
   * is defined as HH:MM to be exactly in the format of HH:MM and will not display a 
   * time passed in as H:MM. This would make all AM reminder times hidden. To get around
   * this, we just check if the time string is missing a leading 0, which indicates it is 
   * an AM time. If it is, a '0' is appended to the front of the string ebfore setting the
   * value of the form control.
   */
  async generateReminderForm(): Promise<void> {
    if (!this.remindersForm) {
      this.remindersForm = this.fb.group({
        [this.WEIGHT_REMINDER_CONTROL]: [],
        [this.CALORIE_REMINDER_CONTROL]: [],
      });
      let notifications = await this.pushNotifications.getScheduledNotificiations();
      let weightFormControlValue;
      const weightNotification = notifications.find(noti => noti.id == this.WEIGHT_REMINDER_ID);
      if (weightNotification) {
        let hourValue:string = weightNotification.trigger.every.hour + "";
        let minuteValue:string = weightNotification.trigger.every.minute + "";
        if(hourValue.length<2){
          hourValue =( "0" + hourValue)
        }
        if(minuteValue.length<2){
          minuteValue = ("0" + minuteValue);
        }
        weightFormControlValue = (hourValue+ ":" + minuteValue);
      }
      this.remindersForm.controls[this.WEIGHT_REMINDER_CONTROL].setValue(weightFormControlValue);
      let calorieFormControlValue;
      const calorieNotification = notifications.find(noti => noti.id == this.CALORIE_REMINDER_ID);
      if (calorieNotification) {
        let hourValue:string = calorieNotification.trigger.every.hour + "";
        let minuteValue:string = calorieNotification.trigger.every.minute + "";
        if(hourValue.length<2){
          hourValue = ( "0" + hourValue);
        }
        if(minuteValue.length<2){
          minuteValue = ("0" + minuteValue);
        }
        calorieFormControlValue = (hourValue+ ":" +minuteValue);
      }
      this.remindersForm.controls[this.CALORIE_REMINDER_CONTROL].setValue(calorieFormControlValue);
    }
  }

  /**
   * Returns true if the reminders form is being edited. False otherwise.
   */
  reminderBeingEdited(): boolean {
    return (this.profileControl.currentEditValue() == this.profileControl.EDITING_REMINDER);
  }

  /**
   * Checks if the user has permission or not to update their notification configuration.
   * If the user does not have permissions then they are asked to update their notification
   * preferenes in their settings then they will not be allowed to update their settings.
   */
  async tryToEditReminders(): Promise<void> {
    if(!this.pushNotifications.PUSH_NOTIFICATION){
      this.snackBar.showFailureMessage("Could not load reminders");
      return;
    }
    let userHasPermission: boolean = await this.pushNotifications.hasPermissions();
    if (!userHasPermission) {
      userHasPermission = await this.pushNotifications.requestPermissions();
      if (!userHasPermission) {
        this.snackBar.showFailureMessage("Must enable push notifications in system settings!");
        return;
      }
    }
    this.toggleEditReminder();
  }

  /**
   * Click handler for the set reminders button and close button.
   * If pressed will change the form state to the inverse of what it is currently.
   */
  toggleEditReminder(): void {
    if (!this.reminderBeingEdited()) {
      this.profileControl.beginEditing(this.profileControl.EDITING_REMINDER);
    }
    else {
      this.profileControl.doneEditing();
    }
  }

  /**
   * Returns true if the button that enables editing the reminders 
   * form should be shown. This is true if the profile form is not 
   * in edit mode and the user's tier has preference editing permissions.
   */
  showEditReminderFormButton(): boolean {
    const generalPrefsNotBeingEdited: boolean = !this.reminderBeingEdited();
    return generalPrefsNotBeingEdited;
  }

  /**
   * Returns true if the button that enables editing the reminders
   * form should be disabled. This is true if another form on the profile page
   * is being edited 
   */
  disableEditReminders(): boolean {
    const someOtherFormBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.NOT_EDITING);
    return someOtherFormBeingEdited;
  }

}
