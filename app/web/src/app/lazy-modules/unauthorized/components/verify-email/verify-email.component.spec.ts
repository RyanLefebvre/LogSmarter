import { VerifyEmailComponent } from './verify-email.component';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { autoSpy } from 'autoSpy';

describe('VerifyEmailComponent', () => {
  const testHelper: TestHelpers = new TestHelpers(); let component: VerifyEmailComponent;
  beforeEach(() => {
    component = setup().default().build();
  });

  it('when ngOnInit is called it should', () => {
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });
});

function setup() {
  const environment = autoSpy(EnvironmentService);
  const builder = {

    default() {
      return builder;
    },
    build() {
      return new VerifyEmailComponent(environment);
    }
  };

  return builder;
}
