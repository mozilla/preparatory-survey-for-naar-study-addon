/* global ExtensionAPI, XPCOMUtils, resProto, Cc, Ci, Cr */

"use strict";

this.aboutPioneer = class extends ExtensionAPI {
  getAPI(context) {
    const { extension } = this;

    const { Services } = ChromeUtils.import(
      "resource://gre/modules/Services.jsm",
      {},
    );

    // Enable resource://pioneer-participation-prompt-content URLs
    const RESOURCE_HOST = "pioneer-participation-prompt-content";
    const RESOURCE_PATH = "privileged/aboutPioneer/content/";
    const resProto = Services.io
      .getProtocolHandler("resource")
      .QueryInterface(Ci.nsIResProtocolHandler);
    const uri = Services.io.newURI(RESOURCE_PATH, null, extension.rootURI);
    resProto.setSubstitutionWithFlags(
      RESOURCE_HOST,
      uri,
      resProto.ALLOW_CONTENT_ACCESS,
    );
    // TODO: Possibly run onShutdown or similar: resProto.setSubstitution(RESOURCE_HOST, null);

    const { AboutPages } = ChromeUtils.import(
      "resource://pioneer-participation-prompt-content/AboutPages.jsm",
      {},
    );

    // Due to bug 1051238 frame scripts are cached forever, so we can't update them
    // as a restartless add-on. The Math.random() is the work around for this.
    const PROCESS_SCRIPT = `resource://pioneer-participation-prompt-content/process-script.js?${Math.random()}`;
    const FRAME_SCRIPT = `resource://pioneer-participation-prompt-content/frame-script.js?${Math.random()}`;

    return {
      aboutPioneer: {
        enable: async function enable() {
          // Load scripts in content processes and tabs
          Services.ppmm.loadProcessScript(PROCESS_SCRIPT, true);
          Services.mm.loadFrameScript(FRAME_SCRIPT, true);

          // Register about: pages and their listeners
          AboutPages.aboutPioneer.register();
          AboutPages.aboutPioneer.registerParentListeners();
        },
        disable: async function disable() {
          // Stop loading process scripts and notify existing scripts to clean up.
          Services.ppmm.removeDelayedProcessScript(PROCESS_SCRIPT);
          Services.ppmm.broadcastAsyncMessage("Pioneer:ShuttingDown");
          Services.mm.removeDelayedFrameScript(FRAME_SCRIPT);
          Services.mm.broadcastAsyncMessage("Pioneer:ShuttingDown");

          // Clean up about pages
          AboutPages.aboutPioneer.unregisterParentListeners();
          AboutPages.aboutPioneer.unregister();
        },
      },
    };
  }
};
