import { FirebaseGeneralService } from './../firebase/firebase-general.service';
import { HttpClient } from '@angular/common/http';
import { InstagramService } from './instagram.service';
import { autoSpy } from 'autoSpy';
import { of } from 'rxjs';

describe('InstagramService', () => {
  let service: InstagramService;

  beforeEach(() => {
    service = setup().build();
  });

  // it('should return an app access token when getAppAccessToken() is called', (done) => {
  //   const appAccessToken: string = "123456789adcdefghijklmnopqrstuvqxyz";
  //   service.http.get = jasmine.createSpy().and.returnValue(of({ token: appAccessToken }))
  //   service.getAppAccessToken().then(response => {
  //     expect(response.token).toBe(appAccessToken);
  //     done();
  //   });
  // });

  it('should return the app id when getAppId() is called', () => {
    expect(service.getAppId()).toBe("702679287099253");
  })

  it('should return the client access token when getClientAccessToken() is called', () => {
    expect(service.getClientAccessToken()).toBe("8bf848bb4ae77410c187d97e5d48b293");
  });

  function setup() {
    const http = autoSpy(HttpClient);
    const firebase = autoSpy(FirebaseGeneralService);
    const builder = {
      default() {
        return builder;
      },
      build() {
        firebase.getInstagramAPIKeys = jasmine.createSpy().and.returnValue(of({
          data: function() {
            return { secret: "secretKey" }
          } 
        }));
        http.get = jasmine.createSpy().and.returnValue(of());
        return new InstagramService(http, firebase);
      }
    }
    return builder;
  }

});
