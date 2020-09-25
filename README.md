# k6 Cloud Grafana Data Source Plugin

[![CircleCI](https://circleci.com/gh/k6io/k6-cloud-grafana-datasource/tree/master.svg?style=svg)](https://circleci.com/gh/k6io/k6-cloud-grafana-datasource/tree/master)

Thi Grafana data source plugin allows you to view your tests results stored in k6 Cloud in Grafana.

![k6 Cloud Test Run Result Dashboard](src/img/screenshot_test_run_result1.png)

## Getting started
1. Install dependencies
```BASH
yarn install
```
2. Build plugin in production mode
```BASH
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

## Learn more
- [k6 Cloud](https://k6.io/)
- [Grafana documentation](https://grafana.com/docs/)
