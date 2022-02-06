import { TestHelpers } from './../../../../services/general/testHelpers';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { Router } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { autoSpy } from 'autoSpy';
import { EnvironmentService } from 'src/app/services/general/environment.service';

describe('HomePageComponent', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let component: HomePageComponent;

  beforeEach(() => {
    component = setup().build();
  });

  it('should not crash when ngOnInit is called', () => {
    const crashed = testHelpers.testOnInit(component);
    expect(crashed).toBe(false);
  });
  it('should not crash when ngOnDestroy is called', () => {
    component.ngOnInit();
    const crashed = testHelpers.testOnDestroy(component);
    expect(crashed).toBe(false);
  });

  it('should navigate to the register form when goToRegister is called', () => {
    component.goToRegister();
    expect(component.stateManager.goToRegister).toHaveBeenCalled();
  });

  it('should navigate to the sign-in form when goToSignIn() is called', () => {
    component.router.navigate = jasmine.createSpy().and.callFake((someArr) => {
      expect(someArr[0]).toBe("/auth/login");
      return {} as any;
    });
    component.goToSignIn();
    expect(component.router.navigate).toHaveBeenCalled()
  });

  it("should go to the terms page when goToTerms() is called ", () => {
    const expectedRoute = "/info/terms";
    component.router.navigate = (route) => {
      expect(route[0]).toBe(expectedRoute);
      return {} as any;
    }
    component.goToTerms();
  });

  it("should go to the privacy page when goToPrivacy() is called ", () => {
    const expectedRoute = '/info/privacy';
    component.router.navigate = (route) => {
      expect(route[0]).toBe(expectedRoute);
      return {} as any;
    }
    component.goToPrivacy();
  });

  it("should go to the dashboard when goToDash is called ", () => {
    const expectedRoute = '/dashboard';
    component.router.navigate = (route) => {
      expect(route[0]).toBe(expectedRoute);
      return {} as any;
    }
    component.goToDash();
  });

});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const router = autoSpy(Router);
  const environmentService = autoSpy(EnvironmentService);
  const builder = {
    stateManager,
    router,
    environmentService,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new HomePageComponent(stateManager, router, environmentService);
    }
  };

  return builder;
}
