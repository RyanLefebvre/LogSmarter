import { OnlyLoggedInUsersGuard } from './only-logged-in-users-guard.service';
import { autoSpy } from 'autoSpy';
import { BehaviorSubject } from 'rxjs';
import { StateManagerService } from '../general/state-manager.service';

describe('OnlyLoggedInUsersGuard', () => {
  let guard: OnlyLoggedInUsersGuard;

  beforeEach(() => {
    guard = setup().default().build();
    guard.stateManager.currentUserAuth = new BehaviorSubject<string>(guard.stateManager.USER_LOADING);
  });

  it('should return if the user is logged in when canActivate is called', () => {
    spyOn(guard.stateManager, 'userIsAuthenticated').and.returnValue(guard.stateManager.currentUserAuth.value == guard.stateManager.USER_AUTHENTICATED);

    expect(guard.canActivate()).toBe(false);

    guard.stateManager.currentUserAuth = new BehaviorSubject<string>(guard.stateManager.USER_AUTHENTICATED);
    spyOn(guard.stateManager, 'userIsAuthenticated').and.returnValue(guard.stateManager.currentUserAuth.value == guard.stateManager.USER_AUTHENTICATED);
    expect(guard.canActivate()).toBe(true);
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
      jasmine.getEnv().allowRespy(true);
      stateManager.USER_LOADING = "LOADING";
      stateManager.USER_AUTHENTICATED = "USER_AUTHENTICATED";
      return new OnlyLoggedInUsersGuard(stateManager);
    }
  };

  return builder;
}
