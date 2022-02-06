import { Component, Input, OnInit } from '@angular/core';
import { Media } from 'src/app/model-classes/general/media';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';

/**
 * Component that displays {@link Media} as an {@link EmbedPanelComponent}.
 * Takes an optional input to filter the posts by certain owners only.
 * To add an owner whitelist to a social dashboard you can do... <app-social-dashboard [owners]="['0000']'></app-social-dashboard>
 */
@Component({
  selector: 'app-social-dashboard',
  templateUrl: './social-dashboard.component.html',
  styleUrls: ['./social-dashboard.component.css']
})
export class SocialDashboardComponent implements OnInit {
  /**
   * The TTL in seconds for the social dashboard posts
   */
  private static readonly POSTS_TTL_IN_SECONDS: number = 86400;

  /**
   * Array of owners who can have their posts displayed in the social dashboard instance
   */
  @Input('owners') owners: string[] = null;

  /**
   * The media that is displayed in the component
   */
  public displayedMedia: Media[] = [];

  /**
   * The media that is not displayed in the component but can be displayed
   */
  public undisplayedMedia: Media[] = [];

  /**
   * Flag that toggles the components display after the firebase request has been completed
   */
  public display = false;

  /**
   * @ignore 
   */
  constructor(public firebaseGeneral: FirebaseGeneralService) { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.firebaseGeneral.getSocials().toPromise().then(response => {
      const isFromCache: boolean = (<any> response)._fromCache;

      // If the firebase response has a true _fromCache field then the user is offline (https://cloud.google.com/firestore/docs/manage-data/enable-offline#:~:text=If%20you%20get%20a%20document,an%20error%20is%20returned%20instead.)
      if (isFromCache) {
        return;
      }

      const posts = this.getSocialsFromJSONList(JSON.parse(response.data().socials));
      this.initDashboard(posts);
    });
  }

  /**
   * Initializes the social dashboard
   * @param posts posts to display on the social dashboard
   */
  private initDashboard(posts) {
    this.undisplayedMedia = this.owners === null ? posts : posts.filter(post => this.owners.includes(post.ownerId));
    this.shuffle(this.undisplayedMedia);
    this.addDisplayedPosts(8);
    this.display = this.displayedMedia.length > 0
  }

  /**
   * Converts the response from firebase into a Media[]
   * @param jsonList The response from firebase
   */
  private getSocialsFromJSONList(jsonList: any[]): Media[] {
    let returnList = [];
    jsonList.forEach(json => {
      returnList.push(new Media(json.type, json.title, json.data, json.ownerId))
    })
    return returnList;
  }

  /**
  * Shuffles an array (source: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array)
  */
  private shuffle(a): void {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Adds 4 posts to the social dashboard assuming there are still posts to display
   * @paramthe number of posts to make visible
   */
  private addDisplayedPosts(posts: number): void {
    for (let n = 0; n < posts && this.undisplayedMedia.length != 0; n++) {
      this.displayedMedia.push(this.undisplayedMedia.pop());
    }
  }

}