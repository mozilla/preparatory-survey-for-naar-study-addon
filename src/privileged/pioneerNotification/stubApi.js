/* eslint-env commonjs */
/* eslint no-logger: off */
/* eslint no-unused-vars: off */
/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

/* eslint-disable no-undef */
const { EventManager } = ExtensionCommon;
const EventEmitter =
  ExtensionCommon.EventEmitter || ExtensionUtils.EventEmitter;

this.pioneerNotification = class extends ExtensionAPI {
  getAPI(context) {
    const apiEventEmitter = new EventEmitter();
    return {
      pioneerNotification: {
        /* Shows the participation prompt */
        show: async function show() {
          console.log("Called show()");
          return undefined;
        },

        // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
        /* Fires when the participation prompt has been shown */
        onShown: new EventManager(
          context,
          "pioneerNotification:onShown",
          fire => {
            const listener = (eventReference, arg1) => {
              fire.async(arg1);
            };
            apiEventEmitter.on("shown", listener);
            return () => {
              apiEventEmitter.off("shown", listener);
            };
          },
        ).api(),

        // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
        /* Fires onAccept */
        onAccept: new EventManager(
          context,
          "pioneerNotification:onAccept",
          fire => {
            const listener = (eventReference, arg1) => {
              fire.async(arg1);
            };
            apiEventEmitter.on("accept", listener);
            return () => {
              apiEventEmitter.off("accept", listener);
            };
          },
        ).api(),

        // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
        /* Fires onLeaveStudy */
        onLeaveStudy: new EventManager(
          context,
          "pioneerNotification:onLeaveStudy",
          fire => {
            const listener = (eventReference, arg1) => {
              fire.async(arg1);
            };
            apiEventEmitter.on("leaveStudy", listener);
            return () => {
              apiEventEmitter.off("leaveStudy", listener);
            };
          },
        ).api(),
      },
    };
  }
};
