import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { SignInComponent } from './sign-in.component';
import { autoSpy } from 'autoSpy';
import { of, Subscription, Subject } from 'rxjs';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';

describe('SignInComponent', () => {
  const testHelper: TestHelpers = new TestHelpers();
  let component: SignInComponent;
  const email = 'test@example.com';
  const password = 'password';

  beforeEach(() => {
    component = setup().default().build();
    component.authenticateForm.patchValue({
      username: email,
      password: password
    })

    document.getElementsByClassName = jasmine.createSpy().and.returnValue([
      {
        classList: {
          add: function() {},
          remove: function() {}
        }
      }
    ]);
  });

  it('should not crash when ngOnInit is called', () => {
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it('should not crash when ngOnInit is called (mobile)', () => {
    component.environmentService.isMobile = true;
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it('should not crash when ngOnDestroy is called', () => {
    component.ngOnInit();
    const crashed: boolean = testHelper.testOnDestroy(component);
    expect(crashed).toBe(false);
  });

  it('should not crash when ngOnDestroy is called (mobile)', () => {
    component.environmentService.isMobile = true;
    component.ngOnInit();
    const crashed: boolean = testHelper.testOnDestroy(component);
    expect(crashed).toBe(false);
  });

  it('should kill the myErrorSubscription when ngOnDestroy is called', () => {
    component.myErrorSubscription = new Subscription();
    const unsubSpy: jasmine.Spy<() => void> = spyOn(component.myErrorSubscription, "unsubscribe");
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it('should not unsubscribe from myErrorSubscription if myErrorSubscription is null when ngOnDestroy is called', () => {
    component.myErrorSubscription = new Subscription();
    const unsubSpy: jasmine.Spy<() => void> = spyOn(component.myErrorSubscription, "unsubscribe");
    component.myErrorSubscription = null;
    const crashed = testHelper.testOnDestroy(component);
    expect(crashed).not.toBe(true);
    expect(unsubSpy).not.toHaveBeenCalled();
  });

  it('should subscribe to errors from firebase when errorSubscription is called', () => {
    let lambdaRef;
    component.authService.eventAuthError = {
      subscribe: (errorMSG) => {
        lambdaRef = errorMSG;
      },
    } as any;

    component.errorSubscription();

    lambdaRef('error');
    expect(component.showSpinner).toBe(false);
    expect(component.errorMessage).toEqual('error');
    expect(component.showErrorMessage).toBe(true);
    expect(component.showReset).toBe(true);
  });

  it('should extract email and username from form controls and try to authenticate user when handleSubmit is called', () => {
    component.showSpinner = false;
    const logInSpy: jasmine.Spy<(email, password) => void> = spyOn(component.authService, 'login');
    component.handleSubmit();
    expect(component.showSpinner).toBe(true);
    expect(logInSpy).toHaveBeenCalledWith(email, password);
  });

  it('should extract email and username from form controls and try to authenticate user when handleSubmit is called even if they are null', () => {
    component.showSpinner = false;
    const logInSpy: jasmine.Spy<(email, password) => void> = spyOn(component.authService, 'login');
    component.authenticateForm.patchValue({
      username: null,
      password: null
    })
    component.handleSubmit();
    expect(component.showSpinner).toBe(true);
    expect(logInSpy).toHaveBeenCalledWith(null, null);
  });

  it('should open the password reset dialog if a valid email has been entered into the form when resetPassword is called', () => {
    const openPasswordResetDialogSpy: jasmine.Spy<(email) => void> = spyOn(component.dialogManager, 'openPasswordResetDialog');
    component.resetPassword();
    expect(openPasswordResetDialogSpy).toHaveBeenCalledWith(email);
  });

  it('should not open the password reset dialog and instead display an error message if an invalid email has been entered into the form when reset password is called', () => {
    component.authenticateForm.patchValue({
      username: 'kdshfodiwhf0we93',
      password: password
    });
    const openPasswordResetDialogSpy: jasmine.Spy<(email) => void> = spyOn(component.dialogManager, 'openPasswordResetDialog');
    component.resetPassword();
    expect(openPasswordResetDialogSpy).not.toHaveBeenCalled();
    expect(component.errorMessage).toEqual('Enter valid email to reset');
  });
});

function setup() {
  const authService = autoSpy(AuthenticationService);
  const fb = autoSpy(FormBuilder);
  const dialog = autoSpy(MatDialog);
  const dialogManager = autoSpy(DialogCreatorService);
  const environment = autoSpy(EnvironmentService);
  const state = autoSpy(StateManagerService);
  const builder = {
    authService,
    fb,
    dialog,
    dialogManager,
    default() {
      return builder;
    },
    build() {
      authService.eventAuthError = new Subject<string>();
      return new SignInComponent(authService, environment, new FormBuilder(), dialog, dialogManager, state);
    }
  };

  jasmine.getEnv().allowRespy(true);

  return builder;
}