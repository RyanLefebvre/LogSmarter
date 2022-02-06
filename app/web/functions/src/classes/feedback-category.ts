import { Feedback } from "./feedback";

/**
 * Wrapper around a list of feedback objects that are similar. 
 * Used to group feedback returned from various analyzers.
 * 
 * Last edited by: Ryan Lefebvre 8/02/2020
 */
export class FeedbackCategory {

    /**
     * Title used to identify the feedback category and what links the 
     * feedback objects in the feedback list together.
     */
    category: string;

    /**
     * A list of feedback objects that belong to this feedback category.
     */
    feedbackList: Feedback[];

}