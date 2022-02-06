import { FormControl } from '@angular/forms';
import { ExpectedConditions } from 'protractor';
import { ValidateAge } from './age-validator'
import { ValidateCalories } from './calorie-validator';
import { ValidateEmail } from './email-validator';
import { ValidateFootHeight } from './height-foot-validator';
import { ValidateInchesHeight } from './height-inches-validator';
import { ValidateImperialWeight } from './imperial-weight-validator';
import { ValidateMetricHeight } from './metric-height-validator';
import { ValidateMetricWeight } from './metric-weight-validator';
import { ValidatePassword } from './password-validator';
import { ValidateUsername } from './username-validator';

describe('Shared Validators', () => {
    let control: FormControl;

    describe('ValidateAge', () => {
        it('should return null when age is null', () => {
            control = new FormControl(null);
            expect(ValidateAge(control)).toBe(null);
        });

        it('should return { INVALID_AGE: true } when age is not a number', () => {
            const age: string = 'not a number';
            control = new FormControl(age);
            expect(ValidateAge(control)).toEqual({INVALID_AGE: true});
        });

        it('should return null when age is a number in the valid range', () => {
            const age: number = 50;
            control = new FormControl(age);
            expect(ValidateAge(control)).toBe(null);
        });

        it('should return { INVALID_AGE: true } when age is number outside of the valid range', () => {
            const age: number = -1;
            control = new FormControl(age);
            expect(ValidateAge(control)).toEqual({INVALID_AGE: true});
        });
    });

    describe('ValidateCalories', () => {
        it('should return null when calories is null', () => {
            control = new FormControl(null);
            expect(ValidateCalories(control)).toBe(null);
        });

        it('should return { INVALID_AGE: true } when calories is not a number', () => {
            const calories: string = 'not a number';
            control = new FormControl(calories);
            expect(ValidateCalories(control)).toEqual({INVALID_AGE: true}); 
        });

        it('should return null when calories is a number in the valid range', () => { 
            const calories: number = 3000;
            control = new FormControl(calories);
            expect(ValidateCalories(control)).toBe(null);
        });

        it('should return { INVALID_AGE: true } when calories is a nymber ouytside of the valid range', () => {
            const calories: number = -1;
            control = new FormControl(calories);
            expect(ValidateCalories(control)).toEqual({INVALID_AGE: true});
        });
    });

    describe('ValidateEmail', () => {
        it('should return null when email is null', () => {
            control = new FormControl(null);
            expect(ValidateEmail(control)).toBe(null);
        });

        it('should return { INVALID_EMAIL: true } when email is not a string', () => {
            const email: number = 1;
            control = new FormControl(email);
            expect(ValidateEmail(control)).toEqual({INVALID_EMAIL: true});
        });

        it('should return { INVALID_EMAIL: true } when email has an invalid length', () => { 
            let email = 'test@';
            for(let i = 0; i < 255; i++){ email += 'e'}
            control = new FormControl(email);
            expect(ValidateEmail(control)).toEqual({INVALID_EMAIL: true});
        });

        it('should return { INVALID_EMAIL: true } when email does not contain an "@" symbol', () => {
            const email: string = 'testexample.com';
            control = new FormControl(email);
            expect(ValidateEmail(control)).toEqual({INVALID_EMAIL: true});
        });

        it('should return { INVALID_EMAIL: true } when email contains whitespace', () => {
            const email: string = 'test@ examplel.com';
            control = new FormControl(email);
            expect(ValidateEmail(control)).toEqual({INVALID_EMAIL: true});
        });

        it('should return null when the email is valid ( less than 256 characters, inclues and @ symbol and does not have whitespace', () => {
            const email: string = 'test@example.com';
            control = new FormControl(email);
            expect(ValidateEmail(control)).toBe(null);
        });
    });

    describe('ValidateFootHeight', () => {
        it('should return null when heightFeet is null', () => { 
            control = new FormControl(null);
            expect(ValidateFootHeight(control)).toBe(null);
        });

        it('should return { INVALID_HEIGHT: true } when heightFeet is not a number', () => {
            const heightFeet: string = 'not a number';
            control = new FormControl(heightFeet);
            expect(ValidateFootHeight(control)).toEqual({INVALID_HEIGHT: true});
        });

        it('should return { INVALID_HEIGHIT: true} when heightFeet outside the valid range of heights', () => { 
            const heightFeet: number = -1;
            control = new FormControl(heightFeet);
            expect(ValidateFootHeight(control)).toEqual({INVALID_HEIGHT: true});
        });

        it('should return null when heightFeet is a number inside the valid range', () => {
            const heightFeet: number = 6;
            control = new FormControl(heightFeet);
            expect(ValidateFootHeight(control)).toBe(null);
        });
    });

    describe('ValidateInchesHeight', () => {
        it('should return null when heightInches is null', () => { 
            control = new FormControl(null);
            expect(ValidateInchesHeight(control)).toBe(null);
        });

        it('should return { INVALID_HEIGHT: true } when heightInches is not a number', () => {
            const heightInches: string = 'not a number';
            control = new FormControl(heightInches);
            expect(ValidateInchesHeight(control)).toEqual({INVALID_HEIGHT: true});
        });

        it('should return { INVALID_HEIGHIT: true} when heightInches outside the valid range of heights', () => { 
            const heightInches: number = -1;
            control = new FormControl(heightInches);
            expect(ValidateInchesHeight(control)).toEqual({INVALID_HEIGHT: true});
        });

        it('should return null when heightInches is a number inside the valid range', () => {
            const heightInches: number = 6;
            control = new FormControl(heightInches);
            expect(ValidateInchesHeight(control)).toBe(null);
        });
    });

    describe('ValidateImperialWeight', () => {
        it('should return null when imperialWeight is null', () => { 
            control = new FormControl(null);
            expect(ValidateImperialWeight(control)).toBe(null);
        });

        it('should return { INVALID_WEIGHT: true } when imperialWeight is not a number', () => {
            const imperialWeight: string = 'not a number';
            control = new FormControl(imperialWeight);
            expect(ValidateImperialWeight(control)).toEqual({INVALID_WEIGHT: true});
        });

        it('should return { INVALID_WEIGHIT: true} when imperialWeight outside the valid range of heights', () => { 
            const imperialWeight: number = -1;
            control = new FormControl(imperialWeight);
            expect(ValidateImperialWeight(control)).toEqual({INVALID_WEIGHT: true});
        });

        it('should return null when imperialWeight is a number inside the valid range', () => {
            const imperialWeight: number = 6;
            control = new FormControl(imperialWeight);
            expect(ValidateImperialWeight(control)).toBe(null);
        });
    });

    describe('ValidateMetricHeight', () => {
        it('should return null when metricHeight is null', () => { 
            control = new FormControl(null);
            expect(ValidateMetricHeight(control)).toBe(null);
        });

        it('should return { INVALID_HEIGHTt: true } when metricWeight is not a number', () => {
            const metricHeight: string = 'not a number';
            control = new FormControl(metricHeight);
            expect(ValidateMetricHeight(control)).toEqual({INVALID_HEIGHTt: true});
        });

        it('should return { INVALID_HEIGHTt: true} when metricWeight outside the valid range of heights', () => { 
            const metricHeight: number = -1;
            control = new FormControl(metricHeight);
            expect(ValidateMetricHeight(control)).toEqual({INVALID_HEIGHTt: true});
        });

        it('should return null when metricWeight is a number inside the valid range', () => {
            const metricHeight: number = 6;
            control = new FormControl(metricHeight);
            expect(ValidateMetricHeight(control)).toBe(null);
        });
    });

    describe('ValidateMetricWeight', () => {
        it('should return null when metricWeight is null', () => { 
            control = new FormControl(null);
            expect(ValidateMetricWeight(control)).toBe(null);
        });

        it('should return { INVALID_WEIGHT: true } when metricWeight is not a number', () => {
            const metricWeight: string = 'not a number';
            control = new FormControl(metricWeight);
            expect(ValidateMetricWeight(control)).toEqual({INVALID_WEIGHT: true});
        });

        it('should return { INVALID_WEIGHIT: true} when metricWeight outside the valid range of heights', () => { 
            const metricWeight: number = -1;
            control = new FormControl(metricWeight);
            expect(ValidateMetricWeight(control)).toEqual({INVALID_WEIGHT: true});
        });

        it('should return null when metricWeight is a number inside the valid range', () => {
            const metricWeight: number = 6;
            control = new FormControl(metricWeight);
            expect(ValidateMetricWeight(control)).toBe(null);
        });
    });

    describe('ValidatePassword', () => {
        it('should return { invalidPassword: true } when password is null', () => {
            control = new FormControl(null);
            expect(ValidatePassword(control)).toEqual({ invalidPassword: true });
        });

        it('should return { invalidPassword: true } if the trimmed password is an empty string "" ', () => {
            const password: string = '  ';
            control = new FormControl(password);
            expect(ValidatePassword(control)).toEqual({ invalidPassword: true });
        });

        it('should return { invalidPassword: true } if password is an invalid length', () => {
            const password: string = 'pass';
            control = new FormControl(password);
            expect(ValidatePassword(control)).toEqual({ invalidPassword: true });
        });

        it('should return { invalidPassword: true } if password contains whitespace', () => {
            const password: string = 'bad password';
            control = new FormControl(password);
            expect(ValidatePassword(control)).toEqual({ invalidPassword: true });
        });

        it('should return  { invalidPassword: true } if password does not contain a number', () => {
            const password: string = 'alongpasswordwithoutanumber';
            control = new FormControl(password);
            expect(ValidatePassword(control)).toEqual({ invalidPassword: true });
        });

        it('should return null if password is valid', () => {
            const password: string = 'avalidpassword69';
            control = new FormControl(password);
            expect(ValidatePassword(control)).toBe(null);
        });
    });

    describe('ValidateUsername', () => {
        it('should return null when username is null', () => {
            control = new FormControl(null);
            expect(ValidateUsername(control)).toBe(null);
        });

        it('should return { usernameInvalid : true } when username is not a string', () => {
            const username: number = 1;
            control = new FormControl(username);
            expect(ValidateUsername(control)).toEqual({INVALID_USERNAME: true});
        });

        it('should return { usernameInvalid : true } when username has an invalid length', () => { 
            let username = 'user';
            for(let i = 0; i < 25; i++){ username += 'er'}
            control = new FormControl(username);
            expect(ValidateUsername(control)).toEqual({INVALID_USERNAME: true});
        });

        it('should return null when the username is valid', () => {
            const username: string = 'username';
            control = new FormControl(username);
            expect(ValidateUsername(control)).toBe(null);
        });
    });


});