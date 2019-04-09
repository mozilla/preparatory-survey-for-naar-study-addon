"use strict";

/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/Console.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

/* eslint-disable no-undef */
const { EventManager } = ExtensionCommon;
const EventEmitter =
  ExtensionCommon.EventEmitter || ExtensionUtils.EventEmitter;

// eslint-disable-next-line no-undef
XPCOMUtils.defineLazyModuleGetter(
  this,
  "BrowserWindowTracker",
  "resource:///modules/BrowserWindowTracker.jsm",
);

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");
XPCOMUtils.defineLazyModuleGetter(
  this,
  "AddonManager",
  "resource://gre/modules/AddonManager.jsm",
);
XPCOMUtils.defineLazyServiceGetter(
  this,
  "timerManager",
  "@mozilla.org/updates/timer-manager;1",
  "nsIUpdateTimerManager",
);

const ENROLLMENT_STATE_STRING_PREF =
  "extensions.pioneer-participation-prompt_shield_mozilla_org.enrollmentState";
const TIMER_NAME = "pioneer-participation-prompt-prompt";

let notificationBox = null;
let notice = null;
let config = null;

// Style the notification like Heartbeat (selectively copied from Heartbeat.jsm)
const HEARTBEAT_CSS_URI = Services.io.newURI(
  "resource://normandy/skin/shared/Heartbeat.css",
);
const HEARTBEAT_CSS_URI_OSX = Services.io.newURI(
  "resource://normandy/skin/osx/Heartbeat.css",
);
const windowsWithInjectedCss = new WeakSet();
let anyWindowsWithInjectedCss = false;

function removeActiveNotification() {
  if (notice && notificationBox) {
    try {
      notificationBox.removeNotification(notice);
    } catch (err) {
      // The dom nodes are probably gone. That's fine.
    }
  }
}

function showNotification(chromeWindow, onClickButton) {
  removeActiveNotification();

  notificationBox = chromeWindow.gHighPriorityNotificationBox;
  notice = notificationBox.appendNotification(
    config.notificationMessage,
    "pioneer-participation-prompt-1",
    "resource://normandy/skin/shared/heartbeat-icon.svg",
    notificationBox.PRIORITY_INFO_HIGH,
    [
      {
        label: "Tell me more",
        callback: onClickButton,
      },
    ],
    eventType => {
      if (eventType === "removed") {
        // Send ping about removing the study?
      }
    },
  );

  // Style the notification like Heartbeat (selectively copied from Heartbeat.jsm)
  if (!windowsWithInjectedCss.has(chromeWindow)) {
    windowsWithInjectedCss.add(chromeWindow);
    const utils = chromeWindow.windowUtils;
    utils.loadSheet(HEARTBEAT_CSS_URI, chromeWindow.AGENT_SHEET);
    if (AppConstants.platform === "macosx") {
      utils.loadSheet(HEARTBEAT_CSS_URI_OSX, chromeWindow.AGENT_SHEET);
    }
    anyWindowsWithInjectedCss = true;
  }
  notice.messageDetails.style.overflow = "hidden";
  notice.messageImage.classList.add("heartbeat", "pulse-onshow");
  notice.messageText.classList.add("heartbeat");
  notice.messageText.flex = 0;
  notice.spacer.flex = 0;
  notice.classList.add("heartbeat");
}

function getMostRecentBrowserWindow() {
  return BrowserWindowTracker.getTopWindow({
    private: false,
    allowPopups: false,
  });
}

function getEnrollmentState() {
  try {
    return JSON.parse(
      Services.prefs.getCharPref(ENROLLMENT_STATE_STRING_PREF, ""),
    );
  } catch (err) {
    return null;
  }
}

function setEnrollmentState(state) {
  Services.prefs.setCharPref(
    ENROLLMENT_STATE_STRING_PREF,
    JSON.stringify(state),
  );
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

  timerManager.registerTimer(
    TIMER_NAME,
    () => {
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
        Cu.reportError(
          `Unknown stage for Pioneer Enrollment: ${
            state.stage
          }. Exiting study.`,
        );
        studyUtils.endStudy({ reason: "error" });
      }
    },
    config.updateTimerInterval,
  );
}

const TREATMENTS = {
  notificationAndPopunder() {
    initializeTreatment(promptType => {
      const recentWindow = getMostRecentBrowserWindow();
      if (recentWindow && recentWindow.gBrowser) {
        const tab = recentWindow.gBrowser.loadOneTab("about:pioneer", {
          inBackground: true,
          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
        });
        tab.addEventListener("TabClose", () => {
          removeActiveNotification();
        });

        showNotification(recentWindow, () => {
          recentWindow.gBrowser.selectedTab = tab;
          // TODO: studyUtils.telemetry({ event: "engagedPrompt" });
        });
        // TODO: studyUtils.telemetry({ event: "prompted", promptType });
      }
    });
  },
};

const addonListener = {
  onInstalled(addon) {
    if (addon.id === "pioneer-opt-in@mozilla.org") {
      // TODO: studyUtils.telemetry({ event: "enrolled" });
      setEnrollmentState({
        stage: "enrolled",
        time: Date.now(),
      });
    }
  },
};

/**
 * Display notification bar
 *
 * Events:
 *  - {event: introduction-shown}
 *  - {event: introduction-tell-me-more}
 */
class PioneerNotificationEventEmitter extends EventEmitter {}

this.pioneerNotification = class extends ExtensionAPI {
  getAPI(context) {
    const pioneerNotificationEventEmitter = new PioneerNotificationEventEmitter();
    return {
      pioneerNotification: {
        enable(promptConfig) {
          config = promptConfig;

          // Register add-on listener
          AddonManager.addAddonListener(addonListener);

          // Run treatment
          TREATMENTS.notificationAndPopunder();

          // Notify notification shown
          pioneerNotificationEventEmitter.emit("notification-shown");
        },
        disable() {
          // Close up timers
          if (firstPromptTimeout) {
            clearTimeout(firstPromptTimeout);
          }
          timerManager.unregisterTimer(TIMER_NAME);

          // Unregister add-on listener
          AddonManager.removeAddonListener(addonListener);

          // If a notification is up, close it
          removeActiveNotification();

          // Cleanup CSS injected into windows by Heartbeat
          if (anyWindowsWithInjectedCss) {
            for (const window of Services.wm.getEnumerator(
              "navigator:browser",
            )) {
              if (windowsWithInjectedCss.has(window)) {
                const utils = window.windowUtils;
                utils.removeSheet(HEARTBEAT_CSS_URI, window.AGENT_SHEET);
                if (AppConstants.platform === "macosx") {
                  utils.removeSheet(HEARTBEAT_CSS_URI_OSX, window.AGENT_SHEET);
                }
                windowsWithInjectedCss.delete(window);
              }
            }
          }

          // Send this before the ShuttingDown event to ensure that message handlers
          // are still registered and receive it.
          Services.mm.broadcastAsyncMessage("Pioneer:Uninstalling");
        },
        onShown: new EventManager(
          context,
          "pioneerNotification.onShown",
          fire => {
            const listener = value => {
              fire.async(value);
            };
            pioneerNotificationEventEmitter.on("introduction-shown", listener);
            return () => {
              pioneerNotificationEventEmitter.off(
                "introduction-shown",
                listener,
              );
            };
          },
        ).api(),
        onNotificationAccept: new EventManager(
          context,
          "notification.onNotificationAccept",
          fire => {
            const listener = value => {
              fire.async(value);
            };
            notificationEventEmitter.on("introduction-accept", listener);
            return () => {
              notificationEventEmitter.off("introduction-accept", listener);
            };
          },
        ).api(),
        onNotificationLeaveStudy: new EventManager(
          context,
          "notification.onNotificationLeaveStudy",
          fire => {
            const listener = value => {
              fire.async(value);
            };
            notificationEventEmitter.on("introduction-leave-study", listener);
            return () => {
              notificationEventEmitter.off(
                "introduction-leave-study",
                listener,
              );
            };
          },
        ).api(),
      },
    };
  }
};
