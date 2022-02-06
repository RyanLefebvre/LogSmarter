import { TestHelpers } from './testHelpers';

describe('TestHelpers', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: TestHelpers;

  beforeEach(() => {
    service = setup().build();
  });

  it('should generate a random list of logs when getRandomListOfLogs is called', () => {
    expect(service.getRandomListOfLogs()).toBeDefined();
  });

  it('should generate an n-sized list of logs when getRandomListOfLogsOfLength is called', () => {
    for (let n = 1; n < 10; n++) {
      expect(service.getRandomListOfLogsOfLength(n).length).toBe(n);
    }
  });

  it('should generate a nutrition log when getRandomNutritionLog is called', () => {
    expect(service.getRandomNutritionLog()).toBeDefined();
  });

  it('should generate an array of day entrys when getRandomEntryList is called', () => {
    expect(service.getRandomEntryList()).toBeDefined();
  });

  it('should generate an array of day entries of n-length when getRandomEntryListOfLength is called', () => {
    for (let n = 1; n < 10; n++) {
      expect(service.getRandomEntryListOfLength(n).length).toBe(n);
    }
  });

  it('should generate a day entry when getRandomEntry is called', () => {
    expect(service.getRandomEntry()).toBeDefined();
  });

  it('should return a number allowed as a day entry calorie amount when getRandomCalories is called', () => {
    expect(service.getRandomCalories()).toBeDefined();
  });

  it('should return a number allowed as weight when getRandomWeight is called', () => {
    expect(service.getRandomWeight()).toBeDefined();
  });

  it('should return a number within a range when getRandomWithinArbitraryRange is called', () => {
    const offset = 25;
    for (let n = 1; n < 10; n++) {
      const lowerBound = n;
      const uppoerBound = n + offset;
      const r = service.getRandomWithinArbitraryRange(lowerBound, uppoerBound);
      expect(r >= lowerBound && r < uppoerBound).toBe(true);
    }
  });

  it('should create a random date when getRandomDate is called', () => {
    expect(service.getRandomDate()).toBeDefined();
  });

  it('should return a random item in the array when getRandomFrom is called', () => {
    const arr = new Array("writing", "unit", "tests", "is", "so", "much", "fun");
    const random = service.getRandomFrom(arr);
    expect(arr.includes(random)).toBe(true);
    expect(service.getRandomFrom({ length: false } as any)).toBe("");
  });

  it('should return whether the component crashed during ngOnInit when testNgOnInit is called', () => {
    const component = {
      ngOnInit: function () { }
    };
    expect(service.testOnInit(component)).toBe(false);
    spyOn(component, 'ngOnInit').and.throwError("error");
    expect(service.testOnInit(component)).toBe(true);
  });

  it('should return whether the component crashed during ngOnDestroy when testNgOnDestroy is called', () => {
    const component = {
      ngOnDestroy: function () { }
    };
    expect(service.testOnDestroy(component)).toBe(false);
    spyOn(component, 'ngOnDestroy').and.throwError("error");
    expect(service.testOnDestroy(component)).toBe(true);
  });

  it('should create a free user profile when createFreeUserProfile is called', () => {
    expect(service.createFreeUserProfile().subscriptionTier).toBe("LS_FREE");
  });

  it('should create a premium user profile when createPremiumUserProfile is called', () => {
    expect(service.createPremiumUserProfile().subscriptionTier).toBe("PREMIUM");
  });

  it('should create a gold user profile when createGoldUserProfile is called', () => {
    expect(service.createGoldUserProfile().subscriptionTier).toBe("GOLD");
  });

  it('should return if the user has preference editing permission when mockPreferencesAllowPreferenceEditing is called', () => {
    expect(service.mockPreferencesAllowPreferenceEditing(service.createFreeUserProfile())).toBe(false);
    expect(service.mockPreferencesAllowPreferenceEditing(service.createPremiumUserProfile())).toBe(true);
    expect(service.mockPreferencesAllowPreferenceEditing(service.createGoldUserProfile())).toBe(true);
  });

  it('should return the account tier associated with the users subscription tier when mockTierPermissionServiceGetUserTier is called', () => {
    expect(service.mockTierPermissionServiceGetUserTier(service.createFreeUserProfile())).toBe(service.accountTiers[0]);
    expect(service.mockTierPermissionServiceGetUserTier(service.createPremiumUserProfile())).toBe(service.accountTiers[1]);
    expect(service.mockTierPermissionServiceGetUserTier(service.createGoldUserProfile())).toBe(service.accountTiers[2]);
  });
});

function setup() {

  const builder = {

    default() {
      return builder;
    },
    build() {
      return new TestHelpers();
    }
  };

  return builder;
}
