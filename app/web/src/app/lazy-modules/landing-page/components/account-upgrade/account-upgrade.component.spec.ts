import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { autoSpy } from 'autoSpy';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { TestHelpers } from './../../../../services/general/testHelpers';
import { AccountUpgradeComponent } from './account-upgrade.component';

describe('AccountUpgradeComponent', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let component: AccountUpgradeComponent;

  beforeEach(() => {
    component = setup().build();
  });

  it('should not crash when ngOnInit is called', () => {
    const crashed = testHelpers.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it("should go to the dashboard when goToDash() is called ", () => {
    component.ngz.run = (someLambda => someLambda());
    const expectedParam = 'dashboard';
    (component.router as any).navigate = ((someRoute) => { expect(expectedParam == someRoute).toBe(true) })
    component.goToDash();
  });

});

function setup() {
  const router = autoSpy(Router);
  const ngz = autoSpy(NgZone);
  const environment = autoSpy(EnvironmentService);
  const builder = {
    router, ngz,
    default() {
      return builder;
    },
    build() {
      return new AccountUpgradeComponent(router, ngz, environment);
    }
  };

  return builder;
}
