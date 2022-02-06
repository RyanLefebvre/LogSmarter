import { Component, OnInit, Input } from '@angular/core';

/**
 * Wrapper around the mat-spinner component that displays a message 
 * underneath the spinner that informs the user of the operation the spinner 
 * is being shown for. Whatever component is the parent of the app-spinner-wheel
 * component is responsible for hiding and showing the spinner when appropriate.
 * If no spinnerMessage is passed in, then a generic loading message is shown. If the 
 * noMessage parameter is passed in with a value of true then no message at all is 
 * displayed.
 * 
 * Last edited by: Ryan Lefebvre 8/10/2020
 */
@Component({
  selector: 'log-smarter-spinner-wheel',
  templateUrl: './spinner-wheel.component.html',
  styleUrls: ['./spinner-wheel.component.css']
})
export class SpinnerWheelComponent implements OnInit {

  /**
  * Value passed in as parameter for spinner message.
  */
  @Input()
  spinnerMessage: string = null;

  /**
   * True if there should be no message shown.
   */
  @Input()
  noMessage: boolean = false;

  /**
   * Generic message displayed when spinnerMessage is null
   */
  GENEREIC_MESSAGE: string = "Loading";

  /**
   * Actual spinner message that will be displayed.
   */
  spinnerMessageToDisplay: string = null;

  /**
   * @ignore
   */
  constructor() { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.setSpinnerMessage(this.spinnerMessage);
  }

  /**
   * Sets the value of the spinnerMessageToDisplay variable to 
   * the message passed in as long as it is not null. If it is
   * null, then the message will be set to a generic loading 
   * message. 
   * 
   * If the noMessage input is true then the spinner message is
   * left as null.
   * 
   * @param newSpinnerMessage New value of the spinner message
   */
  setSpinnerMessage(newSpinnerMessage: string): void {
    const wantsMessage: boolean = !(this.noMessage);
    if (wantsMessage) {
      if (newSpinnerMessage) {
        this.spinnerMessageToDisplay = newSpinnerMessage;
      } else {
        this.spinnerMessageToDisplay = this.GENEREIC_MESSAGE;
      }
    }
  }

  /**
   * Returns true if the spinner message should be shown.
   * False otherwise. The spinner message should be shown 
   * as long as it is not null or undefined and the noMessage
   * input is not true.
   */
  showSpinnerMessage(): boolean {
    const wantsMessage: boolean = !(this.noMessage);
    const messageIsNotNull: boolean = (this.spinnerMessageToDisplay != null);
    const messageIsNotUndefined: boolean = (this.spinnerMessageToDisplay != undefined);
    const shouldShowMessage: boolean = (wantsMessage && messageIsNotNull && messageIsNotUndefined);
    return shouldShowMessage;
  }

}
