import { TierPermissionsService } from './../../../../services/general/tier-permissions.service';
import { DialogCreatorService } from './../../../../shared-modules/dialogs/dialog-creator.service';
import { Category } from './../../../../model-classes/general/category';
import { Component, OnInit } from '@angular/core';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';

/**
 * Component that displays {@link Category} objects as a resource section with subresources.
 * Schema of resource objects is as follows: 
 * 
 *  [
 *    isPremium ,      // true if the resource can only be accessed by premium users 
 *    title,           // title of the resource shown above its thumbnail 
 *    resourceURL      // url to the resource to be loaded 
 *    thumbnailURL     // url of the thumbnail displayed on the resource card 
 *    thumbnailLoaded  // true if the thumbnail loaded, false otherwise  
 *  ]
 * 
 *  Last edited by: Ryan Lefebvre 9/20/2020
 */
@Component({
  selector: 'app-resource-holder',
  templateUrl: './resource-holder.component.html',
  styleUrls: ['./resource-holder.component.css']
})
export class ResourceHolderComponent implements OnInit {
  /**
   * The Categories of resources being displayed
   */
  categories: Category[];

  /**
   * Flag used to determine whether the resources page should be visible
   */
  showResourceList = true;

  /**
   * The selected resources title
   */
  selectedResourceTitle = null;

  /**
   * Key used to identify the What is TDEE resources page
   */
  WHAT_IS_TDEE: string = "What is TDEE?";

  /**
  * Key used to identify the activity level guide resource.
  */
  ACTIVITY_LEVEL_GUIDE: string = "Activity level guide";

  /**
  * Key used to identify the periodization resource.
  */
  PERIODIZATION: string = "Periodization for nutrition";

  /**
  * Key used to identify the bulking resource.
  */
  BULKING: string = "Bulking recommendations";

  /**
   * Key used to identify the cutting resource.
   */
  CUTTING: string = "Cutting recommendations";

  /**
   * Key used to identify the bulk or cut guidelines resource.
   */
  BULK_OR_CUT: string = "Should I bulk or cut?";

  /**
   * Contains the y position of the last click to revert scroll postion.
   */
  LAST_Y_POS: number = 0;

  /**
   * @ignore
   */
  constructor(
    public firebaseGeneral: FirebaseGeneralService,
    public dialogService: DialogCreatorService,
    public permissionService: TierPermissionsService,
    public iap: InAppPurchaseService,
    public environmentService: EnvironmentService,
    public stateManager: StateManagerService) { }

  /**
   * @ignore
   */
  ngOnInit() {
    const resourceList = [
      {
        "title": "General",
        "resources": [
          [
            "What is TDEE?",
            "./assets/resources/whatIsTDEE-min.png",
            false
          ],
          [
            "Activity level guide",
            "./assets/resources/activityLevel-min.png",
            false
          ]
        ]
      },
      {
        "title": "Nutrition",
        "resources": [
          [
            "Periodization for nutrition",
            "./assets/resources/nutritionPeriodization-min.png",
            false
          ],
          [
            "Bulking recommendations",
            "./assets/resources/bulking-min.png",
            true
          ],
          [
            "Cutting recommendations",
            "./assets/resources/cutting-min.png",
            true
          ],
          [
            "Should I bulk or cut?",
            "./assets/resources/bulkOrCut-min.png",
            true
          ]
        ]
      },
    ]
    this.categories = this.getResourcesFromJSON(resourceList);
  }

  /**
   * Converts the return from FirebaseGeneralService into a Category[]
   * @param jsonList return from FirebaseGeneralService 
   */
  getResourcesFromJSON(jsonList: any[]): Category[] {
    let returnList = [];
    const context = this;
    jsonList.forEach(json => {
      json.resources = json.resources.map(resource => {
        const resourceImageHasBeenLoaded: boolean = false;
        resource.push(resourceImageHasBeenLoaded);
        context.getResourceImageURL(resource);
        return resource;
      })
      returnList.push(new Category(json.title, json.resources))
    });
    return returnList;
  }

  /**
   * Handles loading resources. Changes component state internally and will check if the resource is premium only
   * @param resource the resource to load
   */
  loadResource(resource) {
    if (this.environmentService.isMobile) {
      this.LAST_Y_POS = (document.getElementsByClassName('mat-sidenav-content'))[0].scrollTop;
    }
    else {
      this.LAST_Y_POS = document.scrollingElement.scrollTop;
    }
    const userHasPremium: boolean = this.permissionService.userHasActiveSubscription()
    if (this.isPremium(resource) && !userHasPremium) {
      this.dialogService.openAppropritateAccountDialog(this.iap);
    } else {
      this.showResourceList = false;
      this.selectedResourceTitle = this.getResourceTitle(resource);
      this.stateManager.scrollToTop();
    }
  }

  /**
   * Returns true if the resource is premium, false otherwise.
   * 
   * @param resource Resource to check for being premium
   */
  isPremium(resource): boolean {
    return resource[2];
  }

  /**
   * Handles going back to the resource list from a resource
   */
  backToResources() {
    this.showResourceList = true;
    this.stateManager.scrollToTop(this.LAST_Y_POS);
  }

  /**
   * Gets the title of a resource
   * @param resource resource
   */
  getResourceTitle(resource: [string, string, boolean, boolean]): string {
    return resource[0];
  }

  /**
   * Gets the Image URL of a resource
   * @param resource resource
   */
  getResourceImageURL(resource: [string, string, boolean, boolean]): string {
    try {
      const imageURL: string = resource[1];
      const resourceImageHasBeenLoaded: boolean = true;
      resource[3] = resourceImageHasBeenLoaded;
      return imageURL;
    }
    catch (error) {
      return "NO_URL_FOUND";
    }
  }

  /**
  * Returns true if the resource has been loaded, false otherwise.
  * 
  * @param resource resource
  */
  resourceHasBeenLoaded(resource: [string, string, boolean, boolean]): boolean {
    return resource[3];
  }

  /**
   * Checks whether a URL is a PDF resource
   * @param url url
   */
  isPDF(url: string) {
    return !this.isYouTube(url)
  }

  /**
   * Checks whether a URL is a YouTube resource
   * @param url url
   */
  isYouTube(url: string) {
    return url.includes("https://www.youtube.com/embed/");
  }

}
