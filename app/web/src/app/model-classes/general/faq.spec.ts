import { FAQ } from './faq';

describe('FAQ', () => {
  let component: FAQ;

  beforeEach(() => {
    component = setup().default().build()
  })

  it('should return the FAQ’s question when getQuestion is called', () => {
    expect(component.getQuestion()).toEqual('question');
  });

  it('should return the FAQ‘s answer when getAnswer is called', () => {
    expect(component.getAnswer()).toEqual('answer');
  });

  it('shoud return the FAQ‘s number when getNumber is called', () => {
    expect(component.getNumber()).toEqual(1);
  });
});

function setup() {
  const builder = {
    default() {
      return builder;
    },
    build() {
      return new FAQ('question', 'answer', 1);
    }
  };

  return builder;
}
