import { Injectable } from '@angular/core';

/**
 * This service is responsible for any constants needed between multiple services that DO NOT relate to nutrition 
 * logs or TDEE estimation. Any operations to retrieve or display those values should go through this service.
 * 
 * Last edited by: Ryan Lefebvre 12/1/2020
 */
@Injectable({
  providedIn: 'root'
})
export class ConstantsService {

  /**
   * @ignore
   */
  constructor() { }

  /**
   * Number of msec that spinner should be displayed for if a setTimeout is used to 
   * make it appear that an operation is happening for longer than it actually is with 
   * a spinner. This is useful when the length of the operation is long enough that a 
   * spinner appears but also quick enough that spinner just appears to flicker.
   */
  SPINNER_TIMEOUT: number = 600;

  /**
  * Value used in the user profile subplatform property if the platform is web.
  */
  PLATFORM_WEB: string = null;

  /**
   * Value used in the user profile subplatform property if the platform is ios.
   */
  PLATFORM_iOS: string = "apple";

  /**
   * Value used in the user profile subplatform property if the platform is ios.
   */
  PLATFORM_ANDROID: string = "android";
}
