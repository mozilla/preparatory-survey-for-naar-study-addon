/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Registers about: pages provided by Shield, and listens for a shutdown event
 * from the add-on before un-registering them.
 *
 * This file is loaded as a process script. It is executed once for each
 * process, including the parent one.
 */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://pioneer-participation-prompt-content/AboutPages.jsm");

class PioneerChildListener {
  onStartup() {
    Services.cpmm.addMessageListener("Pioneer:ShuttingDown", this, true);
    AboutPages.aboutPioneer.register();
  }

  onShutdown() {
    AboutPages.aboutPioneer.unregister();
    Services.cpmm.removeMessageListener("Pioneer:ShuttingDown", this);

    // Unload jsms in case the add-on is reinstalled and we need to
    // load a new version of it.
    Cu.unload("resource://pioneer-participation-prompt-content/AboutPages.jsm");
  }

  receiveMessage(message) {
    // eslint-disable-next-line default-case
    switch (message.name) {
      case "Pioneer:ShuttingDown":
        this.onShutdown();
        break;
    }
  }
}

// Only register in content processes; the parent process handles registration
// separately.
if (Services.appinfo.processType === Services.appinfo.PROCESS_TYPE_CONTENT) {
  const listener = new PioneerChildListener();
  listener.onStartup();
}
