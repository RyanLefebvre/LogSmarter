
import * as feedbackBuilder from './fedbackHelper'
import { Feedback } from '../../../../classes/feedback'

/**
 * Helper function for returning some general feedback to the user when 
 * there is in sufficient data to provide any meaningful feedback for 
 * their log.
 * 
 * Last edited by: Ryan Lefebvre 7/21/2020
 */
export function getGeneralFeeback() {
    let generalFeedback: Feedback = new Feedback();
    generalFeedback.title = feedbackBuilder.getPositiveExclamation();
    let message = "";
    message += feedbackBuilder.getRandomFrom(RANDOM_POSITIVE_STATEMENTS) + "! ";
    message += feedbackBuilder.getRandomFrom(RANDOM_LS_MESSAGES);
    generalFeedback.message = message;
    return generalFeedback;
}

/**
 * A collection of positive statements.
 */
const RANDOM_POSITIVE_STATEMENTS: string[] = [
    "Trust the process",
    "Keep pushing",
    "You've got this",
    "We believe in you",
    "Track smarter, progress faster"
];


/**
 * Collection of random LogSmarter messages.
 */
const RANDOM_LS_MESSAGES: string[] = [
    "The LogSmarter™  algorithm waits to provide specific feedback until there is a sufficient amount of data in your log.",

    "Our algorithm is built on validated data that outperforms traditional methods for estimating calorie requirements.",

    "We've spent countless hours testing the efficacy of our algorithm and are confident it will help you reach your goal.",

    "Did you know there are over 240 equations for estimating energy expenditure? It's a good thing you're using LogSmarter™  instead.",

    "The more data you track in a log, the more accurate our algorithm becomes. We wait a little while until you have enough data in a log to provide an accurate and useful analysis.",

    "Make sure to reach out to the team on social media to let us know why you're using LogSmarter™"
];