# Changelog

## 0.0.24
- Fixes issue with variables populating. See [issue #46](https://github.com/NeedleInAJayStack/needleinajaystack-haystack-datasource/issues/46) and [PR #47](https://github.com/NeedleInAJayStack/needleinajaystack-haystack-datasource/pull/47)

## 0.0.23
- Uses [Grafana GitHub plugin actions](https://github.com/grafana/plugin-actions)

## 0.0.22
- Correctly sets minimum Grafana version to v11.0.0
- Fixes persistence issues with input queries
- Restores support for variable 'definition' display strings

## 0.0.21
- Documentation updates

## 0.0.20
- Removes 'Run' button from query editor
- Removes reliance on deprecated features
- Bumps dependences to latest versions

## 0.0.19
- Adds 'display column' support to variables
- Adds placeholders to variable column inputs to explain behavior

## 0.0.17
- Ref variables do not include id in display
- Variables use `id` column if unspecified

## 0.0.16
- Adds full nhaystack support with basic authentication
- Improves display name detection
- Changes default query type to `read` to better support non-Axon environments
- Loosens basic auth server header requirements

## 0.0.15
Fixes haystack v0.1.12 upgrade.

## 0.0.14
Upgrades to haystack v0.1.12 to add basic auth client support.

## 0.0.12
Sets Grafana field display name to column meta `ID` display name, if present.

## 0.0.11
Minor documentation updates

## 0.0.10

- Adds a `HisRead with Filter` query type that allows filtering and performing multiple hisReads in one step.
- Improves unit detection of historical data.
- Fixes HisRead legend and DataFrame name to reflect the name of the point.

## 0.0.9

Adds login/retry on a 403 response. This ensures that visualizations are still functional after long periods of
inactivity.

## 0.0.6

Initial release.
