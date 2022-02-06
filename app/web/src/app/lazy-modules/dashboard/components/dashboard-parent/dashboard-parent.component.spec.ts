import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { DashboardParentComponent } from './dashboard-parent.component';
import { autoSpy } from 'autoSpy';

describe('DashboardParentComponent', () => {

  let component;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();

  });

  it('should not crash when ngOnInit() is called', () => {
    let noError = true;
    try {
      component.ngOnInit();
    }
    catch (error) {
      noError = false;
    }
    expect(noError).toBe(true);
  });

});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const builder = {
    stateManager,
    default() {
      return builder;
    },
    build() {
      return new DashboardParentComponent(stateManager);
    }
  };

  return builder;
}
