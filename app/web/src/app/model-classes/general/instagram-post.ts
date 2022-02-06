/**
 * Interface that models the object returned by the Instagram embed API (https://developers.facebook.com/docs/instagram/embedding)
 * 
 * Last edited by: Matthew Lefebvre 5/2020
 */
export interface InstagramPost {
    /**
     * The author's id (e.g. - 9538472)
     */
    author_id: number,
    /**
     * The author's account name (e.g. - diegoquinteiro)
     */
    author_name: string,
    /**
     * URL to the author's profile (e.g. - https://www.instagram.com/diegoquinteiro)
     */
    author_url: string,
    /**
     * The height of the post (for some reason the documentation has the height returning as null)
     */
    height: number,
    /**
     * The HTML that can be used to embed the post
     */
    html: string,
    /**
     * The post's id (e.g. - 558717847597368461_9538472)
     */
    media_id: string,
    /**
     * The provider's name (e.g. - Instagram)
     */
    provider_name: string,
    /**
     * URL to the provider (e.g. - https://www.instagram.com)
     */
    provider_url: string,
    /**
     * Height of the thumbnail
     */
    thumbnail_height: number,
    /**
     * A URL to the thumbnail of the post, this is not accessible. To obtain the post's image you must create a separate GET request
     * as shown in the second example here https://developers.facebook.com/docs/instagram/embedding
     */
    thumbnail_url: string,
    /**
     * Width of the thumbnail
     */
    thumbnail_width: number,
    /**
     * The posts caption, for some reason called the title (e.g. - Wii Gato (Lipe Sleep))
     */
    title: string,
    /**
     * The post's type (e.g. - rich)
     */
    type: string,
    /**
     * Version (e.g. - 1.0)
     */
    version: string,
    /**
     * The post's width (e.g. - 658)
     */
    width: number;
}