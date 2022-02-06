import { StateManagerService } from '../general/state-manager.service';
import { OnlyNotLoggedInUsersGuard } from './only-not-logged-in-users-guard.service';
import { autoSpy } from 'autoSpy';
import { BehaviorSubject } from 'rxjs';

describe('OnlyNotLoggedInUsersGuard', () => {
  let guard: OnlyNotLoggedInUsersGuard;

  beforeEach(() => {
    guard = setup().default().build();
    guard.stateManager.currentUserAuth = new BehaviorSubject<string>(guard.stateManager.USER_LOADING);
  });

  it('should return if the user is not logged in when canActivate is called', () => {
    spyOn(guard.stateManager, 'userIsNotAuthenticated').and.returnValue(guard.stateManager.currentUserAuth.value == guard.stateManager.USER_NOT_AUTHENTICATED);

    expect(guard.canActivate()).toBe(false);

    guard.stateManager.currentUserAuth = new BehaviorSubject<string>(guard.stateManager.USER_NOT_AUTHENTICATED);
    spyOn(guard.stateManager, 'userIsNotAuthenticated').and.returnValue(guard.stateManager.currentUserAuth.value == guard.stateManager.USER_NOT_AUTHENTICATED);
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
      stateManager.USER_NOT_AUTHENTICATED = "NOTAUTHENTICATED";
      return new OnlyNotLoggedInUsersGuard(stateManager);
    }
  };

  return builder;
}
