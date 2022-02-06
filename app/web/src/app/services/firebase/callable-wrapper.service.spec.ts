import { AngularFireFunctions } from '@angular/fire/functions';
import { CallableWrapperService } from './callable-wrapper.service';
import { autoSpy } from 'autoSpy';
import { of } from 'rxjs';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';

describe('CallableWrapperService', () => {
  let service: CallableWrapperService;

  beforeEach(() => {
    service = setup().default().build();
  });

  it('should mock a request to a cloud function when firebaseCloudFunction is called (no error)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.returnValue(str => of(""));
    service.firebaseCloudFunction("func", "body").then(() => {
      expect(fireFuncSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should mock a request to a cloud function when firebaseCloudFunction is called (error)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable');
    service.firebaseCloudFunction("func", "body").then(value => {
      expect(value).toBe(service.ERROR)
      expect(fireFuncSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should mock a request to a cloud function when firebaseCloudFunction is called (error internal)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.callFake(() => { throw { code: "internal" } });
    service.firebaseCloudFunction("func", "body").then(value => {
      expect(value).toBe(service.ERROR);
      expect(fireFuncSpy).toHaveBeenCalled();
      expect(service.snackBarManager.showWarningMessage).toHaveBeenCalled();
      done();
    });
  });

});

function setup() {
  const fireFunc = autoSpy(AngularFireFunctions);
  const snackbar = autoSpy(SnackBarService);
  const builder = {
    fireFunc,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new CallableWrapperService(fireFunc, snackbar);
    }
  };

  return builder;
}
