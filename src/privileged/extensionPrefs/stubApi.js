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

this.extensionPrefs = class extends ExtensionAPI {
  getAPI(context) {
    const apiEventEmitter = new EventEmitter();
    return {
      extensionPrefs: {
        /* Clear a preference's non-default value */
        clearUserPref: async function clearUserPref(name) {
          console.log("Called clearUserPref(name)", name);
          return undefined;
        },

        /* Get a preference's value */
        getIntPref: async function getIntPref(name, defaultValue) {
          console.log(
            "Called getIntPref(name, defaultValue)",
            name,
            defaultValue,
          );
          return undefined;
        },

        /* Set a preference's value */
        setIntPref: async function setIntPref(name, value) {
          console.log("Called setIntPref(name, value)", name, value);
          return undefined;
        },
      },
    };
  }
};
