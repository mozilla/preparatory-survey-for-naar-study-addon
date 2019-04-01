# Telemetry sent by this add-on

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

* [Usual Firefox Telemetry is mostly unaffected](#usual-firefox-telemetry-is-mostly-unaffected)
* [Study-specific endings](#study-specific-endings)
* [`shield-study` pings (common to all shield-studies)](#shield-study-pings-common-to-all-shield-studies)
* [`shield-study-addon` pings, specific to THIS study.](#shield-study-addon-pings-specific-to-this-study)
* [Example sequence for a 'voted => not sure' interaction](#example-sequence-for-a-voted--not-sure-interaction)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usual Firefox Telemetry is mostly unaffected

* No change: `main` and other pings are UNAFFECTED by this add-on, except that [shield-studies-addon-utils](https://github.com/mozilla/shield-studies-addon-utils) adds the add-on id as an active experiment in the telemetry environment.
* Respects telemetry preferences. If user has disabled telemetry, no telemetry will be sent.

## Study-specific endings

The STUDY SPECIFIC ENDINGS this study supports are:

* "voted",
* "notification-x"
* "window-or-fx-closed"

## `shield-study` pings (common to all shield-studies)

[shield-studies-addon-utils](https://github.com/mozilla/shield-studies-addon-utils) sends the usual packets.

## `shield-study-addon` pings, specific to THIS study.

## Telemetry

Along with standard Shield study pings from the [study utils][], pings are sent under the `shield-study-addon` type during the study when certain events happen. The pings are shaped like so:

```json
{
  "version": 3,
  "study_name": "pioneer-participation-prompt",
  "branch": "notificationOldStudyPage",
  "addon_version": "1.0.1",
  "shield_version": "4.0.0",
  "type": "shield-study-addon",
  "data": {
    "attributes": {
      "event": "enrolled"
    }
  },
  "testing": false
}
```

The `data.attributes.event` key contains an identifier for the type of event that was triggered:

[study utils]: https://github.com/mozilla/shield-studies-addon-utils/

### `prompted`

Sent when the user is prompted to enroll with a notification or popunder. Pings of this type contain an extra key, `promptType`, that describes which type of prompt triggered the event:

<dl>
  <dt><code>first-prompt</code></dt>
  <dd>The initial prompt soon after installation.</dd>
  <dt><code>second-prompt</code></dt>
  <dd>The second prompt shown if the user did not enroll after the first prompt.</dd>
</dl>

Example:

```json
{
  "version": 3,
  "study_name": "pioneer-participation-prompt",
  "branch": "notificationOldStudyPage",
  "addon_version": "1.0.1",
  "shield_version": "4.0.0",
  "type": "shield-study-addon",
  "data": {
    "attributes": {
      "event": "prompted",
      "promptType": "first-prompt"
    }
  },
  "testing": false
}
```

### `enrolled` / `enrolled-via-study`

Sent when the user enrolls in Pioneer. The `enrolled-via-study` event is sent only when the user enrolls from the `about:pioneer` page included in the study. The `enrolled` event is sent whenever the enrollment add-on is installed, even if it occurs outside of `about:pioneer`.

Note that this means that enrollments from `about:pioneer` result in **two events: both `enrolled` and `enrolled-via-study`**. Also note that **enrollments from the `notificationOldStudyPage` do not have an `enrolled-via-study` event**.

Example:

```json
{
  "version": 3,
  "study_name": "pioneer-participation-prompt",
  "branch": "notificationOldStudyPage",
  "addon_version": "1.0.1",
  "shield_version": "4.0.0",
  "type": "shield-study-addon",
  "data": {
    "attributes": {
      "event": "enrolled-via-study"
    }
  },
  "testing": false
}
```

### `engagedPrompt`

Sent when the user clicks the button on the Heartbeat-style prompts to either focus or open `about:pioneer`.

Example:

```json
{
  "version": 3,
  "study_name": "pioneer-participation-prompt",
  "branch": "notificationOldStudyPage",
  "addon_version": "1.0.1",
  "shield_version": "4.0.0",
  "type": "shield-study-addon",
  "data": {
    "attributes": {
      "event": "engagedPrompt"
    }
  },
  "testing": false
}
```

## Example sequence for a 'voted => not sure' interaction

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets.

```
// common fields

branch        up-to-expectations-1        // should describe Question text
study_name    57-perception-shield-study
addon_version 1.0.0
version       3

2017-10-09T14:16:18.042Z shield-study
{
  "study_state": "enter"
}

2017-10-09T14:16:18.055Z shield-study
{
  "study_state": "installed"
}

2017-10-09T14:16:18.066Z shield-study-addon
{
  "attributes": {
    "event": "prompted",
    "promptType": "notificationBox-strings-1"
  }
}

2017-10-09T16:29:44.109Z shield-study-addon
{
  "attributes": {
    "promptType": "notificationBox-strings-1",
    "event": "answered",
    "yesFirst": "1",
    "score": "0",
    "label": "not sure",
    "branch": "up-to-expectations-1",
    "message": "Is Firefox performing up to your expectations?"
  }
}

2017-10-09T16:29:44.188Z shield-study
{
  "study_state": "ended-neutral",
  "study_state_fullname": "voted"
}

2017-10-09T16:29:44.191Z shield-study
{
  "study_state": "exit"
}
```
