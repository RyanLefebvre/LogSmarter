import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { Router } from '@angular/router';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';

describe('ConfirmationDialogComponent', () => {

  let component: ConfirmationDialogComponent;

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

  it('should close the dialog when closeDialog() is called', () => {
    component.closeDialog();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it("should disable closing, show the spinner and wait on the confirm logic when confirm is called, then turn the spinner off after the timeout ", async () => {
    expect(component.showSpinner).toBe(false);
    expect(component.dialogRef.disableClose).toBe(false);
    (component.data)['confirmationLogic'] = async () => {
      expect(component.showSpinner).toBe(true);
      expect(component.dialogRef.disableClose).toBe(true);
    };
    component.closeDialog = jasmine.createSpy();
    await component.confirm();
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(component.closeDialog).toHaveBeenCalled();

  });

});

function setup() {
  const dialogRef = (new TestHelpers()).getDialogMock();
  const fbNutr = autoSpy(FirebaseNutritionService);
  const router = autoSpy(Router);
  const constants = autoSpy(ConstantsService);
  const builder = {
    dialogRef,
    fbNutr,
    router,
    constants,
    default() {
      return builder;
    },
    build() {
      return new ConfirmationDialogComponent(dialogRef, fbNutr, router, constants, {});
    }
  };

  return builder;
}
