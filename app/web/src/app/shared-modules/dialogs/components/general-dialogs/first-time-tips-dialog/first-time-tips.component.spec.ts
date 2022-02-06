import { FirstTimeTipsComponent } from './first-time-tips.component';
import { autoSpy } from 'autoSpy';
import { MatDialogRef } from '@angular/material';

describe('FirstTimeTipsComponent', () => {

  let component: FirstTimeTipsComponent;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
  })

  it('should disable closing when ngOnInit() is called', () => {
    component.ngOnInit();
    expect(component.dialogRef.disableClose).toBe(true);
  });

  it("should get the current stage when getCurrentStage() is called", () => {
    expect(component.getCurrentStage()).toBe(component.instructionStages[component.currentInstructionStage]);
  });

  it("should return true if the components instruction stage is on the first stage when onFirstInstruction() is called ", () => {
    component.currentInstructionStage = 0;
    expect(component.onFirstInstruction()).toBe(true);
  });

  it("should return false if the components instruction stage is NOT on the first stage when onFirstInstruction() is called ", () => {
    component.currentInstructionStage = 1;
    expect(component.onFirstInstruction()).toBe(false);
  });

  it("should return true if the components instruction stage is on the last stage when onLastInstruction() is called ", () => {
    component.currentInstructionStage = component.instructionStages.length - 1;
    expect(component.onLastInstruction()).toBe(true);
  });

  it("should return false if the components instruction stage is NOT on the last stage when onLastInstruction() is called ", () => {
    component.currentInstructionStage = 0;
    expect(component.onLastInstruction()).toBe(false);
  });

  it("should add to the instruction stage and scroll to the top if nextStage() is called", () => {
    component.currentInstructionStage = 0;
    component.scrollToTop = jasmine.createSpy();
    component.nextStage();
    expect(component.currentInstructionStage).toBe(1);
    expect(component.scrollToTop).toHaveBeenCalled();
  });

  it("should also close the dialog when nextStage() is called if the dialog is on the last instruction", () => {
    component.onLastInstruction = () => true;
    component.closeDialog = jasmine.createSpy();
    component.nextStage();
    expect(component.closeDialog).toHaveBeenCalled();
  });

  it("should subsctract from the instruction stage and scroll to the top if previousStage() is called", () => {
    component.currentInstructionStage = 1;
    component.scrollToTop = jasmine.createSpy();
    component.previousStage();
    expect(component.currentInstructionStage).toBe(0);
    expect(component.scrollToTop).toHaveBeenCalled();
  });

  it("should return true if the user is NOT on the first or last insruction and onIntermediateInstruction() is called ", () => {
    component.onFirstInstruction = () => false;
    component.onLastInstruction = () => false;
    expect(component.onIntermediateInstruction()).toBe(true);
  });

  it("should return false if the user is on the first or last insruction and onIntermediateInstruction() is called ", () => {
    component.onFirstInstruction = () => false;
    component.onLastInstruction = () => true;
    expect(component.onIntermediateInstruction()).toBe(false);
    component.onFirstInstruction = () => true;
    component.onLastInstruction = () => false;
    expect(component.onIntermediateInstruction()).toBe(false);
  });

  it("should force scroll the instruction div back to the top when scrollToTop() is called", () => {
    const messageDiv = {
      scrollTop: "someValThatIsNot0" as any
    };
    let getElRef = document.getElementById;
    document.getElementById = () => {
      return messageDiv as any;
    };
    component.scrollToTop();
    expect(messageDiv.scrollTop).toBe(0);
    document.getElementById = getElRef;
  });

  it("should NOT force scroll the instruction div back to the top when scrollToTop() is called and the div is null", () => {
    const messageDiv = {
      scrollTop: "someValThatIsNot0" as any
    };
    let getElRef = document.getElementById;
    document.getElementById = () => {
      return null;
    };
    component.scrollToTop();
    expect(document.getElementById(null)).toBe(null);
    document.getElementById = getElRef;
  });

  it("should set the dialogs current instruction stage to the last instruction when closeDialog() is called ", () => {
    component.currentInstructionStage = 0;
    component.closeDialog();
    expect(component.currentInstructionStage).toBe(component.instructionStages.length - 1);
  });

});

function setup() {
  const dialogRef: any = autoSpy(MatDialogRef);
  const data = {};
  const builder = {
    dialogRef,
    data,
    default() {
      return builder;
    },
    build() {
      return new FirstTimeTipsComponent(dialogRef, data);
    }
  };

  return builder;
}
