"use strict";

/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/Console.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");

this.addonsMetadata = class extends ExtensionAPI {
  getAPI(context) {
    const { TelemetryEnvironment } = ChromeUtils.import(
      "resource://gre/modules/TelemetryEnvironment.jsm",
    );
    return {
      addonsMetadata: {
        async getListOfInstalledAddons() {
          await TelemetryEnvironment.onInitialized();
          return TelemetryEnvironment.currentEnvironment.addons;
        },
      },
    };
  }
};
