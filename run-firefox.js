/* eslint-env node */
/* global browser */
/* eslint-disable no-console */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const utils = require("./test/functional/utils");
const path = require("path");

const STUDY_TYPE = process.env.STUDY_TYPE || "shield";
const LOG_LEVEL = process.env.LOG_LEVEL || "all";
const EXPIRE_IN_SECONDS = process.env.EXPIRE_IN_SECONDS || false;
const EXPIRED = process.env.EXPIRED || false;

const run = async studyType => {
  const driver = await utils.setupWebdriver.promiseSetupDriver(
    utils.FIREFOX_PREFERENCES,
  );
  const widgetId = utils.ui.makeWidgetId(
    "preparatory-survey-for-naar-study-addon@shield.mozilla.org",
  );
  /*
  await utils.preferences.set(
    driver,
    `extensions.${widgetId}.test.studyType`,
    STUDY_TYPE,
  );
  */
  if (EXPIRE_IN_SECONDS > 0) {
    // Set preference that simulates that the study will expire after EXPIRE_IN_SECONDS seconds
    const beginTime = Date.now();
    const msInOneDay = 60 * 60 * 24 * 1000;
    const expiresInDays = 7 * 5; // 5 weeks // Needs to be the same as in src/studySetup.js
    const firstRunTimestamp =
      beginTime - msInOneDay * expiresInDays + EXPIRE_IN_SECONDS * 1000;
    await utils.preferences.set(
      driver,
      `extensions.${widgetId}.test.firstRunTimestamp`,
      String(firstRunTimestamp),
    );
  }
  if (EXPIRED) {
    // Set preference that simulates that the study has already expired before the study starts
    await utils.preferences.set(
      driver,
      `extensions.${widgetId}.test.expired`,
      true,
    );
  }
  await utils.preferences.set(driver, `shieldStudy.logLevel`, LOG_LEVEL);
  await utils.preferences.set(
    driver,
    `browser.ctrlTab.recentlyUsedOrder`,
    false,
  );
  if (studyType === "pioneer") {
    await utils.setupWebdriver.installPioneerOptInAddon(driver);
  }

  // Install some external add-ons
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/360_internet_protection-5.0.0.1015-fx.xpi",
    ),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(process.cwd(), "test/some-addons/adblock_plus-3.5.2-an+fx.xpi"),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/easyziptab_for_firefox-1.0.785.501-fx.xpi",
    ),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/flixtab_movie_center_for_firefox-1.0.792.497-fx.xpi",
    ),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/lastpass_password_manager-4.29.0.4-fx.xpi",
    ),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/startpagecom_private_search_engine-1.1.4-fx.xpi",
    ),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/tampermonkey-4.9.5941-an+fx.xpi",
    ),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(process.cwd(), "test/some-addons/ublock_origin-1.20.0-an+fx.xpi"),
  );
  await utils.setupWebdriver.installAddon(
    driver,
    path.join(
      process.cwd(),
      "test/some-addons/video_downloader_professional-1.98.2-an+fx.xpi",
    ),
  );

  await utils.setupWebdriver.installAddon(driver);
  await utils.ui.openBrowserConsole(driver);

  console.log(
    "The add-on should now be loaded and you should be able to interact with the add-on in the newly opened Firefox instance.",
  );
  const beginTime = Date.now();

  // For inclusion in TELEMETRY.md as example ping sequence
  console.log("Waiting 30 seconds to allow for telemetry report to be shown");
  await driver.sleep(30 * 1000);
  const studyPings = await utils.telemetry.getShieldPingsAfterTimestamp(
    driver,
    beginTime,
  );
  const filteredPings = studyPings.filter(
    ping => ping.type === "shield-study" || ping.type === "shield-study-addon",
  );
  console.log(
    "Shield study telemetry pings in chronological order: ",
    utils.telemetry.pingsReport(filteredPings.reverse()),
  );

  // Wait "indefinitely"
  await driver.sleep(1000 * 60 * 60 * 24);
  driver.quit();
};

run(STUDY_TYPE);
