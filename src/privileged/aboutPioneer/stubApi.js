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

this.aboutPioneer = class extends ExtensionAPI {
  getAPI(context) {
    const apiEventEmitter = new EventEmitter();
    return {
      aboutPioneer: {
        /* @TODO no description given */
        enable: async function enable(addonUrl) {
          console.log("Called enable(addonUrl)", addonUrl);
          return undefined;
        },

        /* @TODO no description given */
        disable: async function disable() {
          console.log("Called disable()");
          return undefined;
        },
      },
    };
  }
};
