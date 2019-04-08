/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Dispatches a page event to the privileged frame script for this tab.
 * @param {String} action
 * @param {Object} data
 */
function sendPageEvent(action, data) {
  const event = new CustomEvent("PioneerPageEvent", {
    bubbles: true,
    detail: { action, data },
  });
  document.dispatchEvent(event);
}

// Attempt to enroll when clicked.
const clickListener = {
  handleEvent(event) {
    if (event.target.matches(".enroll-button")) {
      sendPageEvent("Enroll");
      document.removeEventListener("click", this);

      const clickedButton = event.target;
      clickedButton.classList.add("enrolled");
      clickedButton.innerHTML =
        "You\u0027ve enrolled.<br>Welcome, intrepid Pioneer!";

      for (const button of document.querySelectorAll(
        ".enroll-button:not(.enrolled)",
      )) {
        button.remove();
      }
    }
  },
};
document.addEventListener("click", clickListener);

document.addEventListener("ReceiveEnrollment", event => {
  const isEnrolled = event.detail;
  if (isEnrolled) {
    document.removeEventListener("click", clickListener);
    for (const button of document.querySelectorAll(
      ".enroll-button:not(.enrolled)",
    )) {
      button.classList.add("enrolled");
      button.innerHTML = "You\u0027ve enrolled.<br>Welcome, intrepid Pioneer!";
    }
  }
});

sendPageEvent("GetEnrollment");
