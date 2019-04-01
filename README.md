# Pioneer Enrollment Study

[![CircleCI badge](https://img.shields.io/circleci/project/github/mozilla/pioneer-enrollment-study/master.svg?label=CircleCI)](https://circleci.com/gh/mozilla/pioneer-enrollment-study/)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/pioneer-enrollment-study/badge.svg)](https://coveralls.io/github/mozilla/pioneer-enrollment-study)

The purpose of this extension is to test various prompts for enrolling users in [Pioneer][].

[pioneer]: https://medium.com/firefox-context-graph/make-firefox-better-with-pioneer-10c82d0f9301

## Seeing the add-on in action

See [TESTPLAN.md](./docs/TESTPLAN.md) for more details on how to get the add-on installed and tested.

## Data Collected / Telemetry Pings

See [TELEMETRY.md](./docs/TELEMETRY.md) for more details on what pings are sent by this add-on.

## Analyzing data

Telemetry pings are loaded into S3 and re:dash. Sample query:

* [All pings](https://sql.telemetry.mozilla.org/queries/{#your-id}/source#table)

(OR, if Pioneer, use the below instead)

Telemetry pings are loaded into the encrypted Pioneer pipeline.

## Improving this add-on

See [DEV.md](./docs/DEV.md) for more details on how to work with this add-on as a developer.

## References

* [Experimenter](https://experimenter.services.mozilla.com/experiments/TODO/)
* [Bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=TODO)
