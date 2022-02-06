
/**
 * Model class used in the {@link ResourceHolderComponent}
 * 
 * Last edited by: Matthew Lefebvre 5/2020
 */
export class Category {
    /**
     * Constructor
     * @param title title of the category (e.g. - Nutrition) 
     * @param resources array of the different resources in this category [isPremium: boolean, title: string, url: string]
     */
    constructor(
        public title: string,
        public resources: [boolean, string, string][]
    ) { }
}