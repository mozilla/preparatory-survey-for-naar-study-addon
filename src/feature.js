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
   * @returns {Promise<*>} Promise that resolves after configure
   */
  async configure() {
    const feature = this;

    const { notificationShown } = await browser.storage.local.get(
      "notificationShown",
    );
    if (!notificationShown) {
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
              icon: addon.amoData.icon_url,
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

      // https://github.com/Daplie/knuth-shuffle
      const shuffle = array => {
        let currentIndex = array.length,
          temporaryValue,
          randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          // And swap it with the current element.
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
        }

        return array;
      };

      // Send information about at most 10 randomly selected self-installed addons to the survey URL
      const shuffledAddonsSurveyData = shuffle(addonsSurveyData);
      await browser.study.logger.debug({
        shuffledAddonsSurveyData,
      });
      const shuffledAndCappedAddonsSurveyData = shuffledAddonsSurveyData.slice(
        0,
        10,
      );
      await browser.study.logger.debug({
        shuffledAndCappedAddonsSurveyData,
      });

      const surveyUrl =
        baseUrl +
        "&addons=" +
        encodeURIComponent(JSON.stringify(shuffledAndCappedAddonsSurveyData));
      await browser.study.logger.debug({
        surveyUrl,
      });

      await browser.study.logger.log(
        "First run. Showing faux Heartbeat prompt",
      );

      browser.fauxHeartbeat.onShown.addListener(async() => {
        await browser.study.logger.log("notification-shown");
        await browser.storage.local.set({ notificationShown: true });
      });

      browser.fauxHeartbeat.onAccept.addListener(async() => {
        await browser.study.logger.log("accept-survey");

        // Fire survey
        await browser.study.logger.log("Firing survey");
        await browser.tabs.create({ url: surveyUrl });

        browser.study.endStudy("accept-survey");
      });

      browser.fauxHeartbeat.onReject.addListener(async() => {
        await browser.study.logger.log("closed-notification-bar");
        browser.study.endStudy("closed-notification-bar");
      });

      await browser.fauxHeartbeat.show({
        notificationMessage: "Help others discover better Extensions!",
        buttonLabel: "Take me to the questionnaire",
      });
    } else {
      browser.study.endStudy("notification-already-shown");
    }
  }

  /**
   * Called at end of study, and if the user disables the study or it gets uninstalled by other means.
   * @returns {Promise<*>} Promise that resolves after cleanup
   */
  async cleanup() {
    await browser.study.logger.log("Cleaning up fauxHeartbeat artifacts");
    await browser.fauxHeartbeat.cleanup();
  }
}

// make an instance of the feature class available to background.js
// construct only. will be configured after setup
window.feature = new Feature();
