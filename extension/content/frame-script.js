/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Listen for DOM events bubbling up from the about:pioneer page, and perform
 * privileged actions in response to them. If we need to do anything that the
 * content process can't handle (such as reading IndexedDB), we send a message
 * to the parent process and handle it there.
 *
 * This file is loaded as a frame script. It will be loaded once per tab that
 * is opened.
 */

/* global content addMessageListener removeMessageListener sendAsyncMessage */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const frameGlobal = {};
XPCOMUtils.defineLazyModuleGetter(
  frameGlobal, "AboutPages", "resource://pioneer-enrollment-study-content/AboutPages.jsm",
);

/**
 * Handles incoming events from the parent process and about:pioneer.
 * @implements nsIMessageListener
 * @implements EventListener
 */
class PioneerFrameListener {
  handleEvent(event) {
    // Abort if the current page isn't about:studies.
    if (!this.ensureTrustedOrigin()) {
      return;
    }

    // We waited until after we received an event to register message listeners
    // in order to save resources for tabs that don't ever load about:pioneer.
    addMessageListener("Pioneer:ShuttingDown", this);
    addMessageListener("Pioneer:ReceiveEnrollment", this);

    // eslint-disable-next-line default-case
    switch (event.detail.action) {
      // Actions that require the parent process
      case "Enroll":
        sendAsyncMessage("Pioneer:Enroll");
        break;
      case "GetEnrollment":
        sendAsyncMessage("Pioneer:GetEnrollment");
        break;
    }
  }

  /**
   * Check that the current webpage's origin is about:studies.
   * @return {Boolean}
   */
  ensureTrustedOrigin() {
    return content.document.documentURI.startsWith("about:pioneer");
  }

  /**
   * Handle messages from the parent process.
   * @param {Object} message
   *   See the nsIMessageListener docs.
   */
  receiveMessage(message) {
    switch (message.name) {
      case "Pioneer:ShuttingDown":
        this.onShutdown();
        break;
      case "Pioneer:ReceiveEnrollment":
        this.triggerPageCallback("ReceiveEnrollment", message.data.isEnrolled);
        break;
    }
  }

  /**
   * Trigger an event to communicate with the unprivileged about: page.
   * @param {String} type
   * @param {Object} detail
   */
  triggerPageCallback(type, detail) {
    // Do not communicate with untrusted pages.
    if (!this.ensureTrustedOrigin()) {
      return;
    }

    // Clone details and use the event class from the unprivileged context.
    const event = new content.document.defaultView.CustomEvent(type, {
      bubbles: true,
      detail: Cu.cloneInto(detail, content.document.defaultView),
    });
    content.document.dispatchEvent(event);
  }

  onShutdown() {
    removeMessageListener("Pioneer:ShuttingDown", this);
    removeEventListener("PioneerPageEvent", this);
  }
}

addEventListener("PioneerPageEvent", new PioneerFrameListener(), false, true);
