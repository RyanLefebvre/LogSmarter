import * as CloudFunc from '../src/services/cloudfunction';
import * as httpResponses from '../src/constants/httpResponses';
import { assert } from 'console';
import { isEquivalent } from './testHelpers';

describe("Functions/Services/CloudFunctions", () => {

    it("should return false if the auth context is null and isAuthenticated() is called ", () => {
        const authContext: any = null;
        const expectedValue = false;
        const actualValue = CloudFunc.isAuthenticated(authContext);
        const actualIsExpected = (actualValue == expectedValue)
        assert(actualIsExpected);
    });

    it("should return false if the auth context does not have an auth property and isAuthenticated() is called ", () => {
        const authContext = {
            "somePropertyThatIsNotAuth": "someVal"
        } as any;
        const expectedValue = false;
        const actualValue = CloudFunc.isAuthenticated(authContext);
        const actualIsExpected = (actualValue == expectedValue)
        assert(actualIsExpected);
    });

    it("should return true if the auth context does have an auth property and isAuthenticated() is called ", () => {
        const authContext = {
            "auth": "someVal"
        } as any;
        const expectedValue = true;
        const actualValue = CloudFunc.isAuthenticated(authContext);
        const actualIsExpected = (actualValue == expectedValue)
        assert(actualIsExpected);
    });

    it("should concatenate the response of the function parameter and an http success response when cloudFuntionWrapper() is called", async () => {
        const someFakeFunc = async () => {
            return { functionReturnValue: "this is a fake async function" };
        };
        const concatenatedResponse = {
            ...(await someFakeFunc()),
            ...httpResponses.successResponse
        };
        const actualValue = await CloudFunc.cloudFunctionWrapper(someFakeFunc);
        const actualIsExpected = isEquivalent(actualValue, concatenatedResponse);
        assert(actualIsExpected);
    });

    it("should return an http unauthenticated response when authenticatedCloudFunctionWrapper() is called and the user is NOT authenticated", async () => {
        const someFakeFunc = async () => {
            return { functionReturnValue: "this is a fake async function" };
        };
        const authContext: any = null;
        const actualValue = await CloudFunc.authenticatedCloudFunctionWrapper(authContext, someFakeFunc);
        const actualIsExpected = isEquivalent(actualValue, httpResponses.unauthenticatedErrorResponse);
        assert(actualIsExpected);
    });

    it("should concatenate the response of the function parameter and an http success response when authenticatedCloudFunctionWrapper() is called and the user is authenticated", async () => {
        const someFakeFunc = async () => {
            return { functionReturnValue: "this is a fake async function" };
        };
        const concatenatedResponse = {
            ...(await someFakeFunc()),
            ...httpResponses.successResponse
        };
        const authContext = {
            "auth": "someVal"
        } as any;
        const actualValue = await CloudFunc.authenticatedCloudFunctionWrapper(authContext, someFakeFunc);
        const actualIsExpected = isEquivalent(actualValue, concatenatedResponse);
        assert(actualIsExpected);
    });

    it("should return an error response if there is an error when authenticatedCloudFunctionWrapper() is called", async () => {
        const authContext = {
            "auth": "someVal"
        } as any;
        const functionThatWillCauseAnError: any = null;
        const returnedValue = await CloudFunc.authenticatedCloudFunctionWrapper(authContext, functionThatWillCauseAnError);
        const expectedValue = httpResponses.generalErrorResponse;
        const actualIsExpected = (returnedValue == expectedValue);
        assert(actualIsExpected);
    });

    it("should return an error response if there is an error when cloudFunctionWrapper() is called", async () => {
        const functionThatWillCauseAnError: any = null;
        const returnedValue = await CloudFunc.cloudFunctionWrapper(functionThatWillCauseAnError);
        const expectedValue = httpResponses.generalErrorResponse;
        const actualIsExpected = (returnedValue == expectedValue);
        assert(actualIsExpected);
    });

    it("should call the function with the optional params if they were provided and cloudFunctionWrapper() is called", async () => {
        const fakeParams = "someFakeValue";
        let funcWasCalledWithParams: any = false;
        const fakeFunc = async (params?: any) => {
            if (params && params === fakeParams) {
                funcWasCalledWithParams = true;
            }
        }
        await CloudFunc.cloudFunctionWrapper(fakeFunc, fakeParams);
        const itWasCalledCorrectly = funcWasCalledWithParams == true;
        assert(itWasCalledCorrectly);
    });

    it("should call the function with the optional params if they were provided and authenticatedCloudFunctionWrapper() is called", async () => {
        const fakeParams = "someFakeValue";
        let funcWasCalledWithParams: any = false;
        const fakeFunc = async (params?: any) => {
            if (params && params === fakeParams) {
                funcWasCalledWithParams = true;
            }
        }
        const authContext = {
            "auth": "someVal"
        } as any;
        await CloudFunc.authenticatedCloudFunctionWrapper(authContext, fakeFunc, fakeParams);
        const itWasCalledCorrectly = funcWasCalledWithParams == true;
        assert(itWasCalledCorrectly);
    });

    it("should NOT call the function with the optional params if they were NOT provided and cloudFunctionWrapper() is called", async () => {
        const fakeParams = "someFakeValue";
        let funcWasCalledWithParams: any = false;
        const fakeFunc = async (params?: any) => {
            if (params && params === fakeParams) {
                funcWasCalledWithParams = true;
            }
        }
        await CloudFunc.cloudFunctionWrapper(fakeFunc);
        const itWasCalledCorrectly = funcWasCalledWithParams == false;
        assert(itWasCalledCorrectly);
    });

    it("should NOT call the function with the optional params if they were NOT provided and authenticatedCloudFunctionWrapper() is called", async () => {
        const fakeParams = "someFakeValue";
        let funcWasCalledWithParams: any = false;
        const fakeFunc = async (params?: any) => {
            if (params && params === fakeParams) {
                funcWasCalledWithParams = true;
            }
        }
        const authContext = {
            "auth": "someVal"
        } as any;
        await CloudFunc.authenticatedCloudFunctionWrapper(authContext, fakeFunc);
        const itWasCalledCorrectly = funcWasCalledWithParams == false;
        assert(itWasCalledCorrectly);
    });

});