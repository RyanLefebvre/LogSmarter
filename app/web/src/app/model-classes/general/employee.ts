import { Contact } from 'src/app/model-classes/general/contact';

/**
 * Class that models an Employee. This model class is used to easily populate {@link AboutComponent}
 * 
 * Last edited by: Matthew Lefebvre 5/2020
 */
export class Employee {
    /**
     * Employee constructor
     * @param photoOnLeft Whether the photo should appear on the left or right of an app-employee-panel
     * @param name Name of the employee
     * @param description Description of the employee (this is an array because each string has its own p tag)
     * @param imgPath Path to an image of the employee
     * @param contacts List of the employees contacts
     */
    constructor(
        public photoOnLeft: boolean,
        public name: string,
        public description: string[],
        public imgPath: string,
        public contacts: Contact[]
    ) { }
}