# Pioneer Enrollment Study
The purpose of this extension is to test various prompts for enrolling users in [Pioneer][].

[Pioneer]: https://medium.com/firefox-context-graph/make-firefox-better-with-pioneer-10c82d0f9301

## Eligibility
- Users are ineligible for the study if they already have the Pioneer add-on installed.

## User Flow
1. 5 minutes after installation, the user will be prompted to enroll in Pioneer.
2. If the user does not enroll, they will be prompted again 2 days after the first prompt.
3. If the user still does not enroll, the study will remove itself 1 day after the second prompt.

### Notes
- If a user enrolls in Pioneer, either via the prompt or unprompted, they will no longer be prompted and the study will remove itself 1 day after they enrolled.
- The user may visit `about:pioneer` at any time and enroll in the program if the study is still installed. Once the user has enrolled, `about:pioneer` will not show enrollment buttons. If the study is removed, `about:pioneer` will cease to function.

## Treatment Branches
1. `popunder` - The user is not directly prompted; a tab with `about:pioneer` is opened in the current active window but is not focused.
2. `notification` - The user is shown a Heartbeat-style notification bar with a button that opens `about:pioneer` in a new tab.
3. `notificationAndPopunder` - A tab with `about:pioneer` is opened in the current active window but is not focused. In addition, a Heartbeat-style notification bar is shown that focuses the tab when clicked.
4. `notificationOldStudyPage` - The user is shown a Heartbeat-style notification bar with a button that opens the AMO-hosted Pioneer enrollment page.

## Testing Preferences
The following preferences can be set to customize the study behavior for testing purposes.

<dl>
  <dt><code>extensions.pioneer-enrollment-study.treatment</code></dt>
  <dd>The treatment to use. Set this to a value from the Treatment Branches section to force the add-on to show you that treatment. You must set this preference before installing the study (default: random).</dd>

  <dt><code>extensions.pioneer-enrollment-study.updateTimerInterval</code></dt>
  <dd>The interval for checking if the user should be prompted in minutes. (default: <code>43200</code>, 12 hours).</dd>

  <dt><code>extensions.pioneer-enrollment-study.firstPromptDelay</code></dt>
  <dd>The delay between installation and the first prompt being shown in milliseconds (default: <code>300000</code>, 5 minutes).</dd>

  <dt><code>extensions.pioneer-enrollment-study.secondPromptDelay</code></dt>
  <dd>The delay between the first prompt being shown and the second prompt being shown in milliseconds (default: <code>169200000</code>, or 47 hours).</dd>

  <dt><code>extensions.pioneer-enrollment-study.studyEndDelay</code></dt>
  <dd>The delay between the second prompt being shown and the study end in milliseconds (default: <code>86396400</code>, or 23 hours).</dd>

  <dt><code>extensions.pioneer-enrollment-study.studyEnrolledEndDelay</code></dt>
  <dd>The delay between enrollment and the study end in milliseconds (default: <code>86396400</code>, or 23 hours).</dd>
</dl>

Due to timer variations, for testing purposes it's recommended to set `updateTimerInterval` to `1` and the rest of the delays to `180000`. The timers are not exact and may vary by a few seconds/minutes before triggering.

## Telemetry
Along with standard Shield study pings from the [study utils][], pings are sent under the `shield-study-addon` type during the study when certain events happen. The pings are shaped like so:

```json
{
  "version": 3,
  "study_name": "pioneer-enrollment-study",
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
  "study_name": "pioneer-enrollment-study",
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

Note that this means that enrollments from `about:pioneer` result in __two events: both `enrolled` and `enrolled-via-study`__. Also note that __enrollments from the `notificationOldStudyPage` do not have an `enrolled-via-study` event__.

Example:

```json
{
  "version": 3,
  "study_name": "pioneer-enrollment-study",
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
  "study_name": "pioneer-enrollment-study",
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
