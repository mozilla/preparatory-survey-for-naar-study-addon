# Preparatory Survey for NAAR Study Add-on

[![CircleCI badge](https://img.shields.io/circleci/project/github/mozilla/preparatory-survey-for-naar-study-addon/master.svg?label=CircleCI)](https://circleci.com/gh/mozilla/preparatory-survey-for-naar-study-addon/)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/preparatory-survey-for-naar-study-addon/badge.svg)](https://coveralls.io/github/mozilla/preparatory-survey-for-naar-study-addon)

The purpose of this extension is to prompt users to participate in [the preparatory survey for NAAR](https://experimenter.services.mozilla.com/experiments/preparatory-survey-for-naar-needs-aware-add-on-recommendations/).

Shipped as a study add-on since the survey requires metadata about some of the add-ons that the user has installed.

## Seeing the add-on in action

See [TESTPLAN.md](./docs/TESTPLAN.md) for more details on how to get the add-on installed and tested.

## Data Collected / Telemetry Pings

See [TELEMETRY.md](./docs/TELEMETRY.md) for more details on what pings are sent by this add-on.

## Analyzing data

Telemetry pings are loaded into S3 and re:dash. Sample query:

* [All pings](https://sql.telemetry.mozilla.org/queries/{#your-id}/source#table)

## Improving this add-on

See [DEV.md](./docs/DEV.md) for more details on how to work with this add-on as a developer.

## References

* [Experimenter](https://experimenter.services.mozilla.com/experiments/preparatory-survey-for-naar-needs-aware-add-on-recommendations/)
