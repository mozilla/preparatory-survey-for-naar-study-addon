"use strict";

/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/Console.jsm");
this.addonsMetadata = class extends ExtensionAPI {
  getAPI(context) {
    const { TelemetryEnvironment } = ChromeUtils.import(
      "resource://gre/modules/TelemetryEnvironment.jsm",
    );
    return {
      addonsMetadata: {
        async getListOfInstalledAddons() {
          await TelemetryEnvironment.onInitialized();

          // Use general addon metadata from the already prepared addons information in the telemetry environment
          const telAddons =
            TelemetryEnvironment.currentEnvironment.addons.activeAddons;

          // Return general addon metadata as an array
          return Object.keys(telAddons).map(addonId => {
            return {
              ...telAddons[addonId],
              id: addonId,
            };
          });
        },
      },
    };
  }
};
