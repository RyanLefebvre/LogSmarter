import * as functions from 'firebase-functions';
import * as httpResp from '../constants/httpResponses';
const request = require('request');

/**
 * Helper function for a safe firebase cloud function. Adds an extra check for authentication
 * and if the authentication check is passed, then the cloud function is passed onto the 
 * cloudfunction wrapper which safely exectues a cloud function.
 * 
 * @param func function to be executed as a firebase cloud function
 * 
 * Last edited by: Ryan Lefebvre 7/25/2020
 */
export async function authenticatedCloudFunctionWrapper(
    authContext: functions.https.CallableContext,
    func: (someParams?: any) => {},
    params?: any) {
    try {
        if (!isAuthenticated(authContext)) {
            return httpResp.unauthenticatedErrorResponse;
        } else {
            return await cloudFunctionWrapper(func, params);
        }
    } catch (error) {
        return httpResp.generalErrorResponse;
    }

}

/**
 * Wrapper for firebase cloud functions. Makes sure that all code is wrapped in a try catch,
 * and returns an error message if an error is encountered. Otherwise, waits for the function 
 * passed in as a parameter to exectute, then returns the output of that function appended
 * to an http 200 response status code indicating a success.
 * 
 * @param func 
 */
export async function cloudFunctionWrapper(func: (someParams?: any) => {}, params?: any) {
    try {
        let funcRespData: {} = {};
        if (params) {
            funcRespData = await (func(params))
        }
        else {
            funcRespData = await func();
        }
        return {
            ...funcRespData,
            ...httpResp.successResponse
        };
    } catch (error) {
        return httpResp.generalErrorResponse;
    }
}

/**
 * Input is a firebase on call context object from a cloud function request. 
 * Returns true if a user is authenticated, false otherwise.
 * 
 * @param context firebase cloud function request context. 
 */
export function isAuthenticated(context: functions.https.CallableContext): boolean {
    if (!context || !context.auth)
        return false;
    return true;
}

/**
 * Runtime options to increase the timeout for functions. This is used to handle 
 * slow responses from ML model which can take too long to warm up.
 */
export const increaseRuntimeOpts: any = {
    timeoutSeconds: 300,
    memory: "1GB"
};

/**
 * Makes an https request with options passed in as params.
 * Function is expecting the options to contain , the url, 
 * http request method, any authentication that is required 
 * and the body of the request if applicable 
 * 
 * @param options options to be passed as a request. 
 */
export const httpRequest = (options: any): Promise<any> => {
    return new Promise(function (resolve, reject) {
        request(options, function (err: any, resp: any, body: any) {
            if (err) {
                reject({ err: err });
            }
            resolve(body);
        });
    });
}
