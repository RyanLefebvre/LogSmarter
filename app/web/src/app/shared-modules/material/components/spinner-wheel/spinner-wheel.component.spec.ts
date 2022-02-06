import { SpinnerWheelComponent } from './spinner-wheel.component';

describe('SpinnerWheelComponent', () => {

  let component: SpinnerWheelComponent;

  beforeEach(() => {
    component = setup().default().build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should not crash when ngOnInit() is called', () => {
    let somethingBadHappened = false;
    try {
      component.ngOnInit();
    } catch (error) {
      somethingBadHappened = true;
    }
    expect(somethingBadHappened).toBe(false);
  });

  it('should set the spinner message when setSpinnerMessage() is called and noMessage is falsy', () => {
    expect(component.spinnerMessage).toBe(null);
    const someFakeMessage = "fakeSpinnerMessage";
    component.setSpinnerMessage(someFakeMessage);
    expect(component.spinnerMessageToDisplay).toBe(someFakeMessage);
  });

  it('should set the spinnerMessage when ngOnInit() is called and NoMessage is falsy ', () => {
    const setSpinnerSpy = spyOn(component, 'setSpinnerMessage');
    component.ngOnInit();
    expect(setSpinnerSpy).toHaveBeenCalled();
  });

  it('should show the spinnerMessage if spinnerMessage is not null and noMessage is falsy ', () => {
    component.setSpinnerMessage("someFakeMessage");
    expect(component.showSpinnerMessage()).toBe(true);
  });

  it('should show the spinnerMessage if spinnerMessage is null and noMessage is falsy ', () => {
    component.setSpinnerMessage(null);
    expect(component.showSpinnerMessage()).toBe(true);
  });

  it('should  show the spinnerMessage if spinnerMessage is undefined and noMessage is falsy ', () => {
    component.setSpinnerMessage(undefined);
    expect(component.showSpinnerMessage()).toBe(true);
  });

  it('should set spinnerMessageToDisplay to the generic message if spinnerMessageParam is null and noMessage is falsy and setSpinnerMessage() is called ', () => {
    component.setSpinnerMessage(null);
    expect(component.spinnerMessageToDisplay).toBe(component.GENEREIC_MESSAGE);
  });

  it('should set spinnerMessageToDisplay to the generic message if spinnerMessageParam is undefined and noMessage is falsy and setSpinnerMessage() is called ', () => {
    component.setSpinnerMessage(undefined);
    expect(component.spinnerMessageToDisplay).toBe(component.GENEREIC_MESSAGE);
  });

  it('should NOT set the spinnerMessage when setSpinnerMessage() is called and noMessage is true', () => {
    component.noMessage = true;
    expect(component.spinnerMessage).toBe(null);
    const someFakeMessage = "fakeSpinnerMessage";
    component.setSpinnerMessage(someFakeMessage);
    expect(component.spinnerMessageToDisplay).toBe(null);
  });

  it('should NOT show the spinnerMessage if spinnerMessage is not null and noMessage is true ', () => {
    component.setSpinnerMessage("someFakeMessage");
    component.noMessage = true;
    expect(component.showSpinnerMessage()).toBe(false);
  });

  it('should NOT show the spinnerMessage if spinnerMessage is null and noMessage is true ', () => {
    component.setSpinnerMessage(null);
    component.noMessage = true;
    expect(component.showSpinnerMessage()).toBe(false);
  });

  it('should NOT show the spinnerMessage if spinnerMessage is undefined and noMessage is true ', () => {
    component.setSpinnerMessage(undefined);
    component.noMessage = true;
    expect(component.showSpinnerMessage()).toBe(false);
  });

});

function setup() {
  const builder = {
    default() {
      return builder;
    },
    build() {
      return new SpinnerWheelComponent();
    }
  };
  return builder;
}
