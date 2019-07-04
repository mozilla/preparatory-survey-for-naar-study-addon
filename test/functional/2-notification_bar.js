/* eslint-env node, mocha */

// for unhandled promise rejection debugging
process.on("unhandledRejection", r => console.error(r)); // eslint-disable-line no-console

const assert = require("assert");
const utils = require("./utils");

// Part 1:  Utilities

async function getFirstButton(driver) {
  return utils.ui.getChromeElementBy.className(driver, "notification-button");
}

// Part 2:  The Tests

describe("notifcation bar", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(25000);

  let driver;

  before(async() => {
    driver = await utils.setupWebdriver.promiseSetupDriver(
      utils.FIREFOX_PREFERENCES,
    );
    await utils.installSomeAddons(driver);
    await utils.setupWebdriver.installAddon(driver);
    // allow our shield study add-on some time to send initial pings
    await driver.sleep(4000);
  });

  after(async() => {
    driver.quit();
  });

  it("accept button looks fine", async() => {
    const firstButton = await getFirstButton(driver);
    assert(firstButton !== null);
    const label = await firstButton.getAttribute("label");
    assert.strictEqual(label, "Take me to the questionnaire");
  });

  it("clicking accept gives telemetry", async() => {
    const startTime = Date.now();
    const firstButton = await getFirstButton(driver);
    await firstButton.click();
    await driver.sleep(100);

    const newPings = await utils.telemetry.getShieldPingsAfterTimestamp(
      driver,
      startTime,
    );
    const observed = utils.telemetry.summarizePings(newPings);

    const expected = [
      [
        "shield-study",
        {
          study_state: "exit",
        },
      ],
      [
        "shield-study",
        {
          study_state: "ended-neutral",
          study_state_fullname: "accept-survey",
        },
      ],
    ];
    // this would add new telemetry
    assert.deepStrictEqual(observed, expected, "telemetry pings do not match");
  });

  it("TBD click on NO uninstalls addon", async() => {
    assert(true);
  });
});
