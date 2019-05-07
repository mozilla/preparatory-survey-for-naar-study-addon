/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { interfaces: Ci, results: Cr, manager: Cm, utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

this.EXPORTED_SYMBOLS = ["AboutPages"];

/**
 * Class for managing an about: page that Pioneer provides. Adapted from
 * browser/extensions/pocket/content/AboutPocket.jsm.
 *
 * @implements nsIFactory
 * @implements nsIAboutModule
 */
class AboutPage {
  constructor({ chromeUrl, aboutHost, classId, description, uriFlags }) {
    this.chromeUrl = chromeUrl;
    this.aboutHost = aboutHost;
    this.classId = Components.ID(classId);
    this.description = description;
    this.uriFlags = 0; // TODO: Using uriFlags currently leads to "Hmm. That address doesn’t look right. Please check that the URL is correct and try again."
  }

  getURIFlags() {
    return this.uriFlags;
  }

  newChannel(uri, loadInfo) {
    const newURI = Services.io.newURI(this.chromeUrl);
    const channel = Services.io.newChannelFromURIWithLoadInfo(newURI, loadInfo);
    channel.originalURI = uri;

    // eslint-disable-next-line no-bitwise
    if (this.uriFlags & Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT) {
      const principal = Services.scriptSecurityManager.createCodebasePrincipal(
        uri,
        {},
      );
      channel.owner = principal;
    }
    return channel;
  }

  createInstance(outer, iid) {
    if (outer !== null) {
      throw Cr.NS_ERROR_NO_AGGREGATION;
    }
    return this.QueryInterface(iid);
  }

  /**
   * Register this about: page with XPCOM. This must be called once in each
   * process (parent and content) to correctly initialize the page.
   */
  register() {
    Cm.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(
      this.classId,
      this.description,
      `@mozilla.org/network/protocol/about;1?what=${this.aboutHost}`,
      this,
    );
  }

  /**
   * Unregister this about: page with XPCOM. This must be called before the
   * add-on is cleaned up if the page has been registered.
   */
  unregister() {
    Cm.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(
      this.classId,
      this,
    );
  }
}
AboutPage.prototype.QueryInterface = ChromeUtils.generateQI([
  Ci.nsIAboutModule,
]);

/**
 * The module exported by this file.
 */
this.AboutPages = {};

/**
 * about:pioneer page for displaying a consent page for Pioneer.
 * @type {AboutPage}
 * @implements {nsIMessageListener}
 */
XPCOMUtils.defineLazyGetter(this.AboutPages, "aboutPioneer", () => {
  const aboutPioneer = new AboutPage({
    chromeUrl:
      "resource://pioneer-participation-prompt-content/about-pioneer/about-pioneer.html",
    aboutHost: "pioneer",
    classId: "{1ecac8dc-4e64-4872-8185-11fde537bf95}",
    description: "Firefox Pioneer",
    uriFlags:
      Ci.nsIAboutModule.ALLOW_SCRIPT |
      Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT |
      Ci.nsIAboutModule.URI_MUST_LOAD_IN_CHILD,
  });
  return aboutPioneer;
});
