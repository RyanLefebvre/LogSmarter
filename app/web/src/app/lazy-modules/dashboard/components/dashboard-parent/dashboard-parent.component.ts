import { Component, OnInit } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';

/**
 * This is the parent component for the various dashboards that 
 * are displayed based upon user type. It handles the checking 
 * of the user's profile type through the state manager and is 
 * the component loaded by the 'dashboard' route for authenticated 
 * users.
 * 
 * Last edited by: Ryan Lefebvre 9/30/2020
 */
@Component({
  selector: 'app-dashboard-parent',
  templateUrl: './dashboard-parent.component.html',
  styleUrls: ['./dashboard-parent.component.css']
})
export class DashboardParentComponent implements OnInit {

  /**
   * @ignore
   */
  constructor(public stateManager: StateManagerService) { }

  /**
   * @ignore
   */
  ngOnInit() {
  }

}
