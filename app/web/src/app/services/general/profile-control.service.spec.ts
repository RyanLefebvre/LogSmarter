import { ProfileControlService } from './profile-control.service';
import { autoSpy } from 'autoSpy';

describe('ProfileControlService', () => {
  let service: ProfileControlService;

  beforeEach(() => {
    service = setup().build();
  });

  it('should return the current edit value when currentEditValue is called', () => {
    expect(service.currentEditValue()).toBe(service.NOT_EDITING);
  });

  it('should set the current edit value when beginEditing is called', () => {
    service.beginEditing(service.EDITING_NUTR_PREFS);
    expect(service.currentEditValue()).toBe(service.EDITING_NUTR_PREFS);
    service.beginEditing(service.EDITING_GENERAL_PREFS);
    expect(service.currentEditValue()).toBe(service.EDITING_GENERAL_PREFS);
  });

  it('should reset the current edit value when doneEditing is called', () => {
    expect(service.currentEditValue()).toBe(service.NOT_EDITING);
    service.beginEditing(service.EDITING_PROFILE);
    expect(service.currentEditValue()).toBe(service.EDITING_PROFILE);
    service.beginEditing(service.EDITING_PORTAL);
    expect(service.currentEditValue()).toBe(service.EDITING_PORTAL);
    service.doneEditing();
    expect(service.currentEditValue()).toBe(service.NOT_EDITING);
  });
  
});

function setup() {
  
  const builder = {
    
    default() {
      return builder;
    },
    build() {
      return new ProfileControlService();
    }
  };

  return builder;
}
