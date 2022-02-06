import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';

/**
 * This service is a wrapper around all requests to a firebase callable function to make 
 * it easier to return the body of the request or null on an error without having to repeat 
 * the same few lines of code with async/await keywords that is wrapped in a try catch.
 * 
 * Last edited by: Ryan Lefebvre 7/13/2020
 */
@Injectable({
  providedIn: 'root'
})
export class CallableWrapperService {

  /**
   * Constant used to represent an error occuring from a callable cloud function related to internet connection.
   */
  ERROR: null = null;

  /**
   * Constant used to represent an error occuring from a callable cloud function related to internet connection.
   */
  INTERNET_ERROR: string = "noInternet";

  /**
  * Easy way to specify a function request that has no params aka not having a body.
  */
  NO_PARAMS: {} = {};

  /**
   * @ignore
   */
  constructor(public fireFunc: AngularFireFunctions, public snackBarManager: SnackBarService) { }

  /**
   * Makes a request to a firebase callable cloud function with the name functionName
   * and passes functionBody as the body of the request for the callable function.
   * 
   * @param functionName name of the firebase cloud function to be executed.
   * @param functionBody body of the firebase cloud function request.
   */
  async firebaseCloudFunction(functionName: string, functionBody: any, dontShowMessage?: boolean) {
    try {
      const returnedValue: any = await this.fireFunc.httpsCallable(functionName)(functionBody).toPromise();
      return returnedValue;
    } catch (error) {
      if (error.code == "internal" && !dontShowMessage) {
        this.snackBarManager.showWarningMessage("Can't Connect");
      }
      return this.ERROR;
    }
  }
}
