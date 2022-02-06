import { Testimonial } from './testimonial';

describe('Testimonial', () => {

  let testimonial;

  it('should successfully construct a testimonial object and assign the correct values to all public members', () => {
    testimonial = new Testimonial('name', 'title', 'url/', 'message');
    expect(testimonial).not.toBe(null);
    expect(testimonial.name).toEqual('name');
    expect(testimonial.title).toEqual('title');
    expect(testimonial.imageUrl).toEqual('url/');
    expect(testimonial.message).toEqual('message');
  });
});