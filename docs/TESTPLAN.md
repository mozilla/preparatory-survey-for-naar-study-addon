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

* Create profile: <https://developer.mozilla.org/Firefox/Multiple_profiles>, or use your main profile
* Have at least 3 self-installed extensions installed
* Have the `shieldStudy.logLevel` string pref created with `info` value. (This permits shield-add-on log output in browser console.)
* Go to [this study's tracking bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1561606)
* If the add-on to test is unsigned:
  * Use Dev Edition, Nightly or an Unbranded version of Firefox
  * Have the `extensions.legacy.enabled` boolean pref set to `true`.
  * Have the `xpinstall.signatures.required` boolean pref to `false`.
* If the add-on to test is signed using the testing certificate:
  * Have the `xpinstall.signatures.dev-root` boolean pref created with the `true` value.†
* Install the add-on zip/xpi file by clicking on it and allowing bugzilla.mozilla.org to install the add-on

† Remember to revert this afterwards if this is your main profile since you will only be able to install testing-signed add-ons while this is enabled.

## Expected User Experience / Functionality

The user will be shown a Heartbeat-styled notification bar:

<img width="1276" alt="reddit__the_front_page_of_the_internet" src="https://user-images.githubusercontent.com/793037/59619147-84910680-9132-11e9-9389-d54fdb748230.png">

The user have the ability to click "Take me to the questionnaire" or close the notification bar using the X on the right.

The questionnaire is created using Survey Gizmo. Example URLs:

* [Profile with 9 add-ons (only 6 are shown)](https://tinyurl.com/mozilla-naar-survey-test)
* [Profile with 3 add-ons](https://tinyurl.com/mozilla-naar-survey-test-3) 

Page 1 asks the user about installed extensions:

<img width="1183" alt="Firefox_Survey_-_Extensions" src="https://user-images.githubusercontent.com/793037/60376759-b56a1900-9a19-11e9-9828-c0f13d86cd6a.png">

Page 2 asks the user to rate the importance and satisfaction of answers given on page 1:

<img width="1183" alt="Firefox_Survey_-_Extensions" src="https://user-images.githubusercontent.com/793037/60376845-290c2600-9a1a-11e9-9560-b83f7c113064.png">

### Surveys

This study fires a survey at the following endings:

* `accept-survey`

### Do these tests (in addition to ordinary regression tests)

**Test the complete study add-on and survey flow**

* Have at least 3 self-installed extensions/add-ons installed
* Install the add-on as per above
* Verify that the study runs
* Verify that the Heartbeat-styled notification bar is displayed
* Click "Take me to the questionnaire"
* Verify that the study ends
* Verify that add-ons that were installed are listed in a random order in the survey
* Answer the questions on page 1 and 2 of the survey
* Verify that the survey behaves as expected of a survey

**User with more than 6 self-installed add-ons accepts the survey**

* Have more than 7 self-installed extensions/add-ons installed
* Install the add-on as per above
* Verify that the study runs
* Verify that the Heartbeat-styled notification bar is displayed
* Click "Take me to the questionnaire"
* Verify that the study ends
* Verify that at most 6 add-ons are listed in a random order in the survey

**User closes the notification**

* Install the add-on as per above
* Verify that the study runs
* Verify that the Heartbeat-styled notification bar is displayed
* Close the notification bar using the X on the right
* Verify that the study ends

**User ignores the notification for more than 1 day**

* Install the add-on as per above
* Verify that the study runs
* Verify that the Heartbeat-styled notification bar is displayed
* Verify that the study expires 1 day after the study started

**User ignores the notification and restarts the browser**

* Install the add-on as per above
* Verify that the study runs
* Verify that the Heartbeat-styled notification bar is displayed
* Restart the browser
* Verify that no Heartbeat-styled notification bar is displayed
* Verify that the study ends

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

* Open a private browsing window
* Install the add-on as per above
* Verify that the study runs
* Verify that the notification bar is not shown in the private browsing window

**Not showing in `about:addons`**

* Install the add-on as per above
* Verify that the study runs
* Verify that the study does not show up in `about:addons` (note: only signed study add-ons are hidden)

### Design

Any UI in a Shield study should be consistent with standard Firefox design specifications. These standards can be found at [design.firefox.com](https://design.firefox.com/). Firefox logo specifications can be found [here](https://design.firefox.com/photon/visuals/product-identity-assets.html).

### Note: checking "sent Telemetry is correct"

* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) log output from the add-on.
* To inspect the contents of individual telemetry packets, set `shieldStudy.logLevel` to `all`. This permits debug-level shield-add-on log output in the browser console.
* To see the actual payloads, go to `about:telemetry` -> Click `current ping` -> Select `Archived ping data` -> Ping Type `shield-study-addon` -> Choose a payload -> Raw Payload

See [TELEMETRY.md](./TELEMETRY.md) for more details on what pings are sent by this add-on.

## Debug

To debug installation and loading of the add-on:

* Open the Browser Console using Firefox's top menu at `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) and log output from the add-on.
* Set `shieldStudy.logLevel` to `all`. This permits debug-level shield-add-on log output in the browser console.
