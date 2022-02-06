import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { StateManagerService } from '../general/state-manager.service';

/**
 * Route guard used to protect routes that only authenticated users can access.
 * 
 * Last edited by: Ryan Lefebvre 7/04/2020
 */
@Injectable({
  providedIn: 'root'
})
export class OnlyLoggedInUsersGuard implements CanActivate {

  /**
   * @ignore
   */
  constructor(public stateManager: StateManagerService) { }

  /**
   * @ignore
   */
  canActivate(): boolean {
    return this.stateManager.userIsAuthenticated();
  }

}
