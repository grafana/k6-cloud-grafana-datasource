# Contributing

Thank you for your interest in contributing to this repository. We are glad you want help us to improve the project and join our community. Feel free to [browse the open issues](https://github.com/grafana/k6-cloud-grafana-datasource/issues). For more details about how you can help, please take a look at [Grafana's Contributing Guide](https://github.com/grafana/grafana/blob/master/CONTRIBUTING.md).

## Developer Guide

This is a very basic guide on how to set up your local environment, make the desired changes and see the result with a fresh Grafana installation.

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
