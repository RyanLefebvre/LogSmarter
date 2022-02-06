/**
 * This file is a collection of constant values that are used to return errors or indicate success
 * from http requests to our firebase cloud functions environment.
 * 
 * Last edited by: Ryan Lefebvre 7/20/2020
 */

/**
 * Error returned if a user is not authenticated.
 */
export const unauthenticatedErrorResponse = {
    message: 'Authentication Required',
    code: 401
}

/**
 * Error returned if an http request was poorly formatted
 */
export const badRequestResponse = {
    message: 'Bad Request',
    code: 400
}

/**
 * Error returned if a user's tier does not have permissions for the operation that they are requesting.
 */
export const invalidTierResponse = {
    message: 'Invalid Tier',
    code: 400
}

/**
 * Error returned if something went wrong but it is not clear what the error was. This is considered 
 * a generic catch all response for server side errors.
 */
export const generalErrorResponse = {
    message: 'Something went wrong',
    code: 500
}

/**
 * OK success status response code indicates that the request has succeeded
 */
export const successResponse = {
    message: 'success',
    code: 200
}