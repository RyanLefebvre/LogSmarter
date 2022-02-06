import { TestHelpers } from './testHelpers';
import { ObjectStorageService } from './object-storage.service';
import { autoSpy } from 'autoSpy';

describe('ObjectStorageService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: ObjectStorageService;

  beforeEach(() => {
    service = setup().build();
  })

  it('should convert a nutrition log into a JSON object when convertLogSummaryToFireStorageFormat is called', () => {
    expect(service.convertLogSummaryToFireStorageFormat(testHelpers.getRandomNutritionLog())).toBeDefined();
  });

  it('should convert a JSON object into a nutrition log when convertLogSummaryFromFireStorageFormat is called', () => {
    const jsonLog = service.convertLogSummaryToFireStorageFormat(testHelpers.getRandomNutritionLog());
    expect(service.convertLogSummaryFromFireStorageFormat(jsonLog)).toBeDefined();
  });

  it('should return a deep copy of the nutrition log when deepCopyNutrLog is called', () => {
    expect(service.deepCopyNutrLog(null)).toBe(null);
    expect(service.deepCopyNutrLog(testHelpers.getRandomNutritionLog())).toBeDefined();
  });

  it('should convert an array of day entries to a JSON object when convertDayEntryListToFireStorageFormat is called', () => {
    expect(service.convertDayEntryListToFireStorageFormat(testHelpers.getRandomEntryList())).toBeDefined();
  });

  it('should convert a JSON object into an array of day entry objects when convertDayEntryListFromStorageFormat is called', () => {
    const jsonLogs = service.convertDayEntryListToFireStorageFormat(testHelpers.getRandomEntryList());
    expect(service.convertDayEntryListFromStorageFormat(jsonLogs)).toBeDefined();
  });

  it('should convert a day entry to a JSON object when convertEntryToFireStorageFormat is called', () => {
    expect(service.convertEntryToFireStorageFormat(testHelpers.getRandomEntry())).toBeDefined();
  });

  it('should convert a JSON object into a day entry object when convertEntryFromFireStorageFormat is called', () => {
    const json = service.convertEntryToFireStorageFormat(testHelpers.getRandomEntry());
    expect(service.convertEntryFromFireStorageFormat(json)).toBeDefined();
  });

  it("should return an empty day entry list if convertDayEntryListFromStorageFormat() is called with a null obj", () => {
    expect(service.convertDayEntryListFromStorageFormat(null).length).toBe([].length)
  });

});

function setup() {

  const builder = {

    default() {
      return builder;
    },
    build() {
      return new ObjectStorageService();
    }
  };

  return builder;
}
