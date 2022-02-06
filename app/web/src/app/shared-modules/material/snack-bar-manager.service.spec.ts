import { MatSnackBar } from '@angular/material';
import { SnackBarService } from './snack-bar-manager.service';
import { autoSpy } from 'autoSpy';

describe('SnackBarService', () => {

  let service: SnackBarService;

  beforeEach(() => {
    const { build } = setup().default();
    service = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should open a success snackbar when showSuccessMessage() is called', () => {
    const expectedMessage: string = "myMessage";
    const expectedAction = null;
    const expectedClass = 'success-snackbar';
    service._snackBar.open = jasmine.createSpy().and.callFake((msg, action, config) => {
      expect(msg).toBe(expectedMessage);
      expect(action).toBe(expectedAction);
      expect(config.panelClass[0]).toBe(expectedClass);
    });
    service.showSuccessMessage(expectedMessage);
    expect(service.someSnackBarOpen == true);
    jasmine.clock().tick(service.successDuration);
    expect(service._snackBar.open).toHaveBeenCalled();
    expect(service.someSnackBarOpen == false);
  });

  it('should open a failuire snackbar when showFailureMessage() is called', () => {
    const expectedMessage: string = "myMessage";
    const expectedAction = null;
    const expectedClass = 'failure-snackbar';
    service._snackBar.open = jasmine.createSpy().and.callFake((msg, action, config) => {
      expect(msg).toBe(expectedMessage);
      expect(action).toBe(expectedAction);
      expect(config.panelClass[0]).toBe(expectedClass);
    });
    service.showFailureMessage(expectedMessage);
    expect(service.someSnackBarOpen == true);
    jasmine.clock().tick(service.failureDuration);
    expect(service._snackBar.open).toHaveBeenCalled();
    expect(service.someSnackBarOpen == false);
  });

  it('should open a warning snackbar when showWarningMessage() is called', () => {
    const expectedMessage: string = "myMessage";
    const expectedAction = null;
    const expectedClass = 'warning-snackbar';
    service._snackBar.open = jasmine.createSpy().and.callFake((msg, action, config) => {
      expect(msg).toBe(expectedMessage);
      expect(action).toBe(expectedAction);
      expect(config.panelClass[0]).toBe(expectedClass);
    });
    service.showWarningMessage(expectedMessage);
    expect(service.someSnackBarOpen == true);
    jasmine.clock().tick(service.warningDuration);
    expect(service._snackBar.open).toHaveBeenCalled();
    expect(service.someSnackBarOpen == false);
  });

  it("should not open the snackbars if another snackbar is open and any of the functions are called", () => {
    service.someSnackBarOpen = true;
    const expectedMessage: string = "myMessage";
    service.showWarningMessage(expectedMessage);
    service.showFailureMessage(expectedMessage);
    service.showSuccessMessage(expectedMessage);
    service._snackBar.open = jasmine.createSpy();
    expect(service._snackBar.open).not.toHaveBeenCalled();
  });

});

function setup() {
  const _snackBar = autoSpy(MatSnackBar);
  const builder = {
    _snackBar,
    default() {
      return builder;
    },
    build() {
      return new SnackBarService(_snackBar);
    }
  };

  return builder;
}
