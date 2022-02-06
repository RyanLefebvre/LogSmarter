import { FormControlPair } from './../../model-classes/general/form-control-pair';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    service = setup().build();
  });

  it('should return an array of gender form controls when getGenderFormControls is called', () => {
    const formControls: FormControlPair[] = service.getGenderFormControls();
    expect(formControls.includes(service.FORM_CONTROL_MALE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_FEMALE)).toBe(true);
  });

  it('should return an array of activity level form controls when getActivtiyLevelFormControls is called', () => {
    const formControls: FormControlPair[] = service.getActivtiyLevelFormControls();
    expect(formControls.includes(service.FORM_CONTROL_ACTIVITY_LEVEL_ACTIVE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_ACTIVITY_LEVEL_SEDENTARY)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_ACTIVITY_LEVEL_LIGHTLY_ACTIVE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_ACTIVITY_LEVEL_VERY_ACTIVE)).toBe(true);
  });

  it('should return the activity levels display name when activityLevelDisplayName is called', () => {
    expect(service.activityLevelDisplayName(service.ACTIVITY_LEVEL_SEDENTARY)).toBe(service.ACTIVITY_LEVEL_SEDENTARY_DISPLAY_NAME);
    expect(service.activityLevelDisplayName(service.ACTIVITY_LEVEL_LIGHTLY_ACTIVE)).toBe(service.ACTIVITY_LEVEL_LIGHTLY_ACTIVE_DISPLAY_NAME);
    expect(service.activityLevelDisplayName(service.ACTIVITY_LEVEL_ACTIVE)).toBe(service.ACTIVITY_LEVEL_ACTIVE_DISPLAY_NAME);
    expect(service.activityLevelDisplayName(service.ACTIVITY_LEVEL_VERY_ACTIVE)).toBe(service.ACTIVITY_LEVEL_VERY_ACTIVE_DISPLAY_NAME);
    expect(service.activityLevelDisplayName("")).toBe(null);
  });

});

function setup() {

  const builder = {

    default() {
      return builder;
    },
    build() {
      return new ProfileService();
    }
  };

  return builder;
}
