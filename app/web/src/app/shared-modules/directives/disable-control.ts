import { NgControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

/**
 * Angular reactive forms force us to programmatically enable or disable a form control. If an attempt
 * is made to use the 'disabled' attribute of an element linked to a form control, then an error is thrown.
 * This custom directive allows us to use the template driven approach to disabling a form control without 
 * causing Angular to throw errors.
 * 
 * Last edited by: Ryan Lefebvre 7/11/2020 
 */
@Directive({
    selector: '[disableControl]'
})
export class DisableControlDirective {

    /**
     * This function handles the logic for the actual directive. If condition is true, 
     * the form control is disabled. If the condition is false then the control is enabled.
     */
    @Input() set disableControl(condition: boolean) {
        const action = condition ? 'disable' : 'enable';
        this.ngControl.control[action]();
    }

    /**
     * @ignore
     */
    constructor(private ngControl: NgControl) {
    }

}