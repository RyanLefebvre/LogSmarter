import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  beforeEach(() => {
    component = setup().default().build();
  })

  it('should not crash when ngOnInit is called ', () => {
    let crashed: boolean = false;
    try {
      component.ngOnInit();
    } catch (error) {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });
});

function setup() {
  const builder = {
    default() {
      return builder;
    },
    build() {
      return new PrivacyComponent();
    }
  };

  return builder;
}
