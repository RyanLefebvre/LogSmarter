import { Feedback } from './feedback';

describe('Feedback', () => {
  it('it should return a JSON of the feedback title and message when toJSON is called', () => {
    let component: Feedback = setup().default().build();

    const json = component.toJSON();

    expect(json).toEqual({title: component.title, message: component.message});
  });
});

function setup() {
  
  const builder = {
    
    default() {
      return builder;
    },
    build() {
      const feedback: Feedback = new Feedback();
      feedback.title = 'title';
      feedback.message = 'message';
      return feedback;
    }
  };

  return builder;
}
