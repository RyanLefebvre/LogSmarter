import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

/**
 * This dialog is opened the first time that an individual user opens the 
 * appliation. It is used to instuct them on the basics of using LogSmarter
 * as a way to eliminate confusion and answer common questions that we get.
 * 
 * Last edited by: Ryan Lefebvre 12/23/2020
 */
@Component({
  selector: 'app-first-time-tips',
  templateUrl: './first-time-tips.component.html',
  styleUrls: ['./first-time-tips.component.css']
})
export class FirstTimeTipsComponent implements OnInit {

  /**
   * Holds the value of the current instruction stage.
   */
  currentInstructionStage: number = 0;

  /**
   * Contains the content of the individual instruction stages.
   */
  instructionStages: any[] = [
    {
      title: "Learn To Use LogSmarter™",
      message: "Do you know how to use LogSmarter™ ? If not, we will walk you through how it works to make sure you get the most out of using our software. We want to make sure we do the best job we can to help you reach your goals."
    },
    {
      title: "TDEE",
      message: "When you registered, you probably entered your demographic information. If you did, our machine learning model has made an initial prediction of the number of calories you require per day to maintain your weight, also known as your TDEE. If you didn't enter your demographic information, you can do that at any time through the Profile page. If you didn't provide your demographic information, we strongly recommend doing this before making a log. Otherwise, it will take 14 days for our algorithm to provide a goal intake. If you already know your maintenance calories, you can manually enter your TDEE on the profile page too."
    },
    {
      title: "Main Log",
      message: "Whenever you sign in, you're taken to the dashboard page. On this page you will see your main log. Your main log is where you will keep daily records of your calorie intake and body weight. If you have not created a main log, you can do this by clicking the 'Set Main Log' button on the dashboard. "
    },
    {
      title: "Log Goal",
      message: "Every log has a goal. Possible goals are muscle gain, fat loss and weight maintenance. The goal for a log is set at creation time and can't be changed after that. If you aren't sure what your first log's goal should be, you can check out the Resouces section and look at the 'Should I bulk or cut?' resource. Your log goal and estimated TDEE will be used by our algorithm to determine a personalized goal calorie intake range."
    },
    {
      title: "Weighing Yourself",
      message: "Try to weigh yourself at a consistent time every day. We recomend in the morning, right after you get up. It is also important to note that the start and current weight displayed by your log statistics are rolling averages. They are the average of the first 7 and latest 7 entries respectively. This is more accurate than using one entry and mitigates the impact that outlier entries can have."
    },
    {
      title: "Tracking Calories",
      message: "We recomend using a food scale when tracking your calories to have the most accurate measurements. Most users will utilize one of the many calorie tracking apps that exist to help them with this and then log their calories at night when they are finished eating for the day."
    },
    {
      title: "Algorithm Feedback",
      message: "Our algorithm provides feedback on your calorie intake and body weight and updates your goal calorie intake range whenever you log a complete entry. The algorithm waits to make adjustments or provide certain types of feedback until after 14 days worth of complete data is logged. Complete entries have a record of both calorie intake and bodyweight. Waiting 14 days allows the algorithm to learn before providing feedback and 14 days is also considered the gold standard for finding maintenance calories in the scientific literature."
    },
    {
      title: "Changing Main Log",
      message: "You should switch main logs every time you enter a new nutritional phase, so if you bulk for a few months, cut for a month and then enter into another bulking phase, you would have one log for the first bulk, one log for your cutting phase and another log for your new bulk. To change your main log, use the options button on your main log to remove it and then set a new main log."
    },
    {
      title: "Track Smarter, Progress Faster",
      message: "Looks like you know what you're doing! We won't automatically show you these tips again. If you want, you can open them through the options button on your main log."
    }
  ];


  /**
   * @ignore
   */
  constructor(
    public dialogRef: MatDialogRef<FirstTimeTipsComponent>,
    @Inject(MAT_DIALOG_DATA) public data) { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.dialogRef.disableClose = true;
  }

  /**
   * Returns the content that should be displayed in the dialog based on what 
   * the current instruction stage is.
   */
  getCurrentStage(): any {
    return this.instructionStages[this.currentInstructionStage];
  }

  /**
   * Returns true if the user is on the first instruction. False otherwise.
   */
  onFirstInstruction(): boolean {
    return (this.currentInstructionStage == 0);
  }

  /**
   * Returns true if the user is not on the first or the last instruction. False otherwise.
   */
  onIntermediateInstruction(): boolean {
    return (!this.onFirstInstruction() && !this.onLastInstruction());
  }

  /**
   * Returns true if the user is on the last instruction. alse otherwise.
   */
  onLastInstruction(): boolean {
    return (this.currentInstructionStage == this.instructionStages.length - 1);
  }

  /**
   * Moves the current instruction stage forward. 
   */
  nextStage(): void {
    this.currentInstructionStage++;
    if (this.onLastInstruction()) {
      this.closeDialog();
    }
    this.scrollToTop();

  }

  /**
  * Moves the current instruction stage backwards.
  */
  previousStage(): void {
    this.currentInstructionStage--;
    this.scrollToTop();
  }

  /**
   * Force scrolls the dialogs div to the top to prevent weird transitions.
   */
  scrollToTop(): void {
    const messageDiv: HTMLElement = document.getElementById('scrollToTop');
    if (messageDiv) {
      messageDiv.scrollTop = 0;
    }
  }

  /**
   * This function does not actually close the dialog, because we want to make sure 
   * the user knows how to open this dialog again before it closes. Instead it navigates
   * the user to the instruction about how to open this dialog again if they want to do 
   * that.
   */
  closeDialog(): void {
    this.currentInstructionStage = this.instructionStages.length - 1;
  }

}
