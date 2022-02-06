import { Component, OnInit } from '@angular/core';

/**
 * Multiple components in the application need access to our terms of service. This 
 * component is a wrapper around the text for the terms of service so that they can be 
 * used in different containers without keeping the terms in plain text in more than one 
 * location.
 * 
 * Last edited by: Ryan Lefebvre 7/11/2020
 */
@Component({
  selector: 'app-terms-text',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.css']
})
export class TermsTextComponent implements OnInit {

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
