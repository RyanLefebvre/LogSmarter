import { CallableWrapperService } from './callable-wrapper.service';
import { PaymentService } from './payments.service';
import { autoSpy } from 'autoSpy';
import { ConstantsService } from '../general/constants.service';
import { TimeService } from '../general/time-constant.service';
import { EnvironmentService } from '../general/environment.service';

describe('StripeService', () => {
  let service: PaymentService;
  let cloudFunctionSpy;

  beforeEach(() => {
    service = setup().build();
    cloudFunctionSpy = spyOn(service.wrapper, 'firebaseCloudFunction').and.returnValue(new Promise<any>(resolve => resolve(null)));
  });

  it('should cancel user stripe subscription when cancelUserStripeSubscription is called', (done) => {
    service.cancelUserStripeSubscription().then(() => {
      expect(cloudFunctionSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should get the beanie session for the user when getBeanieSessionForUser is called', (done) => {
    service.getBeanieSessionForUser().then(() => {
      expect(cloudFunctionSpy).toHaveBeenCalled();
      done();
    })
  });

  it("should check the status of the IAP subscription when checkStatusOfIAPSubscription() is called ", async () => {
    let originalId = "someFakeId";
    const retVal = "someVal" as any;
    service.wrapper.firebaseCloudFunction = jasmine.createSpy().and.callFake((func, obj) => {
      expect(func).toBe(service.CHECK_IAP_SUB_STATUS);
      expect(obj.subId).toBe(originalId);
      return retVal;
    })
    const response = await service.checkStatusOfIAPSubscription(originalId);
    expect(response).toBe(retVal);
  });

  it("should check the status of the IAP subscription when checkStatusOfIAPSubscription() is called even if the id is null ", async () => {
    let originalId = null;
    const retVal = "someVal" as any;
    service.wrapper.firebaseCloudFunction = jasmine.createSpy().and.callFake((func, obj) => {
      expect(func).toBe(service.CHECK_IAP_SUB_STATUS);
      expect(obj.subId).toBe(originalId);
      return retVal;
    })
    const response = await service.checkStatusOfIAPSubscription(originalId);
    expect(response).toBe(retVal);
  });

  it("should check the status of the IAP subscription when createIAPSubscription() is called ", async () => {
    let subId = "someId";
    let subReceipt = "someReceipt";
    const retVal = "someVal" as any;
    service.wrapper.firebaseCloudFunction = jasmine.createSpy().and.callFake((func, obj) => {
      expect(func).toBe(service.CREATE_IAP_SUBSCRIPTION);
      expect(obj.subscriptionID).toBe(subId);
      expect(obj.appStoreReceipt).toBe(subReceipt);
      return retVal;
    })
    const response = await service.attemptToCreateIAPSubscription(subId, subReceipt);
    expect(response).toBe(retVal);
  });

  it('should attempt to create an IAB subscription when attemptToCreateIABSubscription() is called ', async () => {
    const fakeID = "someFakeID"
    let wasCalled = false;
    service.wrapper.firebaseCloudFunction = (name, params): any => {
      expect(name).toBe(service.CREATE_IAB_SUBSCRIPTION);
      expect(params.subscriptionID).toBe(fakeID);
      wasCalled = true;
    };
    await service.attemptToCreateIABSubscription(fakeID);
    expect(wasCalled).toBe(true);
  });

});

function setup() {
  const wrapper = autoSpy(CallableWrapperService);
  const constantsService = autoSpy(ConstantsService);
  const time = autoSpy(TimeService);
  const env = autoSpy(EnvironmentService);
  const builder = {
    wrapper,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new PaymentService(constantsService, time, wrapper, env);
    }
  };

  return builder;
}
