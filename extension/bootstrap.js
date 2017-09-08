const { interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/CustomizableUI.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Preferences",
  "resource://gre/modules/Preferences.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "studyUtils",
  "resource://share-button-study/StudyUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "config",
  "resource://share-button-study/Config.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PingStorage",
  "resource://share-button-study/PingStorage.jsm");

const REASONS = {
  APP_STARTUP:      1, // The application is starting up.
  APP_SHUTDOWN:     2, // The application is shutting down.
  ADDON_ENABLE:     3, // The add-on is being enabled.
  ADDON_DISABLE:    4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL:    5, // The add-on is being installed.
  ADDON_UNINSTALL:  6, // The add-on is being uninstalled.
  ADDON_UPGRADE:    7, // The add-on is being upgraded.
  ADDON_DOWNGRADE:  8, // The add-on is being downgraded.
};
const COUNTER_PREF = "extensions.sharebuttonstudy.counter";
const TREATMENT_OVERRIDE_PREF = "extensions.sharebuttonstudy.treatment";
const ADDED_BOOL_PREF = "extensions.sharebuttonstudy.addedBool";
const EXPIRATION_DATE_STRING_PREF = "extensions.sharebuttonstudy.expirationDateString";
const MAX_TIMES_TO_SHOW = 5;
const SHAREBUTTON_CSS_URI = Services.io.newURI("resource://share-button-study/share_button.css");
const PANEL_CSS_URI = Services.io.newURI("resource://share-button-study/panel.css");
const browserWindowWeakMap = new WeakMap();

function currentPageIsShareable(browserWindow) {
  const uri = browserWindow.window.gBrowser.currentURI;
  return uri.schemeIs("http") || uri.schemeIs("https");
}

function shareButtonIsUseable(shareButton) {
  return shareButton !== null && // the button exists
    shareButton.getAttribute("disabled") !== "true" && // the page we are on can be shared
    shareButton.getAttribute("cui-areatype") === "toolbar" && // the button is in the toolbar
    shareButton.getAttribute("overflowedItem") !== "true"; // but not in the overflow menu"
}

async function highlightTreatment(browserWindow, shareButton, incrementCounter = true) {
  if (shareButtonIsUseable(shareButton)) {
    if (incrementCounter) {
      Preferences.set(COUNTER_PREF, Preferences.get(COUNTER_PREF, 0) + 1);
    }
    const pingData = { treatment: "highlight" };
    await studyUtils.telemetry(pingData);
    await PingStorage.logPing(pingData);
    // add the event listener to remove the css class when the animation ends
    shareButton.addEventListener("animationend", browserWindow.animationEndListener);
    shareButton.classList.add("social-share-button-on");
  }
}

async function doorhangerDoNothingTreatment(browserWindow, shareButton, incrementCounter = true) {
  if (shareButtonIsUseable(shareButton)) {
    if (incrementCounter) {
      Preferences.set(COUNTER_PREF, Preferences.get(COUNTER_PREF, 0) + 1);
    }
    const pingData = { treatment: "doorhanger" };
    await studyUtils.telemetry(pingData);
    await PingStorage.logPing(pingData);
    let panel = browserWindow.window.document.getElementById("share-button-panel");
    if (panel === null) { // create the panel
      panel = browserWindow.window.document.createElement("panel");
      panel.setAttribute("id", "share-button-panel");
      panel.setAttribute("class", "no-padding-panel");
      panel.setAttribute("type", "arrow");
      panel.setAttribute("noautofocus", true);
      panel.setAttribute("level", "parent");

      const embeddedBrowser = browserWindow.window.document.createElement("browser");
      embeddedBrowser.setAttribute("id", "share-button-doorhanger");
      embeddedBrowser.setAttribute("src", "resource://share-button-study/doorhanger.html");
      embeddedBrowser.setAttribute("type", "content");
      embeddedBrowser.setAttribute("disableglobalhistory", "true");
      embeddedBrowser.setAttribute("flex", "1");

      panel.appendChild(embeddedBrowser);
      browserWindow.window.document.getElementById("mainPopupSet").appendChild(panel);
    }
    panel.openPopup(shareButton, "bottomcenter topright", 0, 0, false, false);
  }
}

async function doorhangerAskToAddTreatment(browserWindow, shareButton) {
  // Do not re-add to toolbar if user removed manually
  if (Preferences.get(ADDED_BOOL_PREF, false)) { return; }

  Preferences.set(COUNTER_PREF, Preferences.get(COUNTER_PREF, 0) + 1);

  // check to see if we can share the page and if the share button has not yet been added
  // if it has been added, we do not want to prompt to add
  if (currentPageIsShareable(browserWindow) && shareButton === null) {
    let panel = browserWindow.window.document.getElementById("share-button-ask-panel");
    if (panel === null) { // create the panel
      panel = browserWindow.window.document.createElement("panel");
      panel.setAttribute("id", "share-button-ask-panel");
      panel.setAttribute("class", "no-padding-panel");
      panel.setAttribute("type", "arrow");
      panel.setAttribute("noautofocus", true);
      panel.setAttribute("level", "parent");

      panel.addEventListener("click", () => {
        CustomizableUI.addWidgetToArea("social-share-button", CustomizableUI.AREA_NAVBAR);
        panel.hidePopup();
        highlightTreatment(browserWindow, browserWindow.shareButton, false);
        Preferences.set(ADDED_BOOL_PREF, true);
      });

      const embeddedBrowser = browserWindow.window.document.createElement("browser");
      embeddedBrowser.setAttribute("id", "share-button-ask-doorhanger");
      embeddedBrowser.setAttribute("src", "resource://share-button-study/ask.html");
      embeddedBrowser.setAttribute("type", "content");
      embeddedBrowser.setAttribute("disableglobalhistory", "true");
      embeddedBrowser.setAttribute("flex", "1");

      panel.appendChild(embeddedBrowser);
      browserWindow.window.document.getElementById("mainPopupSet").appendChild(panel);
    }
    const burgerMenu = browserWindow.window.document.getElementById("PanelUI-menu-button");
    if (burgerMenu !== null) {
      // only send the telemetry ping if we actually open the panel
      const pingData = { treatment: "ask-to-add" };
      await studyUtils.telemetry(pingData);
      await PingStorage.logPing(pingData);
      panel.openPopup(burgerMenu, "bottomcenter topright", 0, 0, false, false);
    }
  } else if (shareButtonIsUseable(shareButton)) {
    doorhangerDoNothingTreatment(browserWindow, browserWindow.shareButton);
  }
}

async function doorhangerAddToToolbarTreatment(browserWindow, shareButton) {
  // Do not re-add to toolbar if user removed manually
  if (Preferences.get(ADDED_BOOL_PREF, false)) { return; }

  Preferences.set(COUNTER_PREF, Preferences.get(COUNTER_PREF, 0) + 1);

  // check to see if the page will be shareable after adding the button to the toolbar
  if (currentPageIsShareable(browserWindow) && !shareButtonIsUseable(shareButton)) {
    const pingData = { treatment: "add-to-toolbar" };
    await studyUtils.telemetry(pingData);
    await PingStorage.logPing(pingData);
    CustomizableUI.addWidgetToArea("social-share-button", CustomizableUI.AREA_NAVBAR);
    Preferences.set(ADDED_BOOL_PREF, true);
    // need to get using browserWindow.shareButton because the shareButton argument
    // was initialized before the button was added
  }
  doorhangerDoNothingTreatment(browserWindow, browserWindow.shareButton, false);
}

// define treatments as STRING: fn(browserWindow, shareButton)
const TREATMENTS = {
  control: () => {},
  highlight:              highlightTreatment,
  doorhangerDoNothing:    doorhangerDoNothingTreatment,
  doorhangerAskToAdd:     doorhangerAskToAddTreatment,
  doorhangerAddToToolbar: doorhangerAddToToolbarTreatment,
};

async function chooseVariation() {
  let variation;
  // if pref has a user-set value, use this instead
  if (Preferences.isSet(TREATMENT_OVERRIDE_PREF)) {
    variation = {
      name: Preferences.get(TREATMENT_OVERRIDE_PREF, null), // there is no default value
      weight: 1,
    };
    if (variation.name in TREATMENTS) { return variation; }
    // if the variation from the pref is invalid, then fall back to standard choosing
  }

  const sample = studyUtils.sample;
  // this is the standard arm choosing method
  const clientId = await studyUtils.getTelemetryId();
  const hashFraction = await sample.hashFraction(config.study.studyName + clientId);
  variation = sample.chooseWeighted(config.study.weightedVariations, hashFraction);

  // if the variation chosen by chooseWeighted is not a valid treatment (check in TREATMENTS),
  // then throw an exception: this means that the config file is wrong
  if (!(variation.name in TREATMENTS)) {
    throw new Error(`The variation "${variation.name}" is not a valid variation.`);
  }

  return variation;
}

class CopyController {
  // See https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Property/controllers
  constructor(browserWindow) {
    this.browserWindow = browserWindow;
    this.treatment = studyUtils.getVariation().name;
  }

  supportsCommand(cmd) { return cmd === "cmd_copy" || cmd === "cmd_cut" || cmd === "share-button-study"; }

  isCommandEnabled() { return true; }

  async doCommand(cmd) {
    if (cmd === "cmd_copy" || cmd === "cmd_cut") {
      // Iterate over all other controllers and call doCommand on the first controller
      // that supports it
      // Skip until we reach the controller that we inserted
      let i = 0;
      const urlInput = this.browserWindow.urlInput;

      for (; i < urlInput.controllers.getControllerCount(); i++) {
        const curController = urlInput.controllers.getControllerAt(i);
        if (curController.supportsCommand("share-button-study")) {
          i += 1;
          break;
        }
      }
      for (; i < urlInput.controllers.getControllerCount(); i++) {
        const curController = urlInput.controllers.getControllerAt(i);
        if (curController.supportsCommand(cmd)) {
          curController.doCommand(cmd);
          break;
        }
      }

      const pingData = { event: "copy" };
      await studyUtils.telemetry(pingData);
      await PingStorage.logPing(pingData);
      const shareButton = this.browserWindow.shareButton;
      // check to see if we should call a treatment at all
      const numberOfTimeShown = Preferences.get(COUNTER_PREF, 0);
      if (numberOfTimeShown < MAX_TIMES_TO_SHOW) {
        await TREATMENTS[this.treatment](this.browserWindow, shareButton);
      }
    }
  }

  onEvent() {}
}

class BrowserWindow {
  constructor(window) {
    this.window = window;

    // bind functions that are called externally so that `this` will work
    this.animationEndListener = this.animationEndListener.bind(this);
    this.insertCopyController = this.insertCopyController.bind(this);
    this.removeCopyController = this.removeCopyController.bind(this);
    this.addCustomizeListener = this.addCustomizeListener.bind(this);
    this.removeCustomizeListener = this.removeCustomizeListener.bind(this);

    // initialize CopyController
    this.copyController = new CopyController(this);
  }

  get urlInput() {
    // Get the "DOM" elements
    const urlBar = this.window.document.getElementById("urlbar");
    if (urlBar === null) { return null; }
    // XUL elements are different than regular children
    return this.window.document.getAnonymousElementByAttribute(urlBar, "anonid", "input");
  }

  get shareButton() {
    return this.window.document.getElementById("social-share-button");
  }

  insertCopyController() {
    // refresh urlInput reference, this is potentially changed by the customize event
    this.urlInput.controllers.insertControllerAt(0, this.copyController);
  }

  removeCopyController() {
    // refresh urlInput reference, this is potentially changed by the customize event
    this.urlInput.controllers.removeController(this.copyController);
  }

  animationEndListener() {
    // When the animation is done, we want to remove the CSS class
    // so that we can add the class again upon the next copy and
    // replay the animation
    this.shareButton.classList.remove("social-share-button-on");
  }

  addCustomizeListener() {
    this.window.addEventListener("customizationending", this.insertCopyController);
  }

  removeCustomizeListener() {
    this.window.removeEventListener("customizationending", this.insertCopyController);
  }

  insertCSS() {
    const utils = this.window.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindowUtils);
    utils.loadSheet(SHAREBUTTON_CSS_URI, utils.AGENT_SHEET);
    utils.loadSheet(PANEL_CSS_URI, utils.AGENT_SHEET);
  }

  removeCSS() {
    const utils = this.window.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindowUtils);
    utils.removeSheet(SHAREBUTTON_CSS_URI, utils.AGENT_SHEET);
    utils.removeSheet(PANEL_CSS_URI, utils.AGENT_SHEET);
  }

  startup() {
    // if there is no urlBar / urlInput, we don't want to do anything
    // (ex. browser console window)
    if (this.urlInput === null) return;

    browserWindowWeakMap.set(this.window, this);

    // The customizationending event represents exiting the "Customize..." menu from the toolbar.
    // We need to handle this event because after exiting the customization menu, the copy
    // controller is removed and we can no longer detect text being copied from the URL bar.
    // See DXR:browser/base/content/browser-customization.js
    this.addCustomizeListener();

    // Load the CSS with the shareButton animation
    this.insertCSS();

    // insert the copy controller to detect copying from URL bar
    this.insertCopyController();

    // Emit notification that the code has been injected
    // This is for testing purposes.
    Services.obs.notifyObservers(null, "share-button-study-init-complete");
  }

  shutdown() {
    // Remove the customizationending listener
    this.removeCustomizeListener();

    // Remove the CSS
    this.removeCSS();

    // Remove the copy controller
    this.removeCopyController();

    // Remove the share-button-panel
    const sharePanel = this.window.document.getElementById("share-button-panel");
    if (sharePanel !== null) {
      sharePanel.remove();
    }
    // Remove the share-button-ask-panel
    const shareAskPanel = this.window.document.getElementById("share-button-ask-panel");
    if (shareAskPanel !== null) {
      shareAskPanel.remove();
    }

    // Remove modifications to shareButton (modified in CopyController)
    if (this.shareButton !== null) {
      // if null this means there is no shareButton on the page
      // so we don't have anything to remove
      this.shareButton.classList.remove("social-share-button-on");
      this.shareButton.removeEventListener("animationend", this.animationEndListener);
    }
  }
}

// see https://dxr.mozilla.org/mozilla-central/rev/53477d584130945864c4491632f88da437353356/xpfe/appshell/nsIWindowMediatorListener.idl
const windowListener = {
  onWindowTitleChange() { },
  onOpenWindow(xulWindow) {
    // xulWindow is of type nsIXULWindow, we want an nsIDOMWindow
    // see https://dxr.mozilla.org/mozilla-central/rev/53477d584130945864c4491632f88da437353356/browser/base/content/test/general/browser_fullscreen-window-open.js#316
    // for how to change XUL into DOM
    const domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindow);

    // we need to use a listener function so that it's injected
    // once the window is loaded / ready
    const onWindowOpen = () => {
      domWindow.removeEventListener("load", onWindowOpen);
      const browserWindow = new BrowserWindow(domWindow);
      browserWindow.startup();
    };

    domWindow.addEventListener("load", onWindowOpen, true);
  },
  onCloseWindow() { },
};

this.install = function() {};

this.startup = async function(data, reason) {
  studyUtils.setup({
    ...config,
    addon: { id: data.id, version: data.version },
  });
  const variation = await chooseVariation();
  studyUtils.setVariation(variation);

  // Always set EXPIRATION_DATE_PREF if it not set, even if outside of install.
  // This is a failsafe if opt-out expiration doesn't work, so should be resilient.
  // Also helps for testing.
  if (!Preferences.has(EXPIRATION_DATE_STRING_PREF)) {
    const now = new Date(Date.now());
    const expirationDateString = new Date(now.setDate(now.getDate() + 14)).toISOString();
    Preferences.set(EXPIRATION_DATE_STRING_PREF, expirationDateString);
  }

  if (reason === REASONS.ADDON_INSTALL) {
    // reset to counter to 0 primarily for testing purposes
    Preferences.set(COUNTER_PREF, 0);
    // reset force added boolean pref
    Preferences.set(ADDED_BOOL_PREF, false);
    studyUtils.firstSeen(); // sends telemetry "enter"
    const eligible = await config.isEligible(); // addon-specific
    if (!eligible) {
      // uses config.endings.ineligible.url if any,
      // sends UT for "ineligible"
      // then uninstalls addon
      await studyUtils.endStudy({ reason: "ineligible" });
      return;
    }
  }
  // sets experiment as active and sends installed telemetry upon first install
  await studyUtils.startup({ reason });

  const expirationDate = new Date(Preferences.get(EXPIRATION_DATE_STRING_PREF));
  if (Date.now() > expirationDate) {
    studyUtils.endStudy({ reason: "expired" });
  }

  // iterate over all open windows
  const windowEnumerator = Services.wm.getEnumerator("navigator:browser");
  while (windowEnumerator.hasMoreElements()) {
    const window = windowEnumerator.getNext();
    const browserWindow = new BrowserWindow(window);
    browserWindow.startup();
  }

  // add an event listener for new windows
  Services.wm.addListener(windowListener);
};

this.shutdown = async function(data, reason) {
  // remove event listener for new windows before processing WeakMap
  // to avoid race conditions (ie. new window added during shutdown)
  Services.wm.removeListener(windowListener);

  // for use in summary ping
  let hasShareButton = false;
  const windowEnumerator = Services.wm.getEnumerator("navigator:browser");
  while (windowEnumerator.hasMoreElements()) {
    const window = windowEnumerator.getNext();
    if (browserWindowWeakMap.has(window)) {
      const browserWindow = browserWindowWeakMap.get(window);
      if (browserWindow.shareButton !== null) { hasShareButton = true; }
      browserWindow.shutdown();
    }
  }

  // are we uninstalling?
  // if so, user or automatic?
  if (reason === REASONS.ADDON_UNINSTALL || reason === REASONS.ADDON_DISABLE) {
    // reset the preference
    // this will delete it since there is no value in the default branch
    Preferences.reset(COUNTER_PREF);

    // send summary ping
    const allPings = await PingStorage.getAllPings();
    await PingStorage.clear();
    await PingStorage.close();
    // transform every value into string, such that we satisfy string -> string map from schema
    // note: prefer .toString() over JSON.stringify() when possible to minimize strange formatting
    const summaryPingData = {
      hasShareButton: hasShareButton.toString(),
      numberOfTimesURLBarCopied: allPings.filter(ping => ping.event === "copy").length.toString(),
      numberOfShareButtonClicks: Services.telemetry.getHistogramById("SOCIAL_TOOLBAR_BUTTONS").snapshot().counts[0].toString(),
      numberOfSharePanelClicks: Services.telemetry.getHistogramById("SOCIAL_PANEL_CLICKS").snapshot().counts[0].toString(),
      summary: JSON.stringify(allPings),
    };
    await studyUtils.telemetry(summaryPingData);

    if (!studyUtils._isEnding) {
      // we are the first requestors, must be user action.
      studyUtils.endStudy({ reason: "user-disable" });
    }
  }
};

this.uninstall = function() {};
