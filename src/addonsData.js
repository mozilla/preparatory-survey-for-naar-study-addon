/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "getSelfInstalledEnabledAddonsWithAmoData" }]*/

let fetchedAmoData;

const getSelfInstalledEnabledAddonsWithAmoData = async() => {
  // Users need to have at least 3 self-installed add-ons to be eligible
  const listOfInstalledAddons = await browser.addonsMetadata.getListOfInstalledAddons();
  const listOfSelfInstalledEnabledAddons = listOfInstalledAddons.filter(
    addon =>
      !addon.isSystem && !addon.userDisabled && addon.id !== browser.runtime.id,
  );
  if (listOfSelfInstalledEnabledAddons.length === 0) {
    await browser.study.logger.info(
      "No self-installed enabled add-ons found. Returning an empty result",
    );
    return [];
  }

  if (!fetchedAmoData) {
    // Fetching AMO metadata about the extensions allows us to verify that
    // they are listed in AMO and retrieve public extension names and icon URLs
    const guids = listOfSelfInstalledEnabledAddons.map(addon => addon.id);
    const amoDataUrl = `https://addons.mozilla.org/api/v3/addons/search/?guid=${encodeURIComponent(
      guids.join(","),
    )}`;
    const amoDataResponse = await fetch(amoDataUrl).catch(async error => {
      await browser.study.logger.error(
        "Error when fetching metadata from AMO. Returning an empty result",
      );
      await browser.study.logger.error({ error });
      return false;
    });
    if (!amoDataResponse) {
      await browser.study.logger.error(
        "Fetched AMO response empty. Returning an empty result",
      );
      return [];
    }

    const amoData = await amoDataResponse.json();
    if (!amoData || !amoData.results) {
      await browser.study.logger.error(
        "Fetched metadata from AMO empty. Returning an empty result",
      );
      return false;
    }

    fetchedAmoData = amoData;
  }

  return listOfSelfInstalledEnabledAddons
    .map(addon => {
      const matchingAmoDataResultsEntry = fetchedAmoData.results.find(
        amoDataResultsEntry => amoDataResultsEntry.guid === addon.id,
      );
      return {
        ...addon,
        amoData: matchingAmoDataResultsEntry
          ? {
            guid: matchingAmoDataResultsEntry.guid,
            icon_url: matchingAmoDataResultsEntry.icon_url,
            name_en_us: matchingAmoDataResultsEntry.name["en-US"],
          }
          : null,
      };
    })
    .filter(
      addon =>
        addon.amoData !== null &&
        addon.amoData.guid &&
        addon.amoData.icon_url &&
        addon.amoData.name_en_us,
    );
};
