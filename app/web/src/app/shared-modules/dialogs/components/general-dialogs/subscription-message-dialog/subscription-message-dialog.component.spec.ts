import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { SubscriptionMessageDialogComponent } from './subscription-message-dialog.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';

describe('SubscriptionMessageDialogComponent', () => {

  let component: SubscriptionMessageDialogComponent;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should call makeSureDialogCantBeClosed() when ngOnInit() is called', () => {
    component.makeSureDialogCantBeClosed = jasmine.createSpy();
    component.ngOnInit();
    expect(component.makeSureDialogCantBeClosed).toHaveBeenCalled();
  });

  it('should set disable close to true when makeSureDialogCantBeclosed() is called', () => {
    component.makeSureDialogCantBeClosed();
    expect(component.dialogRef.disableClose).toBe(true);
  });

});

function setup() {
  const tierPermissionManager = autoSpy(TierPermissionsService);
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const builder = {
    tierPermissionManager,
    data,
    dialogRef,
    default() {
      return builder;
    },
    build() {
      return new SubscriptionMessageDialogComponent(tierPermissionManager, data, dialogRef);
    }
  };

  return builder;
}
