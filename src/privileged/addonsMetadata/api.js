"use strict";

/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/Console.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");

this.addonsMetadata = class extends ExtensionAPI {
  getAPI(context) {
    const { TelemetryEnvironment } = ChromeUtils.import(
      "resource://gre/modules/TelemetryEnvironment.jsm",
    );
    const { AddonManager } = ChromeUtils.import(
      "resource://gre/modules/AddonManager.jsm",
    );
    return {
      addonsMetadata: {
        async getListOfInstalledAddons() {
          await TelemetryEnvironment.onInitialized();

          // Get general addon metadata from the already prepared addons information in the telemetry environment
          const telAddons =
            TelemetryEnvironment.currentEnvironment.addons.activeAddons;

          // Get icon urls
          const activeAddons = await AddonManager.getActiveAddons();
          const addonsIconUrlInfos = activeAddons.addons.map(addon => {
            const id = addon.id;
            const iconUrl =
              AddonManager.getPreferredIconURL(addon, 256) || false;
            return { id, iconUrl };
          });

          // Return general addon metadata merged with the icon url info
          return Object.keys(telAddons).map(addonId => {
            const iconUrlInfo = addonsIconUrlInfos.find(
              $iconUrlInfo => ($iconUrlInfo.id = addonId),
            );
            return {
              ...telAddons[addonId],
              iconUrl: iconUrlInfo.iconUrl,
              id: addonId,
            };
          });
        },
      },
    };
  }
};
