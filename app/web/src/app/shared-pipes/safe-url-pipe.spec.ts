import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { autoSpy } from 'autoSpy';
import { SafePipe } from './safe-url-pipe';

class MockDomSanitizer extends DomSanitizer {
  sanitize(): string{
    return 'ANY';
  }
  bypassSecurityTrustHtml(): string{
    return 'ANY'
  }
  bypassSecurityTrustStyle(): string{
    return 'ANY'
  }
  bypassSecurityTrustScript(): string{
    return 'ANY'
  }
  bypassSecurityTrustUrl(): string{
    return 'ANY'
  }
  bypassSecurityTrustResourceUrl(): string{
    return 'ANY'
  }
}

describe('SafePipe', () => {
 it('should return the result of a call to sanitizer.bypassSecurityTrustResourceUrl(url) when transform is called', () => {
   const def = setup().default();
   let component: SafePipe = def.build();

   component.transform('url');

   expect(def.sanitizerSpy).toHaveBeenCalledWith('url');
 });
});

function setup() {
  // need to allow respy here to spy on private sanitizer member
  jasmine.getEnv().allowRespy(true);

  const sanitizer = autoSpy(MockDomSanitizer)
  const sanitizerSpy: jasmine.Spy<(url) => SafeResourceUrl> = spyOn(sanitizer, 'bypassSecurityTrustResourceUrl'); 
  const builder = {
    sanitizer,
    sanitizerSpy,
    default() {
      return builder;
    },
    build() {
      return new SafePipe(sanitizer);
    }
  };

  return builder;
}
