import { FormControlPair } from './../../model-classes/general/form-control-pair';
import { PreferenceService } from './preference.service';
import { componentFactoryName } from '@angular/compiler';
import { autoSpy } from 'autoSpy';
import { EnvironmentService } from './environment.service';

describe('PreferenceService', () => {
  let service: PreferenceService;

  beforeEach(() => {
    service = setup().build();
  });

  it('should return default preferences when getDefaultPreferences is called', () => {
    const defaultPrefs = service.getDefaultPreferences();
    expect(defaultPrefs[service.GENERAL_PREFS][service.NUMBER_SYSTEM]).toBe(service.NUMBER_SYSTEM_IMPERIAL);
    expect(defaultPrefs[service.GENERAL_PREFS][service.THEME_COLOR]).toBe(service.COLOR_TURQOUSIE);
    expect(defaultPrefs[service.GENERAL_PREFS][service.EMAIL_NOTIFICATIONS]).toBe(service.EMAIL_NOTIFICATIONS_ON);
    expect(defaultPrefs[service.NUTR_PREFS][service.SORT_MODE]).toBe(service.SORT_MODE_DAY);
    expect(defaultPrefs[service.NUTR_PREFS][service.ORDER_MODE]).toBe(service.ORDER_MODE_DESC);
    expect(defaultPrefs[service.NUTR_PREFS][service.GRAPH_MODE]).toBe(service.GRAPH_MODE_LINE);
    expect(defaultPrefs[service.NUTR_PREFS][service.SURPLUS]).toBe(service.SURPLUS_MODERATE);
    expect(defaultPrefs[service.NUTR_PREFS][service.DEFICIT]).toBe(service.DEFICIT_MODERATE)
  });

  it('should return if its a valid number system when isValidNumberSystem is called', () => {
    expect(service.isValidNumberSystem(service.NUMBER_SYSTEM_IMPERIAL)).toBe(true);
    expect(service.isValidNumberSystem(service.NUMBER_SYSTEM_METRIC)).toBe(true);
  });

  it('should return an array of valid number sets when getValidNumberSystems is called', () => {
    const validNumberSystems: boolean[] = service.getValidNumberSystems();
    expect(validNumberSystems.includes(service.NUMBER_SYSTEM_METRIC)).toBe(true);
    expect(validNumberSystems.includes(service.NUMBER_SYSTEM_IMPERIAL)).toBe(true);
  });

  it('should return an array of form controls when getNumberSystemFormControls is called', () => {
    const formControls: FormControlPair[] = service.getNumberSystemFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_NUMBER_IMPERIAL)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_NUMBER_METRIC)).toBe(true);
  });

  it('should return if the color is a valid theme color when isValidThemeColor is called', () => {
    expect(service.isValidThemeColor(service.COLOR_ORANGE)).toBe(true);
    expect(service.isValidThemeColor(service.COLOR_DARK_ORANGE)).toBe(false);
  });

  it('should return an array of valid theme colors when getValidThemeColors is called it should', () => {
    const validThemeColors: string[] = service.getValidThemeColors();
    expect(validThemeColors.includes(service.COLOR_TURQOUSIE)).toBe(true);
    expect(validThemeColors.includes(service.COLOR_ORANGE)).toBe(true);
    expect(validThemeColors.includes(service.COLOR_PINK)).toBe(true);
    expect(validThemeColors.includes(service.COLOR_GOLD)).toBe(true);
    expect(validThemeColors.includes(service.COLOR_BLUE)).toBe(true);
    expect(validThemeColors.includes(service.COLOR_PURPLE)).toBe(true);
    expect(validThemeColors.includes(service.COLOR_GREY)).toBe(true);
    expect(validThemeColors.includes(service.COLOR_DARK_ORANGE)).toBe(false);
  });

  it('should return an array of form controls when getThemeColorFormControls is called', () => {
    const formControls: FormControlPair[] = service.getThemeColorFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_TURQOUISE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_ORANGE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PINK));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_BLUE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PURPLE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_GOLD) == false);
  });


  it('should return an array of just two form controls when getThemeColorFormControls is called and the environment is mobile', () => {
    service.environmentService.isMobile = true;
    const formControls: FormControlPair[] = service.getThemeColorFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_TURQOUISE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_ORANGE)).toBe(false);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PINK)).toBe(false);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_BLUE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PURPLE)).toBe(false);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_GOLD)).toBe(false);
  });


  it('should return an array of form controls when getThemeColorFormControls is called', () => {
    const formControls: FormControlPair[] = service.getThemeColorFormControls(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_TURQOUISE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_ORANGE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PINK));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_BLUE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PURPLE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_GOLD) == false);
  });

  it('should return an array of form controls when getThemeColorFormControls is called', () => {
    const formControls: FormControlPair[] = service.getThemeColorFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_TURQOUISE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_ORANGE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PINK));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_BLUE));
    expect(formControls.includes(service.FORM_CONTROL_PAIR_PURPLE));
  });

  it('should return if an email status preference is valid when isValidEmailStatusPreference is called', () => {
    expect(service.isValidEmailStatusPreference(service.EMAIL_NOTIFICATIONS_ON)).toBe(true);
    expect(service.isValidEmailStatusPreference(service.EMAIL_NOTIFICATIONS_OFF)).toBe(true);
  });

  it('should return an array of valid email notification statuses when getValidEmailNotificationStatus is called', () => {
    const emailNotifications: boolean[] = service.getValidEmailNotificationStatus();
    expect(emailNotifications.includes(service.EMAIL_NOTIFICATIONS_ON)).toBe(true);
    expect(emailNotifications.includes(service.EMAIL_NOTIFICATIONS_OFF)).toBe(true);
  });

  it('should return an array of form control objects for valid email statuses when getEmailStatusFormControls is called', () => {
    const formControls: FormControlPair[] = service.getEmailStatusFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_EMAIL_ON)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_EMAIL_OFF)).toBe(true);
  });

  it('should return if a sort mode preference is valid when isValidSortModePreference is called', () => {
    expect(service.isValidSortModePreference(service.SORT_MODE_DAY)).toBe(true);
    expect(service.isValidSortModePreference(service.SORT_MODE_WEEK)).toBe(true);
  });

  it('should return an array of form control pair objects for valid sort modes when getValidSortModes is called', () => {
    const validSortModes: string[] = service.getValidSortModes();
    expect(validSortModes.includes(service.SORT_MODE_DAY)).toBe(true);
    expect(validSortModes.includes(service.SORT_MODE_WEEK)).toBe(true);
  });

  it('should return an array of sort mode form controls when getSortModeFormControls is called', () => {
    const formControls: FormControlPair[] = service.getSortModeFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_SORT_MODE_DAY)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_SORT_MODE_WEEK)).toBe(true);
  });

  it('should return if an order mode preference is valid when isValidOrderModePreference is called', () => {
    expect(service.isValidOrderModePreference(service.ORDER_MODE_ASC)).toBe(true);
    expect(service.isValidOrderModePreference(service.ORDER_MODE_DESC)).toBe(true);
  });

  it('should return an array of valid order modes when getValidOrderModes is called', () => {
    const orderModes: string[] = service.getValidOrderModes();
    expect(orderModes.includes(service.ORDER_MODE_ASC)).toBe(true);
    expect(orderModes.includes(service.ORDER_MODE_DESC)).toBe(true);
  });

  it('should return an array of order mode form controls when getOrderModeFormControls is called', () => {
    const formControls: FormControlPair[] = service.getOrderModeFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_ORDER_MODE_DESC)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_ORDER_MODE_ASC)).toBe(true);
  });

  it('should return if a graph mode preference is valid when isValidGraphModePreference is called', () => {
    expect(service.isValidGraphModePreference(service.GRAPH_MODE_LINE)).toBe(true);
    expect(service.isValidGraphModePreference(service.GRAPH_MODE_SCATTER)).toBe(true);
  });

  it('should return an array of valid graph modes when getValidGraphModes is called', () => {
    const graphModes: string[] = service.getValidGraphModes();
    expect(graphModes.includes(service.GRAPH_MODE_LINE)).toBe(true);
    expect(graphModes.includes(service.GRAPH_MODE_SCATTER)).toBe(true);
  });

  it('should return an array of graph mode form controls when getGraphModeFormControls is called', () => {
    const formControls: FormControlPair[] = service.getGraphModeFormControls();
    expect(formControls.includes(service.FORM_CONTROL_PAIR_GRAPH_MODE_LINE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_PAIR_GRAPH_MODE_SCATTER)).toBe(true);
  });

  it('should return if a surplus preference is valid when isValidSurplusPreference is called', () => {
    expect(service.isValidSurplusPreference(service.SURPLUS_CONSERVATIVE)).toBe(true);
    expect(service.isValidSurplusPreference(service.SURPLUS_MODERATE)).toBe(true);
    expect(service.isValidSurplusPreference(service.SURPLUS_AGGRESSIVE)).toBe(true);
  });

  it('should return an array of valid surplus preferences when getValidSurplusPreferences is called', () => {
    const surplusPrefs: string[] = service.getValidSurplusPreferences();
    expect(surplusPrefs.includes(service.SURPLUS_CONSERVATIVE)).toBe(true);
    expect(surplusPrefs.includes(service.SURPLUS_MODERATE)).toBe(true);
    expect(surplusPrefs.includes(service.SURPLUS_AGGRESSIVE)).toBe(true);
  });

  it('should return an array of surplus form controls when getSurplusFormControls is called', () => {
    const formControls: FormControlPair[] = service.getSurplusFormControls();
    expect(formControls.includes(service.FORM_CONTROL_SURPLUS_CONSERVATIVE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_SURPLUS_MODERATE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_SURPLUS_AGGRESSIVE)).toBe(true);
  });

  it('should return is a deficit preference is valid when isValidDeficitPreference is called', () => {
    expect(service.isValidDeficitPreference(service.DEFICIT_CONSERVATIVE)).toBe(true);
    expect(service.isValidDeficitPreference(service.DEFICIT_MODERATE)).toBe(true);
    expect(service.isValidDeficitPreference(service.DEFICIT_AGGRESSIVE)).toBe(true);
    expect(service.isValidDeficitPreference(service.DEFICIT_VERY_AGGRESSIVE)).toBe(true);
  });

  it('should return an array of valid deficit preferences when getValidDeficitPreferences is called', () => {
    const deficitPrefs: string[] = service.getValidDeficitPreferences();
    expect(deficitPrefs.includes(service.DEFICIT_CONSERVATIVE)).toBe(true);
    expect(deficitPrefs.includes(service.DEFICIT_MODERATE)).toBe(true);
    expect(deficitPrefs.includes(service.DEFICIT_AGGRESSIVE)).toBe(true);
    expect(deficitPrefs.includes(service.DEFICIT_VERY_AGGRESSIVE)).toBe(true);
  });

  it('should return an array of deficit form controls when getDeficitFormControls is called', () => {
    const formControls: FormControlPair[] = service.getDeficitFormControls();
    expect(formControls.includes(service.FORM_CONTROL_DEFICIT_CONSERVATIVE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_DEFICIT_MODERATE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_DEFICIT_AGGRESSIVE)).toBe(true);
    expect(formControls.includes(service.FORM_CONTROL_DEFICIT_VERY_AGGRESSIVE)).toBe(true);
  });

  it('should return the weight units corresponding to the number system when getWeightUnits is called', () => {
    expect(service.getWeightUnits(service.NUMBER_SYSTEM_METRIC)).toBe(service.WEIGHT_UNITS_METRIC);
    expect(service.getWeightUnits(service.NUMBER_SYSTEM_IMPERIAL)).toBe(service.WEIGHT_UNITS_IMPERIAL);
    expect(service.getWeightUnits(null)).toBe("");
  });

  it('should return the themes respective dark theme when getDarkerTheme is called', () => {
    expect(service.getDarkerTheme(service.COLOR_TURQOUSIE)).toBe(service.COLOR_DARK_TURQOUSIE);
    expect(service.getDarkerTheme(service.COLOR_ORANGE)).toBe(service.COLOR_DARK_ORANGE);
    expect(service.getDarkerTheme(service.COLOR_PINK)).toBe(service.COLOR_DARK_PINK);
    expect(service.getDarkerTheme(service.COLOR_GOLD)).toBe(service.COLOR_DARK_GOLD);
    expect(service.getDarkerTheme(service.COLOR_BLUE)).toBe(service.COLOR_DARK_BLUE);
    expect(service.getDarkerTheme(service.COLOR_GREY)).toBe(service.COLOR_DARK_GREY);
    expect(service.getDarkerTheme(service.COLOR_PURPLE)).toBe(service.COLOR_DARK_PURPLE);
    expect(service.getDarkerTheme("")).toBe("");
  });

});

function setup() {
  const environment = autoSpy(EnvironmentService);
  const builder = {
    environment,
    default() {
      return builder;
    },
    build() {
      return new PreferenceService(environment);
    }
  };

  return builder;
}
