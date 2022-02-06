import { MediaType } from "./media-type";

/**
 * Class that stores information used to populate a {@link EmbedPanelComponent}
 */
export class Media {
    /**
     * Media constructor
     * @param type The type of media being displayed
     * @param title The title of the media (e.g. - New LogSmarter Logo!)
     * @param data Instagram (use the URL to the post), YouTube (use the video id: https://www.youtube.com/watch?v={VIDEO ID HERE}), LinkedIn (use the embed link on the post)
     * @param ownerId The ID of whoever owns this post
     */
    constructor(
      public type: MediaType,
      public title: string,
      public data: string,
      public ownerId: string
    ) { }
  }