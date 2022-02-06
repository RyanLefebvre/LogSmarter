import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { FormBuilder } from '@angular/forms';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { ReAuthenticateDialogComponent } from './re-authenticate-dialog.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';

describe('ReAuthenticateDialogComponent', () => {

  let component: ReAuthenticateDialogComponent;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should not crash when ngOnInit() is called', () => {
    let crashed = false;
    try {
      component.ngOnInit();
    } catch (error) {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it('should close the dialog with the authentication result whenever closeDialog() is called ', () => {
    const result = "someResult" as any;
    component.closeDialog(result);
    expect(component.dialogRef.close).toHaveBeenCalledWith(result);
  });

  it("should show a success message and close the dialog with true as the result when the user reauthenticates successfully and handlesubmit() is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    component.authenticateForm = {
      controls: {
        [component.FORM_CONTROL_USERNAME]: { value: "someUserName" },
        [component.FORM_CONTROL_PASSWORD]: { value: "somePassword" },
      }
    } as any;
    component.authService.afAuth = {
      auth: {
        currentUser: {
          reauthenticateWithCredential: jasmine.createSpy()
        }
      }
    } as any;
    await component.handleSubmit();
    expect(component.snackbar.showSuccessMessage).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalledWith(true);
  });

  it("should turn the spinner off enable closing and show a failure message snackbar  after the timeout if handleSubmit() errors out without a code", async () => {
    component.closeDialog = jasmine.createSpy();
    component.authenticateForm = {
      controls: {
        [component.FORM_CONTROL_USERNAME]: { value: "someUserName" },
        [component.FORM_CONTROL_PASSWORD]: { value: "somePassword" },
      }
    } as any;
    component.authService.afAuth = {
      auth: {
        currentUser: {
          reauthenticateWithCredential: jasmine.createSpy().and.callFake(() => {
            throw {
              name: "myError with no message",
              message: null
            }
          })
        }
      }
    } as any;
    await component.handleSubmit();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT);
    expect(component.showErrorMessage).toBe(false);
    expect(component.snackbar.showFailureMessage).toHaveBeenCalled();
    expect(component.dialogRef.disableClose).toBe(false);
    expect(component.snackbar.showFailureMessage).toHaveBeenCalledWith(component.AUTH_FAILURE_MSG);
  });

  it("should show an error message, turn the spinner off, enable closing and show a failure message snackbar after the timeout if handleSubmit() errors out without a code", async () => {
    component.closeDialog = jasmine.createSpy();
    component.authenticateForm = {
      controls: {
        [component.FORM_CONTROL_USERNAME]: { value: "someUserName" },
        [component.FORM_CONTROL_PASSWORD]: { value: "somePassword" },
      }
    } as any;
    component.authService.afAuth = {
      auth: {
        currentUser: {
          reauthenticateWithCredential: jasmine.createSpy().and.callFake(() => {
            throw {
              name: "myError with message",
              message: "My error message"
            }
          })
        }
      }
    } as any;
    await component.handleSubmit();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT);
    expect(component.showErrorMessage).toBe(true);
    expect(component.snackbar.showFailureMessage).toHaveBeenCalled();
    expect(component.dialogRef.disableClose).toBe(false);
    expect(component.snackbar.showFailureMessage).toHaveBeenCalledWith(component.AUTH_FAILURE_MSG);
  });

});

function setup() {
  const authService = autoSpy(AuthenticationService);
  const fb = autoSpy(FormBuilder);
  const stateManager = autoSpy(StateManagerService);
  const snackbar = autoSpy(SnackBarService);
  const constants = autoSpy(ConstantsService);
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const builder = {
    authService,
    fb,
    stateManager,
    snackbar,
    constants,
    data,
    dialogRef,
    default() {
      return builder;
    },
    build() {
      return new ReAuthenticateDialogComponent(authService, fb, stateManager, snackbar, constants, data, dialogRef);
    }
  };

  return builder;
}
