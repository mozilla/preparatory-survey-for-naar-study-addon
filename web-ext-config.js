/* eslint-env node */

const defaultConfig = {
  // Global options:
  sourceDir: "./src/",
  artifactsDir: "./dist/",
  ignoreFiles: [".DS_Store"],
  // Command options:
  build: {
    overwriteDest: true,
  },
  run: {
    firefox: process.env.FIREFOX_BINARY || "nightly",
    browserConsole: true,
    startUrl: ["about:debugging"],
    pref: [
      "extensions.pioneer-participation-prompt_shield_mozilla_org.firstPromptDelay=5",
      "shieldStudy.logLevel=info",
      "browser.ctrlTab.recentlyUsedOrder=false",
    ],
  },
};

module.exports = defaultConfig;
