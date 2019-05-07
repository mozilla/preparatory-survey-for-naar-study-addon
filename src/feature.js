/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/

/**
 * **Example template documentation - remove or replace this jsdoc in your study**
 *
 * Example Feature module for a Shield Study.
 *
 *  UI:
 *  - during INSTALL only, show a notification bar with 2 buttons:
 *    - "Thanks".  Accepts the study (optional)
 *    - "I don't want this".  Uninstalls the study.
 *
 *  Firefox code:
 *  - Implements the 'introduction' to the 'button choice' study, via notification bar.
 *
 *  Demonstrates `studyUtils` API:
 *
 *  - `telemetry` to instrument "shown", "accept", and "leave-study" events.
 *  - `endStudy` to send a custom study ending.
 *
 **/
class Feature {
  constructor() {}

  /**
   * @returns {Promise<*>} Promise that resolves after configure
   */
  async configure() {
    const feature = this;

    const HOUR_MS = 60 * 60 * 1000;

    feature.config = {
      addonUrl:
        "https://addons.mozilla.org/firefox/downloads/latest/firefox-pioneer/?src=pioneer-participation-prompt-v3",
      notificationMessage: "Please help us improve Firefox and the Web",
      updateTimerInterval: await browser.extensionPrefs.getIntPref(
        "updateTimerInterval",
        43200, // 12 hours
      ),
      firstPromptDelay: await browser.extensionPrefs.getIntPref(
        "firstPromptDelay",
        5 * 60 * 1000, // 5 minutes in ms
      ),
      secondPromptDelay: await browser.extensionPrefs.getIntPref(
        "secondPromptDelay",
        2 * 24 * HOUR_MS - HOUR_MS, // 2 days minus an hour for timer variances
      ),
      studyEndDelay: await browser.extensionPrefs.getIntPref(
        "studyEndDelay",
        24 * HOUR_MS - HOUR_MS, // 1 day in ms minus an hour for timer variances
      ),
      studyEnrolledEndDelay: await browser.extensionPrefs.getIntPref(
        "studyEnrolledEndDelay",
        24 * HOUR_MS - HOUR_MS, // 1 day in ms minus an hour for timer variances
      ),
    };

    await browser.aboutPioneer.enable(feature.config.addonUrl);
    await browser.pioneerNotification.enable(feature.config);
  }

  /* good practice to have the literal 'sending' be wrapped up */
  async sendTelemetry(payload) {
    if (await browser.privacyContext.aPrivateBrowserWindowIsOpen()) {
      // drop the ping - do not send any telemetry
      return false;
    }

    await browser.study.logger.debug([
      "Telemetry about to be validated using browser.study.validateJSON",
      payload,
    ]);

    const payloadSchema = {
      type: "object",
      properties: {
        event: {
          type: "string",
        },
        timesClickedInSession: {
          type: "number",
          minimum: 0,
        },
      },
      required: ["event"],
    };
    const validationResult = await browser.study.validateJSON(
      payload,
      payloadSchema,
    );

    // Use to update study.payload.schema.json
    // console.log(JSON.stringify(payloadSchema));

    if (!validationResult.valid) {
      await browser.study.logger.error([
        "Invalid telemetry payload",
        { payload, validationResult },
      ]);
      throw new Error("Invalid telemetry payload");
    }

    // Submit ping using study utils - allows for automatic querying of study data in re:dash
    const shieldStudyAddonPayload = {
      event: String(payload.event),
      timesClickedInSession: String(payload.timesClickedInSession),
    };
    await browser.study.sendTelemetry(shieldStudyAddonPayload);
    await browser.study.logger.log("Telemetry submitted:");
    await browser.study.logger.log({ payload, shieldStudyAddonPayload });
    return true;
  }

  /**
   * Called at end of study, and if the user disables the study or it gets uninstalled by other means.
   * @returns {Promise<*>} Promise that resolves after cleanup
   */
  async cleanup() {
    await browser.aboutPioneer.disable();
    await browser.pioneerNotification.disable();
  }
}

// make an instance of the feature class available to background.js
// construct only. will be configured after setup
window.feature = new Feature();
