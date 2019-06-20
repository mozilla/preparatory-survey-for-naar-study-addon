/* global Papa, amoDataCsv */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "getSelfInstalledEnabledAddonsWithAmoData" }]*/

const amoDataCsvParsed = Papa.parse(amoDataCsv);

const getSelfInstalledEnabledAddonsWithAmoData = async() => {
  const amoData = amoDataCsvParsed.data;

  await browser.study.logger.debug({
    amoData,
  });

  // Users need to have at least 3 self-installed add-ons to be eligible
  const listOfInstalledAddons = await browser.addonsMetadata.getListOfInstalledAddons();
  const listOfSelfInstalledEnabledAddons = listOfInstalledAddons.filter(
    addon =>
      !addon.isSystem && !addon.userDisabled && addon.id !== browser.runtime.id,
  );

  await browser.study.logger.debug({
    listOfSelfInstalledEnabledAddons,
  });

  return listOfSelfInstalledEnabledAddons;
};
