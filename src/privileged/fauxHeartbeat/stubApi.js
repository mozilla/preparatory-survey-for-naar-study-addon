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

this.fauxHeartbeat = class extends ExtensionAPI {
  getAPI(context) {
    const apiEventEmitter = new EventEmitter();
    return {
      fauxHeartbeat: {
        /* Shows the faux Heartbeat prompt */
        show: async function show(promptConfig) {
          console.log("Called show(promptConfig)", promptConfig);
          return undefined;
        },

        /* Hides the faux Heartbeat prompt and cleanups any injected Heartbeat stylesheets */
        cleanup: async function cleanup() {
          console.log("Called cleanup()");
          return undefined;
        },

        // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
        /* Fires when the faux Heartbeat prompt has been shown */
        onShown: new EventManager(context, "fauxHeartbeat:onShown", fire => {
          const listener = (eventReference, arg1) => {
            fire.async(arg1);
          };
          apiEventEmitter.on("shown", listener);
          return () => {
            apiEventEmitter.off("shown", listener);
          };
        }).api(),

        // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
        /* Fires on accept */
        onAccept: new EventManager(context, "fauxHeartbeat:onAccept", fire => {
          const listener = (eventReference, arg1) => {
            fire.async(arg1);
          };
          apiEventEmitter.on("accept", listener);
          return () => {
            apiEventEmitter.off("accept", listener);
          };
        }).api(),

        // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
        /* Fires on reject */
        onReject: new EventManager(context, "fauxHeartbeat:onReject", fire => {
          const listener = (eventReference, arg1) => {
            fire.async(arg1);
          };
          apiEventEmitter.on("reject", listener);
          return () => {
            apiEventEmitter.off("reject", listener);
          };
        }).api(),
      },
    };
  }
};
