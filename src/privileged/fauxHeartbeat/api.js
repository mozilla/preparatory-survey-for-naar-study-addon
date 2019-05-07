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

let notificationBox = null;
let notice = null;

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

function showNotification(
  chromeWindow,
  notificationMessage,
  buttonLabel,
  onClickButton,
  onDismissed,
) {
  removeActiveNotification();

  notificationBox = chromeWindow.gHighPriorityNotificationBox;
  notice = notificationBox.appendNotification(
    notificationMessage,
    "naar-survey-prompt-1",
    "resource://normandy/skin/shared/heartbeat-icon.svg",
    notificationBox.PRIORITY_INFO_HIGH,
    [
      {
        label: buttonLabel,
        callback: onClickButton,
      },
    ],
    eventType => {
      if (eventType === "dismissed") {
        onDismissed();
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

function getMostRecentNonPrivateBrowserWindow() {
  return BrowserWindowTracker.getTopWindow({
    private: false,
    allowPopups: false,
  });
}

/**
 * Display notification bar
 *
 * Events:
 *  - {event: shown}
 *  - {event: tell-me-more}
 */
class FauxHeartbeatEventEmitter extends EventEmitter {}

this.fauxHeartbeat = class extends ExtensionAPI {
  getAPI(context) {
    const fauxHeartbeatEventEmitter = new FauxHeartbeatEventEmitter();
    return {
      fauxHeartbeat: {
        show(config) {
          const chromeWindow = getMostRecentNonPrivateBrowserWindow();
          if (chromeWindow && chromeWindow.gBrowser) {
            showNotification(
              chromeWindow,
              config.notificationMessage,
              config.buttonLabel,
              () => {
                fauxHeartbeatEventEmitter.emit("accept");
              },
              () => {
                fauxHeartbeatEventEmitter.emit("reject");
              },
            );
            fauxHeartbeatEventEmitter.emit("shown");
          }
        },
        cleanup() {
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
        },
        onShown: new EventManager(context, "fauxHeartbeat.onShown", fire => {
          const listener = value => {
            fire.async(value);
          };
          fauxHeartbeatEventEmitter.on("shown", listener);
          return () => {
            fauxHeartbeatEventEmitter.off("shown", listener);
          };
        }).api(),
        onAccept: new EventManager(context, "notification.onAccept", fire => {
          const listener = value => {
            fire.async(value);
          };
          fauxHeartbeatEventEmitter.on("accept", listener);
          return () => {
            fauxHeartbeatEventEmitter.off("accept", listener);
          };
        }).api(),
        onReject: new EventManager(context, "notification.onReject", fire => {
          const listener = value => {
            fire.async(value);
          };
          fauxHeartbeatEventEmitter.on("reject", listener);
          return () => {
            fauxHeartbeatEventEmitter.off("reject", listener);
          };
        }).api(),
      },
    };
  }
};
