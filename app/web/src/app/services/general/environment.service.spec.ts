import { TestHelpers } from './testHelpers';
import { EnvironmentService } from './environment.service';
import { } from 'autoSpy';

describe('EnvironmentService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: EnvironmentService;

  beforeEach(() => {
    service = setup().default().build();
  });

  it('should return the correct variable when getOctobatPublicKey is called', () => {
    expect(service.getOctobatPublicKey()).toBe(service.OCTOBAT_PUBLIC_KEY_DEV);
    service.isProduction = true;
    expect(service.getOctobatPublicKey()).toBe(service.OCTOBAT_PUBLIC_KEY_PROD);
  });

  it('should return the correct variable when getCorrectEnvironmentVariable is called', () => {
    const dev = "dev";
    const prod = "prod";
    expect(service.getCorrectEnvironmentVariable(dev, prod)).toBe(dev);
    service.isProduction = true;
    expect(service.getCorrectEnvironmentVariable(dev, prod)).toBe(prod);
  });

  it("should return the fovea validator url when getFoveaValidatorURL() is called", () => {
    expect(service.getFoveaValidatorURL()).toBe(service.VALIDATOR_URL);
  });

  it("should return the coach id when getCoachId() is called", () => {
    expect(service.getCoachIdIAP()).toBe(service.COACH_ID_IAP);
  });

  it("should return the individual id when getIndividualId() is called", () => {
    expect(service.getIndividualId()).toBe(service.INDIVIDUAL_ID_IAP);
  });

  it("should return the android sub if getIndividualID is called and the env is android", () => {
    service.isAndroid = true;
    expect(service.getIndividualId()).toBe(service.INDIVIDUAL_ID_IAB);
  });

});

function setup() {

  const builder = {

    default() {
      return builder;
    },
    build() {
      return new EnvironmentService();
    }
  };

  return builder;
}
