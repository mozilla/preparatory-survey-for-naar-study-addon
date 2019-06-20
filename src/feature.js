/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/
/* global getSelfInstalledEnabledAddonsWithAmoData */

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
   * @param {Object} studyInfo Study info
   * @returns {Promise<*>} Promise that resolves after configure
   */
  async configure(studyInfo) {
    const feature = this;
    const { isFirstRun } = studyInfo;

    if (isFirstRun) {
      const selfInstalledEnabledAddonsWithAmoData = await getSelfInstalledEnabledAddonsWithAmoData();
      await browser.study.logger.debug({
        selfInstalledEnabledAddonsWithAmoData,
      });

      const baseUrl = await browser.study.fullSurveyUrl(
        "https://qsurvey.mozilla.com/s3/extensions-satisfaction-survey-2019-1/",
        "accept-survey",
      );
      await browser.study.logger.debug({
        baseUrl,
      });
      const addonsSurveyData = selfInstalledEnabledAddonsWithAmoData.map(
        addon => {
          try {
            return {
              guid: addon.amoData.guid,
              name: addon.amoData.name_en_us,
              icon: addon.amoData.icon_url_128,
            };
          } catch (error) {
            // Surfacing otherwise silent errors
            // eslint-disable-next-line no-console
            console.error(error.toString(), error.stack);
            throw new Error(error.toString());
          }
        },
      );
      await browser.study.logger.debug({
        addonsSurveyData,
      });
      const surveyUrl =
        baseUrl +
        "&addons=" +
        encodeURIComponent(JSON.stringify(addonsSurveyData));
      await browser.study.logger.debug({
        surveyUrl,
      });

      await browser.study.logger.log(
        "First run. Showing faux Heartbeat prompt",
      );

      browser.fauxHeartbeat.onShown.addListener(async() => {
        await browser.study.logger.log("notification-shown");
        feature.sendTelemetry({
          event: "notification-shown",
        });
      });

      browser.fauxHeartbeat.onAccept.addListener(async() => {
        await browser.study.logger.log("accept-survey");
        feature.sendTelemetry({
          event: "accept-survey",
        });

        // Fire survey
        await browser.study.logger.log("Firing survey");
        await browser.tabs.create({ url: surveyUrl });

        browser.study.endStudy("accept-survey");
      });

      browser.fauxHeartbeat.onReject.addListener(async() => {
        await browser.study.logger.log("closed-notification-bar");
        feature.sendTelemetry({
          event: "closed-notification-bar",
        });
        browser.study.endStudy("closed-notification-bar");
      });

      await browser.fauxHeartbeat.show({
        notificationMessage: "Help others discover better Extensions!",
        buttonLabel: "Take me to the questionnaire",
      });
    }
  }

  /* good practice to have the literal 'sending' be wrapped up */
  async sendTelemetry(payload) {
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
    await browser.fauxHeartbeat.cleanup();
  }
}

// make an instance of the feature class available to background.js
// construct only. will be configured after setup
window.feature = new Feature();
