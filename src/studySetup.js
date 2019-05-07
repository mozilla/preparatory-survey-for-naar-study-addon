/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "getStudySetup" }]*/

/**
 *  Overview:
 *
 *  - constructs a well-formatted `studySetup` for use by `browser.study.setup`
 *  - mostly declarative, except that some fields are set at runtime
 *    asynchronously.
 *
 *  Advanced features:
 *  - testing overrides from preferences
 *  - expiration time
 *  - some user defined endings.
 *  - study defined 'shouldAllowEnroll' logic.
 */

/** Base for studySetup, as used by `browser.study.setup`.
 *
 * Will be augmented by 'getStudySetup'
 */
const baseStudySetup = {
  // used for activeExperiments tagging (telemetryEnvironment.setActiveExperiment)
  activeExperimentName: browser.runtime.id,

  // use either "shield" or "pioneer" telemetry semantics and data pipelines
  studyType: "shield",

  // telemetry
  telemetry: {
    // Actually submit the pings to Telemetry. [default if omitted: false]
    send: true,
    // Marks pings with testing=true. Set flag to `true` for pings are meant to be seen by analysts [default if omitted: false]
    removeTestingFlag: true,
    // Keep an internal telemetry archive. Useful for verifying payloads of Pioneer studies without risking actually sending any unencrypted payloads [default if omitted: false]
    internalTelemetryArchive: false,
  },

  // endings with urls
  endings: {
    /** normandy-defined endings - https://firefox-source-docs.mozilla.org/toolkit/components/normandy/normandy/data-collection.html */
    "install-failure": {
      baseUrls: [],
    },
    "individual-opt-out": {
      baseUrls: [],
    },
    "general-opt-out": {
      baseUrls: [],
    },
    "recipe-not-seen": {
      baseUrls: [],
    },
    uninstalled: {
      baseUrls: [],
    },
    "uninstalled-sideload": {
      baseUrls: [],
    },
    unknown: {
      baseUrls: [],
    },
    /** study-utils-defined endings */
    "user-disable": {
      baseUrls: [],
    },
    ineligible: {
      baseUrls: [],
    },
    expired: {
      baseUrls: [],
    },
    /** study-defined endings */
    accept: {
      baseUrls: [],
    },
    reject: {
      baseUrls: [],
    },
  },

  weightedVariations: [{ name: "notificationAndPopunder", weight: 1 }],

  // maximum time that the study should run, from the first run
  expire: {
    days: 14,
  },
};

async function isCurrentlyEligible() {
  const dataPermissions = await browser.study.getDataPermissions();
  // Need to allow studies in general
  if (!dataPermissions.shield) {
    await browser.study.logger.log("Studies not enabled, exiting study");
    return false;
  }
  // Someone already in the pioneer cohort should not receive the prompt
  if (dataPermissions.pioneer) {
    await browser.study.logger.log("Already Pioneer, exiting study");
    return false;
  }
  // Users with private browsing on autostart are not eligible
  if (await browser.privacyContext.permanentPrivateBrowsing()) {
    await browser.study.logger.log("Permanent private browsing, exiting study");
    return false;
  }
  return true;
}

/**
 * Augment declarative studySetup with any necessary async values
 *
 * @return {object} studySetup A complete study setup object
 */
async function getStudySetup() {
  // shallow copy
  const studySetup = Object.assign({}, baseStudySetup);

  // Since the eligibility criterias are not dependent on the state of the first run only
  // but rather should be checked on every browser launch, we skip the use
  // of wasEligibleAtFirstRun and instead use the below:
  studySetup.allowEnroll = await isCurrentlyEligible();

  const testingOverrides = await browser.study.getTestingOverrides();
  studySetup.testing = {
    variationName: testingOverrides.variationName,
    firstRunTimestamp: testingOverrides.firstRunTimestamp,
    expired: testingOverrides.expired,
  };

  // Set testing flag on shield-study-addon pings in case any testing override is set
  if (studySetup.testing.variationName !== null) {
    await browser.study.logger.log(
      `Note: The branch/variation is overridden for testing purposes ("${
        studySetup.testing.variationName
      }")`,
    );
    studySetup.telemetry.removeTestingFlag = false;
  }
  if (studySetup.testing.firstRunTimestamp !== null) {
    await browser.study.logger.log(
      `Note: The firstRunTimestamp property is set to "${JSON.stringify(
        studySetup.testing.firstRunTimestamp,
      )}" for testing purposes `,
    );
    studySetup.telemetry.removeTestingFlag = false;
  }
  if (studySetup.testing.expired !== null) {
    await browser.study.logger.log(
      `Note: The expired flag is set to "${JSON.stringify(
        studySetup.testing.expired,
      )}" for testing purposes `,
    );
    studySetup.telemetry.removeTestingFlag = false;
  }

  return studySetup;
}
