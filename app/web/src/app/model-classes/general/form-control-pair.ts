/**
 * Class used to consildate data for form controls.
 * Pairs the actual value of the control and what text 
 * for the controls should be displayed to the user. 
 * Especially useful for mat-options where the value of 
 * the control may not be something the user would intuitively click on.
 * 
 * Last edited by: Ryan Lefebvre 6/24/2020
 */
export class FormControlPair {

    /**
     * Actual value of the form control.
     */
    public value: any = null;

    /**
     * name of the control to be displayed to the user.
     */
    public displayName: string = null;

    /**
     * Assigns value and display name to class properties.
     * 
     * @param value actual value of the form control. 
     * @param displayName the name of the control to be displayed.
     */
    constructor(value: any, displayName: string) {
        this.value = value;
        this.displayName = displayName;
    }
}