import * as TestHelpers from './testHelpers';
import * as Profile from '../src/services/profile';
import * as PaymentServices from '../src/services/payments';
import * as Tiers from '../src/services/tiers';
import * as platforms from '../src/constants/platforms';
import * as FunctionWrappers from "../src/services/cloudfunction"
import { assert } from 'console';

describe("Functions/Services/Payments", () => {

    let updateWasCalled: boolean;
    afterEach(() => {
        updateWasCalled = false;
        TestHelpers.resetAllSpies();
        TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => {
            updateWasCalled = true;
            return null as any;
        });
    });

    it("should extract the user's uid from a customer object and call stripeWebhookUpdateHelper() " +
        " when stripeEventWebhookBody() is invoked and the event type is SUBSCRIPTION_DELETED for an inactive sub", async () => {
            const mockEventType = PaymentServices.SUBSCRIPTION_DELETED;
            const fakeRequest: any = {
                body: {
                    event_type: mockEventType
                },
                headers: {

                }
            };
            const fakeResponse: any = {
                status: () => { return { end: () => { } } }
            };
            let getUidFromSubEventWasCalled: any = false;
            const expectedUID = "someFakeUID";
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getUidFromSubscriptionEvent', async () => {
                getUidFromSubEventWasCalled = true;
                return expectedUID;
            });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => TestHelpers.getRandomUserProfile());
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getUidForChargeFailed', async () => { });
            let uidThatWebHookHelperWasCalledWith = null;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'deactivateSubscription', async (uid: any) => uidThatWebHookHelperWasCalledWith = uid);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                webhooks: {
                    constructEvent: async (body: any, sig: any, secret: any,) => {
                        return {
                            type: fakeRequest.body.event_type
                        }
                    }
                },
                subscriptions: {
                    retrieve: async () => {
                        return {
                            status: Tiers.SUBSCRIPTION_STATUS_ACTIVE + "Some other chars"
                        }
                    }
                }
            });
            assert(getUidFromSubEventWasCalled == false);
            await (PaymentServices.stripeEventWebhookBody(fakeRequest, fakeResponse));
            assert(getUidFromSubEventWasCalled == true);
            assert(uidThatWebHookHelperWasCalledWith == expectedUID);
        });

    it("should NOT extract the user's email from a customer object and call stripeWebhookUpdateHelper() " +
        " when stripeEventWebhookBody() is invoked and the event type is SUBSCRIPTION_DELETED for an active sub", async () => {
            const mockEventType = PaymentServices.SUBSCRIPTION_DELETED;
            const fakeRequest: any = {
                body: {
                    event_type: mockEventType
                },
                headers: {

                }
            };
            const fakeResponse: any = {
                status: () => { return { end: () => { } } }
            };
            let getUidFromSubEventWasCalled: any = false;
            const expectedUID = "someFakeUID";
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getUidFromSubscriptionEvent', async () => {
                getUidFromSubEventWasCalled = true;
                return expectedUID;
            });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => TestHelpers.getRandomUserProfile());
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getEmailFromCustObj', async () => { });
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getUidForChargeFailed', async () => { });
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getEmailForChargeFailed', async () => { });
            let uidThatWebHookHelperWasCalledWith = null;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'deactivateSubscription', async (uid: any) => uidThatWebHookHelperWasCalledWith = uid);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                webhooks: {
                    constructEvent: async (body: any, sig: any, secret: any,) => {
                        return {
                            type: fakeRequest.body.event_type
                        }
                    }
                },
                subscriptions: {
                    retrieve: async () => {
                        return {
                            status: Tiers.SUBSCRIPTION_STATUS_ACTIVE
                        }
                    }
                }
            });
            assert(getUidFromSubEventWasCalled == false);
            await (PaymentServices.stripeEventWebhookBody(fakeRequest, fakeResponse));
            assert(getUidFromSubEventWasCalled == true);
            assert(uidThatWebHookHelperWasCalledWith != expectedUID);// aka it didnt get called
        });

    it("should extract the user's email from a charge object and call stripeWebhookUpdateHelper() " +
        " when stripeEventWebhookBody() is invoked and the event type is CHARGE_FAILED", async () => {
            const mockEventType = PaymentServices.CHARGE_FAILED;
            const fakeRequest: any = {
                body: {
                    event_type: mockEventType
                },
                headers: {

                }
            }; const fakeResponse: any = {
                status: () => { return { end: () => { } } }
            };
            let getUidFromSubEventWasCalled: any = false;
            const expectedUID = "someFakeUID";
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getUidForChargeFailed', async () => {
                getUidFromSubEventWasCalled = true;
                return expectedUID;
            });
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getEmailFromCustObj', async () => { });
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getUidFromSubscriptionEvent', async () => { });
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getEmailForChargeFailed', async () => { });
            let uidThatWebHookHelperWasCalledWith = null;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'deactivateSubscription', async (uid: any) => uidThatWebHookHelperWasCalledWith = uid);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                webhooks: {
                    constructEvent: async (body: any, sig: any, secret: any,) => {
                        return {
                            type: fakeRequest.body.event_type
                        }
                    }
                }
            })
            assert(getUidFromSubEventWasCalled == false);
            await (PaymentServices.stripeEventWebhookBody(fakeRequest, fakeResponse));
            assert(getUidFromSubEventWasCalled == true);
            assert(uidThatWebHookHelperWasCalledWith == expectedUID);
        });

    it("should not get the user's email or call stripeWebhookUpdateHelper() when stripeEventWebhookBody()" +
        " is invoked and the event type is NOT CHARGE_FAILED, SUBSCRIPTION_UPDATED or SUBSCRIPTION_CREATED", async () => {
            const mockEventType = "someFakeEventType";
            const fakeRequest: any = {
                body: {
                    event_type: mockEventType
                },
                headers: {

                }
            };
            const fakeResponse: any = {
                status: () => { return { end: () => { } } }
            };
            const expectedEmail = "someFakeEmail@gmail.com";
            let getEmailFromCustObjWasCalled: any = false;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getEmailFromCustObj', async () => getEmailFromCustObjWasCalled = true);
            let getEmailFromChargeWasCalled: any = false;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'getEmailForChargeFailed', async () => getEmailFromChargeWasCalled = true);
            let emailThatWebHookHelperWasCalledWith = null;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripeWebhookUpdateHelper', async (email: any) => emailThatWebHookHelperWasCalledWith = email);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                webhooks: {
                    constructEvent: async (body: any, sig: any, secret: any,) => {
                        return {
                            type: fakeRequest.body.event_type
                        }
                    }
                }
            })
            assert(getEmailFromChargeWasCalled == false);
            assert(getEmailFromCustObjWasCalled == false);
            assert(emailThatWebHookHelperWasCalledWith != expectedEmail);
            assert(emailThatWebHookHelperWasCalledWith == null);
            await (PaymentServices.stripeEventWebhookBody(fakeRequest, fakeResponse));
            assert(getEmailFromChargeWasCalled == false);
            assert(getEmailFromCustObjWasCalled == false);
            assert(emailThatWebHookHelperWasCalledWith != expectedEmail);
            assert(emailThatWebHookHelperWasCalledWith == null);
        });

    it("should NOT do anything when octobatWebhookBody() is invoked and the event type is not an order success ", async () => {
        const mockEventType = PaymentServices.OCTO_ORDER_SUCCESS + "forceItToBeAnUnknownEvent";
        const fakeRequest: any = {
            body: {
                event_type: mockEventType
            }
        };
        const fakeResponse: any = {
            json: () => { return { end: () => { } } }
        };
        let getUserProfileWasCalled = false;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => getUserProfileWasCalled = true);
        let updateUserInDBWasCalled = false;
        TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => updateUserInDBWasCalled = true);
        let retrieveWasCalled = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', async () => {
            return {
                subscriptions: {
                    retrieve: () => retrieveWasCalled = true
                }
            }
        });
        assert(fakeRequest.body.event_type != PaymentServices.OCTO_ORDER_SUCCESS);
        await (PaymentServices.octobatWebhookBody(fakeRequest, fakeResponse));
        assert(!getUserProfileWasCalled);
        assert(!updateUserInDBWasCalled);
        assert(!retrieveWasCalled);
    });

    it("should set the user’s stripe data to the new subscription and their old subscription should be deleted " +
        " after they are updated in the DB when octoOrderHookBody() is invoked if the event type is OCTO_ORDER_SUCCESS, " +
        " the user already has a subscription and their current subscription is different than the new one from Octobat ", async () => {
            const mockEventType = PaymentServices.OCTO_ORDER_SUCCESS;
            const userReturnedFromQueryByUID = TestHelpers.getRandomUserProfile();
            const fakeUid = "someFakeUserId";
            const currentSubscription = {
                id: "fakeCurrentSubId",
                status: "currentSubStatus",
                tier: "someFakeTierName",
            }
            const newSubscription = {
                id: "fakeNewSUbId",
                status: "newSubStatus",
                tier: "aTierNameDifferentThanTheCurrentSubs",
            }
            const fakeRequest: any = {
                body: {
                    event_type: mockEventType,
                    data: {
                        beanie_session: {
                            client_reference_id: fakeUid
                        },
                        stripe: {
                            subscription_id: newSubscription.id
                        }
                    }
                }
            };
            const fakeResponse: any = {
                json: () => { return { end: () => { } } }
            };
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
                if (uid == fakeUid) {
                    return userReturnedFromQueryByUID;
                } else {
                    return null;
                }
            });
            let idOfSubThatGotDeleted = null;
            let subDeleteGotCalled = false;
            let timeOfDel = 1;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            plan: {
                                metadata: {
                                    tier: newSubscription.tier
                                }
                            },
                            status: newSubscription.status
                        }
                    },
                    del: async (subToDelete: any) => {
                        idOfSubThatGotDeleted = subToDelete;
                        subDeleteGotCalled = true;
                        timeOfDel = (new Date()).getTime();
                    }
                }
            });
            let timeOfUpdate = timeOfDel + 1;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'createSubscription', async (uid: any, newSubscriptionId: string) => {
                assert(uid == fakeUid);
                assert(newSubscriptionId == newSubscription.id);
                // Force there to be time before and after the marking of when update was called 
                // pretend operation is longer than it is to prevent false duplicate times for del/update
                await (async () => { new Promise(resolve => setTimeout(resolve, 10)); });
                timeOfUpdate = (new Date()).getTime();
                await new Promise(resolve => setTimeout(resolve, 10));
            });
            userReturnedFromQueryByUID.subscriptionID = currentSubscription.id;
            userReturnedFromQueryByUID.subscriptionStatus = currentSubscription.status;
            userReturnedFromQueryByUID.subscriptionTier = currentSubscription.tier;
            const orderTypeIsSuccess = (fakeRequest.body.event_type == PaymentServices.OCTO_ORDER_SUCCESS);
            assert(orderTypeIsSuccess);
            const newSubAndCurrentSubAreDifferent = !(TestHelpers.isEquivalent(newSubscription, currentSubscription))
            assert(newSubAndCurrentSubAreDifferent);
            const userHasSubscription = (userReturnedFromQueryByUID.subscriptionID != null)
            assert(userHasSubscription);
            await (PaymentServices.octobatWebhookBody(fakeRequest, fakeResponse));
            assert(subDeleteGotCalled);
            assert(idOfSubThatGotDeleted == currentSubscription.id);
            const deleteWasCalledAfterUpdate = (timeOfDel > timeOfUpdate);
            assert(deleteWasCalledAfterUpdate);
        });

    it("should set the user’s stripe data to the new subscription and their old subscription should NOT be deleted " +
        " after they are updated in the DB when octoOrderHookBody() is invoked if the event type is OCTO_ORDER_SUCCESS, " +
        " the user already has a subscription and their current subscription is the same as the new one from Octobat ", async () => {
            const mockEventType = PaymentServices.OCTO_ORDER_SUCCESS;
            const userReturnedFromQueryByUID = TestHelpers.getRandomUserProfile();
            const fakeUid = "someFakeUserId";
            const currentSubscription = {
                id: "fakeNewSubId",
                status: "newSubStatus",
                tier: "someFakeTierName",
            }
            const newSubscription = currentSubscription;
            const fakeRequest: any = {
                body: {
                    event_type: mockEventType,
                    data: {
                        beanie_session: {
                            client_reference_id: fakeUid
                        },
                        stripe: {
                            subscription_id: newSubscription.id
                        }
                    }
                }
            };
            const fakeResponse: any = {
                json: () => { return { end: () => { } } }
            };
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
                if (uid == fakeUid) {
                    return userReturnedFromQueryByUID;
                } else {
                    return null;
                }
            });
            let subDeleteGotCalled = false;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            plan: {
                                metadata: {
                                    tier: newSubscription.tier
                                }
                            },
                            status: newSubscription.status
                        }
                    },
                    del: async (subToDelete: any) => {
                        subDeleteGotCalled = true;
                    }
                }
            });
            TestHelpers.spyOnIndividualExport(PaymentServices, 'createSubscription', async (uid: any, newSubscriptionId: string) => {
                assert(uid == fakeUid);
                assert(newSubscriptionId == newSubscription.id);
            });
            userReturnedFromQueryByUID.subscriptionID = currentSubscription.id;
            userReturnedFromQueryByUID.subscriptionStatus = currentSubscription.status;
            userReturnedFromQueryByUID.subscriptionTier = currentSubscription.tier;
            const orderTypeIsSuccess = (fakeRequest.body.event_type == PaymentServices.OCTO_ORDER_SUCCESS);
            assert(orderTypeIsSuccess);
            const newSubAndCurrentSubAreTheSame = (TestHelpers.isEquivalent(newSubscription, currentSubscription))
            assert(newSubAndCurrentSubAreTheSame);
            const userHasSubscription = (userReturnedFromQueryByUID.subscriptionID != null)
            assert(userHasSubscription);
            await (PaymentServices.octobatWebhookBody(fakeRequest, fakeResponse));
            assert(!subDeleteGotCalled);
        });

    it("should set the user’s stripe data to the new subscription and their old subscription should NOT be deleted " +
        " after they are updated in the DB when octoOrderHookBody() is invoked if the event type is OCTO_ORDER_SUCCESS, " +
        " the user DOES NOT already has a subscription and their current subscription is NOT the same as the new one from Octobat ", async () => {
            const mockEventType = PaymentServices.OCTO_ORDER_SUCCESS;
            const userReturnedFromQueryByUID = TestHelpers.getRandomUserProfile();
            const fakeUid = "someFakeUserId";
            const currentSubscription: any = {}
            const newSubscription = {
                id: "fakeCurrentSubId",
                status: "currentSubStatus",
                tier: "someFakeTierName",
            }
            const fakeRequest: any = {
                body: {
                    event_type: mockEventType,
                    data: {
                        beanie_session: {
                            client_reference_id: fakeUid
                        },
                        stripe: {
                            subscription_id: newSubscription.id
                        }
                    }
                }
            };
            const fakeResponse: any = {
                json: () => { return { end: () => { } } }
            };
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
                if (uid == fakeUid) {
                    return userReturnedFromQueryByUID;
                } else {
                    return null;
                }
            });
            let subDeleteGotCalled = false;
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            plan: {
                                metadata: {
                                    tier: newSubscription.tier
                                }
                            },
                            status: newSubscription.status
                        }
                    },
                    del: async (subToDelete: any) => {
                        subDeleteGotCalled = true;
                    }
                }
            });
            TestHelpers.spyOnIndividualExport(PaymentServices, 'createSubscription', async (uid: any, newSubscriptionId: string) => {
                assert(uid == fakeUid);
                assert(newSubscriptionId == newSubscription.id);
            });
            userReturnedFromQueryByUID.subscriptionID = currentSubscription.id;
            userReturnedFromQueryByUID.subscriptionStatus = currentSubscription.status;
            userReturnedFromQueryByUID.subscriptionTier = currentSubscription.tier;
            const orderTypeIsSuccess = (fakeRequest.body.event_type == PaymentServices.OCTO_ORDER_SUCCESS);
            assert(orderTypeIsSuccess);
            const newSubAndCurrentSubAreNotTheSame = !(TestHelpers.isEquivalent(newSubscription, currentSubscription))
            assert(newSubAndCurrentSubAreNotTheSame);
            const userHasNoSubscription = (userReturnedFromQueryByUID.subscriptionID == null)
            assert(userHasNoSubscription);
            await (PaymentServices.octobatWebhookBody(fakeRequest, fakeResponse));
            assert(!subDeleteGotCalled);
        });

    it("should set the beanie session theme color to the user's theme color when createBeanieSessionBody() is called " +
        " when the user profile passed in as param has a theme color", async () => {
            const fakeData = {};
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedTheme = "someFaketheme"
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            expectedUserProfile.userPreferences = {
                general: {
                    currentTheme: expectedTheme
                }
            };
            const beanieParams = [fakeContext, fakeData];
            TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: "someFakeCustomer"
                        }
                    }
                }
            });
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            const beanieColor = beanieSession.body.primary_color;
            const beanieColorIsCorrect = beanieColor == expectedTheme;
            assert(beanieColorIsCorrect);
        });

    it("should set the beanie session theme color to the DEFAULT theme color when createBeanieSessionBody() is called " +
        " when the user profile passed in as param  DOES NOT have a theme color", async () => {
            const fakeData = {};
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const defaultTheme = "#43dbbd";
            const expectedTheme = defaultTheme
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            expectedUserProfile.userPreferences = {
                general: {
                    currentTheme: null
                }
            };
            const userHasNoTheme = !expectedUserProfile.userPreferences.general.currentTheme;
            assert(userHasNoTheme);
            const beanieParams = [fakeContext, fakeData];
            TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: "someFakeCustomer"
                        }
                    }
                }
            });
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            const beanieColor = beanieSession.body.primary_color;
            const beanieColorIsCorrect = beanieColor == expectedTheme;
            assert(beanieColorIsCorrect);
            assert(beanieColor != null);
        });

    it("should set the beanie session baseUrl to the user's applications baseURL when createBeanieSessionBody() is called " +
        " when the params passed in specifiy a base/origin URL", async () => {
            const expectedOrigin = "someFakeOriginURL/#"
            const fakeData = {
                fullUrl: expectedOrigin
            };
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            const beanieParams = [fakeContext, fakeData];
            TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: "someFakeCustomer"
                        }
                    }
                }
            });
            assert(fakeData.fullUrl != null);
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            const beanieSuccessLink = beanieSession.body.success_url;
            const beanieFailureLink = beanieSession.body.cancel_url;
            const beanieSuccessIsCorrect = beanieSuccessLink.includes(expectedOrigin);
            const beanieFailureIsCorrect = beanieFailureLink.includes(expectedOrigin);
            const beanieOriginIsCorrect = (beanieSuccessIsCorrect && beanieFailureIsCorrect);
            assert(beanieOriginIsCorrect);
        });

    it("should set the beanie session baseUrl to logmarter.net when createBeanieSessionBody() is called " +
        " when the params passed in do NOT specifiy a base/origin URL", async () => {
            const defaultURL = "https://www.logsmarter.net/"
            const expectedOrigin = defaultURL;
            const fakeData = {
                fullUrl: null
            } as any;
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            const beanieParams = [fakeContext, fakeData];
            TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: "someFakeCustomer"
                        }
                    }
                }
            });
            assert(fakeData.fullUrl == null);
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            const beanieSuccessLink = beanieSession.body.success_url;
            const beanieFailureLink = beanieSession.body.cancel_url;
            const beanieSuccessIsCorrect = beanieSuccessLink.includes(expectedOrigin);
            const beanieFailureIsCorrect = beanieFailureLink.includes(expectedOrigin);
            const beanieOriginIsCorrect = (beanieSuccessIsCorrect && beanieFailureIsCorrect);
            assert(beanieOriginIsCorrect);
        });

    it("should NOT set the beanie session mode to subscription when createBeanieSessionBody() is called " +
        " if the user does NOT have a subscription", async () => {
            const fakeData = {};
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            expectedUserProfile.subscriptionID = null;
            expectedUserProfile.subscriptionStatus = null;
            const beanieParams = [fakeContext, fakeData];
            TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: "someFakeCustomer"
                        }
                    }
                }
            });
            assert(expectedUserProfile.subscriptionID == null);
            assert(expectedUserProfile.subscriptionStatus != Tiers.SUBSCRIPTION_STATUS_ACTIVE);
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            assert(beanieSession.body.mode != 'subscription');
            assert(beanieSession.body.mode == null)
        });

    it("should NOT set the beanie session mode to subscription when createBeanieSessionBody() is called " +
        " if the user has a subscription but it is NOT an active subscription", async () => {
            const fakeData = {};
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            expectedUserProfile.subscriptionID = "itsNotNull";
            expectedUserProfile.subscriptionStatus = "notActive"
            const beanieParams = [fakeContext, fakeData];
            TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: "someFakeCustomer"
                        }
                    }
                }
            });
            assert(expectedUserProfile.subscriptionID != null);
            assert(expectedUserProfile.subscriptionStatus != Tiers.SUBSCRIPTION_STATUS_ACTIVE);
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            assert(beanieSession.body.mode != 'subscription');
            assert(beanieSession.body.mode == null)
        });

    it("should set the beanie session mode to subscription when createBeanieSessionBody() is called " +
        " if the user has a subscription and it is an active subscription", async () => {
            const fakeData = {};
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            expectedUserProfile.subscriptionID = "itsNotNull";
            expectedUserProfile.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
            const beanieParams = [fakeContext, fakeData];
            TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: "someFakeCustomer"
                        }
                    }
                }
            });
            assert(expectedUserProfile.subscriptionID != null);
            assert(expectedUserProfile.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE);
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            assert(beanieSession.body.mode == 'subscription');
        });

    it("should set the following default properties when the beanieSession mode is subscrtipion and createBeanieSessionBody() " +
        " is called: client_reference_id, billing_address_collection, save_payment_method, tax_calculation, setup_future_usage, subscriptionPlan" +
        " prefill the email and add the gateway and customer ID", async () => {
            const fakeData = {};
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            expectedUserProfile.subscriptionID = "itsNotNull";
            expectedUserProfile.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
            const beanieParams = [fakeContext, fakeData];
            const expectedUID = "fakeUID";
            TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => expectedUID);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            const expectedCustomer = "someFakeCustomer";
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: expectedCustomer
                        }
                    }
                }
            });
            assert(expectedUserProfile.subscriptionID != null);
            assert(expectedUserProfile.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE);
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            const beanieData = beanieSession.body;
            assert(beanieData.client_reference_id == expectedUID);
            assert(beanieData.billing_address_collection == 'required');
            assert(beanieData.coupon_collection == true);
            assert(beanieData.save_payment_method == 'always');
            assert(beanieData.tax_calculation == 'exclusive');
            assert(beanieData.setup_future_usage == 'off_session');
            assert(beanieData.subscription_data.subscription_items[0].plan == PaymentServices.PREMIUM_MONTHLY_PLAN_ID_INDIVIDUAL);
            assert(beanieData.subscription_data.subscription_items.length == 1);
            assert(beanieData.prefill_data.customer_email == expectedEmail);
            assert(beanieData.gateway == 'stripe');
            assert(beanieData.customer == expectedCustomer);
        });


    it("should set the following default properties when the beanieSession mode is  NOT subscrtipion and createBeanieSessionBody() " +
        " is called: client_reference_id, billing_address_collection, save_payment_method, tax_calculation, setup_future_usage, subscriptionPlan" +
        " prefill the email and add the gateway and customer ID", async () => {
            const fakeData = {};
            const fakeContext = {};
            const expectedEmail = TestHelpers.getRandomEmail();
            const expectedUserProfile = TestHelpers.getRandomUserProfile();
            expectedUserProfile.subscriptionID = null;
            expectedUserProfile.subscriptionStatus = null;
            const beanieParams = [fakeContext, fakeData];
            const expectedUID = "fakeUID";
            TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => expectedUID);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => expectedEmail);
            TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
            TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
            const expectedCustomer = "someFakeCustomer";
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        return {
                            customer: expectedCustomer
                        }
                    }
                }
            });
            assert(expectedUserProfile.subscriptionID == null);
            assert(expectedUserProfile.subscriptionStatus != Tiers.SUBSCRIPTION_STATUS_ACTIVE);
            const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
            const beanieData = beanieSession.body;
            assert(beanieData.client_reference_id == expectedUID);
            assert(beanieData.billing_address_collection == 'required');
            assert(beanieData.coupon_collection == true);
            assert(beanieData.save_payment_method == 'always');
            assert(beanieData.tax_calculation == 'exclusive');
            assert(beanieData.setup_future_usage == 'off_session');
            assert(beanieData.subscription_data.subscription_items[0].plan == PaymentServices.PREMIUM_MONTHLY_PLAN_ID_INDIVIDUAL);
            assert(beanieData.subscription_data.subscription_items.length == 1);
            assert(beanieData.prefill_data.customer_email == expectedEmail);
            assert(beanieData.gateway == null);
            assert(beanieData.customer == null);
        });

    it("should always make a post request to the beanie session URL when createBeanieSessionBody() is invoked", async () => {
        const fakeData = {};
        const fakeContext = {};
        const expectedUserProfile = TestHelpers.getRandomUserProfile();
        const beanieParams = [fakeContext, fakeData];
        TestHelpers.spyOnIndividualExport(Profile, 'getUidFromContext', async () => { });
        TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => { });
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => expectedUserProfile);
        TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async (params: any) => params);
        TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
            subscriptions: {
                retrieve: async () => {
                    return {
                        customer: "someFakeCustomer"
                    }
                }
            }
        });
        const beanieSession: any = await PaymentServices.createBeanieBody(beanieParams);
        assert(beanieSession.url == 'https://apiv2.octobat.com/beanie/sessions');
        assert(beanieSession.method == 'POST');
        assert(beanieSession.auth.user == PaymentServices.OCTOBAT_SECRET_KEY);
    });

    it("should delete the user's subscription if it exists when cancelSubscriptionBody() is called ", async () => {
        const expectedSubIdToBeDeleted = "someFakeId";
        const fakeContext = {};
        const fakeData = {};
        const userThatOwnsSubscription = TestHelpers.getRandomUserProfile();
        userThatOwnsSubscription.subscriptionID = expectedSubIdToBeDeleted;
        userThatOwnsSubscription.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => {
            return userThatOwnsSubscription;
        });
        TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => { });
        let deleteGotCalled = false;
        let deletedObject = null;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
            subscriptions: {
                del: async (objToDel: any) => {
                    deletedObject = objToDel;
                    deleteGotCalled = true;
                }
            }
        });
        assert(!deletedObject)
        assert(!deleteGotCalled);
        TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
        assert(userThatOwnsSubscription.subscriptionID && userThatOwnsSubscription.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE);
        await PaymentServices.cancelSubBody([fakeContext, fakeData]);
        assert(deleteGotCalled);
        assert(deletedObject == expectedSubIdToBeDeleted);
    });

    it("should NOT delete the user's subscription if it does NOT exist when cancelSubscriptionBody() is called ", async () => {
        const fakeContext = {};
        const fakeData = {};
        const userThatOwnsSubscription = TestHelpers.getRandomUserProfile();
        userThatOwnsSubscription.subscriptionID = null;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => {
            return userThatOwnsSubscription;
        });
        TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => { });
        let deleteGotCalled = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
            subscriptions: {
                del: async (objToDel: any) => {
                    deleteGotCalled = true;
                }
            }
        });
        assert(!deleteGotCalled);
        TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
        assert(!userThatOwnsSubscription.subscriptionID);
        await PaymentServices.cancelSubBody([fakeContext, fakeData]);
        assert(!deleteGotCalled);
    });

    it("should do nothing when keepSubscriptionDataInSync() is called  if the user does not have a subscription", async () => {
        let subRetrieveWasCalled = false;
        let custRetreieveWasCalled = false;
        let custUpdateWasCalled = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
            subscriptions: {
                retrieve: async () => {
                    subRetrieveWasCalled = true;
                }
            },
            customers: {
                retrieve: async () => {
                    custRetreieveWasCalled = true;
                },
                update: async () => {
                    custUpdateWasCalled = true
                }
            }
        });
        const userProf = TestHelpers.getRandomUserProfile();
        userProf.subscriptionID = null;
        userProf.subscriptionStatus = null;
        const hasSubscription: boolean = userProf.subscriptionID != null;
        const hasActiveSubscription: boolean = (hasSubscription && (userProf.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE));
        assert(!hasActiveSubscription);
        assert(!custRetreieveWasCalled)
        assert(!custUpdateWasCalled);
        assert(!subRetrieveWasCalled);
        await PaymentServices.keepSubscriptionDataInSync(userProf);
        assert(!custRetreieveWasCalled)
        assert(!custUpdateWasCalled);
        assert(!subRetrieveWasCalled);
    });

    it("should do nothing when keepSubscriptionDataInSync() is called if the user has an inactive subscription", async () => {
        let subRetrieveWasCalled = false;
        let custRetreieveWasCalled = false;
        let custUpdateWasCalled = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
            subscriptions: {
                retrieve: async () => {
                    subRetrieveWasCalled = true;
                }
            },
            customers: {
                retrieve: async () => {
                    custRetreieveWasCalled = true;
                },
                update: async () => {
                    custUpdateWasCalled = true
                }
            }
        });
        const userProf = TestHelpers.getRandomUserProfile();
        userProf.subscriptionID = "notNull";
        userProf.subscriptionStatus = "notActive";
        const hasSubscription: boolean = userProf.subscriptionID != null;
        const hasActiveSubscription: boolean = (hasSubscription && (userProf.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE));
        assert(!hasActiveSubscription);
        assert(!custRetreieveWasCalled)
        assert(!custUpdateWasCalled);
        assert(!subRetrieveWasCalled);
        await PaymentServices.keepSubscriptionDataInSync(userProf);
        assert(!custRetreieveWasCalled)
        assert(!custUpdateWasCalled);
        assert(!subRetrieveWasCalled);
    });

    it("should NOT update the customer when keepSubscriptionDataInSync() is called if the user has an active subscription" +
        " but their profile email matches the email that is on record for their stripe customer object", async () => {
            let subRetrieveWasCalled = false;
            let custRetreieveWasCalled = false;
            let custUpdateWasCalled = false;
            const userProf = TestHelpers.getRandomUserProfile();
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        subRetrieveWasCalled = true;
                        return {
                            customer: "someFakeCust"
                        }
                    }
                },
                customers: {
                    retrieve: async () => {
                        custRetreieveWasCalled = true;
                        const emailthatMatches = userProf.emailAddr
                        assert((emailthatMatches == userProf.emailAddr));
                        return {
                            email: emailthatMatches
                        }
                    },
                    update: async () => {
                        custUpdateWasCalled = true
                    }
                }
            });
            userProf.subscriptionID = "somefakeSUbscriptionId";
            userProf.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
            const hasSubscription: boolean = userProf.subscriptionID != null;
            const hasActiveSubscription: boolean = (hasSubscription && (userProf.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE));
            assert(hasActiveSubscription);
            assert(!custRetreieveWasCalled)
            assert(!custUpdateWasCalled);
            assert(!subRetrieveWasCalled);
            await PaymentServices.keepSubscriptionDataInSync(userProf);
            assert(custRetreieveWasCalled)
            assert(subRetrieveWasCalled);
            assert(!custUpdateWasCalled);
        });

    it("should NOT update the customer when keepSubscriptionDataInSync() is called if the user has an active subscription that is no from stripe", async () => {
        let subRetrieveWasCalled = false;
        let custRetreieveWasCalled = false;
        let custUpdateWasCalled = false;
        const userProf = TestHelpers.getRandomUserProfile();
        userProf.subPlatform = "somePlatformNotWeb";
        TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
            subscriptions: {
                retrieve: async () => {
                    subRetrieveWasCalled = true;
                    return {
                        customer: "someFakeCust"
                    }
                }
            },
            customers: {
                retrieve: async () => {
                    custRetreieveWasCalled = true;
                    const emailthatMatches = userProf.emailAddr
                    assert((emailthatMatches == userProf.emailAddr));
                    return {
                        email: emailthatMatches
                    }
                },
                update: async () => {
                    custUpdateWasCalled = true
                }
            }
        });
        userProf.subscriptionID = "somefakeSUbscriptionId";
        userProf.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
        const hasSubscription: boolean = userProf.subscriptionID != null;
        const hasActiveSubscription: boolean = (hasSubscription && (userProf.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE));
        assert(hasActiveSubscription);
        assert(!custRetreieveWasCalled)
        assert(!custUpdateWasCalled);
        assert(!subRetrieveWasCalled);
        await PaymentServices.keepSubscriptionDataInSync(userProf);
        assert(!custRetreieveWasCalled)
        assert(!subRetrieveWasCalled);
        assert(!custUpdateWasCalled);
    });

    it("should update the customer when keepSubscriptionDataInSync() is called if the user has an active subscription" +
        " but their profile email does not match the email that is on record for their stripe customer object " +
        " by rewriting the email of the customer object to the email of the user profile", async () => {
            let subRetrieveWasCalled = false;
            let custRetreieveWasCalled = false;
            let custUpdateWasCalled = false;
            const userProf = TestHelpers.getRandomUserProfile();
            let params1ForUpdate: any = null;
            let params2ForUpdate: any = null;
            const expectedCustId = "someFakeCust";
            TestHelpers.spyOnIndividualExport(PaymentServices, 'stripe', {
                subscriptions: {
                    retrieve: async () => {
                        subRetrieveWasCalled = true;
                        return {
                            customer: expectedCustId
                        }
                    }
                },
                customers: {
                    retrieve: async () => {
                        custRetreieveWasCalled = true;
                        const emailthatNeverMatches = userProf.emailAddr + "otherChars"
                        assert((emailthatNeverMatches != userProf.emailAddr));
                        return {
                            email: emailthatNeverMatches
                        }
                    },
                    update: async (params1: any, params2: any) => {
                        params1ForUpdate = params1;
                        params2ForUpdate = params2;
                        custUpdateWasCalled = true
                    }
                }
            });
            userProf.subscriptionID = "somefakeSUbscriptionId";
            userProf.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
            const hasSubscription: boolean = userProf.subscriptionID != null;
            const hasActiveSubscription: boolean = (hasSubscription && (userProf.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE));
            assert(hasActiveSubscription);
            assert(!custRetreieveWasCalled)
            assert(!custUpdateWasCalled);
            assert(!subRetrieveWasCalled);
            await PaymentServices.keepSubscriptionDataInSync(userProf);
            assert(custRetreieveWasCalled)
            assert(subRetrieveWasCalled);
            assert(custUpdateWasCalled);
            assert(params1ForUpdate == expectedCustId);
            assert(params2ForUpdate.email == userProf.emailAddr);
        });

    it("should assign a sub status of active, the premium tier name and whatever platform is passed in when activateSubscription() is called ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        await PaymentServices.activateSubscription("fakeUid", subId, subPlatform);
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE);
        assert(user.subscriptionTier == Tiers.PREMIUM_TIER_NAME);
    });

    it("should NOT assign a sub status of active, the premium tier name and whatever platform is passed in when activateSubscription() is called if the user already has those properties ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        user.subscriptionID = subId;
        user.subPlatform = subPlatform;
        user.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
        user.subscriptionTier = Tiers.PREMIUM_TIER_NAME;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        await PaymentServices.activateSubscription("fakeUid", subId, subPlatform);
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE);
        assert(user.subscriptionTier == Tiers.PREMIUM_TIER_NAME);
        assert(!updateWasCalled);
    });

    it("should assign a sub status of unpaid, the free tier name and whatever platform is already the users platform when dectivateSubscription() is called ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        user.subPlatform = subPlatform;
        user.subscriptionID = subId;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        await PaymentServices.deactivateSubscription("fakeUid");
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_UNPAID);
        assert(user.subscriptionTier == Tiers.FREE_TIER_NAME);
    });

    it("should call refferal helper if the users referredByProperty is not null and activateSubscription() is called ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        user.referredBy = "someUser"
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        let refHelperCalled: boolean = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'referralHelper', async (someUid: string, addIfTrueSubIfFalse: boolean) => {
            refHelperCalled = true;
            assert(addIfTrueSubIfFalse == true);
        });
        await PaymentServices.activateSubscription("fakeUid", subId, subPlatform);
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE);
        assert(user.subscriptionTier == Tiers.PREMIUM_TIER_NAME);
        assert(refHelperCalled);
    });

    it("should NOT call refferal helper if the users referredByProperty is null and activateSubscription() is called ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        user.subPlatform = subPlatform;
        user.subscriptionID = subId;
        user.referredBy = null;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        let refHelperCalled: boolean = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'referralHelper', async (someUid: string, addIfTrueSubIfFalse: boolean) => {
            refHelperCalled = true;
            assert(addIfTrueSubIfFalse == true);
        });
        await PaymentServices.activateSubscription("fakeUid", subId, subPlatform);
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_ACTIVE);
        assert(user.subscriptionTier == Tiers.PREMIUM_TIER_NAME);
        assert(!refHelperCalled);
    });

    it("should call refferal helper if the users referredByProperty is not null and deactivateSubscription() is called ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        user.subPlatform = subPlatform;
        user.subscriptionID = subId;
        user.subscriptionTier = "someOtherTier";
        user.subscriptionStatus = "someOtherStatus";
        user.referredBy = "someUser";
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        let refHelperCalled: boolean = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'referralHelper', async (someUid: string, addIfTrueSubIfFalse: boolean) => {
            refHelperCalled = true;
            assert(addIfTrueSubIfFalse == false);
        });
        await PaymentServices.deactivateSubscription("fakeUid");
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_UNPAID);
        assert(user.subscriptionTier == Tiers.FREE_TIER_NAME);
        assert(refHelperCalled);
    });

    it("should NOT call refferal helper if the users referredByProperty is null and deactivateSubscription() is called ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        user.subPlatform = subPlatform;
        user.subscriptionID = subId;
        user.referredBy = null;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        let refHelperCalled: boolean = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'referralHelper', async (someUid: string, addIfTrueSubIfFalse: boolean) => {
            refHelperCalled = true;
            assert(addIfTrueSubIfFalse == false);
        });
        await PaymentServices.deactivateSubscription("fakeUid");
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_UNPAID);
        assert(user.subscriptionTier == Tiers.FREE_TIER_NAME);
        assert(!refHelperCalled);
    });

    it("should NOT assign a sub status of unpaid, the free tier name and whatever platform is already the users platform when dectivateSubscription() is called ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const subId = "someFakeId";
        const subPlatform = " someFakePlatform";
        user.subPlatform = subPlatform;
        user.subscriptionID = subId;
        user.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_UNPAID;
        user.subscriptionTier = Tiers.FREE_TIER_NAME;
        TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => user);
        await PaymentServices.deactivateSubscription("fakeUid");
        assert(user.subscriptionID == subId);
        assert(user.subPlatform == subPlatform);
        assert(user.subscriptionStatus == Tiers.SUBSCRIPTION_STATUS_UNPAID);
        assert(user.subscriptionTier == Tiers.FREE_TIER_NAME);
        assert(!updateWasCalled);
    });

    it("should return true if the subscription is not expired and checkIfAppleSubscriptionIsValid() is called", async () => {
        const fakeSubId: string = "someSubscriptionID";
        const fakeReceipt: string = "someFakeReceipt";
        TestHelpers.spyOnIndividualExport(PaymentServices, 'getOwnerAndReceiptOfIAP', async () => {
            return {
                [PaymentServices.IAP_RECEIPT_KEY]: fakeReceipt
            } as any
        });
        TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async () => {
            return {
                latest_receipt_info: [
                    {
                        expires_date_ms: Number.MAX_SAFE_INTEGER
                    }
                ]
            } as any
        });
        assert((await PaymentServices.checkIfAppleSubscriptionIsValid(fakeSubId)) == true);
    });

    it("should return FALSE if the subscription check errors out and checkIfAppleSubscriptionIsValid() is called", async () => {
        const fakeSubId: string = "someSubscriptionID";
        const fakeReceipt: string = "someFakeReceipt";
        TestHelpers.spyOnIndividualExport(PaymentServices, 'getOwnerAndReceiptOfIAP', async () => {
            return {
                [PaymentServices.IAP_RECEIPT_KEY]: fakeReceipt
            } as any
        });
        TestHelpers.spyOnIndividualExport(FunctionWrappers, 'httpRequest', async () => {
            return null as any;
        });
        assert((await PaymentServices.checkIfAppleSubscriptionIsValid(fakeSubId)) == false);
    });

    it("should activate the subscription and set the owner of the iap when createSubscriptionForIAPBody() is called ", async () => {
        const fakeUID: any = "someFakeUID"
        TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => fakeUID);
        let activateSubscriptionWasCalled: any = false;
        let setOwnerOfIAPWasCalled: any = false;
        const context = {};
        const data = {
            subscriptionID: "fakeSUbId" as any,
            appStoreReceipt: "fakeAppStoreReceipt" as any
        }
        const fakeParams = [context, data];
        TestHelpers.spyOnIndividualExport(PaymentServices, 'activateSubscription', async (uid: any, subId: any, platform: any) => {
            activateSubscriptionWasCalled = true;
            assert(uid == fakeUID);
            assert(data.subscriptionID == subId);
            assert(platform == platforms.PLATFORM_iOS);
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, 'setOwnerOfIAP', async (subId: any, subReceipt: any, uid: any) => {
            setOwnerOfIAPWasCalled = true;
            assert(subId == data.subscriptionID);
            assert(subReceipt == data.appStoreReceipt);
            assert(uid == fakeUID);
        });
        await PaymentServices.createSubscriptionForIAPBody(fakeParams);
        assert(activateSubscriptionWasCalled == true);
        assert(setOwnerOfIAPWasCalled == true);
    });

    it("should deactivate the subscription if the user owns the subscription and their subscription is not active ", async () => {
        const fakeUID = "someFakeUID";
        const fakeData = {};
        const fakeContext = {
            auth: {
                uid: fakeUID
            }
        };
        const params = [fakeContext, fakeData];
        let activateSubscriptionWasCalled: any = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'activateSubscription', async (uid: any, subId: any, platform: any) => { activateSubscriptionWasCalled = true; });
        let deactivateSubscriptionWasCalled: any = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'deactivateSubscription', async (uid: any) => { deactivateSubscriptionWasCalled = true; });
        const userProfileFromDB = TestHelpers.getRandomUserProfile();
        userProfileFromDB.subscriptionStatus = "someFakeStatus"
        TestHelpers.spyOnIndividualExport(Profile, "getUserProfileFromUID", async (uid: any) => {
            if (uid == fakeUID) {
                return userProfileFromDB;
            }
            return null;
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "checkIfAppleSubscriptionIsValid", async (subId: string) => {
            return false
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "getOwnerAndReceiptOfIAP", async () => {
            return {
                [PaymentServices.IAP_OWNER_KEY]: fakeUID
            } as any;
        });
        const checkResp = await PaymentServices.checkSubStatusForIAPBody(params);
        assert(deactivateSubscriptionWasCalled == true);
        assert(activateSubscriptionWasCalled == false);
        assert(checkResp.subscriptionIsActive == false);
        assert(checkResp.subscriptionOwnerUID == fakeUID);
        assert(checkResp.subscriptionOwnerProfileIsActive == false);
    });


    it("should activate the subscription if the user owns the subscription and their subscription is active ", async () => {
        const fakeUID = "someFakeUID";
        const fakeData = {};
        const fakeContext = {
            auth: {
                uid: fakeUID
            }
        };
        const params = [fakeContext, fakeData];
        const userProfileFromDB = TestHelpers.getRandomUserProfile();
        let activateSubscriptionWasCalled: any = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'activateSubscription', async (uid: any, subId: any, platform: any) => {
            userProfileFromDB.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
            activateSubscriptionWasCalled = true;
        });
        let deactivateSubscriptionWasCalled: any = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'deactivateSubscription', async (uid: any) => {
            userProfileFromDB.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_UNPAID;
            deactivateSubscriptionWasCalled = true;
        });
        userProfileFromDB.subscriptionStatus = "someFakeStatus"
        TestHelpers.spyOnIndividualExport(Profile, "getUserProfileFromUID", async (uid: any) => {
            if (uid == fakeUID) {
                return userProfileFromDB;
            }
            return null;
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "checkIfAppleSubscriptionIsValid", async (subId: string) => {
            return true
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "getOwnerAndReceiptOfIAP", async () => {
            return {
                [PaymentServices.IAP_OWNER_KEY]: fakeUID
            } as any;
        });
        const checkResp = await PaymentServices.checkSubStatusForIAPBody(params);
        assert(deactivateSubscriptionWasCalled == false);
        assert(activateSubscriptionWasCalled == true);
        assert(checkResp.subscriptionIsActive == true);
        assert(checkResp.subscriptionOwnerUID == fakeUID);
        assert(checkResp.subscriptionOwnerProfileIsActive == true);
    });

    it("should NOT activate the subscription if the user does not own the subscription and it is active ", async () => {
        const fakeUID = "someFakeUID";
        const fakeData = {
            subId: "someStupidFuckingId" as any
        };
        const fakeContext = {
            auth: {
                uid: fakeUID
            }
        };
        const params = [fakeContext, fakeData];
        const userProfileFromDB = TestHelpers.getRandomUserProfile();
        const fakeStatus = "someFakeStatus";
        userProfileFromDB.subscriptionStatus = fakeStatus;
        userProfileFromDB.subscriptionID = "someRandomSubID"
        let activateSubscriptionWasCalled: any = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'activateSubscription', async (uid: any, subId: any, platform: any) => {
            userProfileFromDB.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
            activateSubscriptionWasCalled = true;
        });
        let deactivateSubscriptionWasCalled: any = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'deactivateSubscription', async (uid: any) => {
            userProfileFromDB.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_UNPAID;
            deactivateSubscriptionWasCalled = true;
        });
        userProfileFromDB.subscriptionStatus = "someFakeStatus"
        TestHelpers.spyOnIndividualExport(Profile, "getUserProfileFromUID", async (uid: any) => {
            if (uid == fakeUID) {
                return userProfileFromDB;
            } else {
                return TestHelpers.getRandomUserProfile()
            }
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "checkIfAppleSubscriptionIsValid", async (subId: string) => {
            return true
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "getOwnerAndReceiptOfIAP", async () => {
            return {
                [PaymentServices.IAP_OWNER_KEY]: fakeUID + "someOtherChars"
            } as any;
        });
        const checkResp = await PaymentServices.checkSubStatusForIAPBody(params);
        assert(deactivateSubscriptionWasCalled == false);
        assert(activateSubscriptionWasCalled == false);
        assert(checkResp.subscriptionIsActive == true);
        assert(checkResp.subscriptionOwnerUID != fakeUID);
        assert(userProfileFromDB.subscriptionStatus == fakeStatus);
    });

    it("should deactivate the subscription if the user does not own the subscription and  a new guy took his subscription ", async () => {
        const fakeUID = "someFakeUID";
        const fakeData = {
            subId: "someStupidFuckingId" as any
        };
        const fakeContext = {
            auth: {
                uid: fakeUID
            }
        };
        const params = [fakeContext, fakeData];
        const userProfileFromDB = TestHelpers.getRandomUserProfile();
        const fakeStatus = "someFakeStatus";
        userProfileFromDB.subscriptionStatus = fakeStatus;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'activateSubscription', async (uid: any, subId: any, platform: any) => {
            userProfileFromDB.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
        });
        let deactivateSubscriptionWasCalled: any = false;
        TestHelpers.spyOnIndividualExport(PaymentServices, 'deactivateSubscription', async (uid: any) => {
            userProfileFromDB.subscriptionStatus = Tiers.SUBSCRIPTION_STATUS_UNPAID;
            deactivateSubscriptionWasCalled = true;
        });
        userProfileFromDB.subscriptionStatus = "someFakeStatus"
        TestHelpers.spyOnIndividualExport(Profile, "getUserProfileFromUID", async (uid: any) => {
            if (uid == fakeUID) {
                return userProfileFromDB;
            } else {
                return TestHelpers.getRandomUserProfile()
            }
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "checkIfAppleSubscriptionIsValid", async (subId: string) => {
            return false
        });
        TestHelpers.spyOnIndividualExport(PaymentServices, "getOwnerAndReceiptOfIAP", async () => {
            return {
                [PaymentServices.IAP_OWNER_KEY]: fakeUID + "someOtherChars"
            } as any;
        });
        const checkResp = await PaymentServices.checkSubStatusForIAPBody(params);
        assert(deactivateSubscriptionWasCalled == true);
        assert(checkResp.subscriptionIsActive == false);
        assert(checkResp.subscriptionOwnerUID != fakeUID);
    });

    it("should add one point to the user who referred if referralHelper is called and referredBy is not null and addReferral is true", async () => {
        const userWhoReferred = TestHelpers.getRandomUserProfile();
        TestHelpers.spyOnIndividualExport(Profile, "getUserProfileFromUID", async (uid: any) => {
            return userWhoReferred;
        });
        await PaymentServices.referralHelper("someUID", true);
        assert(userWhoReferred.numReferrals == 1);
        assert(updateWasCalled == true);
        await PaymentServices.referralHelper("someUID", true);
        assert(userWhoReferred.numReferrals == 2);
        assert(updateWasCalled == true);
        await PaymentServices.referralHelper("someUID", true);
        assert(userWhoReferred.numReferrals == 3);
        assert(updateWasCalled == true);
        userWhoReferred.numReferrals = 766
        await PaymentServices.referralHelper("someUID", true);
        assert(userWhoReferred.numReferrals == 767);
        assert(updateWasCalled == true);
    });

    it("should subtract one point from the user who referred if referralHelper is called and referredBy is not null and addReferral is true", async () => {
        const userWhoReferred = TestHelpers.getRandomUserProfile();
        userWhoReferred.numReferrals = 7;
        TestHelpers.spyOnIndividualExport(Profile, "getUserProfileFromUID", async (uid: any) => {
            return userWhoReferred;
        });
        await PaymentServices.referralHelper("someUID", false);
        assert(userWhoReferred.numReferrals == 6);
        assert(updateWasCalled == true);
        await PaymentServices.referralHelper("someUID", false);
        assert(userWhoReferred.numReferrals == 5);
        assert(updateWasCalled == true);
        await PaymentServices.referralHelper("someUID", false);
        assert(userWhoReferred.numReferrals == 4);
        assert(updateWasCalled == true);
        userWhoReferred.numReferrals = 766
        await PaymentServices.referralHelper("someUID", false);
        assert(userWhoReferred.numReferrals == 765);
        assert(updateWasCalled == true);
    });

    it("should not do anything if referralHelper is called and referredBy is null and addReferral is true or false", async () => {
        TestHelpers.spyOnIndividualExport(Profile, "getUserProfileFromUID", async () => {
            return null as any;
        });
        await PaymentServices.referralHelper("someUID", false);
        await PaymentServices.referralHelper("someUID", true);
        assert(updateWasCalled == false);
    });

});