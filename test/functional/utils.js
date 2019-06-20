/* eslint-env node */

// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require("geckodriver");

const path = require("path");

// Preferences set during testing
const FIREFOX_PREFERENCES = {
  // Ensure e10s is turned on.
  "browser.tabs.remote.autostart": true,
  "browser.tabs.remote.autostart.1": true,
  "browser.tabs.remote.autostart.2": true,

  // Improve debugging using `browser toolbox`.
  "devtools.chrome.enabled": true,
  "devtools.debugger.remote-enabled": true,
  "devtools.debugger.prompt-connection": false,

  // Removing warning for `about:config`
  "general.warnOnAboutConfig": false,

  // Enable verbose shield study utils logging
  "shieldStudy.logLevel": "All",

  /** WARNING: Geckodriver sets many additional prefs at:
   * https://dxr.mozilla.org/mozilla-central/source/testing/geckodriver/src/prefs.rs
   *
   * In, particular, this DISABLES actual telemetry uploading
   * ("toolkit.telemetry.server", Pref::new("https://%(server)s/dummy/telemetry/")),
   *
   */
};

// Re-usable test methods from shield-studies-addon-utils
const { executeJs } = require("shield-studies-addon-utils/testUtils/executeJs");
const { nav } = require("shield-studies-addon-utils/testUtils/nav");
const {
  preferences,
} = require("shield-studies-addon-utils/testUtils/preferences");
const {
  setupWebdriver,
} = require("shield-studies-addon-utils/testUtils/setupWebdriver");
const { telemetry } = require("shield-studies-addon-utils/testUtils/telemetry");
const { ui } = require("shield-studies-addon-utils/testUtils/ui");

const installSomeAddons = async driver => {
  // Install some external add-ons
  await setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/360_internet_protection-5.0.0.1015-fx.xpi",
    ),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(process.cwd(), "test/some-addons/adblock_plus-3.5.2-an+fx.xpi"),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/easyziptab_for_firefox-1.0.785.501-fx.xpi",
    ),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/flixtab_movie_center_for_firefox-1.0.792.497-fx.xpi",
    ),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/lastpass_password_manager-4.29.0.4-fx.xpi",
    ),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/startpagecom_private_search_engine-1.1.4-fx.xpi",
    ),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/tampermonkey-4.9.5941-an+fx.xpi",
    ),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(process.cwd(), "test/some-addons/ublock_origin-1.20.0-an+fx.xpi"),
  );
  await setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/video_downloader_professional-1.98.2-an+fx.xpi",
    ),
  );
};

// What we expose to our add-on-specific tests
module.exports = {
  FIREFOX_PREFERENCES,
  executeJs,
  nav,
  preferences,
  setupWebdriver,
  telemetry,
  ui,
  installSomeAddons,
};
