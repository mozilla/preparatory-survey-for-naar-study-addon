const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "studyUtils",
  "resource://pioneer-enrollment-study/StudyUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "config",
  "resource://pioneer-enrollment-study/Config.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "RecentWindow",
  "resource:///modules/RecentWindow.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "AboutPages",
  "resource://pioneer-enrollment-study-content/AboutPages.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "AddonManager",
  "resource://gre/modules/AddonManager.jsm");
XPCOMUtils.defineLazyServiceGetter(this, "timerManager",
  "@mozilla.org/updates/timer-manager;1", "nsIUpdateTimerManager");

const REASONS = {
  APP_STARTUP:      1, // The application is starting up.
  APP_SHUTDOWN:     2, // The application is shutting down.
  ADDON_ENABLE:     3, // The add-on is being enabled.
  ADDON_DISABLE:    4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL:    5, // The add-on is being installed.
  ADDON_UNINSTALL:  6, // The add-on is being uninstalled.
  ADDON_UPGRADE:    7, // The add-on is being upgraded.
  ADDON_DOWNGRADE:  8, // The add-on is being downgraded.
};
const TREATMENT_OVERRIDE_PREF = "extensions.pioneer-enrollment-study.treatment";
const EXPIRATION_DATE_STRING_PREF = "extensions.pioneer-enrollment-study.expirationDateString";
const ENROLLMENT_STATE_STRING_PREF = "extensions.pioneer-enrollment-study.enrollmentState";
const TIMER_NAME = "pioneer-enrollment-study-prompt";

// Due to bug 1051238 frame scripts are cached forever, so we can't update them
// as a restartless add-on. The Math.random() is the work around for this.
const PROCESS_SCRIPT = (
  `resource://pioneer-enrollment-study-content/process-script.js?${Math.random()}`
);
const FRAME_SCRIPT = (
  `resource://pioneer-enrollment-study-content/frame-script.js?${Math.random()}`
);

let notificationBox = null;
let notice = null;

function showNotification(doc, onClickButton) {
  if (notice && notificationBox) {
    notificationBox.removeNotification(notice);
  }

  notificationBox = doc.querySelector(
    "#high-priority-global-notificationbox",
  );
  notice = notificationBox.appendNotification(
    config.notificationMessage,
    "pioneer-enrollment-study-1",
    "resource://pioneer-enrollment-study/skin/heartbeat-icon.svg",
    notificationBox.PRIORITY_INFO_HIGH,
    [{
      label: "Tell me more",
      callback: onClickButton,
    }],
    (eventType) => {
      if (eventType === "removed") {
        // Send ping about removing the study?
      }
    },
  );

  // Minimal attempts to style the notification like Heartbeat
  notice.style.background = "linear-gradient(-179deg, #FBFBFB 0%, #EBEBEB 100%)";
  notice.style.borderBottom = "1px solid #C1C1C1";
  notice.style.height = "40px";
  const messageText = doc.getAnonymousElementByAttribute(notice, "anonid", "messageText");
  messageText.style.color = "#333";
  const closeButton = doc.getAnonymousNodes(notice)[0].childNodes[1];
  if (closeButton) {
    if (doc.defaultView.matchMedia("(min-resolution: 2dppx)").matches) {
      closeButton.setAttribute("style", "-moz-image-region: rect(0, 32px, 32px, 0) !important;");
    } else {
      closeButton.setAttribute("style", "-moz-image-region: rect(0, 16px, 16px, 0) !important;");
    }
  }

  // Position the button next to the text like in Heartbeat
  const rightSpacer = doc.createElement("spacer");
  rightSpacer.flex = 20;
  notice.appendChild(rightSpacer);
  messageText.flex = 0;
  messageText.nextSibling.flex = 0;
}

function getMostRecentBrowserWindow() {
  return RecentWindow.getMostRecentBrowserWindow({
    private: false,
    allowPopups: false,
  });
}

function getEnrollmentState() {
  try {
    return JSON.parse(Services.prefs.getCharPref(ENROLLMENT_STATE_STRING_PREF, ""));
  } catch (err) {
    return null;
  }
}

function setEnrollmentState(state) {
  Services.prefs.setCharPref(ENROLLMENT_STATE_STRING_PREF, JSON.stringify(state));
}

let firstPromptTimeout = null;
function showFirstPrompt(actionCallback) {
  if (!firstPromptTimeout) {
    firstPromptTimeout = setTimeout(() => {
      actionCallback("first-prompt");
      setEnrollmentState({
        stage: "first-prompt",
        time: Date.now(),
      });
    }, config.firstPromptDelay);
  }
}
function initializeTreatment(actionCallback) {
  const enrollmentState = getEnrollmentState();
  if (!enrollmentState) {
    showFirstPrompt(actionCallback);
  }

  timerManager.registerTimer(TIMER_NAME, () => {
    const state = getEnrollmentState();
    if (!state) {
      showFirstPrompt(actionCallback);
    } else if (state.stage === "first-prompt") {
      if (Date.now() - state.time >= config.secondPromptDelay) {
        actionCallback("second-prompt");
        setEnrollmentState({
          stage: "second-prompt",
          time: Date.now(),
        });
      }
    } else if (state.stage === "second-prompt") {
      if (Date.now() - state.time >= config.studyEndDelay) {
        studyUtils.endStudy({ reason: "no-enroll" });
      }
    } else if (state.stage === "enrolled") {
      if (Date.now() - state.time >= config.studyEnrolledEndDelay) {
        studyUtils.endStudy({ reason: "enrolled" });
      }
    } else {
      Cu.reportError(`Unknown stage for Pioneer Enrollment: ${state.stage}. Exiting study.`);
      studyUtils.endStudy({ reason: "error" });
    }
  }, config.updateTimerInterval);
}

const TREATMENTS = {
  notificationOldStudyPage() {
    initializeTreatment((promptType) => {
      const recentWindow = getMostRecentBrowserWindow();
      if (recentWindow && recentWindow.gBrowser) {
        showNotification(recentWindow.document, () => {
          recentWindow.gBrowser.loadOneTab("https://addons.mozilla.org/en-US/firefox/shield_study_16", {
            inBackground: false,
          });
          studyUtils.telemetry({ event: "engagedPrompt" });
        });
        studyUtils.telemetry({ event: "prompted", promptType });
      }
    });
  },

  notification() {
    initializeTreatment((promptType) => {
      const recentWindow = getMostRecentBrowserWindow();
      if (recentWindow && recentWindow.gBrowser) {
        showNotification(recentWindow.document, () => {
          recentWindow.gBrowser.loadOneTab("about:pioneer", {
            inBackground: false,
          });
          studyUtils.telemetry({ event: "engagedPrompt" });
        });
        studyUtils.telemetry({ event: "prompted", promptType });
      }
    });
  },

  notificationAndPopunder() {
    initializeTreatment((promptType) => {
      const recentWindow = getMostRecentBrowserWindow();
      if (recentWindow && recentWindow.gBrowser) {
        const tab = recentWindow.gBrowser.loadOneTab("about:pioneer", {
          inBackground: true,
        });

        showNotification(recentWindow.document, () => {
          recentWindow.gBrowser.selectedTab = tab;
          studyUtils.telemetry({ event: "engagedPrompt" });
        });
        studyUtils.telemetry({ event: "prompted", promptType });
      }
    });
  },

  popunder() {
    initializeTreatment((promptType) => {
      const recentWindow = getMostRecentBrowserWindow();
      if (recentWindow && recentWindow.gBrowser) {
        recentWindow.gBrowser.loadOneTab("about:pioneer", {
          inBackground: true,
        });
        studyUtils.telemetry({ event: "prompted", promptType });
      }
    });
  },
};

const addonListener = {
  onInstalled(addon) {
    if (addon.id === "pioneer-opt-in@mozilla.org") {
      studyUtils.telemetry({ event: "enrolled" });
      setEnrollmentState({
        stage: "enrolled",
        time: Date.now(),
      });
    }
  },
};

async function chooseVariation() {
  let variation;
  // if pref has a user-set value, use this instead
  if (Services.prefs.prefHasUserValue(TREATMENT_OVERRIDE_PREF)) {
    variation = {
      name: Services.prefs.getCharPref(TREATMENT_OVERRIDE_PREF, null), // there is no default value
      weight: 1,
    };
    if (variation.name in TREATMENTS) { return variation; }
    // if the variation from the pref is invalid, then fall back to standard choosing
  }

  const sample = studyUtils.sample;
  // this is the standard arm choosing method
  const clientId = await studyUtils.getTelemetryId();
  const hashFraction = await sample.hashFraction(config.study.studyName + clientId);
  variation = sample.chooseWeighted(config.study.weightedVariations, hashFraction);

  // if the variation chosen by chooseWeighted is not a valid treatment (check in TREATMENTS),
  // then throw an exception: this means that the config file is wrong
  if (!(variation.name in TREATMENTS)) {
    throw new Error(`The variation "${variation.name}" is not a valid variation.`);
  }

  return variation;
}

this.install = function() {};

this.startup = async function(data, reason) {
  studyUtils.setup({
    ...config,
    addon: { id: data.id, version: data.version },
  });
  const variation = await chooseVariation();
  studyUtils.setVariation(variation);

  // Always set EXPIRATION_DATE_PREF if it not set, even if outside of install.
  // This is a failsafe if opt-out expiration doesn't work, so should be resilient.
  // Also helps for testing.
  if (!Services.prefs.prefHasUserValue(EXPIRATION_DATE_STRING_PREF)) {
    const now = new Date(Date.now());
    const expirationDateString = new Date(now.setDate(now.getDate() + 7)).toISOString();
    Services.prefs.setCharPref(EXPIRATION_DATE_STRING_PREF, expirationDateString);
  }

  if (reason === REASONS.ADDON_INSTALL) {
    studyUtils.firstSeen(); // sends telemetry "enter"
    const eligible = await config.isEligible(); // addon-specific
    if (!eligible) {
      // uses config.endings.ineligible.url if any,
      // sends UT for "ineligible"
      // then uninstalls addon
      await studyUtils.endStudy({ reason: "ineligible" });
      return;
    }
  }
  // sets experiment as active and sends installed telemetry upon first install
  await studyUtils.startup({ reason });

  const expirationDate = new Date(Services.prefs.getCharPref(EXPIRATION_DATE_STRING_PREF));
  if (Date.now() > expirationDate) {
    studyUtils.endStudy({ reason: "expired" });
  }

  // Load scripts in content processes and tabs
  Services.ppmm.loadProcessScript(PROCESS_SCRIPT, true);
  Services.mm.loadFrameScript(FRAME_SCRIPT, true);

  // Register about: pages and their listeners
  AboutPages.aboutPioneer.register();
  AboutPages.aboutPioneer.registerParentListeners();

  // Register add-on listener
  AddonManager.addAddonListener(addonListener);

  // Run treatment
  TREATMENTS[variation.name]();
};

this.shutdown = async function(data, reason) {
  // Register add-on listener
  AddonManager.removeAddonListener(addonListener);

  // Stop loading processs scripts and notify existing scripts to clean up.
  Services.ppmm.removeDelayedProcessScript(PROCESS_SCRIPT);
  Services.ppmm.broadcastAsyncMessage("Pioneer:ShuttingDown");
  Services.mm.removeDelayedFrameScript(FRAME_SCRIPT);
  Services.mm.broadcastAsyncMessage("Pioneer:ShuttingDown");

  // Clean up about pages
  AboutPages.aboutPioneer.unregisterParentListeners();
  AboutPages.aboutPioneer.unregister();

  // Close up timers
  if (firstPromptTimeout) {
    clearTimeout(firstPromptTimeout);
  }
  timerManager.unregisterTimer(TIMER_NAME);

  // If a notification is up, close it
  if (notice && notificationBox) {
    notificationBox.removeNotification(notice);
  }

  // are we uninstalling?
  // if so, user or automatic?
  if (reason === REASONS.ADDON_UNINSTALL || reason === REASONS.ADDON_DISABLE) {
    if (!studyUtils._isEnding) {
      // we are the first requestors, must be user action.
      await studyUtils.endStudy({ reason: "user-disable" });
    }
  }

  Cu.unload("resource://pioneer-enrollment-study/StudyUtils.jsm");
  Cu.unload("resource://pioneer-enrollment-study/Config.jsm");
  Cu.unload("resource://pioneer-enrollment-study-content/AboutPages.jsm");
};

this.uninstall = function() {};
