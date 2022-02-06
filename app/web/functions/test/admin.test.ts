import { assert } from 'console';
import {
    ACTIVITY_LEVEL_ACTIVE,
    ACTIVITY_LEVEL_LIGHTLY_ACTIVE,
    ACTIVITY_LEVEL_SEDENTARY,
    ACTIVITY_LEVEL_VERY_ACTIVE
} from '../src/constants/energyConstants';
import * as admin from '../src/services/admin';
import * as TestHelpers from './testHelpers';

describe("Functions/Services/Admin", () => {

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it("should calculate the total number of free tier individual users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.subscriptionID = null);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFreeIndividualUsers'] == 3);
    });

    it("should calculate the total number of free tier individual users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.subscriptionID = null);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFreeIndividualUsers'] == 3);
    });

    it("should calculate the total number of free tier individual users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
        ];
        users.forEach(user => { user.subscriptionID = null; });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFreeIndividualUsers'] == 1);
    });

    it("should calculate the total number of premium tier individual users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
        ];
        users.forEach(user => user.subscriptionID = "someValidID");
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalPremiumIndividualUsers'] == 2);
    });

    it("should calculate the total number of premium tier individual users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.subscriptionID = "someValidID");
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalPremiumIndividualUsers'] == 3);
    });

    it("should calculate the total number of premium tier individual users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users: any = [];
        users.forEach((user: any) => { user.subscriptionID = "someValidID"; });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalPremiumIndividualUsers'] == 0);
    });

    it("should calculate the total number of male users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalMales'] == 2);
    });

    it("should calculate the total number of male users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalMales'] == 3);
    });

    it("should calculate the total number of male users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalMales'] == 0);
    });

    it("should calculate the total number of female users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFemales'] == 1);
    });

    it("should calculate the total number of female users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFemales'] == 0);
    });

    it("should calculate the total number of female users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFemales'] == 3);
    });

    it("should calculate the percentage of female users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalesIndividual'] == 33.3);
    });

    it("should calculate the percentage of female users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalesIndividual'] == 0);
    });

    it("should calculate the percentage number of female users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalesIndividual'] == 100);
    });

    it("should calculate the percentage of male users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentMalesIndividual'] == 66.7);
    });

    it("should calculate the percentage of male users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = true);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentMalesIndividual'] == 100);
    });

    it("should calculate the percentage of male users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentMalesIndividual'] == 0);
    });

    it("should calculate the total number of gender unknown users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = null);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalGenderUnknown'] == 3);
    });

    it("should calculate the total number of gender unknown users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalGenderUnknown'] == 0);
    });

    it("should calculate the total number of gender unknown users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        users[2].isMale = null;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalGenderUnknown'] == 1);
    });

    it("should calculate the percentage of gender unknown users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = null);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentGenderUnknownIndividual'] == 100);
    });

    it("should calculate the percentage of gender unknown users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentGenderUnknownIndividual'] == 0);
    });

    it("should calculate the percentGenderUnknownIndividual of gender unknown users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => user.isMale = false);
        users[2].isMale = null;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentGenderUnknownIndividual'] == 33.3);
    });

    it("should calculate the number of male premium users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalMalePremiumIndividualUsers'] == 2);
    });

    it("should calculate the number of premium male users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalMalePremiumIndividualUsers'] == 3);
    });

    it("should calculate the number of premium male users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = false; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalMalePremiumIndividualUsers'] == 0);
    });

    it("should calculate the number of female premium users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFemalePremiumIndividualUsers'] == 1);
    });

    it("should calculate the number of premium female users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFemalePremiumIndividualUsers'] == 0);
    });

    it("should calculate the number of premium female users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = false; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalFemalePremiumIndividualUsers'] == 3);
    });

    it("should calculate the percentage of female premium users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalePremiumIndividualUsers'] == 33.3);
    });

    it("should calculate the percentage of premium female users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalePremiumIndividualUsers'] == 0);
    });

    it("should calculate the percentage of premium female users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = false; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalePremiumIndividualUsers'] == 100);
    });

    it("should calculate the percentage of male premium users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentMalePremiumIndividualUsers'] == 66.7);
    });

    it("should calculate the percentage of premium male users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentMalePremiumIndividualUsers'] == 100);
    });

    it("should calculate the percentage of premium male users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = false; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentMalePremiumIndividualUsers'] == 0);
    });

    it("should calculate the percentage of female premium users correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        users[2].isMale = false;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalePremiumIndividualUsers'] == 33.3);
    });

    it("should calculate the percentage of premium female users correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = true; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalePremiumIndividualUsers'] == 0);
    });

    it("should calculate the percentage of premium female users correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.isMale = false; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentFemalePremiumIndividualUsers'] == 100);
    });

    it("should calculate the number of users with an activity level of unknown correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = null;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelUnknown'] == 1);
    });

    it("should calculate the number of users with an activity level of unknown correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelUnknown'] == 0);
    });

    it("should calculate the number of users with an activity level of unknown correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = null; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelUnknown'] == 3);
    });

    it("should calculate the percentage of users with an activity level of unknown correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = null;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelUnknown'] == 33.3);
    });

    it("should calculate the percentage of users with an activity level of unknown correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelUnknown'] == 0);
    });

    it("should calculate the percentage of users with an activity level of unknown correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = null; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelUnknown'] == 100);
    });

    it("should calculate the number of users with an activity level of sedentary correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_SEDENTARY;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelSedentary'] == 1);
    });

    it("should calculate the number of users with an activity level of sedentary correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelSedentary'] == 0);
    });

    it("should calculate the number of users with an activity level of sedentary correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelSedentary'] == 3);
    });

    it("should calculate the percentage of users with an activity level of sedentary correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_SEDENTARY;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelSedentary'] == 33.3);
    });

    it("should calculate the percentage of users with an activity level of sedentary correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelSedentary'] == 0);
    });

    it("should calculate the percentage of users with an activity level of sedentary correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelSedentary'] == 100);
    });

    it("should calculate the number of users with an activity level of lightly active correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_LIGHTLY_ACTIVE;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelLightlyActive'] == 1);
    });

    it("should calculate the number of users with an activity level of lightly active correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelLightlyActive'] == 0);
    });

    it("should calculate the number of users with an activity level of lightly active correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_LIGHTLY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelLightlyActive'] == 3);
    });

    it("should calculate the percentage of users with an activity level of lightly active correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_LIGHTLY_ACTIVE;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelLightlyActive'] == 33.3);
    });

    it("should calculate the percentage of users with an activity level of lightly active correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelLightlyActive'] == 0);
    });

    it("should calculate the percentage of users with an activity level of lightly active correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_LIGHTLY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelLightlyActive'] == 100);
    });

    it("should calculate the number of users with an activity level of active correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_ACTIVE;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelActive'] == 1);
    });

    it("should calculate the number of users with an activity level of active correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelActive'] == 0);
    });

    it("should calculate the number of users with an activity level of active correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelActive'] == 3);
    });

    it("should calculate the percentage of users with an activity level of active correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_LIGHTLY_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_ACTIVE;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelActive'] == 33.3);
    });

    it("should calculate the percentage of users with an activity level of active correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelActive'] == 0);
    });

    it("should calculate the percentage of users with an activity level of active correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelActive'] == 100);
    });

    it("should calculate the number of users with an activity level of very active correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelVeryActive'] == 1);
    });

    it("should calculate the number of users with an activity level of very active correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelVeryActive'] == 0);
    });

    it("should calculate the number of users with an activity level of very active correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['totalActivityLevelVeryActive'] == 3);
    });

    it("should calculate the percentage of users with an activity level of active correctly when exportUserDemoStats() is called (1)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_LIGHTLY_ACTIVE; user.subscriptionID = "someId" });
        users[2].activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE;
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelVeryActive'] == 33.3);
    });

    it("should calculate the percentage of users with an activity level of very active correctly when exportUserDemoStats() is called (2)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_SEDENTARY; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelVeryActive'] == 0);
    });

    it("should calculate the percentage of users with an activity level of very active correctly when exportUserDemoStats() is called (3)", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['percentActivityLevelVeryActive'] == 100);
    });

    it("should calculate the min age of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minAge'] == 1);
    });

    it("should calculate the max age of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxAge'] == 3);
    });

    it("should calculate the average age of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgAge'] == 2);
    });

    it("should calculate the min age of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minMaleAge'] == 1);
    });

    it("should calculate the max age of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxMaleAge'] == 3);
    });

    it("should calculate the average age of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgMaleAge'] == 2);
    });

    it("should calculate the min age of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minFemaleAge'] == 1);
    });

    it("should calculate the max age of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxFemaleAge'] == 3);
    });

    it("should calculate the average age of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgFemaleAge'] == 2);
    });

    it("should calculate the min age of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minAge'] == 1);
    });

    it("should calculate the max age of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxAge'] == 3);
    });

    it("should calculate the average age of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgAge'] == 2);
    });

    it("should calculate the min age of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minMaleAge'] == 1);
    });

    it("should calculate the max age of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxMaleAge'] == 3);
    });

    it("should calculate the average age of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgMaleAge'] == 2);
    });

    it("should calculate the min age of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minFemaleAge'] == 1);
    });

    it("should calculate the max age of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxFemaleAge'] == 3);
    });

    it("should calculate the average age of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['age'] = 1;
        users[1]['age'] = 2;
        users[2]['age'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgFemaleAge'] == 2);
    });

    it("should calculate the min weight of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minWeightPounds'] == 1);
    });

    it("should calculate the max weight of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxWeightPounds'] == 3);
    });

    it("should calculate the average weight of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgWeightPounds'] == 2);
    });

    it("should calculate the min weight of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minMaleWeightPounds'] == 1);
    });

    it("should calculate the max weight of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxMaleWeightPounds'] == 3);
    });

    it("should calculate the average weight of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgMaleWeightPounds'] == 2);
    });

    it("should calculate the min weight of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minFemaleWeightPounds'] == 1);
    });

    it("should calculate the max weight of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxFemaleWeightPounds'] == 3);
    });

    it("should calculate the average weight of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['weight_lbs'] = 1;
        users[1]['weight_lbs'] = 2;
        users[2]['weight_lbs'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgFemaleWeightPounds'] == 2);
    });

    it("should calculate the min height of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minHeightInches'] == 1);
    });

    it("should calculate the max height of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxHeightInches'] == 3);
    });

    it("should calculate the average height of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgHeightInches'] == 2);
    });

    it("should calculate the min height of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minMaleHeightInches'] == 1);
    });

    it("should calculate the max height of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxMaleHeightInches'] == 3);
    });

    it("should calculate the average height of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgMaleHeightInches'] == 2);
    });

    it("should calculate the min height of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minFemaleHeightInches'] == 1);
    });

    it("should calculate the max height of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxFemaleHeightInches'] == 3);
    });

    it("should calculate the average height of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['height_inches'] = 1;
        users[1]['height_inches'] = 2;
        users[2]['height_inches'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgFemaleHeightInches'] == 2);
    });

    it("should calculate the min TDEE of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minTDEE'] == 1);
    });

    it("should calculate the max TDEE of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxTDEE'] == 3);
    });

    it("should calculate the average TDEE of all user correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.activityLevel = ACTIVITY_LEVEL_VERY_ACTIVE; user.subscriptionID = "someId" });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgTDEE'] == 2);
    });

    it("should calculate the min TDEE of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minMaleTDEE'] == 1);
    });

    it("should calculate the max TDEE of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxMaleTDEE'] == 3);
    });

    it("should calculate the average TDEE of all male users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.isMale = true });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgMaleTDEE'] == 2);
    });

    it("should calculate the min TDEE of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['minFemaleTDEE'] == 1);
    });

    it("should calculate the max TDEE of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['maxFemaleTDEE'] == 3);
    });

    it("should calculate the average TDEE of all female users correctly exportUserDemoStats() when is called ", async () => {
        let demoStats: any;
        TestHelpers.spyOnIndividualExport(admin, 'writeToBucketAsCSV', (name: string, headers: string[], data: any[]) => {
            demoStats = data[0];
        });
        const users = [
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile(),
            TestHelpers.getRandomUserProfile()
        ];
        users[0]['estimatedTDEE'] = 1;
        users[1]['estimatedTDEE'] = 2;
        users[2]['estimatedTDEE'] = 3;
        users.forEach(user => { user.isMale = false });
        await (admin.exportUserDemoStats(users));
        assert(demoStats['AvgFemaleTDEE'] == 2);
    });


});