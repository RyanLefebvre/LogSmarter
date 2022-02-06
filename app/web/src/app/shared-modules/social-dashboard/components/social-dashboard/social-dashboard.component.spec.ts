// import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
// import { Media, MediaType, Owner, SocialDashboardComponent } from './social-dashboard.component';
// import { autoSpy } from 'autoSpy';
// import { TestHelpers } from 'src/app/services/general/testHelpers';

// describe('SocialDashboardComponent', () => {
//   const testHelper: TestHelpers = new TestHelpers();

//   let component: SocialDashboardComponent;
//   beforeEach(() => {
//     component = setup().default().build(); 
//   });

//   it('should assign populate the media and owners collections when ngOnInit is called', () => {
//     let lamdaRef = null;

//     component.firebaseGeneral = {
//       getSocials: () => ({
//         subscribe: (socials) => {
//           lamdaRef = socials
//         } 
//       })
//     } as any;

//     component.ngOnInit();

//     const socials = {
//       data: () => ({
//         owners: `[{"id": "0000", "owner": "LogSmarter", "themeColor": "#000000"}]`,
//         socials: `[{"type" : 2, "title": "Example Title", "data": "1234ABC", "ownerId": "0000"}]`
//       })
//     } as any;

//     lamdaRef(socials);

//     expect(component.display).toBe(true);
//   });

//   it('should return the owner of the given media when getOwnerGivenMedia is called', () => {
//     const media = new Media(MediaType.INSTAGRAM, 'Title', 'Data', '0000');
//     const owner = new Owner('0000', 'LogSmarter', 'color');
//     component.owners = [owner];

//     const result = component.getOwnerGivenMedia(media);

//     expect(result.id).toEqual('0000');
//     expect(result.displayName).toEqual('LogSmarter');
//     expect(result.themeColor).toEqual('color');
//   });
// });

// function setup() {
//   const firebaseGeneral = autoSpy(FirebaseGeneralService);
//   const builder = {
//     firebaseGeneral,
//     default() {
//       return builder;
//     },
//     build() {
//       return new SocialDashboardComponent(firebaseGeneral);
//     }
//   };

//   return builder;
// }
