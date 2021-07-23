# k6 Cloud Grafana Data Source Plugin

[![CircleCI](https://circleci.com/gh/grafana/k6-cloud-grafana-datasource/tree/master.svg?style=svg)](https://circleci.com/gh/grafana/k6-cloud-grafana-datasource/tree/master)
[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22grafana-k6cloud-datasource%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/grafana-k6cloud-datasource)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22grafana-k6cloud-datasource%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/grafana-k6cloud-datasource)
[![License](https://img.shields.io/github/license/grafana/k6-cloud-grafana-datasource)](LICENSE)
[![Known Vulnerabilities](https://snyk.io/test/github/grafana/k6-cloud-grafana-datasource/badge.svg)](https://snyk.io/test/github/grafana/k6-cloud-grafana-datasource)
[![Maintainability](https://api.codeclimate.com/v1/badges/280a6029d9b8a329812c/maintainability)](https://codeclimate.com/github/grafana/k6-cloud-grafana-datasource/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/280a6029d9b8a329812c/test_coverage)](https://codeclimate.com/github/grafana/k6-cloud-grafana-datasource/test_coverage)

This Grafana data source plugin allows you to view your tests results stored in k6 Cloud in Grafana.

![k6 Cloud Test Run Result Dashboard](src/img/screenshot_test_run_result1.png)

## Prerequisites

- Docker Engine with docker-compose installed
- Node.js 14.x installed
- Yarn

## Getting started

The instructions below will get you set up with a Docker Compose based Grafana setup to quickly try the plugin. Instructions for installing the plugin with a self-hosted version of Grafana follows further down.

1. Install dependencies

```BASH
yarn install
```

2. Build plugin in production mode

```BASH
# Yarn
yarn build
```

3. Start Grafana with Docker Compose

```BASH
docker-compose up -d
```

4. Open Grafana in your browser: [http://localhost:3000/](http://localhost:3000/)
5. Install the k6 Cloud data source (search for `k6`): [http://localhost:3000/datasources](http://localhost:3000/datasources)
6. Configure the data source by entering your k6 Cloud API token ([found here](https://app.k6.io/account/api-token)): [http://localhost:3000/datasources/edit/1/](http://localhost:3000/datasources/edit/1/)
7. Visit the "Dashboards" tab and "import" the two dashboards that come with the data source plugin: [http://localhost:3000/datasources/edit/1/dashboards](http://localhost:3000/datasources/edit/1/dashboards)
8. Visit the test runs list dashboard to start using exploring your k6 Cloud account from Grafana: [http://localhost:3000/d/k6-cloud-test-runs/k6-cloud-test-runs-list](http://localhost:3000/d/k6-cloud-test-runs/k6-cloud-test-runs-list)

## Installation with self-hosted Grafana

If you're self-hosting a Grafana installation you can follow the steps below to get the plugin setup:

1. Install dependencies
```BASH
yarn install
```

2. Build plugin in production mode

```BASH
yarn build
```

3. Install plugin by copying the files from `./dist` to your Grafana plugin directory

```BASH
cp -r ./dist/* /your/grafana/plugin/directory/grafana-k6cloud-datasource/
```

**Linux**: By default, the Linux plugin location is: `/var/lib/grafana/plugins`

**macOS**: By default, the Mac plugin location is: `/usr/local/var/lib/grafana/plugins`

4. When building locally, make sure you have [configured your Grafana installation](https://grafana.com/docs/grafana/latest/administration/configuration/#allow_loading_unsigned_plugins) to allow unsigned plugins.

```INI
...
[plugins]
allow_loading_unsigned_plugins=grafana-k6cloud-datasource
```

5. Restart Grafana to allow it to discover the new plugin, on Linux:

```BASH
service grafana-server restart
```

on macOS:

```BASH
brew services restart grafana
```

## Learn more

- [k6 Cloud](https://k6.io/)
- [Grafana documentation](https://grafana.com/docs/)
