import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  let component: TermsComponent;
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
      return new TermsComponent();
    }
  };

  return builder;
}