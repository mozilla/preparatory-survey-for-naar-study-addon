/* global ExtensionAPI */

"use strict";

this.extensionPrefs = class extends ExtensionAPI {
  getAPI(context) {
    const { Services } = ChromeUtils.import(
      "resource://gre/modules/Services.jsm",
      {},
    );
    const { extension } = this;
    // Copied here from tree
    function makeWidgetId(id) {
      id = id.toLowerCase();
      return id.replace(/[^a-z0-9_-]/g, "_");
    }
    const widgetId = makeWidgetId(extension.manifest.applications.gecko.id);
    const prefNameBase = `extensions.${widgetId}.`;
    return {
      extensionPrefs: {
        async clearUserPref(name) {
          return Services.prefs.clearUserPref(`${prefNameBase}${name}`);
        },
        async getIntPref(name, defaultValue) {
          return Services.prefs.getIntPref(
            `${prefNameBase}${name}`,
            defaultValue,
          );
        },
        async setIntPref(name, value) {
          return Services.prefs.setIntPref(`${prefNameBase}${name}`, value);
        },
      },
    };
  }
};
