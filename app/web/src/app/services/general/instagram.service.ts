import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Service to work with the Instagram API
 * @author Matt Lefebvre
 */
@Injectable({
  providedIn: 'root'
})
export class InstagramService {
  /**
   * The App ID
   */
  public static readonly APP_ID: string = "702679287099253";

  /**
   * The Client Token
   */
  public static readonly CLIENT_TOKEN: string = "8bf848bb4ae77410c187d97e5d48b293";

  /**
   * @ignore
   */
  constructor(public http: HttpClient, public firebase: FirebaseGeneralService) { }

  /**
   * Returns the app id
   */
  public getAppId(): string {
    return InstagramService.APP_ID;
  }

  /**
   * Returns the client access token
   */
  public getClientAccessToken() {
    return InstagramService.CLIENT_TOKEN;
  }

}