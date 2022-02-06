import { TermsDialogComponent } from './terms-dialog.component';
import { TestHelpers } from 'src/app/services/general/testHelpers';

describe('TermsDialogComponent', () => {

  let component: TermsDialogComponent;

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
});

function setup() {
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const builder = {
    dialogRef,
    data,
    default() {
      return builder;
    },
    build() {
      return new TermsDialogComponent(dialogRef, data);
    }
  };

  return builder;
}
