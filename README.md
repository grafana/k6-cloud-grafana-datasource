# Deprecation Notice
⚠️ This plugin is deprecated and will be no longer maintained in favor of [Grafana Cloud k6](https://grafana.com/products/cloud/k6/ ⚠️


# k6 Cloud Grafana Data Source Plugin

[![CircleCI](https://circleci.com/gh/grafana/k6-cloud-grafana-datasource/tree/master.svg?style=svg)](https://circleci.com/gh/grafana/k6-cloud-grafana-datasource/tree/master)
[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22grafana-k6cloud-datasource%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/grafana-k6cloud-datasource)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22grafana-k6cloud-datasource%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/grafana-k6cloud-datasource)
[![License](https://img.shields.io/github/license/grafana/k6-cloud-grafana-datasource)](LICENSE)
[![Known Vulnerabilities](https://snyk.io/test/github/grafana/k6-cloud-grafana-datasource/badge.svg)](https://snyk.io/test/github/grafana/k6-cloud-grafana-datasource)
[![Maintainability](https://api.codeclimate.com/v1/badges/280a6029d9b8a329812c/maintainability)](https://codeclimate.com/github/grafana/k6-cloud-grafana-datasource/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/280a6029d9b8a329812c/test_coverage)](https://codeclimate.com/github/grafana/k6-cloud-grafana-datasource/test_coverage)

This Grafana data source plugin allows you to view your tests results stored in k6 Cloud in Grafana.

![k6 Cloud Test Run Result Dashboard](https://storage.googleapis.com/integration-artifacts/grafana-k6cloud-datasource/img/screenshot_test_run_result1.png)

## Installation

This plugin requires Grafana 7.1.0 or newer as of version 0.1.0.

## Grafana Cloud

If you do not have a [Grafana Cloud](https://grafana.com/cloud) account, you can sign up for one [here](https://grafana.com/cloud/grafana).

1. Click on the `Install Now` button on the [K6 Cloud Data Source page on Grafana.com](https://grafana.com/plugins/grafana-k6cloud-datasource/?tab=installation). This will automatically add the plugin to your Grafana instance. It might take up to 30 seconds to install.

2. Login to your Hosted Grafana instance (go to your instances page in your profile): `https://grafana.com/orgs/<yourUserName>/instances/` and the K6 Cloud data source will be installed.

## Installing on a local Grafana instance

The plugin is installed using the Grafana CLI and instructions can be found on the [installation page](https://grafana.com/plugins/grafana-k6cloud-datasource/?tab=installation).

Restart your Grafana server after installing the plugin.

### Configure the data source

Accessed from the Grafana main menu, newly installed data sources can be added immediately within the Data Sources section.

Next, click the Add data source button in the upper right. The K6 Cloud data source will be available for selection in the Type select box.

Copy your K6 [Token](https://k6.io/docs/cloud/integrations/token) and paste into the `API Token` field. Click the `Save and Test`button to check that your Token is valid and that you have a connection to the K6 Cloud.

### Sample Dashboard

There are two sample dashboards included with the data source and they can be imported from the Dashboards tab (beside the Settings tab) in the Data Source config.

They can also be found in the GitHub repository in the [dashboards directory](https://github.com/grafana/k6-cloud-grafana-datasource/tree/master/src/dashboards).

## Contributing and local development

Instructions for building the plugin from source can be found at [Contributing](https://github.com/grafana/k6-cloud-grafana-datasource/blob/master/CONTRIBUTING.md).

## Learn more

- [k6 Cloud](https://k6.io/)
- [Grafana documentation](https://grafana.com/docs/)
