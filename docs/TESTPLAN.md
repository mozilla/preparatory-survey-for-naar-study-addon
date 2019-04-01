# Test plan for this add-on

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

* [Manual / QA TEST Instructions](#manual--qa-test-instructions)
  * [Preparations](#preparations)
  * [Install the add-on and enroll in the study](#install-the-add-on-and-enroll-in-the-study)
* [Expected User Experience / Functionality](#expected-user-experience--functionality)
  * [Surveys](#surveys)
  * [Do these tests (in addition to ordinary regression tests)](#do-these-tests-in-addition-to-ordinary-regression-tests)
  * [Design](#design)
  * [Note: checking "sent Telemetry is correct"](#note-checking-sent-telemetry-is-correct)
* [Debug](#debug)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Manual / QA TEST Instructions

### Preparations

* Download a Release version of Firefox

### Install the add-on and enroll in the study

* (Create profile: <https://developer.mozilla.org/Firefox/Multiple_profiles>, or via some other method)
* Navigate to _about:config_ and set the following preferences. (If a preference does not exist, create it be right-clicking in the white area and selecting New -> String)
* Set `shieldStudy.logLevel` to `info`. This permits shield-add-on log output in browser console.
* (If Pioneer study) Make sure that the [Firefox Pioneer Add-on](https://addons.mozilla.org/en-US/firefox/addon/firefox-pioneer/) is installed
* Set `extensions.pioneer-participation-prompt_shield_mozilla_org.test.variationName` to `kittens` (or any other study variation/branch to test specifically)
* Go to [this study's tracking bug](tbd: replace with your study's launch bug link in bugzilla) and install the latest add-on zip file
* (If you are installing an unsigned version of the add-on, you need to set `extensions.legacy.enabled` to `true` before installing the add-on)

## Expected User Experience / Functionality

### Eligibility

* Users are ineligible for the study if they already have the Pioneer add-on installed.

### User Flow

1. 5 minutes after installation, the user will be prompted to enroll in Pioneer.
2. If the user does not enroll, they will be prompted again 2 days after the first prompt.
3. If the user still does not enroll, the study will remove itself 1 day after the second prompt.

#### Notes

* If a user enrolls in Pioneer, either via the prompt or unprompted, they will no longer be prompted and the study will remove itself 1 day after they enrolled.
* The user may visit `about:pioneer` at any time and enroll in the program if the study is still installed. Once the user has enrolled, `about:pioneer` will not show enrollment buttons. If the study is removed, `about:pioneer` will cease to function.

### Treatment Branches

1. `popunder` - The user is not directly prompted; a tab with `about:pioneer` is opened in the current active window but is not focused.
2. `notification` - The user is shown a Heartbeat-style notification bar with a button that opens `about:pioneer` in a new tab.
3. `notificationAndPopunder` - A tab with `about:pioneer` is opened in the current active window but is not focused. In addition, a Heartbeat-style notification bar is shown that focuses the tab when clicked.
4. `notificationOldStudyPage` - The user is shown a Heartbeat-style notification bar with a button that opens the AMO-hosted Pioneer enrollment page.

### Surveys

This study fires a survey at the following endings:

* `individual-opt-out`
* `expired`

### Do these tests (in addition to ordinary regression tests)

**Enabling of permanent private browsing before study has begun**

* Enable permanent private browsing
* Install the add-on as per above
* Verify that the study does not run

**Enabling of permanent private browsing after study has begun**

* Install the add-on as per above
* Verify that the study runs
* Enable permanent private browsing
* Verify that the study ends upon the subsequent restart of the browser

**Private browsing mode test 1**

* Install the add-on as per above
* Verify that the study runs
* Verify that no information is recorded and sent when private browsing mode is active

**Not showing in `about:addons`**

* Install the add-on as per above
* Verify that the study runs
* Verify that the study does not show up in `about:addons` (note: only signed study add-ons are hidden)

**Cleans up preferences upon Normandy unenrollment**

* Set the branch preference to one of the validation branches
* Enroll a client using the Normandy staging server
* Verify that the study runs
* Verify that `places.frecency.firstBucketCutoff` has a non-default value
* Unenroll a client using the Normandy staging server
* Verify that `places.frecency.firstBucketCutoff` has been restored to use the default value

**Correct branches and weights**

* Make sure that the branches and weights in the add-on configuration ([../src/studySetup.js](../src/studySetup.js)) corresponds to the branch weights of the Experimenter entry. (Note that for practical reasons, the implementation uses 7 branches instead of the 5 defined study branches. The study branches that separate use different populations for training and validation corresponding to separate branches in the implementation)

### Design

Any UI in a Shield study should be consistent with standard Firefox design specifications. These standards can be found at [design.firefox.com](https://design.firefox.com/photon/welcome.html). Firefox logo specifications can be found [here](https://design.firefox.com/photon/visuals/product-identity-assets.html).

### Note: checking "sent Telemetry is correct"

* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) log output from the add-on.
* To inspect the (unencrypted) contents individual telemetry packets, set `shieldStudy.logLevel` to `all`. This permits debug-level shield-add-on log output in the browser console. Note that this will negatively affect the performance of Firefox.
* To see the actual (encrypted if Pioneer study) payloads, go to `about:telemetry` -> Click `current ping` -> Select `Archived ping data` -> Ping Type `pioneer-study` -> Choose a payload -> Raw Payload

See [TELEMETRY.md](./TELEMETRY.md) for more details on what pings are sent by this add-on.

## Testing Preferences

The following preferences can be set to customize the study behavior for testing purposes.

<dl>
  <dt><code>extensions.pioneer-participation-prompt.treatment</code></dt>
  <dd>The treatment to use. Set this to a value from the Treatment Branches section to force the add-on to show you that treatment. You must set this preference before installing the study (default: random).</dd>

  <dt><code>extensions.pioneer-participation-prompt.updateTimerInterval</code></dt>
  <dd>The interval for checking if the user should be prompted in minutes. (default: <code>43200</code>, 12 hours).</dd>

  <dt><code>extensions.pioneer-participation-prompt.firstPromptDelay</code></dt>
  <dd>The delay between installation and the first prompt being shown in milliseconds (default: <code>300000</code>, 5 minutes).</dd>

  <dt><code>extensions.pioneer-participation-prompt.secondPromptDelay</code></dt>
  <dd>The delay between the first prompt being shown and the second prompt being shown in milliseconds (default: <code>169200000</code>, or 47 hours).</dd>

  <dt><code>extensions.pioneer-participation-prompt.studyEndDelay</code></dt>
  <dd>The delay between the second prompt being shown and the study end in milliseconds (default: <code>86396400</code>, or 23 hours).</dd>

  <dt><code>extensions.pioneer-participation-prompt.studyEnrolledEndDelay</code></dt>
  <dd>The delay between enrollment and the study end in milliseconds (default: <code>86396400</code>, or 23 hours).</dd>
</dl>

Due to timer variations, for testing purposes it's recommended to set `updateTimerInterval` to `1` and the rest of the delays to `180000`. The timers are not exact and may vary by a few seconds/minutes before triggering.

## Debug

To debug installation and loading of the add-on:

* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) and log output from the add-on.
* Set `shieldStudy.logLevel` to `all`. This permits debug-level shield-add-on log output in the browser console.
