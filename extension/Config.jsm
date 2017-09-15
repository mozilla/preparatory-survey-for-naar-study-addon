const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "AddonManager",
  "resource://gre/modules/AddonManager.jsm");

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(config|EXPORTED_SYMBOLS)" }]*/
const EXPORTED_SYMBOLS = ["config"];

const HOUR_MS = 1 * 60 * 60 * 1000;

const config = {
  addonUrl: "https://addons.mozilla.org/firefox/downloads/latest/firefox-pioneer/?src=pioneer-enrollment-study-1",
  notificationMessage: "Please help us improve Firefox and the Web",
  updateTimerInterval: Services.prefs.getIntPref(
    "extensions.pioneer-enrollment-study.updateTimerInterval",
    43200, // 12 hours
  ),
  firstPromptDelay: Services.prefs.getIntPref(
    "extensions.pioneer-enrollment-study.firstPromptDelay",
    5 * 60 * 1000, // 5 minutes in ms
  ),
  secondPromptDelay: Services.prefs.getIntPref(
    "extensions.pioneer-enrollment-study.secondPromptDelay",
    (2 * 24 * 60 * 60 * 1000) - HOUR_MS, // 2 days minus an hour for timer variances
  ),
  studyEndDelay: Services.prefs.getIntPref(
    "extensions.pioneer-enrollment-study.studyEndDelay",
    (1 * 24 * 60 * 60 * 1000) - HOUR_MS, // 1 day in ms minus an hour for timer variances
  ),
  studyEnrolledEndDelay: Services.prefs.getIntPref(
    "extensions.pioneer-enrollment-study.studyEnrolledEndDelay",
    (1 * 24 * 60 * 60 * 1000) - HOUR_MS, // 1 day in ms minus an hour for timer variances
  ),

  study: {
    studyName: "pioneer-enrollment-study", // no spaces, for all the reasons
    weightedVariations: [
      { name: "popunder", weight: 1 },
      { name: "notification", weight: 1 },
      { name: "notificationAndPopunder", weight: 1 },
      { name: "notificationOldStudyPage", weight: 1 },
    ],
    /** **endings**
      * - keys indicate the 'endStudy' even that opens these.
      * - urls should be static (data) or external, because they have to
      *   survive uninstall
      * - If there is no key for an endStudy reason, no url will open.
      * - usually surveys, orientations, explanations
      */
    endings: {
      error: {
        baseUrl: "https://qsurvey.mozilla.com/s3/pioneer-enrollment-study",
      },
      "no-enroll": {
        baseUrl: "https://qsurvey.mozilla.com/s3/pioneer-enrollment-study",
      },
      expired: {
        baseUrl: "https://qsurvey.mozilla.com/s3/pioneer-enrollment-study",
      },
      "user-disable": {
        baseUrl: "https://qsurvey.mozilla.com/s3/pioneer-enrollment-study",
      },
      enrolled: {
        baseUrl: "https://qsurvey.mozilla.com/s3/pioneer-enrollment-study",
      },
    },
    telemetry: {
      send: true, // assumed false. Actually send pings?
      removeTestingFlag: true,  // Marks pings as testing, set true for actual release
      // TODO "onInvalid": "throw"  // invalid packet for schema?  throw||log
    },
    studyUtilsPath: `./StudyUtils.jsm`,
  },
  async isEligible() {
    const addon = await AddonManager.getAddonByID("pioneer-opt-in@mozilla.org");
    return addon === null;
  },
  // addon-specific modules to load/unload during `startup`, `shutdown`
  modules: [
    // can use ${slug} here for example
  ],
  // sets the logging for BOTH the bootstrap file AND shield-study-utils
  log: {
    // Fatal: 70, Error: 60, Warn: 50, Info: 40, Config: 30, Debug: 20, Trace: 10, All: -1,
    bootstrap:  {
      level: "Warn",
    },
    studyUtils:  {
      level: "Warn",
    },
  },
};
