# Telemetry sent by this add-on

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

* [Usual Firefox Telemetry is mostly unaffected](#usual-firefox-telemetry-is-mostly-unaffected)
* [Study-specific endings](#study-specific-endings)
* [`shield-study` pings (common to all shield-studies)](#shield-study-pings-common-to-all-shield-studies)
* [`shield-study-addon` pings, specific to THIS study.](#shield-study-addon-pings-specific-to-this-study)
* [Telemetry](#telemetry)
* [Example sequence for a 'enter => accept-survey => exit' interaction](#example-sequence-for-a-enter--accept-survey--exit-interaction)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usual Firefox Telemetry is mostly unaffected

* No change: `main` and other pings are UNAFFECTED by this add-on, except that [shield-studies-addon-utils](https://github.com/mozilla/shield-studies-addon-utils) adds the add-on id as an active experiment in the telemetry environment.
* Respects telemetry preferences. If user has disabled telemetry, no telemetry will be sent.

## Study-specific endings

The STUDY SPECIFIC ENDINGS this study supports are:

* `accept-survey`
* `closed-notification-bar`

## `shield-study` pings (common to all shield-studies)

[shield-studies-addon-utils](https://github.com/mozilla/shield-studies-addon-utils) sends the usual packets.

## `shield-study-addon` pings, specific to THIS study.

## Telemetry

Along with standard Shield study pings from the [study utils][], pings are sent under the `shield-study-addon` type during the study when certain events happen:

* `notification-shown` - when the notification bar is shown
* `accept-survey` - when "Take me to the questionnaire" is pressed
* `closed-notification-bar` - when the notification bar is closed

The following data is sent with this ping:

| name    | type   | description                                                               |
| ------- | ------ | ------------------------------------------------------------------------- |
| `event` | string | either `notification-shown`, `accept-survey` or `closed-notification-bar` |

## Example sequence for a 'enter => accept-survey => exit' interaction

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets.

TODO

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
