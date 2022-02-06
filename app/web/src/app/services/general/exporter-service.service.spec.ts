import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { ExporterService } from './exporter-service.service';
import { TestHelpers } from './testHelpers';

describe('FirebaseNutritionService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: ExporterService;

  beforeEach(() => {
    service = setup().build();
  });

  it("should call generateCsv when exportNutrLogToCSV() is called ", () => {
    const fakeExporter = {
      generateCsv: jasmine.createSpy()
    } as any;
    service.getExporter = () => {
      return fakeExporter;
    };
    const log: NutritionLog = testHelpers.getRandomNutritionLog();
    service.exportNutrLogToCSV(log);
    expect(fakeExporter.generateCsv).toHaveBeenCalled();
  });

  it("should NOT call generateCsv when exportNutrLogToCSV() is called and data is not empty ", () => {
    const fakeExporter = {
      generateCsv: jasmine.createSpy()
    } as any;
    service.getExporter = () => {
      return fakeExporter;
    };
    const log: NutritionLog = testHelpers.getRandomNutritionLog();
    log.dayEntries = [];
    service.exportNutrLogToCSV(log);
    expect(fakeExporter.generateCsv).not.toHaveBeenCalled();
    expect(service.snackBarService.showFailureMessage).toHaveBeenCalled();
  });

  it("should return an exporter when getExporter() is called", () => {
    expect(service.getExporter({
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
      filename: "title"
    })).not.toBeNull();
  });


});

function setup() {
  const builder = {
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new ExporterService({
        showSuccessMessage: jasmine.createSpy(),
        showFailureMessage: jasmine.createSpy()
      } as any);
    }
  };

  return builder;
}
