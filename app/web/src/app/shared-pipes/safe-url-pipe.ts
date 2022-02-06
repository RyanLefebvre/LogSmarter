import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Taken directly from the angular documentation: Bypass security and trust the given value to be a safe resource 
 * URL, i.e. a location that may be used to load executable code from, like <script src>, or <iframe src>."
 * @param url The url to sanitize.
 * 
 * Last edited by: Matthew Lefebvre ?/??/????
 */
@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {

  /**
   * @ignore
   */
  constructor(private sanitizer: DomSanitizer) { }

  /**
   * @ignore 
   */
  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
} 