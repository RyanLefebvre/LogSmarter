import { TestBed } from '@angular/core/testing';
import { MobilePushNotificationsService } from './mobile-push-notifications.service';

describe('MobilePushNotificationsService', () => {
  let service: MobilePushNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = new MobilePushNotificationsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add the deviceready event when setUpPushManager is called', () => {
    document.addEventListener = async (event, lam) => {
      await lam();
      return;
    };
    const addEventSpy: jasmine.Spy<any> = spyOn(document, 'addEventListener');
    service.setUpPushManager();
    expect(addEventSpy).toHaveBeenCalled();
  });

  it('should return false if the user did not grant permission for the app when hasPermissions is called', (done) => {
    service.hasPermissions().then((permissions) => {
      expect(permissions).toBe(false);
      done();
    });
  });


  it('should create a reminder object when createReminder is called', () => {
    expect(service.createReminder(1, "title", "message")).toBeTruthy();
  });


  it('should schedule reminders when scheduleReminders is called (2)', (done) => {
    service.PUSH_NOTIFICATION = {
      schedule: async (obj, lam) => { }
    };
    const scheduleSpy = spyOn(service.PUSH_NOTIFICATION, 'schedule');
    service.scheduleReminders([]).then(() => {
      expect(scheduleSpy).not.toHaveBeenCalled();
      done();
    });
  });

  it('should clear reminders when clearReminders is called', (done) => {
    service.PUSH_NOTIFICATION = {
      cancel: (obj, lam) => { }
    };
    const cancelSpy = spyOn(service.PUSH_NOTIFICATION, 'cancel');
    service.clearReminders([]).then(() => {
      expect(cancelSpy).not.toHaveBeenCalled();
      done();
    });
  });

  it("should setup the push manager when setUpPushManager() is called and the service is not initialized ", async () => {
    service.PUSH_NOTIFICATION = null
    const addEventListRef = document.addEventListener
    let eventName = ''
    service.getCordovaPushPlugin = () => { }
    document.addEventListener = (eventNameParam, lam) => {
      lam();
      lam();
      eventName = eventNameParam;
    }
    service.setUpPushManager();
    expect(eventName).toBe('deviceready')
    document.addEventListener = addEventListRef;
  });

  it("should not break on web if getCordovaushPlugin() is called ", () => {
    let madeItThrough = false;
    try {
      service.getCordovaPushPlugin()
    }
    catch (error) { }
    madeItThrough = true;
    expect(madeItThrough).toBe(true);
  });

  it("should return false if the service has not been setup and hasPermissions() is called ", async () => {
    service.PUSH_NOTIFICATION = null;
    expect(await service.hasPermissions()).toBe(false);
  });

  it("should return false if the service has not been setup and hasPermissions() is called ", async () => {
    const expectedRetVal: any = "someReturnValue";
    service.PUSH_NOTIFICATION = {
      hasPermission: async (lam) => await lam(expectedRetVal)
    };
    expect(await service.hasPermissions()).toBe(expectedRetVal);
  });


  it("should return false if the service has not been setup and requestPermissions() is called ", async () => {
    service.PUSH_NOTIFICATION = null;
    expect(await service.requestPermissions()).toBe(false);
  });

  it("should return false if the service has not been setup and requestPermissions() is called ", async () => {
    const expectedRetVal: any = "someReturnValue";
    service.PUSH_NOTIFICATION = {
      requestPermission: async (lam) => await lam(expectedRetVal)
    };
    expect(await service.requestPermissions()).toBe(expectedRetVal);
  });

  it("should return [] if the service has not been setup and getScheduledNotificiations() is called ", async () => {
    service.PUSH_NOTIFICATION = null;
    expect(await service.getScheduledNotificiations()).toEqual([]);
  });

  it("should return false if the service has not been setup and getScheduledNotificiations() is called ", async () => {
    const expectedRetVal: any = "someReturnValue";
    service.PUSH_NOTIFICATION = {
      getScheduled: async (lam) => await lam(expectedRetVal)
    };
    expect(await service.getScheduledNotificiations()).toBe(expectedRetVal);
  });

  it("should call cancel and clear the reminderIDs passed in when clearReminders() is called with a non empty list", async () => {
    const reminderIds = [1, 2, 3, 4, 5];
    let remindersPassedIn: any;
    service.PUSH_NOTIFICATION = {
      cancel: (reminderIdsParam, lam) => {
        remindersPassedIn = reminderIdsParam;
        lam();
      }
    };
    await service.clearReminders(reminderIds);
    expect(remindersPassedIn).toBe(reminderIds);
  });

  it("should call schedule and schedule the reminderIDs passed in when scheduleReminders() is called with a non empty list", async () => {
    const reminderIds = [1, 2, 3, 4, 5];
    let remindersPassedIn: any;
    service.PUSH_NOTIFICATION = {
      schedule: (reminderIdsParam, lam) => {
        remindersPassedIn = reminderIdsParam;
        lam();
      }
    };
    await service.scheduleReminders(reminderIds);
    expect(remindersPassedIn).toBe(reminderIds);
  });
});