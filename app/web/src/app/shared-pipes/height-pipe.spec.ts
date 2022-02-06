import { StateManagerService } from '../services/general/state-manager.service';
import { ConversionService } from '../services/general/conversion.service';
import { HeightPipe } from './height-pipe';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';


describe('HeightPipe', () => {
  let component: HeightPipe;
  let testHelpers: TestHelpers;

  beforeEach(() => {
     component= setup().default().build();
     testHelpers = new TestHelpers();
  });

  it('should return an empty string when transform is called with an invalid height', () => {
    expect(component.transform(0)).toEqual('');
  }); 

  it('should return the user‘s height in inches as a string if the the number system is imperial when transform is called', () => {
    const userWithImperial = testHelpers.createFreeUserProfile();
    const convertIncehesToStringSpy: jasmine.Spy<(inches) => string> = spyOn(component.converter, 'convertInchesToString');
    
    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userWithImperial); 
    
    component.transform(59);

    expect(convertIncehesToStringSpy).toHaveBeenCalledWith(59);
  });

  it('should return the user‘s height in centimeters as a string if the the number system is not imperial when transform is called', () => {
    const userWithoutImperial = testHelpers.createFreeUserProfile();
    userWithoutImperial.userPreferences.general.isImperial = false;

    const convertInchesToCentimetersSpy: jasmine.Spy<(inches) => number> = spyOn(component.converter, 'convertInchesToCentimeters');
    
    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userWithoutImperial); 
    
    component.transform(59);

    expect(convertInchesToCentimetersSpy).toHaveBeenCalledWith(59);
  }); 

  it('should return an empty string if an error occurs when transform is called', () => {
    spyOn(component.stateManager, 'getCurrentUser').and.throwError(new TypeError);
    expect(component.transform(59)).toEqual('');
  });
});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const converter = autoSpy(ConversionService);
  const builder = {
    stateManager,
    converter,
    default() {
      return builder;
    },
    build() {
      return new HeightPipe(stateManager, converter);
    }
  };

  jasmine.getEnv().allowRespy(true);

  return builder;
}
