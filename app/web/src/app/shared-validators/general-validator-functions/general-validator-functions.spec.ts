import { hasNumber } from './has-number';
import { hasWhiteSpace } from './has-white-space';

describe('General Validator Functions', () => {

    describe('hasNumber', () => {

        it('should return true if the string argument contains a number', () => {
            expect(hasNumber('somestr1ng')).toBe(true);
        });
    
        it('should return false if the string argument does not contain a number', () => {
            expect(hasNumber('somestring')).toBe(false);
        });
    });

    describe('hasWhiteSpace', () => {
        
        it('should return true when the string argument has whitespace', () => {
            expect(hasWhiteSpace('some string')).toBe(true);
        });
    
        it('should return false when the string argument does not have whitespace', () => {
            expect(hasWhiteSpace('somestring')).toBe(false);
        });
    
        it('should return true when a string arguement has trailing whitespace', () => {
            expect(hasWhiteSpace('somestring   ')).toBe(true)
        });
    });
});