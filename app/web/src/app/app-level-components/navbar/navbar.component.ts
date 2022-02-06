import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { StateManagerService } from '../../services/general/state-manager.service';

/**
 * Navbar for every page of the application. Helps users
 * navigate to other pages of the application. When the window
 * is wide, the navbar displays the links in the top right hand side.
 * When the window is narrow, the navbar will display a button that 
 * activates a sidenav and displays the same links which would no longer 
 * fit in the narrow window.
 * 
 * Last edited by: Ryan Lefebvre 6/19/2020
 */
@Component({
  selector: 'app-nav-bar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavBarComponent implements OnInit {

  /**
  * @ignore
  */
  constructor(
    public state: StateManagerService,
    public environmentService: EnvironmentService,
    public tierPermission: TierPermissionsService,
    public router: Router) {
  }

  /**
  * @ignore
  */
  ngOnInit(): void {
  }

  /**
  * @ignore
  */
  ngOnDestroy(): void {
  }

  /**
   * Returns true if any of the mobile navbar components should be shown. False otherwise.
   */
  showMobileNav(): boolean {
    return this.environmentService.isMobile && !(this.router.url == "/");
  }

  /**
   * Returns true if any of the web navbar components should be shown. False otherwise.
   */
  showWebNav(): boolean {
    return this.environmentService.isWeb;
  }

  /**
   * Applies the mobile sidenav styles to allow full screen UI
   * rubber banding with no whitespace or scroll bar visible
   */
  rubberBandSideNav() {
    const onTermsOrPolicy: boolean = (this.router.url.includes("terms") || this.router.url.includes("privacy"));
    return ((this.environmentService.isMobile && this.state.userIsAuthenticated()) || (this.environmentService.isMobile && onTermsOrPolicy));
  }

}
