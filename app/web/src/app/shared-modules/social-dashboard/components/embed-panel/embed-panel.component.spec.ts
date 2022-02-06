// import { HttpClient } from '@angular/common/http';
// import { ConstantsService } from 'src/app/services/general/constants.service';
// import { EmbedPanelComponent } from './embed-panel.component';
// import { autoSpy } from 'autoSpy';
// import { MediaType } from '../social-dashboard/social-dashboard.component';

// let post;
// let image;
// let postRef;
// let imageRef;

// describe('EmbedPanelComponent', () => {
//   let component: EmbedPanelComponent;

//   beforeEach(() => {
    // postRef = null;
    // imageRef = null;

    // post = {
    //   subscribe: (p) => postRef = p,
    // } as any;

    // image = {
    //   subscribe: (img, err) => {
    //     imageRef = img;
    //   }
    // } as any;

    // component = setup().default().build();
  // });

  //   it('should unsubscribe from the postObservable if it exists when ngOnDestroy is called', () => {
  //     component.postObservable = {unsubscribe: () => {}} as any;
  //     component.imageObservable = null;

  //     const postObsSpy: jasmine.Spy<() => {}> = spyOn(component.postObservable, 'unsubscribe');

  //     component.ngOnDestroy();

  //     expect(postObsSpy).toHaveBeenCalledTimes(1);
  //   });

  //   it('should unsubscribe from the postObservable if it exists when ngOnDestroy is called', () => {
  //     component.postObservable = null;
  //     component.imageObservable = {unsubscribe: () => {}} as any; 

  //     const imageObsSpy: jasmine.Spy<() => {}> = spyOn(component.imageObservable, 'unsubscribe');

  //     component.ngOnDestroy();

  //     expect(imageObsSpy).toHaveBeenCalledTimes(1);
  //   });

  //   it('should load the instagram post and grab the title if the current mediaType is Instagram when ngOnInit is called', () => {
  //     const someTitle = 'some title';
  //     const someImage = 'some/image';
  //     component.type = MediaType.INSTAGRAM;

  //     component.ngOnInit();

  //     postRef({title: someTitle});

  //     imageRef({url: someImage});

  //     expect(component.description).toEqual(someTitle);
  //     expect(component.image).toEqual(someImage);
  //   });

  //   // it('should save the error url if an error occurs when grabbing an Instagram post when ngOnInit is called', () => {
  //   //   const someImageError = 'some/image/error';
  //   //   component.type = MediaType.INSTAGRAM;

  //   //   component.ngOnInit();

  //   //   postRef({title: ''});
  //   //   //imageRef({url: () => throwError({url: someImageError})});

  //   //   expect(component.image).toEqual(someImageError);
  //   // });

  //   it('should configure the youtube url if the current media type is youtube when ngOnInit is called', () => {
  //     component.type = MediaType.YOUTUBE;
  //     component.data = 'somedata';

  //     component.ngOnInit();

  //     expect(component.youtubeURL).toEqual('https://www.youtube.com/embed/somedata');
  //   });

  //   it('should not configure the youtube url if the current media is not youtube when ngOnInit is called', () => {
  //     component.type = MediaType.LINKEDIN;
  //     component.data = 'somedata';

  //     component.ngOnInit();

  //     expect(component.youtubeURL).toBe(null); 
  //   })

  //   it('should return true if the given mediaType is Instagram when isInstagram is called', () => {
  //     expect(component.isInstagram(MediaType.INSTAGRAM)).toBe(true);
  //   });

  //   it('should return false if the given mediaType is not Instagram when isInstagram is called', () => {
  //     expect(component.isInstagram(MediaType.YOUTUBE)).toBe(false);
  //   });

  //   it('should return true if the given mediaType is LinkedIn when isLinkedIn is called', () => {
  //     expect(component.isLinkedIn(MediaType.LINKEDIN)).toBe(true);
  //   });

  //   it('should return false if the given mediaType is not LinkedIn when isLinkedIn is called', () => {
  //     expect(component.isLinkedIn(MediaType.YOUTUBE)).toBe(false);
  //   });

  //   it('should return true if the given mediaType is Youtube when isYoutube is called', () => {
  //     expect(component.isYouTube(MediaType.YOUTUBE)).toBe(true);
  //   });

  //   it('should return false if the given mediaType is not Youtube when isYoutube is called', () => {
  //     expect(component.isYouTube(MediaType.INSTAGRAM)).toBe(false);
  //   }); 

  //   it('should return true if the media type is Instagram and the post and image were loaded when isLoaded is called', () => {
  //     const someTitle = 'some title';
  //     const someImage = 'some/image';

  //     component.type = MediaType.INSTAGRAM;
  //     component.ngOnInit();

  //     postRef({title: someTitle});
  //     imageRef({url: someImage});

  //     expect(component.isLoaded()).toBe(true);
  //   });

  //   it('should return the true if the media type is not Instagram and spinner is false', () => {
  //     component.type = MediaType.YOUTUBE;

  //     component.ngOnInit();

  //     expect(component.isLoaded()).toBe(true);
  //   });

  //   it('should return true if the given mediaOwner has a defined themeColor when ownerHasThemeColor is called', () => {
  //     const owner = new Owner('0000', 'LogSmarter', '#000000');
  //     expect(component.ownerHasThemeColor(owner)).toBe(true);
  //   });

  //   it('should return false if the given mediaOwner has an undefined themeColor when ownerHasThemeColor is called', () => {
  //     const owner = new Owner('0000', 'LogSmarter', '');
  //     expect(component.ownerHasThemeColor(owner)).toBe(false);
  //   }); 

  //   it('should return the given mediaOwner’s themeColor if they have one when getOwnerThemeColor is called', () => {
  //     const owner = new Owner('0000', 'LogSmarter', '#000000');
  //     const color = component.getOwnerThemeColor(owner);
  //     expect(color).toEqual({'color': '#000000'} as any); 
  //   });

  //   it('should return the given mediaOwner’s themeColor if they have one when getOwnerThemeColor is called', () => {
  //     const owner = new Owner('0000', 'LogSmarter', null);
  //     const color = component.getOwnerThemeColor(owner);
  //     expect(color).toBe(null); 
  //   }); 

  //   it('should return an Instagram link if the given mediatype is Instagram when getSocialLink is called', () => {
  //     expect(component.getSocialLink(MediaType.INSTAGRAM)).toEqual('https://www.instagram.com/log_smarter/');
  //   });

  //   it('should return an LinkedIn link if the given mediatype is LinkedIn when getSocialLink is called', () => {
  //     expect(component.getSocialLink(MediaType.LINKEDIN)).toEqual('https://www.linkedin.com/company/logsmarter/');
  //   });

  //   it('should return an Youtube link if the given mediatype is Youtube when getSocialLink is called', () => {
  //     expect(component.getSocialLink(MediaType.YOUTUBE)).toEqual('https://www.youtube.com/channel/UC7eJSb_q0YHU7z9-YpstCAQ');
  //   });

  //   it('should return an Instagram font awesome icon if the given mediatype is Instagram when getFontAwesomeIcon is called', () => {
  //     expect(component.getFontAwesomeIcon(MediaType.INSTAGRAM)).toEqual('fa fa-instagram button');
  //   });

  //   it('should return an LinkedIn font awesome icon if the given mediatype is LinkedIn when getFontAwesomeIcon is called', () => {
  //     expect(component.getFontAwesomeIcon(MediaType.LINKEDIN)).toEqual('fa fa-linkedin-square button');
  //   });

  //   it('should return an Youtube font awesome icon if the given mediatype is Youtube when getFontAwesomeIcon is called', () => {
  //     expect(component.getFontAwesomeIcon(MediaType.YOUTUBE)).toEqual('fa fa-youtube button');
  //   });
  // });

  // function setup() {
  //   const http = autoSpy(HttpClient);
  //   const constants = autoSpy(ConstantsService);
  //   const builder = {
  //     http,
  //     constants,
  //     default() {
  //       return builder;
  //     },
  //     build() {
  //       spyOn(http, 'get').and.returnValues(post, image);
  //       return new EmbedPanelComponent(http, constants);
  //     }
  //   };

  //   jasmine.getEnv().allowRespy(true);

  //   return builder;
// }
