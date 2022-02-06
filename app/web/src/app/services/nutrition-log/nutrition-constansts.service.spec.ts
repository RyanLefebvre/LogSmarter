import { FormControlPair } from './../../model-classes/general/form-control-pair';
import { INSUFFICIENT_DATA } from './../../../../functions/src/constants/energyConstants';
import { NutritionConstanstsService } from './nutrition-constansts.service';
import { autoSpy } from 'autoSpy';

describe('NutritionConstanstsService', () => {
  let service: NutritionConstanstsService;

  beforeEach(() => {
    service = setup().build();
  });

  it('shold return the display name for the goal when getDisplayForGoal is called', () => {
    expect(service.getDisplayForGoal(service.GOAL_FAT_LOSS)).toBe(service.DISPLAY_GOAL_FAT_LOSS);
    expect(service.getDisplayForGoal(service.GOAL_MAINTAIN)).toBe(service.DISPLAY_GOAL_MAINTAIN_WEIGHT);
    expect(service.getDisplayForGoal(service.GOAL_MUSCLE_GAIN)).toBe(service.DISPLAY_GOAL_MUSCLE_GAIN);
    expect(service.getDisplayForGoal(null)).toBe(service.INSUFFICIENT_DATA_STRING);
  });
  
  it('should return a list of form control objects when getLogGoalFormControls is called', () => {
    const formControls: FormControlPair[] = service.getLogGoalFormControls();
    expect(formControls.includes(service.FORM_CONTROL_FAT_LOSS)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_MUSCLE_GAIN)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_MAINTAIN)).toBe(true);
  });
  
});

function setup() {
  
  const builder = {
    
    default() {
      return builder;
    },
    build() {
      return new NutritionConstanstsService();
    }
  };

  return builder;
}
