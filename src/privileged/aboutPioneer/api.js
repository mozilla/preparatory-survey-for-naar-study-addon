/* global ExtensionAPI, XPCOMUtils, resProto, Cc, Ci, Cr, Cu */

"use strict";

XPCOMUtils.defineLazyModuleGetter(
  this,
  "AddonManager",
  "resource://gre/modules/AddonManager.jsm",
);

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

    const ENROLLMENT_STATE_STRING_PREF =
      "extensions.pioneer-participation-prompt_shield_mozilla_org.enrollmentState";

    function setEnrollmentState(state) {
      Services.prefs.setCharPref(
        ENROLLMENT_STATE_STRING_PREF,
        JSON.stringify(state),
      );
    }

    class MessageHandler {
      constructor(addonUrl) {
        this.addonUrl = addonUrl;
      }

      /**
       * Register listeners for messages from the content processes.
       */
      registerParentListeners() {
        Services.mm.addMessageListener("Pioneer:Enroll", this);
        Services.mm.addMessageListener("Pioneer:GetEnrollment", this);
      }

      /**
       * Unregister listeners for messages from the content process.
       */
      unregisterParentListeners() {
        Services.mm.removeMessageListener("Pioneer:Enroll", this);
        Services.mm.removeMessageListener("Pioneer:GetEnrollment", this);
      }

      /**
       * Dispatch messages from the content process to the appropriate handler.
       * @param {Object} message
       *   See the nsIMessageListener documentation for details about this object.
       */
      receiveMessage(message) {
        switch (message.name) {
          case "Pioneer:Enroll":
            this.enroll();
            break;
          case "Pioneer:GetEnrollment":
            this.getEnrollment(message.target);
            break;
        }
      }

      async getEnrollment(target) {
        const addon = await AddonManager.getAddonByID(
          "pioneer-opt-in@mozilla.org",
        );
        try {
          target.messageManager.sendAsyncMessage("Pioneer:ReceiveEnrollment", {
            isEnrolled: addon !== null,
          });
        } catch (err) {
          // The child process might be gone, so no need to throw here.
          Cu.reportError(err);
        }
      }

      async enroll() {
        const p = new Promise(async(resolve, reject) => {
          const install = await AddonManager.getInstallForURL(
            this.addonUrl,
            "application/x-xpinstall",
          );
          install.addListener({
            onInstallEnded: () => resolve(install.addon),
          });
          install.install();
        });

        await p;
        // TODO: studyUtils.telemetry({ event: "enrolled-via-study" });
        setEnrollmentState({
          stage: "enrolled",
          time: Date.now(),
        });
      }
    }
    let messageHandler;

    return {
      aboutPioneer: {
        enable: async function enable(addonUrl) {
          // Load scripts in content processes and tabs
          Services.ppmm.loadProcessScript(PROCESS_SCRIPT, true);
          Services.mm.loadFrameScript(FRAME_SCRIPT, true);

          // Register about: pages and their listeners
          AboutPages.aboutPioneer.register();
          messageHandler = new MessageHandler(addonUrl);
          messageHandler.registerParentListeners();
        },
        disable: async function disable() {
          // Stop loading process scripts and notify existing scripts to clean up.
          Services.ppmm.removeDelayedProcessScript(PROCESS_SCRIPT);
          Services.ppmm.broadcastAsyncMessage("Pioneer:ShuttingDown");
          Services.mm.removeDelayedFrameScript(FRAME_SCRIPT);
          Services.mm.broadcastAsyncMessage("Pioneer:ShuttingDown");

          // Clean up about pages
          messageHandler.unregisterParentListeners();
          AboutPages.aboutPioneer.unregister();
        },
      },
    };
  }
};
