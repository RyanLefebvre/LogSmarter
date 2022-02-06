import { Component, OnInit } from '@angular/core';

/**
 * Terms component for LogSmarter.
 * This component is contains LogSmarter's Terms of Service document in static HMTL.
 * All changes to this document are made in the HTML. Whenever the HTML is updated,
 * the author of the edits should update the "Last edited" date at the top of the file.
 * 
 * Last edited by: Bowen Bilodeau 7/28/2020
 */
@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.css']
})
export class TermsComponent implements OnInit {

  /**
   * @ignore
   */
  constructor() { }

  /**
   * @ignore
   */
  ngOnInit() {
  }

}
