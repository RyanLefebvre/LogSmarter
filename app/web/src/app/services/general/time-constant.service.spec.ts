import { TimeService } from './time-constant.service';
import { autoSpy } from 'autoSpy';

describe('TimeService', () => {
  let service: TimeService;

  beforeEach(() => {
    service = setup().build();
  });

  it('should return the current epoch millis when getTimeStamp is called', () => {
    expect(service.getTimeStamp()).toBeDefined();
  });

  it('should return the current epoch millis plus one day when getOneDayLater is called', () => {
    expect(service.getTimeStamp() < service.getOneDayLater(new Date()).getTime()).toBe(true);
  });

  it('should return the number of milliseconds in a day when getDayInMillis is called', () => {
    expect(service.getDayInMillis()).toBe(86400000);
  });

  it('should return the number of milliseconds in a week when getWeekInMillis is called', () => {
    expect(service.getWeekInMillis()).toBe(604800000);
  });

  it('should return the number of milliseconds in a year when getYearInMillis is called', () => {
    expect(service.getYearInMillis()).toBe(31536000000);
  });

  it("should return true if two dates are on the same day", () => {
    const date1 = new Date();
    const date2 = new Date(date1.getTime() + 100);
    expect(service.datesAreOnSameDay(date1, date2)).toBe(true);
  });

  it("should return false if two dates are NOT on the same day", () => {
    const date1 = new Date();
    const date2 = new Date(date1.getTime() / 100);
    expect(service.datesAreOnSameDay(date1, date2)).toBe(false);
  });

});

function setup() {

  const builder = {

    default() {
      return builder;
    },
    build() {
      return new TimeService();
    }
  };

  return builder;
}
