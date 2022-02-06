/**
 * Class that represents a frequently asked question
 * 
 * Last edited by: Matthew Lefebvre 5/2020
 */
export class FAQ {

    /**
     * FAQ constructor
     * @param question The frequently asked question (e.g. - Why was LogSmarter started?) 
     * @param answer The answer to the question (e.g. - Ryan started it because...)
     * @param faqNumber The number of the FAQ 
     */
    constructor(private question: string, private answer: string, private faqNumber: number) { }

    /**
     * Getter method for the FAQ's question
     * @return question: string
     */
    public getQuestion(): string {
        return this.question;
    }

    /**
     * Getter method for the FAQ's answer
     * @return answer: string
     */
    public getAnswer(): string {
        return this.answer;
    }

    /**
     * Getter method for the FAQ's number
     * @return number: number
     */
    public getNumber(): number {
        return this.faqNumber
    }

}