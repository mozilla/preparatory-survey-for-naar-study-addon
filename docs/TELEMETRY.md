# Telemetry sent by this add-on

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

* [Usual Firefox Telemetry is mostly unaffected](#usual-firefox-telemetry-is-mostly-unaffected)
* [Study-specific endings](#study-specific-endings)
* [`shield-study` pings (common to all shield-studies)](#shield-study-pings-common-to-all-shield-studies)
* [`shield-study-addon` pings, specific to THIS study.](#shield-study-addon-pings-specific-to-this-study)
* [Telemetry](#telemetry)
* [Example sequences](#example-sequences)
  * ['enter => accept-survey => exit'](#enter--accept-survey--exit)
  * ['enter => closed-notification-bar => exit'](#enter--closed-notification-bar--exit)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usual Firefox Telemetry is mostly unaffected

* No change: `main` and other pings are UNAFFECTED by this add-on, except that [shield-studies-addon-utils](https://github.com/mozilla/shield-studies-addon-utils) adds the add-on id as an active experiment in the telemetry environment.
* Respects telemetry preferences. If user has disabled telemetry, no telemetry will be sent.

## Study-specific endings

The STUDY SPECIFIC ENDINGS this study supports are:

* `accept-survey`
* `closed-notification-bar`
* `notification-already-shown` (Fires if the notification was ignored and the browser was restarted or the study add-on was reloaded/reinstalled)

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

## Example sequences

These are the `payload` fields from all pings in the `shield-study` and `shield-study-addon` buckets.

### 'enter => accept-survey => exit'

```
// common fields

branch        survey
study_name    preparatory-survey-for-naar@shield.mozilla.org
addon_version 1.0.0
version       3

2019-06-20T08:32:01.287Z shield-study
{
  "study_state": "enter"
}

2019-06-20T08:32:01.323Z shield-study
{
  "study_state": "installed"
}

2019-06-20T08:32:01.863Z shield-study-addon
{
  "attributes": {
    "event": "notification-shown"
  }
}

2019-06-20T08:32:23.804Z shield-study-addon
{
  "attributes": {
    "event": "accept-survey"
  }
}

2019-06-20T08:32:23.881Z shield-study
{
  "study_state": "ended-neutral",
  "study_state_fullname": "accept-survey"
}

2019-06-20T08:32:23.969Z shield-study
{
  "study_state": "exit"
}
```

### 'enter => closed-notification-bar => exit'

```
// common fields

branch        survey
study_name    preparatory-survey-for-naar@shield.mozilla.org
addon_version 1.0.0
version       3

2019-06-20T08:52:16.042Z shield-study
{
  "study_state": "enter"
}

2019-06-20T08:52:16.060Z shield-study
{
  "study_state": "installed"
}

2019-06-20T08:52:16.239Z shield-study-addon
{
  "attributes": {
    "event": "notification-shown"
  }
}

2019-06-20T08:52:23.079Z shield-study
{
  "study_state": "ended-neutral",
  "study_state_fullname": "closed-notification-bar"
}

2019-06-20T08:52:23.089Z shield-study-addon
{
  "attributes": {
    "event": "closed-notification-bar"
  }
}

2019-06-20T08:52:23.094Z shield-study
{
  "study_state": "exit"
}
```
