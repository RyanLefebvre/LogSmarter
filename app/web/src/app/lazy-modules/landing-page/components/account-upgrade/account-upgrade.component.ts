import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
* Component that is displayed after a successful Octobat 
* transaction. This component is intended to serve as a 
* thank you message to the customer and stall while we 
* wait for async code responding to octobat webhooks on 
* the backend executes.
* 
* Last edited by: Ryan Lefebvre 6/20/2020
*/
@Component({
  selector: 'app-account-upgrade',
  templateUrl: './account-upgrade.component.html',
  styleUrls: ['./account-upgrade.component.css']
})
export class AccountUpgradeComponent implements OnInit {

  /**
  * @ignore
  */
  constructor(
    public router: Router,
    public ngz: NgZone,
    public environmentService: EnvironmentService) { }

  /**
  * @ignore
  */
  ngOnInit() {
  }

  /**
   * Takes the user back to the dashboard.
   */
  goToDash(): void {
    this.ngz.run(() => this.router.navigate(['dashboard']));
  }

}
