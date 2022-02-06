import * as TestHelpers from './testHelpers';
import * as Profile from '../src/services/profile';
import * as LogCalc from '../src/services/algorithm/logStatCalculator'
import * as Energy from '../src/constants/energyConstants'
import * as RFRModel from '../src/services/algorithm/rfrModel'
import * as algo from '../src/services/algorithm/energyAlgorithm';
import * as Tiers from '../src/services/tiers';
import * as payments from '../src/services/payments';
import * as admin from '../src/services/admin';
import { UserProfile } from '../src/classes/user-profile';
import { assert } from 'console';
import { CallableContext } from 'firebase-functions/lib/providers/https';

describe("Functions/Services/Profile", () => {

  afterEach(() => {
    TestHelpers.resetAllSpies();
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => {
      return null as any;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => {
      return null as any;
    });
  });

  it("should return false if the user's profile before and after are exactly the same then checkIfDemographicInfoChanged()", () => {
    const newUserProfile: UserProfile = TestHelpers.getRandomUserProfile();
    const userProfileFromDB: UserProfile = TestHelpers.deepCopy(newUserProfile);
    const demoInfoHasChanged = Profile.checkIfUserDemographicInfoChanged(newUserProfile, userProfileFromDB);
    assert(demoInfoHasChanged === false);
  });

  it("should return true if the user's profile height is diffrent and checkIfDemographicInfoChanged()", () => {
    const newUserProfile: UserProfile = TestHelpers.getRandomUserProfile();
    const userProfileFromDB: UserProfile = TestHelpers.deepCopy(newUserProfile);
    userProfileFromDB.height_inches = -1;
    const demoInfoHasChanged = Profile.checkIfUserDemographicInfoChanged(newUserProfile, userProfileFromDB);
    assert(demoInfoHasChanged === true);
  });

  it("should return true if the user's profile weight is diffrent and checkIfDemographicInfoChanged()", () => {
    const newUserProfile: UserProfile = TestHelpers.getRandomUserProfile();
    const userProfileFromDB: UserProfile = TestHelpers.deepCopy(newUserProfile);
    userProfileFromDB.weight_lbs = -1;
    const demoInfoHasChanged = Profile.checkIfUserDemographicInfoChanged(newUserProfile, userProfileFromDB);
    assert(demoInfoHasChanged === true);
  });

  it("should return true if the user's profile age is diffrent and checkIfDemographicInfoChanged()", () => {
    const newUserProfile: UserProfile = TestHelpers.getRandomUserProfile();
    const userProfileFromDB: UserProfile = TestHelpers.deepCopy(newUserProfile);
    userProfileFromDB.age = -1;
    const demoInfoHasChanged = Profile.checkIfUserDemographicInfoChanged(newUserProfile, userProfileFromDB);
    assert(demoInfoHasChanged === true);
  });

  it("should return true if the user's profile activity level is diffrent and checkIfDemographicInfoChanged()", () => {
    const newUserProfile: UserProfile = TestHelpers.getRandomUserProfile();
    const userProfileFromDB: UserProfile = TestHelpers.deepCopy(newUserProfile);
    userProfileFromDB.activityLevel = "someOtherActivityLevel";
    const demoInfoHasChanged = Profile.checkIfUserDemographicInfoChanged(newUserProfile, userProfileFromDB);
    assert(demoInfoHasChanged === true);
  });

  it("should return true if the user's gender is diffrent and checkIfDemographicInfoChanged()", () => {
    const newUserProfile: UserProfile = TestHelpers.getRandomUserProfile();
    const userProfileFromDB: UserProfile = TestHelpers.deepCopy(newUserProfile);
    userProfileFromDB.isMale = !newUserProfile.isMale;
    const demoInfoHasChanged = Profile.checkIfUserDemographicInfoChanged(newUserProfile, userProfileFromDB);
    assert(demoInfoHasChanged === true);
  });

  it("should return false if the user's non-demographic info is diffrent and checkIfDemographicInfoChanged()", () => {
    const newUserProfile: UserProfile = TestHelpers.getRandomUserProfile();
    const userProfileFromDB: UserProfile = TestHelpers.deepCopy(newUserProfile);
    userProfileFromDB.username = TestHelpers.getRandomUsername();
    userProfileFromDB.subscriptionID = "someID";
    userProfileFromDB.emailAddr = TestHelpers.getRandomEmail();
    const demoInfoHasChanged = Profile.checkIfUserDemographicInfoChanged(newUserProfile, userProfileFromDB);
    assert(demoInfoHasChanged === false);
  });

  it("should not update the user's profile in the db when nutritionLogEditedTriggerBody() is called and the edited log is not the main log ", async () => {
    const idOfTheUserThatOwnsTheLog = "someFakeUID";
    const idOfTheLogThatWasEdited = 123456789;
    const fakeSnap = {};
    const fakeContext = {
      params: {
        userID: idOfTheUserThatOwnsTheLog,
        nutrLogID: idOfTheLogThatWasEdited
      }
    };
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID',
      async (uid: any): Promise<UserProfile> => {
        const profileOfLogOwner: UserProfile = TestHelpers.getRandomUserProfile();
        const somethingOtherThanTheLogEditedId = 696969420;
        profileOfLogOwner.mainNutrLogId = somethingOtherThanTheLogEditedId;
        const logEditedIsNotTheMainLog = (profileOfLogOwner.mainNutrLogId != fakeContext.params.nutrLogID)
        assert(logEditedIsNotTheMainLog);
        return profileOfLogOwner;
      });
    let updateInDBWasCalled = false;
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB',
      async (): Promise<any> => {
        updateInDBWasCalled = true;
        return null;
      });
    TestHelpers.spyOnIndividualExport(admin, 'getNutrLogFromLogId', () => {
      return {} as any;
    });
    await Profile.nutritionLogEditedTriggerBody(fakeSnap, fakeContext);
    assert(updateInDBWasCalled === false);
  });

  it("should update the user's profile in the db when nutritionLogEditedTriggerBody() is called and the edited log is the " +
    "user's main log and their profile weight does not match their main log's current weight", async () => {
      const idOfTheUserThatOwnsTheLog = "someFakeUID";
      const idOfTheLogThatWasEdited = 123456789;
      const fakeCurrentWeight: number = 187.56;
      const fakeSnap = {
        after: {
          data: () => {
            return TestHelpers.convertDayEntryListToFireStorageFormat(TestHelpers.getRandomEntryList());
          }
        }
      };
      const fakeContext = {
        params: {
          userID: idOfTheUserThatOwnsTheLog,
          nutrLogID: idOfTheLogThatWasEdited
        }
      };
      const profileOfLogOwner: UserProfile = TestHelpers.getRandomUserProfile();
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID',
        async (): Promise<UserProfile> => {
          profileOfLogOwner.mainNutrLogId = idOfTheLogThatWasEdited;
          const valueThatWillForceDifferentWeights = fakeCurrentWeight + 1;
          profileOfLogOwner.weight_lbs = valueThatWillForceDifferentWeights;
          const logEditedIsMainLog = (profileOfLogOwner.mainNutrLogId == fakeContext.params.nutrLogID)
          assert(logEditedIsMainLog);
          return profileOfLogOwner;
        });
      let updateInDBWasCalled: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB',
        async (): Promise<any> => {
          updateInDBWasCalled = true;
          return null;
        });
      TestHelpers.spyOnIndividualExport(admin, 'getNutrLogFromLogId', () => {
        return {} as any;
      });
      TestHelpers.spyOnIndividualExport(algo, 'getEnergyPayload', () => {
        return {
          currentWeight: fakeCurrentWeight,
          estimatedTDEE: profileOfLogOwner.estimatedTDEE
        } as any;
      });
      const currentWeightAndProfWeightAreNotTheSame = ((await algo.getEnergyPayload(null, null)).currentWeight != (await Profile.getUserProfileFromUID(null)).weight_lbs);
      assert(currentWeightAndProfWeightAreNotTheSame);
      await Profile.nutritionLogEditedTriggerBody(fakeSnap, fakeContext);
      assert(updateInDBWasCalled === true);
    });

  it("should NOT update the user's profile in the db when nutritionLogEditedTriggerBody() is called and the edited log is the " +
    "user's main log and their profile weight is the same as their main log's current weight and the TDEE is the same", async () => {
      const idOfTheUserThatOwnsTheLog = "someFakeUID";
      const idOfTheLogThatWasEdited = 123456789;
      const fakeCurrentWeight = 187.56;
      const fakeTDEE = 69420;
      const fakeSnap = {
        after: {
          data: () => {
            return TestHelpers.convertDayEntryListToFireStorageFormat(TestHelpers.getRandomEntryList());
          }
        }
      };
      const fakeContext = {
        params: {
          userID: idOfTheUserThatOwnsTheLog,
          nutrLogID: idOfTheLogThatWasEdited
        }
      };
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID',
        async (): Promise<UserProfile> => {
          const profileOfLogOwner: UserProfile = TestHelpers.getRandomUserProfile();
          profileOfLogOwner.estimatedTDEE = fakeTDEE;
          profileOfLogOwner.mainNutrLogId = idOfTheLogThatWasEdited;
          profileOfLogOwner.weight_lbs = fakeCurrentWeight;
          const logEditedIsMainLog = (profileOfLogOwner.mainNutrLogId == fakeContext.params.nutrLogID)
          assert(logEditedIsMainLog);
          return profileOfLogOwner;
        });
      let updateInDBWasCalled: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB',
        async (): Promise<any> => {
          updateInDBWasCalled = true;
          return null;
        });
      TestHelpers.spyOnIndividualExport(algo, 'getEnergyPayload', async () => {
        return {
          currentWeight: fakeCurrentWeight,
          estimatedTDEE: fakeTDEE
        };
      })
      const currentWeightAndProfWeightAreTheSame = ((await algo.getEnergyPayload(null, null)).currentWeight == (await Profile.getUserProfileFromUID(null)).weight_lbs);
      assert(currentWeightAndProfWeightAreTheSame);
      TestHelpers.spyOnIndividualExport(admin, 'getNutrLogFromLogId', () => {
        return {} as any;
      });
      await Profile.nutritionLogEditedTriggerBody(fakeSnap, fakeContext);
      assert(updateInDBWasCalled === false);
    });

  it("should NOT update the user's profile in the db when nutritionLogEditedTriggerBody() is called and the edited log is the " +
    "user's main log and their main log's current weight is INSUFFICIENT_DATA", async () => {
      const idOfTheUserThatOwnsTheLog = "someFakeUID";
      const idOfTheLogThatWasEdited = 123456789;
      const fakeSnap = {
        after: {
          data: () => {
            return TestHelpers.convertDayEntryListToFireStorageFormat(TestHelpers.getRandomEntryList());
          }
        }
      };
      const fakeContext = {
        params: {
          userID: idOfTheUserThatOwnsTheLog,
          nutrLogID: idOfTheLogThatWasEdited
        }
      };
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID',
        async (): Promise<UserProfile> => {
          const profileOfLogOwner: UserProfile = TestHelpers.getRandomUserProfile();
          profileOfLogOwner.estimatedTDEE = null;
          profileOfLogOwner.mainNutrLogId = idOfTheLogThatWasEdited;
          const logEditedIsMainLog = (profileOfLogOwner.mainNutrLogId == fakeContext.params.nutrLogID)
          assert(logEditedIsMainLog);
          return profileOfLogOwner;
        });
      let updateInDBWasCalled: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB',
        async (): Promise<any> => {
          updateInDBWasCalled = true;
          return null;
        });
      TestHelpers.spyOnIndividualExport(algo, 'getEnergyPayload', async () => {
        return {
          currentWeight: Energy.INSUFFICIENT_DATA,
          estimatedTDEE: null as any
        };
      })
      const currentWeightIsInsufficient = (LogCalc.getCurrentWeightForLog(null) == Energy.INSUFFICIENT_DATA);
      assert(currentWeightIsInsufficient);
      TestHelpers.spyOnIndividualExport(admin, 'getNutrLogFromLogId', () => {
        return {} as any;
      });
      await Profile.nutritionLogEditedTriggerBody(fakeSnap, fakeContext);
      assert(updateInDBWasCalled === false);
    });

  it("should set the user's weight to their main logs current weight when nutritionLogEditedTriggerBody() is called" +
    " and the edited log is the user's main log and their profile weight does not match their main log's current weight", async () => {
      const idOfTheUserThatOwnsTheLog = "someFakeUID";
      const idOfTheLogThatWasEdited = 123456789;
      const fakeCurrentWeight: number = 187.56;
      const fakeSnap = {
        after: {
          data: () => {
            return TestHelpers.convertDayEntryListToFireStorageFormat(TestHelpers.getRandomEntryList());
          }
        }
      };
      const fakeContext = {
        params: {
          userID: idOfTheUserThatOwnsTheLog,
          nutrLogID: idOfTheLogThatWasEdited
        }
      };

      const referenceToProfile: UserProfile = TestHelpers.getRandomUserProfile();
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID',
        async (): Promise<UserProfile> => {
          const profileOfLogOwner: UserProfile = referenceToProfile;
          profileOfLogOwner.mainNutrLogId = idOfTheLogThatWasEdited;
          const valueThatWillForceDifferentWeights = fakeCurrentWeight + 1;
          profileOfLogOwner.weight_lbs = valueThatWillForceDifferentWeights;
          const logEditedIsMainLog = (profileOfLogOwner.mainNutrLogId == fakeContext.params.nutrLogID)
          assert(logEditedIsMainLog);
          return profileOfLogOwner;
        });
      let updateInDBWasCalled: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB',
        async (): Promise<any> => {
          updateInDBWasCalled = true;
          return null;
        });
      TestHelpers.spyOnIndividualExport(algo, 'getEnergyPayload', async () => {
        return {
          currentWeight: fakeCurrentWeight,
          estimatedTDEE: referenceToProfile.estimatedTDEE
        };
      })
      const currentWeightAndProfWeightAreNotTheSame = ((await algo.getEnergyPayload(null, null)).currentWeight != (await Profile.getUserProfileFromUID(null)).weight_lbs);
      assert(currentWeightAndProfWeightAreNotTheSame);
      TestHelpers.spyOnIndividualExport(admin, 'getNutrLogFromLogId', () => {
        return {} as any;
      });
      await Profile.nutritionLogEditedTriggerBody(fakeSnap, fakeContext);
      assert(updateInDBWasCalled === true);
      assert(referenceToProfile.weight_lbs == fakeCurrentWeight);
    });


  it("should set the user's TDEE to their main log's TDEE when nutritionLogEditedTriggerBody() is called" +
    " and the edited log is the user's main log and their profile TDEE does not match their main log's TDEE", async () => {
      const idOfTheUserThatOwnsTheLog = "someFakeUID";
      const idOfTheLogThatWasEdited = 123456789;
      const fakeCurrentWeight: number = 187.56;
      const fakeSnap = {
        after: {
          data: () => {
            return TestHelpers.convertDayEntryListToFireStorageFormat(TestHelpers.getRandomEntryList());
          }
        }
      };
      const fakeContext = {
        params: {
          userID: idOfTheUserThatOwnsTheLog,
          nutrLogID: idOfTheLogThatWasEdited
        }
      };

      const referenceToProfile: UserProfile = TestHelpers.getRandomUserProfile();
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID',
        async (): Promise<UserProfile> => {
          const profileOfLogOwner: UserProfile = referenceToProfile;
          profileOfLogOwner.mainNutrLogId = idOfTheLogThatWasEdited;
          const valueThatWillForceDifferentWeights = fakeCurrentWeight;
          profileOfLogOwner.weight_lbs = valueThatWillForceDifferentWeights;
          const logEditedIsMainLog = (profileOfLogOwner.mainNutrLogId == fakeContext.params.nutrLogID)
          assert(logEditedIsMainLog);
          return profileOfLogOwner;
        });
      let updateInDBWasCalled: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB',
        async (): Promise<any> => {
          updateInDBWasCalled = true;
          return null;
        });
      TestHelpers.spyOnIndividualExport(algo, 'getEnergyPayload', async () => {
        return {
          currentWeight: fakeCurrentWeight,
          estimatedTDEE: referenceToProfile.estimatedTDEE + 10
        };
      })
      const currentWeightAndProfWeightAreTheSame = ((await algo.getEnergyPayload(null, null)).currentWeight == (await Profile.getUserProfileFromUID(null)).weight_lbs);
      assert(currentWeightAndProfWeightAreTheSame);
      const currentWeightAndProfTDEEAreNotTheSame = ((await algo.getEnergyPayload(null, null)).estimatedTDEE != (await Profile.getUserProfileFromUID(null)).estimatedTDEE);
      assert(currentWeightAndProfTDEEAreNotTheSame);
      TestHelpers.spyOnIndividualExport(admin, 'getNutrLogFromLogId', () => {
        return {} as any;
      });
      await Profile.nutritionLogEditedTriggerBody(fakeSnap, fakeContext);
      assert(updateInDBWasCalled === true);
      assert(referenceToProfile.weight_lbs == fakeCurrentWeight);
    });

  it("should update the user's TDEE if the updateTDEE flag is true and userUpdatedTriggerBody() is called", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceToProfile = TestHelpers.getRandomUserProfile();
    const oldTDEE = -1;
    referenceToProfile.estimatedTDEE = oldTDEE;
    const dummyNewTdee = TestHelpers.getRandomCalories();
    assert(oldTDEE != dummyNewTdee);
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
      if (uid == userId) {
        const profileToReturn = referenceToProfile;
        profileToReturn.needToUpdateTDEE = true;
        assert(profileToReturn.needToUpdateTDEE);
        return profileToReturn;
      } else {
        return null;
      }
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => dummyNewTdee);
    TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => TestHelpers.getRandomTierPermissions());
    TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
    let updateInDBWasCalled: any = false;
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { updateInDBWasCalled = true; });
    await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
    const tdeeGotSetToNewValue = referenceToProfile.estimatedTDEE == dummyNewTdee;
    const updatesGotPushedToDb = (updateInDBWasCalled == true);
    const tdeeWasUpdated = (tdeeGotSetToNewValue && updatesGotPushedToDb);
    assert(tdeeWasUpdated);
  });

  it("should NOT update the user's TDEE if the updateTDEE flag is false and userUpdatedTriggerBody() is called", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceToProfile = TestHelpers.getRandomUserProfile();
    const oldTDEE = -1;
    referenceToProfile.estimatedTDEE = oldTDEE;
    const dummyNewTdee = TestHelpers.getRandomCalories();
    assert(oldTDEE != dummyNewTdee);
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
      if (uid == userId) {
        const profileToReturn = referenceToProfile;
        profileToReturn.needToUpdateTDEE = false;
        assert(!profileToReturn.needToUpdateTDEE);
        return profileToReturn;
      } else {
        return null;
      }
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => dummyNewTdee);
    TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => TestHelpers.getRandomTierPermissions());
    TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
    const tdeeDidNotGetSetToNewValue = referenceToProfile.estimatedTDEE != dummyNewTdee;
    assert(tdeeDidNotGetSetToNewValue);
  });

  it("should set the updateTDEE flag back to false when userUpdatedTriggerBody() is called "
    + "and the updateTDEE flag is true causing a TDEE re-calculation ", async () => {
      const userId = " fakeUserId";
      const fakeSnap: any = null;
      const fakeContext: any = {
        params: {
          userID: userId
        }
      };
      const referenceToProfile = TestHelpers.getRandomUserProfile();
      const oldTDEE = -1;
      referenceToProfile.estimatedTDEE = oldTDEE;
      const dummyNewTdee = TestHelpers.getRandomCalories();
      assert(oldTDEE != dummyNewTdee);
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
        if (uid == userId) {
          const profileToReturn = referenceToProfile;
          profileToReturn.needToUpdateTDEE = true;
          assert(profileToReturn.needToUpdateTDEE);
          return profileToReturn;
        } else {
          return null;
        }
      });
      TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => dummyNewTdee);
      TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => TestHelpers.getRandomTierPermissions());
      TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
      TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
      await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
      const doesNotNeedToUpdateTDEE = (referenceToProfile.needToUpdateTDEE == false);
      assert(doesNotNeedToUpdateTDEE);
    });

  it("should NOT update the user's tier permissions if userUpdatedTriggerBody() is called " +
    " and the user's expected permissions match their actual permissions", async () => {
      const userId = " fakeUserId";
      const fakeSnap: any = null;
      const fakeContext: any = {
        params: {
          userID: userId
        }
      };
      const referenceToProfile = TestHelpers.getRandomUserProfile();
      const expectedPermissions = TestHelpers.getRandomTierPermissions();
      const oldTDEE = -1;
      referenceToProfile.estimatedTDEE = oldTDEE;
      const dummyNewTdee = TestHelpers.getRandomCalories();
      assert(oldTDEE != dummyNewTdee);
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
        if (uid == userId) {
          const profileToReturn = referenceToProfile;
          profileToReturn.tierPermissions = expectedPermissions
          assert(referenceToProfile.tierPermissions == expectedPermissions);
          return profileToReturn;
        } else {
          return null;
        }
      });
      TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => dummyNewTdee);
      TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => expectedPermissions);
      TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
      TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
      let updatedPermissions: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { updatedPermissions = true });
      await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
      const premissionsNotUpdated = !(updatedPermissions);
      assert(premissionsNotUpdated);
      const permissionsStillHaveTheSameValue = referenceToProfile.tierPermissions == expectedPermissions;
      assert(permissionsStillHaveTheSameValue);
    });

  it("should update the user's tier permissions if userUpdatedTriggerBody() is called " +
    "and the user's expected permissions do NOT match their actual permissions", async () => {
      const userId = " fakeUserId";
      const fakeSnap: any = null;
      const fakeContext: any = {
        params: {
          userID: userId
        }
      };
      const referenceToProfile = TestHelpers.getRandomUserProfile();
      const expectedPermissions = TestHelpers.getRandomTierPermissions();
      TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => {
        const forceDifferentPermissions = TestHelpers.deepCopy(expectedPermissions);
        forceDifferentPermissions.randomPropertyToForceInequality = "notTheSameObjectAnyMore"
      });
      const oldTDEE = -1;
      referenceToProfile.estimatedTDEE = oldTDEE;
      const dummyNewTdee = TestHelpers.getRandomCalories();
      assert(oldTDEE != dummyNewTdee);
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
        if (uid == userId) {
          const profileToReturn = referenceToProfile;
          profileToReturn.tierPermissions = expectedPermissions
          assert(referenceToProfile.tierPermissions == expectedPermissions);
          assert(referenceToProfile.tierPermissions != Tiers.getUserTier(null, null));
          return profileToReturn;
        } else {
          return null;
        }
      });
      TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => dummyNewTdee);
      TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
      TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
      let updatedPermissions: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { updatedPermissions = true });
      await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
      const premissionsWereUpdated = updatedPermissions;
      assert(premissionsWereUpdated);
      const permissionsNowHaveTheUpdatedValue = referenceToProfile.tierPermissions == Tiers.getUserTier(null, null);
      assert(permissionsNowHaveTheUpdatedValue);
    });

  it("should update the user's profile in the db if they only need to update their TDEE " +
    "and userUpdatedTriggerBody() is called", async () => {
      const userId = " fakeUserId";
      const fakeSnap: any = null;
      const fakeContext: any = {
        params: {
          userID: userId
        }
      };
      const referenceToProfile = TestHelpers.getRandomUserProfile();
      const expectedPermissions = TestHelpers.getRandomTierPermissions();
      const oldTDEE = -1;
      referenceToProfile.estimatedTDEE = oldTDEE;
      const dummyNewTdee = TestHelpers.getRandomCalories();
      assert(oldTDEE != dummyNewTdee);
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
        if (uid == userId) {
          const profileToReturn = referenceToProfile;
          profileToReturn.needToUpdateTDEE = true;
          assert(profileToReturn.needToUpdateTDEE);
          profileToReturn.tierPermissions = expectedPermissions
          assert(referenceToProfile.tierPermissions == expectedPermissions);
          return profileToReturn;
        } else {
          return null;
        }
      });
      TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => dummyNewTdee);
      TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => expectedPermissions);
      TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
      TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
      let updatedInDB: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { updatedInDB = true });
      await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
      const permissionsStillHaveTheSameValue = referenceToProfile.tierPermissions == expectedPermissions;
      assert(permissionsStillHaveTheSameValue);
      const profileWasUpdated = updatedInDB;
      assert(profileWasUpdated);
    });

  it("should update the user's profile in the db if they only need to update their " +
    "permissions and userUpdatedTriggerBody() is called", async () => {
      const userId = " fakeUserId";
      const fakeSnap: any = null;
      const fakeContext: any = {
        params: {
          userID: userId
        }
      };
      const referenceToProfile = TestHelpers.getRandomUserProfile();
      const expectedPermissions = TestHelpers.getRandomTierPermissions();
      const dummyNewTdee = TestHelpers.getRandomCalories();
      TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => {
        const forceDifferentPermissions = TestHelpers.deepCopy(expectedPermissions);
        forceDifferentPermissions.randomPropertyToForceInequality = "notTheSameObjectAnyMore"
      });
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async (uid: any) => {
        if (uid == userId) {
          const profileToReturn = referenceToProfile;
          profileToReturn.needToUpdateTDEE = false;
          assert(!profileToReturn.needToUpdateTDEE);
          profileToReturn.tierPermissions = expectedPermissions
          assert(referenceToProfile.tierPermissions != Tiers.getUserTier(null, null));
          return profileToReturn;
        } else {
          return null;
        }
      });
      let gotNewTdee = false
      TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => {
        gotNewTdee = true;
        return dummyNewTdee
      });
      TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
      TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
      let updatedInDB: any = false;
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { updatedInDB = true });
      await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
      const permissionsNowHaveTheUpdatedValue = referenceToProfile.tierPermissions == Tiers.getUserTier(null, null);
      assert(permissionsNowHaveTheUpdatedValue);
      const profileWasUpdated = updatedInDB;
      assert(profileWasUpdated);
      const didntGetNewTDEE = !gotNewTdee;
      assert(didntGetNewTDEE);
    });

  it("should NOT update the user's profile in the db at all if they DO NOT need to update " +
    "their permissions  or TDEE and userUpdatedTriggerBody() is called", async () => {
      const userId = " fakeUserId";
      const fakeSnap: any = null;
      const fakeContext: any = {
        params: {
          userID: userId
        }
      };
      const fakePermissions = { propName: "someFakeObject" };
      TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => fakePermissions);
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
        const user = new UserProfile();
        user.needToUpdateTDEE = false;
        user.tierPermissions = fakePermissions;
        return user;
      });
      TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
      TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
      TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
      let userWasUpdatedInDB = false
      TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', () => { userWasUpdatedInDB = true });
      await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
      const profileWasNotUpdated = !userWasUpdatedInDB;
      assert(profileWasNotUpdated);
    });

  it("should call updateEmailFeedbackCollection when userUpdatedTriggerBody() is called", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const fakePermissions = { propName: "someFakeObject" };
    TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => fakePermissions);
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      const user = new UserProfile();
      user.needToUpdateTDEE = false;
      user.tierPermissions = fakePermissions;
      return user;
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', () => { });
    let emailFeedbackUpdated = false;
    TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { emailFeedbackUpdated = true });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', () => { });
    await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
    assert(emailFeedbackUpdated);
  });

  it("should keep the user's subscription data in sync anytime that userUpdatedTriggerBody() is called", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const fakePermissions = { propName: "someFakeObject" };
    TestHelpers.spyOnIndividualExport(Tiers, 'getUserTier', () => fakePermissions);
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      const user = new UserProfile();
      user.needToUpdateTDEE = false;
      user.tierPermissions = fakePermissions;
      return user;
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateEmailFeedbackCollection', async () => { });
    let keptThemInSync = false;
    TestHelpers.spyOnIndividualExport(payments, 'keepSubscriptionDataInSync', async () => { keptThemInSync = true });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', () => { });
    await Profile.userUpdatedTriggerBody(fakeSnap, fakeContext);
    const keptSubscriptionInSync = keptThemInSync;
    assert(keptSubscriptionInSync);
  });

  it("should set the user's TDEE by calling the rfr model when userCreatedTriggerBody() is called ", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceTosUser = TestHelpers.getRandomUserProfile();
    referenceTosUser.estimatedTDEE = -1;
    const randTDEE = TestHelpers.getRandomCalories();
    assert(referenceTosUser.estimatedTDEE != randTDEE);
    const EMAIL_IS_NOT_AUTO_GOLD: boolean = false;
    TestHelpers.spyOnIndividualExport(Profile, 'emailIsAutoGold', async () => {
      return EMAIL_IS_NOT_AUTO_GOLD;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      return referenceTosUser;
    });
    let gotEstimatedWasCalled = false;
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => {
      gotEstimatedWasCalled = true;
      return randTDEE;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    await Profile.userCreatedTriggerBody(fakeSnap, fakeContext);
    const gotNewTDEE = gotEstimatedWasCalled;
    assert(gotNewTDEE);
    const tdeeIsTheExpectedValue = referenceTosUser.estimatedTDEE == randTDEE;
    assert(tdeeIsTheExpectedValue);
  });

  it("should update the user's email if they do NOT have an email and userCreatedTriggerBody() is called ", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceTosUser = TestHelpers.getRandomUserProfile();
    referenceTosUser.emailAddr = null;
    const randEmail = TestHelpers.getRandomEmail();
    assert(referenceTosUser.emailAddr == null && referenceTosUser.emailAddr != randEmail);
    const EMAIL_IS_NOT_AUTO_GOLD: boolean = false;
    TestHelpers.spyOnIndividualExport(Profile, 'emailIsAutoGold', async () => {
      return EMAIL_IS_NOT_AUTO_GOLD;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      return referenceTosUser;
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    let gotEmailWasCalled = false;
    TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => {
      gotEmailWasCalled = true;
      return randEmail;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    await Profile.userCreatedTriggerBody(fakeSnap, fakeContext);
    const emailWasUpdated = gotEmailWasCalled;
    assert(emailWasUpdated);
    const emailWasExpected = referenceTosUser.emailAddr == randEmail;
    assert(emailWasExpected);
  });

  it("should NOT update the user's email if they do have an email and userCreatedTriggerBody() is called ", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceTosUser = TestHelpers.getRandomUserProfile();
    referenceTosUser.emailAddr = TestHelpers.getRandomEmail();
    assert(referenceTosUser.emailAddr != null);
    const EMAIL_IS_NOT_AUTO_GOLD: boolean = false;
    TestHelpers.spyOnIndividualExport(Profile, 'emailIsAutoGold', async () => {
      return EMAIL_IS_NOT_AUTO_GOLD;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      return referenceTosUser;
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    let gotEmailWasCalled = false;
    TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => {
      gotEmailWasCalled = true;
      return "someFakeEmail@gmail.com";
    });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    await Profile.userCreatedTriggerBody(fakeSnap, fakeContext);
    const emailWasNotUpdated = !(gotEmailWasCalled);
    assert(emailWasNotUpdated);
    const emailIsNotNull = (referenceTosUser.emailAddr != null);
    assert(emailIsNotNull);
  });

  it("should set the user's tier permissions to the freeTierPermissions when userCreatedTriggerBody() is called ", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceTosUser = TestHelpers.getRandomUserProfile();
    referenceTosUser.tierPermissions = {};
    const freeTierPermissions = Tiers.freeTierPermissions();
    assert(!TestHelpers.isEquivalent(referenceTosUser.tierPermissions, freeTierPermissions));
    const EMAIL_IS_NOT_AUTO_GOLD: boolean = false;
    TestHelpers.spyOnIndividualExport(Profile, 'emailIsAutoGold', async () => {
      return EMAIL_IS_NOT_AUTO_GOLD;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      return referenceTosUser;
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    await Profile.userCreatedTriggerBody(fakeSnap, fakeContext);
    const userNowHasFreeTierPermission = (TestHelpers.isEquivalent(referenceTosUser.tierPermissions, freeTierPermissions));
    assert(userNowHasFreeTierPermission);
  });

  it("should set needsToUpdateTDEE to false when userCreatedTriggerBody() is called ", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceTosUser = TestHelpers.getRandomUserProfile();
    referenceTosUser.needToUpdateTDEE = true;
    assert(referenceTosUser.needToUpdateTDEE as any != false);
    const EMAIL_IS_NOT_AUTO_GOLD: boolean = false;
    TestHelpers.spyOnIndividualExport(Profile, 'emailIsAutoGold', async () => {
      return EMAIL_IS_NOT_AUTO_GOLD;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => referenceTosUser);
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    await Profile.userCreatedTriggerBody(fakeSnap, fakeContext);
    const doesNotNeedToUpdateTDEE = (referenceTosUser.needToUpdateTDEE as any == false);
    assert(doesNotNeedToUpdateTDEE);
  });

  it("should set the user's wasDeleted flag to true and update their profile in the db when userDeletedTriggerBody() is called", async () => {
    const fakeUser = {
      uid: "someFakeID"
    };
    const userProfRef = TestHelpers.getRandomUserProfile();
    userProfRef.wasDeleted = false;
    assert(userProfRef.wasDeleted != true)
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => userProfRef);
    let updateInDbWasCalled = false;
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { updateInDbWasCalled = true });
    await Profile.userDeletedTriggerBody(fakeUser);
    assert(updateInDbWasCalled);
    const wasDeletedFlagFlipped = userProfRef.wasDeleted;
    assert(wasDeletedFlagFlipped);
  });

  it("should set needToUpdateTdee to true when editUserProfileBody() is called if demographicInfoHasChanged() is true and the user did not manually change maintenance", async () => {
    const fakeContext: any = null;
    const userPassedIn: UserProfile = TestHelpers.getRandomUserProfile();
    const mockUserStateInDB: any = TestHelpers.getRandomUserProfile();
    mockUserStateInDB.hasLoggedInBefore = true;
    userPassedIn.estimatedTDEE = mockUserStateInDB.estimatedTDEE;
    mockUserStateInDB.needToUpdateTDEE = false;
    const params: [CallableContext, UserProfile] = [fakeContext, { user: userPassedIn } as any];
    TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
    TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => true);
    TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { });
    TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });
    assert(mockUserStateInDB.needToUpdateTDEE == false);
    await Profile.editUserProfileBody(params);
    assert(mockUserStateInDB.needToUpdateTDEE == true);
  });

  it("should NOT set needToUpdateTdee to true when editUserProfileBody() is called if demographicInfoHasChanged() is true and the user DID manually change maintenance", async () => {
    const fakeContext: any = null;
    const userPassedIn: any = TestHelpers.getRandomUserProfile();
    const mockUserStateInDB: any = TestHelpers.getRandomUserProfile();
    userPassedIn.estimatedTDEE = mockUserStateInDB.estimatedTDEE + 1;
    mockUserStateInDB.needToUpdateTDEE = false;
    const params: [CallableContext, UserProfile] = [fakeContext, { user: userPassedIn } as any];
    TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
    TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => true);
    TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { });
    TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });
    assert(mockUserStateInDB.needToUpdateTDEE == false);
    await Profile.editUserProfileBody(params);
    assert(mockUserStateInDB.needToUpdateTDEE == false);
  });

  it("should NOT set needToUpdateTdee to true when editUserProfileBody() is called if demographicInfoHasChanged() is false", async () => {
    const fakeContext: any = null;
    const userPassedIn: any = TestHelpers.getRandomUserProfile();
    const mockUserStateInDB: any = TestHelpers.getRandomUserProfile();
    mockUserStateInDB.needToUpdateTDEE = false;
    const params: [CallableContext, UserProfile] = [fakeContext, { user: userPassedIn } as any];
    TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
    TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
    TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { });
    TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });
    assert(mockUserStateInDB.needToUpdateTDEE == false);
    await Profile.editUserProfileBody(params);
    assert(mockUserStateInDB.needToUpdateTDEE == false);
  });

  it("should always copy the username, gender, age, weight, height, preferences and main log id from the profile passed in as"
    + " a param to the profile state from the db when editUseProfileBody() is called", async () => {
      const fakeContext: any = null;
      const userPassedIn: any = TestHelpers.getRandomUserProfile();
      const mockUserStateInDB: any = TestHelpers.getRandomUserProfile();
      mockUserStateInDB.hasLoggedInBefore = true;
      mockUserStateInDB.username = userPassedIn.userName + " some other text";
      mockUserStateInDB.isMale = !userPassedIn.isMale;
      mockUserStateInDB.age = userPassedIn.age + 1;
      mockUserStateInDB.weight_lbs = userPassedIn.weight_lbs + 1;
      mockUserStateInDB.height_inches = userPassedIn.height_inches + 1;
      mockUserStateInDB.activityLevel = "someFakeActivityLevelThatCantBeTheSame";
      mockUserStateInDB.userPreferences = { fakeProp: "notRealUserPrefs" };
      mockUserStateInDB.mainNutrLogId = "someFakeLogId";
      const params: [CallableContext, UserProfile] = [fakeContext, { user: userPassedIn } as any];
      TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
      TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
      TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { });
      TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });
      assert(mockUserStateInDB.username != userPassedIn.username);
      assert(mockUserStateInDB.isMale != userPassedIn.isMale);
      assert(mockUserStateInDB.age != userPassedIn.age);
      assert(mockUserStateInDB.weight_lbs != userPassedIn.weight_lbs);
      assert(mockUserStateInDB.height_inches != userPassedIn.height_inches);
      assert(mockUserStateInDB.activityLevel != userPassedIn.activityLevel);
      assert(mockUserStateInDB.userPreferences != userPassedIn.userPreferences);
      assert(mockUserStateInDB.mainNutrLogId != userPassedIn.mainNutrLogId);
      await Profile.editUserProfileBody(params);
      assert(mockUserStateInDB.username == userPassedIn.username);
      assert(mockUserStateInDB.isMale == userPassedIn.isMale);
      assert(mockUserStateInDB.age == userPassedIn.age);
      assert(mockUserStateInDB.weight_lbs == userPassedIn.weight_lbs);
      assert(mockUserStateInDB.height_inches == userPassedIn.height_inches);
      assert(mockUserStateInDB.activityLevel == userPassedIn.activityLevel);
      assert(TestHelpers.isEquivalent(mockUserStateInDB.userPreferences, userPassedIn.userPreferences));
      assert(mockUserStateInDB.mainNutrLogId == userPassedIn.mainNutrLogId);
    });

  it("should NOT copy the username, gender, age, weight, height, preferences and main log id from the profile passed in as"
    + " a param to the profile state from the db when editUseProfileBody() is called IF THE USER HAS NOT LOGGED IN", async () => {
      const fakeContext: any = null;
      const userPassedIn: any = TestHelpers.getRandomUserProfile();
      const mockUserStateInDB: any = TestHelpers.getRandomUserProfile();
      mockUserStateInDB.hasLoggedInBefore = false;
      mockUserStateInDB.username = userPassedIn.userName + " some other text";
      mockUserStateInDB.isMale = !userPassedIn.isMale;
      mockUserStateInDB.age = userPassedIn.age + 1;
      mockUserStateInDB.weight_lbs = userPassedIn.weight_lbs + 1;
      mockUserStateInDB.height_inches = userPassedIn.height_inches + 1;
      mockUserStateInDB.activityLevel = "someFakeActivityLevelThatCantBeTheSame";
      mockUserStateInDB.userPreferences = { fakeProp: "notRealUserPrefs" };
      mockUserStateInDB.mainNutrLogId = "someFakeLogId";
      const params: [CallableContext, UserProfile] = [fakeContext, { user: userPassedIn, setHasLoggedInBefore: true } as any];
      TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
      TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
      TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { });
      TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });
      assert(mockUserStateInDB.username != userPassedIn.username);
      assert(mockUserStateInDB.isMale != userPassedIn.isMale);
      assert(mockUserStateInDB.age != userPassedIn.age);
      assert(mockUserStateInDB.weight_lbs != userPassedIn.weight_lbs);
      assert(mockUserStateInDB.height_inches != userPassedIn.height_inches);
      assert(mockUserStateInDB.activityLevel != userPassedIn.activityLevel);
      assert(mockUserStateInDB.userPreferences != userPassedIn.userPreferences);
      assert(mockUserStateInDB.mainNutrLogId != userPassedIn.mainNutrLogId);
      assert(mockUserStateInDB.hasLoggedInBefore == false);
      await Profile.editUserProfileBody(params);
      assert(mockUserStateInDB.username != userPassedIn.username);
      assert(mockUserStateInDB.isMale != userPassedIn.isMale);
      assert(mockUserStateInDB.age != userPassedIn.age);
      assert(mockUserStateInDB.weight_lbs != userPassedIn.weight_lbs);
      assert(mockUserStateInDB.height_inches != userPassedIn.height_inches);
      assert(mockUserStateInDB.activityLevel != userPassedIn.activityLevel);
      assert(mockUserStateInDB.userPreferences != userPassedIn.userPreferences);
      assert(mockUserStateInDB.mainNutrLogId != userPassedIn.mainNutrLogId);
      assert(mockUserStateInDB.hasLoggedInBefore == true);
    });

  it("should always edit the user's profile in the db when editUserProfileBody() is called", async () => {
    const fakeContext: any = null;
    const userPassedIn: any = TestHelpers.getRandomUserProfile();
    const params: [CallableContext, UserProfile] = [fakeContext, { user: userPassedIn } as any];
    const mockUserStateInDB = TestHelpers.getRandomUserProfile();
    TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
    TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
    let userGotUpdatedInTheDb = false;
    TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { userGotUpdatedInTheDb = true; });
    TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });
    assert(!userGotUpdatedInTheDb)
    await Profile.editUserProfileBody(params);
    assert(userGotUpdatedInTheDb);
  });

  it("should always get the user's email from the auth table when editUserProfileBody() is called", async () => {
    const fakeContext: any = null;
    const userPassedIn: any = TestHelpers.getRandomUserProfile();
    const originalEmail = "someFakeEmail@gmail.com";
    const mockedEmailFromAuthTable = "fakeEmailFromAuthTable";
    const mockUserStateInDB: any = TestHelpers.getRandomUserProfile();
    mockUserStateInDB.hasLoggedInBefore = true;
    mockUserStateInDB.emailAddr = originalEmail;
    const params: [CallableContext, UserProfile] = [fakeContext, { user: userPassedIn } as any];
    TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
    TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
    let userGotEmailFromTheAuthTable = false;
    TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => {
      userGotEmailFromTheAuthTable = true;
      return mockedEmailFromAuthTable
    });
    assert(!userGotEmailFromTheAuthTable);
    assert(mockUserStateInDB.emailAddr != mockedEmailFromAuthTable);
    await Profile.editUserProfileBody(params);
    assert(userGotEmailFromTheAuthTable);
    assert(mockUserStateInDB.emailAddr == mockedEmailFromAuthTable);
  });

  it("should set the user's tier to the gold tier and their permissiosn to the gold tier permissions when userCreatedTrigger is called and their email is autogold ", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceTosUser = TestHelpers.getRandomUserProfile();
    referenceTosUser.subscriptionTier = null;
    referenceTosUser.tierPermissions = null;
    const expectedGoldTierPermissions: any = "someExpectedPermissions";
    const expectedGoldSubscriptionTier: any = "someExpectedTier";
    assert(referenceTosUser.subscriptionTier != expectedGoldSubscriptionTier);
    assert(referenceTosUser.tierPermissions != expectedGoldTierPermissions);
    const EMAIL_IS_AUTO_GOLD: boolean = true;
    TestHelpers.spyOnIndividualExport(Profile, 'emailIsAutoGold', async () => {
      return EMAIL_IS_AUTO_GOLD;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      return referenceTosUser;
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    TestHelpers.spyOnIndividualExport(Tiers, 'goldTierPermissions', () => {
      return expectedGoldTierPermissions;
    });
    TestHelpers.spyOnIndividualExport(Tiers, 'GOLD_TIER_NAME', expectedGoldSubscriptionTier);
    await Profile.userCreatedTriggerBody(fakeSnap, fakeContext);
    assert(referenceTosUser.subscriptionTier == expectedGoldSubscriptionTier);
    assert(referenceTosUser.tierPermissions == expectedGoldTierPermissions);
  });

  it("should NOT set the user's tier to the gold tier and their permissiosn to the gold tier permissions when userCreatedTrigger is called and their email is autogold ", async () => {
    const userId = " fakeUserId";
    const fakeSnap: any = null;
    const fakeContext: any = {
      params: {
        userID: userId
      }
    };
    const referenceTosUser = TestHelpers.getRandomUserProfile();
    referenceTosUser.subscriptionTier = null;
    referenceTosUser.tierPermissions = null;
    const expectedGoldTierPermissions: any = "someExpectedPermissions";
    const expectedGoldSubscriptionTier: any = "someExpectedTier";
    assert(referenceTosUser.subscriptionTier != expectedGoldSubscriptionTier);
    assert(referenceTosUser.tierPermissions != expectedGoldTierPermissions);
    const EMAIL_IS_NOT_AUTO_GOLD: boolean = false;
    TestHelpers.spyOnIndividualExport(Profile, 'emailIsAutoGold', async () => {
      return EMAIL_IS_NOT_AUTO_GOLD;
    });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => {
      return referenceTosUser;
    });
    TestHelpers.spyOnIndividualExport(RFRModel, 'getEstimatedTDEE', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'getUserEmailFromDB', async () => { });
    TestHelpers.spyOnIndividualExport(Profile, 'updateUserInDB', async () => { });
    TestHelpers.spyOnIndividualExport(Tiers, 'goldTierPermissions', () => {
      return expectedGoldTierPermissions;
    });
    TestHelpers.spyOnIndividualExport(Tiers, 'GOLD_TIER_NAME', expectedGoldSubscriptionTier);
    await Profile.userCreatedTriggerBody(fakeSnap, fakeContext);
    assert(referenceTosUser.subscriptionTier != expectedGoldSubscriptionTier);
    assert(referenceTosUser.tierPermissions != expectedGoldTierPermissions);
  });


  it("should always edit the user's profile and promoCode in the db when editUserPromoCode is called"
    + " and the user is a gold user, and their promoCode has been changed to a value not in use", async () => {
      const fakeContext: any = null;
      const userPassedIn: any = TestHelpers.getRandomUserProfile();
      userPassedIn.promoCode = 'OldPromo';
      userPassedIn.subscriptionTier = 'GOLD';
      const mockUserStateInDB = TestHelpers.getRandomUserProfile();
      mockUserStateInDB.promoCode = 'NewPromo';
      mockUserStateInDB.subscriptionTier = 'GOLD';
      const params: [CallableContext, UserProfile] = [fakeContext, userPassedIn];

      TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', () => "fakeUID");
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
      TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
      TestHelpers.spyOnIndividualExport(Profile, 'promoCodeInUse', async () => false);
      let userGotUpdatedInTheDb = false;
      let promoCodeGotUpdatedInTheDb = false;
      TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { userGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "updatePromoCodeInDB", async () => { promoCodeGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });

      assert(userGotUpdatedInTheDb == false);
      assert(promoCodeGotUpdatedInTheDb == false);

      const result = await Profile.editUserPromoCodeBody(params);

      assert(result.errMsg == undefined);
      assert(userGotUpdatedInTheDb != false);
      assert(promoCodeGotUpdatedInTheDb != false);
    });

  it("should NOT edit the user's profile and promoCode in the db when editUserPromoCode is called"
    + " if the promoCode is in use", async () => {
      const fakeContext: any = null;
      const userPassedIn: any = TestHelpers.getRandomUserProfile();
      userPassedIn.promoCode = 'OldPromo';
      userPassedIn.subscriptionTier = 'GOLD';
      const mockUserStateInDB = TestHelpers.getRandomUserProfile();
      mockUserStateInDB.promoCode = 'NewPromo';
      mockUserStateInDB.subscriptionTier = 'GOLD';
      const params: [CallableContext, UserProfile] = [fakeContext, userPassedIn];

      TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', () => "fakeUID");
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
      TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
      TestHelpers.spyOnIndividualExport(Profile, 'promoCodeInUse', async () => true);
      let userGotUpdatedInTheDb = false;
      let promoCodeGotUpdatedInTheDb = false;
      TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { userGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "updatePromoCodeInDB", async () => { promoCodeGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });

      assert(userGotUpdatedInTheDb == false);
      assert(promoCodeGotUpdatedInTheDb == false);

      const result = await Profile.editUserPromoCodeBody(params);

      assert(result.errMsg == 'This promo code is currently in use.');
      assert(userGotUpdatedInTheDb == false);
      assert(promoCodeGotUpdatedInTheDb == false);
    });

  it("should NOT edit the user's profile and promoCode in the db when editUserPromoCode is called"
    + " if the user already has the promoCode set in the DB", async () => {
      const fakeContext: any = null;
      const userPassedIn: any = TestHelpers.getRandomUserProfile();
      userPassedIn.promoCode = 'Promo';
      userPassedIn.subscriptionTier = 'GOLD';
      const mockUserStateInDB = TestHelpers.getRandomUserProfile();
      mockUserStateInDB.promoCode = 'Promo';
      mockUserStateInDB.subscriptionTier = 'GOLD';
      const params: [CallableContext, UserProfile] = [fakeContext, userPassedIn]

      TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
      TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
      TestHelpers.spyOnIndividualExport(Profile, 'promoCodeInUse', async () => false);
      let userGotUpdatedInTheDb = false;
      let promoCodeGotUpdatedInTheDb = false;
      TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { userGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "updatePromoCodeInDB", async () => { promoCodeGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });

      assert(userGotUpdatedInTheDb == false)
      assert(promoCodeGotUpdatedInTheDb == false);

      const result = await Profile.editUserPromoCodeBody(params);

      assert(result.errMsg == 'You currently have this promo code.');
      assert(userGotUpdatedInTheDb == false);
      assert(promoCodeGotUpdatedInTheDb == false);
    });

  it("should NOT edit the user's profile and promoCode in the db when editUserPromoCode is called"
    + " if the user state in the DB does not have a GOLD subscription tier", async () => {
      const fakeContext: any = null;
      const userPassedIn: any = TestHelpers.getRandomUserProfile();
      userPassedIn.promoCode = 'OldPromo';
      userPassedIn.subscriptionTier = 'GOLD';
      const mockUserStateInDB = TestHelpers.getRandomUserProfile();
      mockUserStateInDB.promoCode = 'NewPromo';
      mockUserStateInDB.subscriptionTier = 'LS_FREE';
      const params: [CallableContext, UserProfile] = [fakeContext, userPassedIn]

      TestHelpers.spyOnIndividualExport(Profile, 'getUIDFromContext', async () => "fakeUID");
      TestHelpers.spyOnIndividualExport(Profile, 'getUserProfile', async () => mockUserStateInDB);
      TestHelpers.spyOnIndividualExport(Profile, 'checkIfUserDemographicInfoChanged', () => false);
      TestHelpers.spyOnIndividualExport(Profile, 'promoCodeInUse', async () => false);
      let userGotUpdatedInTheDb = false;
      let promoCodeGotUpdatedInTheDb = false;
      TestHelpers.spyOnIndividualExport(Profile, "updateUserInDB", async () => { userGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "updatePromoCodeInDB", async () => { promoCodeGotUpdatedInTheDb = true; });
      TestHelpers.spyOnIndividualExport(Profile, "getUserEmailFromDB", async () => { });

      assert(userGotUpdatedInTheDb == false)
      assert(promoCodeGotUpdatedInTheDb == false);

      const result = await Profile.editUserPromoCodeBody(params);

      assert(result.errMsg == 'Only GOLD can users can set promo codes.');
      assert(userGotUpdatedInTheDb == false);
      assert(promoCodeGotUpdatedInTheDb == false);
    });

  it('should delete the user‘s promoCode from the database when their account is deleted', async () => {
    const fakeUser = {
      uid: "someFakeID"
    };
    const userProfRef = TestHelpers.getRandomUserProfile();
    userProfRef.wasDeleted = false;
    userProfRef.promoCode = 'PROMO';
    assert(!userProfRef.wasDeleted)
    TestHelpers.spyOnIndividualExport(Profile, 'getUserProfileFromUID', async () => userProfRef);
    let promoCodeDeletedFromDb = false;
    TestHelpers.spyOnIndividualExport(Profile, 'deletePromoCode', async () => { promoCodeDeletedFromDb = true });
    await Profile.userDeletedTriggerBody(fakeUser);
    assert(promoCodeDeletedFromDb);
  });
});