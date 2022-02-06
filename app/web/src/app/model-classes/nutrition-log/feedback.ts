
/**
 * Represents a piece of feedback from the LogSmarter algorithm.
 * Feedback consists of a title that should describe what the feedback 
 * is about and a message that contains the actual content of the feedback.
 * 
 * Last edited by: Ryan Lefebvre 7/20/2020
 */
export class Feedback {

    /**
     * Title of the algorithm feedback.
     */
    title: string = null;

    /**
     * Contains the actual content of the feedback.
     */
    message: string = null;

    /**
     * Converts the feedback from its current state which is a 
     * JS class object into a JSON.
     */
    toJSON(): { title: string; message: string; } {
        return {
            title: this.title,
            message: this.message
        }
    }

}