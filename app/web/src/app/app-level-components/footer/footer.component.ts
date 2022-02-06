import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * Footer for every page of the web application.  
 * The purpose of the footer is to help visitors by adding 
 * information and navigation options at the bottom of web pages
 * 
 * Last edited by: Ryan Lefebvre 6/19/2020
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  /**
   * Copyright needs to be updated if there has been 
   * any contribution made to work during a given year.
   * We are constantly updating the application and this keeps 
   * our copyright date current no matter what.
   */
  currentYear: number = (new Date()).getFullYear();

  /**
  * @ignore
  */
  constructor(
    public environmentService: EnvironmentService,
    public router: Router) { }

  /**
  * @ignore
  */
  ngOnInit() {
  }

  /**
  * Helper method for hiding the support email on small screens.
  * This prevents any overflow from the footer.
  */
  showContactInfo() {
    return window.innerWidth > 540;
  }

  /**
 * Returns true if any of the mobile navbar components should be shown. False otherwise.
 */
  showMobileNav(): boolean {
    return this.environmentService.isMobile && !(this.router.url == "/");
  }

}
