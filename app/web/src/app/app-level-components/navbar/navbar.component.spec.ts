import { StateManagerService } from '../../services/general/state-manager.service';
import { NavBarComponent } from './navbar.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { Router } from '@angular/router';

describe('NavBarComponent', () => {
  let component: NavBarComponent;
  let testHelper: TestHelpers;

  beforeEach(() => {
    component = setup().default().build();
    testHelper = new TestHelpers();
  })

  it('should not crash when ngOnInit is called', () => {
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it('should not crash when ngOnDestroy is called', () => {
    const crashed: boolean = testHelper.testOnDestroy(component);
    expect(crashed).toBe(false);
  });

  it("should return true when showWebNav() is called and the environment is web", () => {
    component.environmentService.isWeb = true;
    expect(component.showWebNav()).toBe(true);
    component.environmentService.isWeb = false;
    expect(component.showWebNav()).toBe(false);
  });


  it("should return true if the environment is mobile and the url is not the base URL when showMobileNav() is called ", () => {
    component.router = { url: "someFakeURL" } as any;
    component.environmentService.isMobile = true;
    expect(component.showMobileNav()).toBe(true);
  });

  it("should NOT return true if the environment is not mobile or the url is the base URL when showMobileNav() is called ", () => {
    component.router = { url: "/" } as any;
    component.environmentService.isMobile = true;
    expect(component.showMobileNav()).toBe(false);
    component.router = { url: "someFakeURL" } as any;
    component.environmentService.isMobile = false;
    expect(component.showMobileNav()).toBe(false);
  });

  it("should return true when rubberBandSideNav() is called and the user is on the terms or privacy page", () => {
    component.router = { url: "terms" } as any;
    component.environmentService.isMobile = true;
    component.state.userIsAuthenticated = () => false;
    expect(component.rubberBandSideNav()).toBe(true);
    component.router = { url: "privacy" } as any;
    component.environmentService.isMobile = true;
    component.state.userIsAuthenticated = () => false;
    expect(component.rubberBandSideNav()).toBe(true);
  });

  it("should return true when rubberBandSideNav() is called and the user is authenticated and not on the terms or privacy page", () => {
    component.router = { url: "/" } as any;
    component.environmentService.isMobile = true;
    component.state.userIsAuthenticated = () => true;
    expect(component.rubberBandSideNav()).toBe(true);
    component.router = { url: "/" } as any;
    component.environmentService.isMobile = true;
    component.state.userIsAuthenticated = () => true;
    expect(component.rubberBandSideNav()).toBe(true);
  });

  it("should NOT return true when rubberBandSideNav() is called and the user is Notauthenticated and not on the terms or privacy page", () => {
    component.router = { url: "/" } as any;
    component.environmentService.isMobile = false;
    component.state.userIsAuthenticated = () => true;
    expect(component.rubberBandSideNav()).toBe(false);
    component.router = { url: "/" } as any;
    component.environmentService.isMobile = true;
    component.state.userIsAuthenticated = () => false;
    expect(component.rubberBandSideNav()).toBe(false);
  });
});

function setup() {
  const state = autoSpy(StateManagerService);
  const environment = autoSpy(EnvironmentService);
  const tierPermission = autoSpy(TierPermissionsService);
  const router = autoSpy(Router);
  const builder = {
    state,
    environment,
    tierPermission,
    default() {
      return builder;
    },
    build() {
      return new NavBarComponent(state, environment, tierPermission, router);
    }
  };

  return builder;
}