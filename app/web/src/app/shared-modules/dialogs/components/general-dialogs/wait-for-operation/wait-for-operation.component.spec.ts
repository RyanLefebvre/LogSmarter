import { ConstantsService } from 'src/app/services/general/constants.service';
import { WaitForOperationDialog } from './wait-for-operation.component';
import { autoSpy } from 'autoSpy';
import { MatDialogRef } from '@angular/material';

describe('WaitForOperationDialog', () => {

  let component: WaitForOperationDialog;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  })

  it('should call waitForSubStateChange() when ngOnInit() is called', () => {
    component.waitForSubStateChange = jasmine.createSpy();
    component.ngOnInit();
    expect(component.waitForSubStateChange).toHaveBeenCalled();
  });

  it('should wait for the lambda passed in and then close the dialog when waitForSubStateChange() is called ', async () => {
    component.data.logic = jasmine.createSpy();
    await component.waitForSubStateChange();
    expect(component.dialogRef.disableClose).toBe(true);
    expect(component.data.logic).toHaveBeenCalled();
    jasmine.clock().tick(3000);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should NOT wait for the lambda passed in and then close the dialog when waitForSubStateChange() is called and there is no logic ', async () => {
    await component.waitForSubStateChange();
    expect(component.dialogRef.disableClose).toBe(true);
    jasmine.clock().tick(3000);
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

});

function setup() {
  const data = {};
  const constants = autoSpy(ConstantsService);
  const dialogRef = autoSpy(MatDialogRef) as any;
  const builder = {
    data,
    constants,
    dialogRef,
    default() {
      return builder;
    },
    build() {
      return new WaitForOperationDialog(data, constants, dialogRef);
    }
  };

  return builder;
}
