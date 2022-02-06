import { NutritionLog } from './nutrition-log';
import { DayEntry } from './day-entry';

describe('NutritionLog', () => {
  it('should return the dateEntry associated with the provided date when getEntryAtDate is called', () => {
    let component: NutritionLog = setup().default().build();

    let dayEntry: DayEntry = new DayEntry();

    dayEntry.date = new Date('1995-12-17T03:24:00');

    component.dayEntries = [dayEntry];

    expect(component.getEntryAtDate(new Date('1995-12-17T03:24:00'))).toEqual(dayEntry);
  });
});

function setup() {
  
  const builder = {
    
    default() {
      return builder;
    },
    build() {
      return new NutritionLog();
    }
  };

  return builder;
}
