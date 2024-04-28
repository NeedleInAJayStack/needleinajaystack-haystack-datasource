# Changelog

## 0.0.16
Upgrades to haystack v0.1.13 to loosen basic auth server requirements.

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
