import { Injectable } from '@angular/core';

/**
 * This service controls any variables that change based on whether or not the 
 * environment being built for is production or development. IT SHOULD NEVER 
 * BE MODIFIED unless you are building for production.
 * 
 * Last edited by: Ryan Lefebvre 8/13/2020
 */
@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {

  /**
   * BE EXTREMELY CAREFUL. IF THIS VARIABLE IS FLIPPED TO TRUE THEN 
   * THE APPLICATION WILL BE BUILT SUCH THAT IT IS HOOKED UP TO ALL 
   * OF OUR PROD THIRD PARTY RESOURCES.
   * 
   * This variable should be false all the time unless we are creating
   * a production build. If the variable is false then we know that 
   * we are building for the development environment. If it is true
   * than we are building for the production environment.
   */
  isProduction: boolean = false;

  /**
  * True if building the application in cordova(for Mobile), false otherwise. 
  * This variable needs to be flipped manually before building, otherwise 
  * certain features may or may not be broken and there will be unexpected behavior.
  */
  isMobile: boolean = false;

  /**
   * True if the environment is ios. False otherwise.
   */
  isiOS: boolean = false;

  /**
   * True if the environment is android. False otherwise.
   */
  isAndroid: boolean = false;

  /**
   * True if the environment is web. False otherwise.
   */
  isWeb: boolean = true;

  /**
   * Development publishable Octobat key used to create beanie sessions.
   */
  OCTOBAT_PUBLIC_KEY_DEV: string = "";

  /**
   * Production publishable Octobat key used to create beanie sessions.
   */
  OCTOBAT_PUBLIC_KEY_PROD: string = "";

  /**
   * URL used for iOS IAP mobile receipt validation.
   */
  VALIDATOR_URL: string = "";

  /**
   * Individual product ID for iOS IAP mobile product.
   */
  INDIVIDUAL_ID_IAP: string = "INDIVIDUAL_PREMIUM";

  /**
   * Coach product ID for iOS IAP mobile product.
   */
  COACH_ID_IAP: string = "COACH_PREMIUM";

  /**
   * Individual product ID for Android IAB mobile product
   */
  INDIVIDUAL_ID_IAB: string = "logsmarter_premium";

  /**
   * @ignore
   */
  constructor() { }

  /**
   * Returns the value of the fovea validator URL
   */
  getFoveaValidatorURL(): string {
    return this.VALIDATOR_URL;
  }

  /**
   * Returns the value of the coach subscription id for IAP.
   */
  getCoachIdIAP(): string {
    return this.COACH_ID_IAP;
  }

  /**
   * Returns the value of the individual subscription id for IAP if the 
   * environment is anything but Android. If the environmnet is Android,
   * then the individual subscription id for IAB is returned.
   */
  getIndividualId(): string {
    const wantToReturnAndroidID: boolean = (this.isAndroid == true);
    if (wantToReturnAndroidID) {
      return this.INDIVIDUAL_ID_IAB;
    }
    return this.INDIVIDUAL_ID_IAP;
  }

  /**
   * Returns the correct variable to be used to create beanie sessions with.
   */
  getOctobatPublicKey(): string {
    return this.getCorrectEnvironmentVariable(this.OCTOBAT_PUBLIC_KEY_DEV, this.OCTOBAT_PUBLIC_KEY_PROD);
  }

  /**
   * Reduces repeated logic for getting correct variable based upon environment. 
   * If the environment is production, then the procution variable is returned.
   * If the environment is development then the development variable is returned.
   * 
   * @param developmentVariable Variable used in the development environment.
   * @param productionVariable  Variable used in the production environment.
   */
  getCorrectEnvironmentVariable(developmentVariable: any, productionVariable: any): any {
    if (this.isProduction) {
      return productionVariable;
    } else {
      return developmentVariable;
    }
  }

}
