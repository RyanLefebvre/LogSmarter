import { Injectable } from '@angular/core';
import { ExportToCsv } from 'export-to-csv';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';

/**
 * We gotta give the people a way to get their info out of the app. 
 * This service was made so people can convert their log to a csv
 * and download the data.
 * 
 * Last edited by: Ryan Lefebvre 7/25/2021
 */
@Injectable({
  providedIn: 'root'
})
export class ExporterService {

  /**
   * @ignore
   */
  constructor(public snackBarService: SnackBarService) {
  }

  /**
   * Returns a csv exporter object using the options passed in.
   * 
   * @param options
   */
  getExporter(options): ExportToCsv {
    return new ExportToCsv(options);
  }

  /**
   * Exports nutrition log to csv by creating a spreadsheet
   * where each row is a different entry in the log. Removes
   * the properties that people don't care about like id 
   * and goal intake boundaries.
   * 
   * @param log Log to be exported to a csv.
   */
  exportNutrLogToCSV(log: NutritionLog) {
    let options = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
      filename: log.title
    };
    let csvExporter: ExportToCsv = this.getExporter(options);
    let data = []
    log.dayEntries.forEach((entry: DayEntry) => {
      let rawEntry = {}
      for (const [key, value] of Object.entries(entry)) {
        const isPropertyThatUserWontCareAbout: boolean = (
          key == "id" || key == "goalIntakeBoundaries"
        );
        if (!isPropertyThatUserWontCareAbout) {
          rawEntry[key] = value;
        }
      }
      data.push(rawEntry)
    });
    if (data.length > 0) {
      csvExporter.generateCsv(data);
      this.snackBarService.showSuccessMessage("Data exported successfully!");
    } else {
      this.snackBarService.showFailureMessage("No data to export!");
    }
  }
}