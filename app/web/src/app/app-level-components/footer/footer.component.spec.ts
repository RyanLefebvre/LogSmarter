import { FooterComponent } from './footer.component';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { autoSpy } from 'autoSpy';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { Router } from '@angular/router';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let testHelper: TestHelpers;

  beforeEach(() => {
    component = setup().default().build();
    testHelper = new TestHelpers();
  })

  it('should not crash when ngOnInit is called', () => {
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it('should return true when window.innerWidth > 540', () => {
    spyOnProperty(window, 'innerWidth').and.returnValue(600);
    expect(component.showContactInfo()).toBe(true);
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
});

function setup() {
  const environment = autoSpy(EnvironmentService);
  const router = autoSpy(Router);
  const builder = {
    environment,
    router,
    default() {
      return builder;
    },
    build() {
      return new FooterComponent(environment, router);
    }
  };

  return builder;
}
