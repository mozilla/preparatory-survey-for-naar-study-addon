/* global Papa, amoDataCsv */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "getSelfInstalledEnabledAddonsWithAmoData" }]*/

const amoDataCsvParsed = Papa.parse(amoDataCsv);

const getSelfInstalledEnabledAddonsWithAmoData = async() => {
  const amoData = amoDataCsvParsed.data;

  // Users need to have at least 3 self-installed add-ons to be eligible
  const listOfInstalledAddons = await browser.addonsMetadata.getListOfInstalledAddons();
  const listOfSelfInstalledEnabledAddons = listOfInstalledAddons.filter(
    addon =>
      !addon.isSystem && !addon.userDisabled && addon.id !== browser.runtime.id,
  );

  const listOfSelfInstalledEnabledAddonsWithAmoData = listOfSelfInstalledEnabledAddons
    .map(addon => {
      const matchingAmoDataEntry = amoData.find(
        amoDataEntry => amoDataEntry[0] === addon.id,
      );
      return {
        ...addon,
        amoData: matchingAmoDataEntry
          ? {
            guid: matchingAmoDataEntry[0],
            icon_url_128: matchingAmoDataEntry[1],
            name_en_us: matchingAmoDataEntry[2],
          }
          : null,
      };
    })
    .filter(addon => addon.amoData !== null);

  return listOfSelfInstalledEnabledAddonsWithAmoData;
};
