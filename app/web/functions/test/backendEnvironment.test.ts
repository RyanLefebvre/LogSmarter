import * as Environment from '../src/services/environment';
import * as TestHelpers from '../test/TestHelpers';
import { assert } from 'console';

describe('FirebaseFunctions/Services/Environment', () => {

    const PRODUCTION = true;
    const DEVELOPMENT = false;

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it("should return the production variable in production mode when getCorrectEnvironmentVariable() is called ", () => {
        const prodVariable = "someVariable";
        const devVariable = "someOtherVariable";
        const expectedVariableValue = prodVariable;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', PRODUCTION);
        const actualVariableValue = Environment.getCorrectEnvironmentVariable(devVariable, prodVariable);
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the development variable in development mode when getCorrectEnvironmentVariable() is called ", () => {
        const prodVariable = "someVariable";
        const devVariable = "someOtherVariable";
        const expectedVariableValue = devVariable;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', DEVELOPMENT);
        const actualVariableValue = Environment.getCorrectEnvironmentVariable(devVariable, prodVariable);
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the development Stripe API Key in development mode when getCorrectStripeAPIKey() is called ", () => {
        const expectedVariableValue = Environment.STRIPE_API_KEY_DEV;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', DEVELOPMENT);
        const actualVariableValue = Environment.getStripeAPIKey();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the production Stripe API Key in production mode when getCorrectStripeAPIKey() is called ", () => {
        const expectedVariableValue = Environment.STRIPE_API_KEY_PROD;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', PRODUCTION);
        const actualVariableValue = Environment.getStripeAPIKey();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the development Stripe endpoint secret in development mode when getStripeEndpointSecret() is called ", () => {
        const expectedVariableValue = Environment.STRIPE_ENDPOINT_SECRET_DEV;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', DEVELOPMENT);
        const actualVariableValue = Environment.getStripeEndpointSecret();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the production Stripe endpoint secret in production mode when getStripeEndpointSecret() is called ", () => {
        const expectedVariableValue = Environment.STRIPE_ENDPOINT_SECRET_PROD;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', PRODUCTION);
        const actualVariableValue = Environment.getStripeEndpointSecret();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the development Stripe premium sub id in development mode when getStripePremiumSubId() is called (INDIVIDUAL) ", () => {
        const expectedVariableValue = Environment.PREMIUM_INDIVIDUAL_MONTHLY_PLAN_ID_DEV;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', DEVELOPMENT);
        const actualVariableValue = Environment.getStripeIndividualPremiumSubId();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the production Stripe premium sub id in production mode when getStripePremiumSubId() is called (INDIVIDUAL)", () => {
        const expectedVariableValue = Environment.PREMIUM_INDIVIDUAL_MONTHLY_PLAN_ID_PROD;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', PRODUCTION);
        const actualVariableValue = Environment.getStripeIndividualPremiumSubId();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the development octobat api key id in development mode when getOctobatAPIKey() is called ", () => {
        const expectedVariableValue = Environment.OCTOBAT_SECRET_KEY_DEV;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', DEVELOPMENT);
        const actualVariableValue = Environment.getOctobatAPIKey();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

    it("should return the production octobat api key id in production mode when getOctobatAPIKey() is called ", () => {
        const expectedVariableValue = Environment.OCTOBAT_SECRET_KEY_PROD;
        TestHelpers.spyOnIndividualExport(Environment, 'isProduction', PRODUCTION);
        const actualVariableValue = Environment.getOctobatAPIKey();
        const actualIsExpected = (actualVariableValue === expectedVariableValue);
        assert(actualIsExpected);
    });

});

