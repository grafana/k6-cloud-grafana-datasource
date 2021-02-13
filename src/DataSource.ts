import _ from 'lodash';
import Keyv from 'keyv';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  dateTimeFormat,
  dateTimeParse,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

import {
  defaultQuery,
  K6Check,
  K6CloudDataSourceOptions,
  K6CloudQuery,
  K6Metric,
  K6Organization,
  K6Project,
  K6QueryType,
  K6Series,
  K6Test,
  K6TestRun,
  K6TestRunListItem,
  K6Threshold,
  K6Url,
  K6VariableQuery,
  K6VariableQueryType,
} from './types';
import {
  getEnumFromMetricType,
  getMetricFromMetricNameAndTags,
  getRunStatusFromEnum,
  getUnitFromMetric,
  reduceByObjectProp,
} from './utils';

const PERCENTILE_REGEX = new RegExp('p\\(([0-9.]+)\\)', 'i');
const VAR_QUERY_ID_REGEX = new RegExp('([0-9]+)(: (.+))?', 'i');

// TODO: make these dynamic based on test run status
const CACHE_TTL_ORGANIZATIONS = 60000;
const CACHE_TTL_PROJECTS = 60000;
const CACHE_TTL_TESTS = 60000;
const CACHE_TTL_TEST_RUNS = 60000;
const CACHE_TTL_METRICS = 60000;
const CACHE_TTL_URLS = 10000;
const CACHE_TTL_CHECKS = 10000;
const CACHE_TTL_THRESHOLDS = 10000;

export class DataSource extends DataSourceApi<K6CloudQuery, K6CloudDataSourceOptions> {
  url?: string;
  cache?: Keyv;

  constructor(instanceSettings: DataSourceInstanceSettings<K6CloudDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url;
    this.cache = new Keyv();
  }

  async query(options: DataQueryRequest<K6CloudQuery>): Promise<DataQueryResponse> {
    let data = { data: [] as MutableDataFrame[] };

    for (const target of options.targets) {
      if (target.hide) {
        continue;
      }
      const { refId, qtype, projectId, testId, testRunId, metric, aggregation, tags } = _.defaults(
        target,
        defaultQuery
      );

      // Resolve template variables.
      const resolvedOrgId = this.resolveVar('$organization');
      const resolvedProjectId = this.resolveVar(projectId);
      const resolvedTestId = this.resolveVar(testId);
      const resolvedTestRunId = this.resolveVar(testRunId);

      // Handle supported query types
      if (qtype === K6QueryType.TEST_RUNS) {
        if (resolvedOrgId && resolvedProjectId && resolvedTestId) {
          const testRuns = await this.getTestRunsForTest(resolvedTestId);
          const fields = this.convertTestRunsToFields(testRuns);
          data.data.push(
            new MutableDataFrame({
              refId: refId,
              fields: fields,
            })
          );
        }
      } else if (qtype === K6QueryType.CHECKS) {
        if (resolvedTestRunId) {
          const checksList = await this.getChecksForTestRun(resolvedTestRunId);
          const fields = this.convertChecksToFields(checksList);
          data.data.push(
            new MutableDataFrame({
              refId: refId,
              fields: fields,
            })
          );
        }
      } else if (qtype === K6QueryType.THRESHOLDS) {
        if (resolvedTestRunId) {
          const thresholdsList = await this.getThresholdsForTestRun(resolvedTestRunId);
          const fields = this.convertThresholdsToFields(thresholdsList);
          data.data.push(
            new MutableDataFrame({
              refId: refId,
              fields: fields,
            })
          );
        }
      } else if (qtype === K6QueryType.URLS) {
        if (resolvedTestRunId) {
          const urlsList = await this.getURLsForTestRun(resolvedTestRunId);
          const fields = this.convertURLsToFields(urlsList);
          data.data.push(
            new MutableDataFrame({
              refId: refId,
              fields: fields,
            })
          );
        }
      } else {
        if (
          resolvedTestRunId &&
          metric &&
          (tags === undefined || tags.size === 0 || _.indexOf(Array.from(tags.values()), '') === -1)
        ) {
          const metricsList = await this.getMetricsForTestRun(resolvedTestRunId);
          const metricObj = getMetricFromMetricNameAndTags(metricsList, metric, tags);
          const series = await this.getSeriesForMetric(resolvedTestRunId, metricObj!.id, aggregation, tags);
          const fields = this.convertSeriesToFields(series, metricObj!, tags, aggregation);
          data.data.push(
            new MutableDataFrame({
              refId: refId,
              fields: fields,
            })
          );
        }
      }
    }

    return data;
  }

  async metricFindQuery(query: K6VariableQuery) {
    const orgId = this.resolveVar('$organization');
    const projectId = this.resolveVar('$project');
    const testId = this.resolveVar('$test');

    // Retrieve DataQueryResponse based on query.
    if (query.qtype === K6VariableQueryType.ORGANIZATIONS) {
      const orgs = await this.getOrganizations();
      return orgs.map((o) => ({ text: `${o.id}: ${o.name}` }));
    } else if (query.qtype === K6VariableQueryType.PROJECTS && orgId) {
      const projects = await this.getProjectsForOrganization(orgId);
      return projects.map((p) => ({ text: `${p.id}: ${p.name}` }));
    } else if (query.qtype === K6VariableQueryType.TESTS && projectId) {
      const tests = await this.getTestsForProject(projectId);
      return tests.map((t) => ({ text: `${t.id}: ${t.name}` }));
    } else if (query.qtype === K6VariableQueryType.TEST_RUNS && testId) {
      const testRuns = await this.getTestRunsForTest(testId);
      return testRuns.map((r) => ({
        text: `${r.id}: ${dateTimeFormat(r.created, {
          defaultWithMS: false,
          format: 'YYYY-MM-DD HH:mm:ss',
        })} (${r.vus} VUs, ${r.duration}s)`,
      }));
    }

    return [];
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }

  convertTestRunsToFields(testRuns: K6TestRun[]) {
    let testRunsList: K6TestRunListItem[] = [];

    for (const r of testRuns) {
      let i: K6TestRunListItem = {
        testRunId: r.id,
        testRunCreated: r.created,
        testRunStarted: r.started,
        testRunStartedEpoch: dateTimeParse(r.started).unix() * 1000,
        testRunEnded: r.ended,
        testRunEndedEpoch: dateTimeParse(r.ended).unix() * 1000,
        testRunStatus: r.runStatus,
        testRunResultStatus: r.resultStatus,
        testRunVUs: r.vus,
        testRunDuration: r.duration,
        testRunLoadTime: r.loadTime,
      };
      testRunsList.push(i);
    }

    return [
      { name: 'Test Run ID', values: reduceByObjectProp(testRunsList, 'testRunId'), type: FieldType.number },
      {
        name: 'Test Run Created',
        values: reduceByObjectProp(testRunsList, 'testRunCreated'),
        type: FieldType.time,
      },
      {
        name: 'Test Run Started',
        values: reduceByObjectProp(testRunsList, 'testRunStarted'),
        type: FieldType.time,
      },
      {
        name: 'Test Run Started Epoch',
        values: reduceByObjectProp(testRunsList, 'testRunStartedEpoch'),
        type: FieldType.number,
      },
      {
        name: 'Test Run Ended',
        values: reduceByObjectProp(testRunsList, 'testRunEnded'),
        type: FieldType.time,
      },
      {
        name: 'Test Run Ended Epoch',
        values: reduceByObjectProp(testRunsList, 'testRunEndedEpoch'),
        type: FieldType.number,
      },
      {
        name: 'Test Run Status',
        values: _.map(reduceByObjectProp(testRunsList, 'testRunStatus'), getRunStatusFromEnum),
        type: FieldType.string,
      },
      {
        name: 'Test Run Result Status',
        values: reduceByObjectProp(testRunsList, 'testRunResultStatus'),
        type: FieldType.number,
      },
      {
        name: 'Test Run VUs',
        values: reduceByObjectProp(testRunsList, 'testRunVUs'),
        type: FieldType.number,
        config: { unit: 'VUs' },
      },
      {
        name: 'Test Run Duration',
        values: reduceByObjectProp(testRunsList, 'testRunDuration'),
        type: FieldType.number,
        config: { unit: 's' },
      },
      {
        name: 'Test Run Load Time',
        values: reduceByObjectProp(testRunsList, 'testRunLoadTime'),
        type: FieldType.number,
        config: { unit: 'ms' },
      },
    ];
  }

  convertChecksToFields(checksList: K6Check[]) {
    return [
      { name: 'ID', values: reduceByObjectProp(checksList, 'id'), type: FieldType.string },
      { name: 'Name', values: reduceByObjectProp(checksList, 'name'), type: FieldType.string },
      { name: 'Count', values: reduceByObjectProp(checksList, 'totalCount'), type: FieldType.number },
      { name: 'Successful', values: reduceByObjectProp(checksList, 'successCount'), type: FieldType.number },
      {
        name: 'Success rate',
        values: _.map(checksList, (c) => {
          return (c.successCount / c.totalCount) * 100.0;
        }),
        type: FieldType.number,
        config: { unit: '%' },
      },
    ];
  }

  convertThresholdsToFields(thresholdsList: K6Threshold[]) {
    return [
      { name: 'ID', values: reduceByObjectProp(thresholdsList, 'id'), type: FieldType.string },
      { name: 'Threshold', values: reduceByObjectProp(thresholdsList, 'name'), type: FieldType.string },
      {
        name: 'Metric value',
        values: reduceByObjectProp(thresholdsList, 'calculatedValue'),
        type: FieldType.number,
      },
      {
        name: 'Pass/Fail',
        values: _.map(thresholdsList, (t) => (t.tainted ? 1 : 0)),
        type: FieldType.number,
      },
    ];
  }

  convertURLsToFields(urlsList: K6Url[]) {
    return [
      { name: 'ID', values: reduceByObjectProp(urlsList, 'id'), type: FieldType.string },
      { name: 'URL', values: reduceByObjectProp(urlsList, 'url'), type: FieldType.string },
      { name: 'Method', values: reduceByObjectProp(urlsList, 'method'), type: FieldType.string },
      { name: 'Status', values: reduceByObjectProp(urlsList, 'status'), type: FieldType.number },
      { name: 'Count', values: reduceByObjectProp(urlsList, 'count'), type: FieldType.number },
      { name: 'Min', values: reduceByObjectProp(urlsList, 'min'), type: FieldType.number, config: { unit: 'ms' } },
      {
        name: 'Mean',
        values: reduceByObjectProp(urlsList, 'mean'),
        type: FieldType.number,
        config: { unit: 'ms' },
      },
      { name: 'P95', values: reduceByObjectProp(urlsList, 'p95'), type: FieldType.number, config: { unit: 'ms' } },
      { name: 'P99', values: reduceByObjectProp(urlsList, 'p99'), type: FieldType.number, config: { unit: 'ms' } },
      { name: 'Max', values: reduceByObjectProp(urlsList, 'max'), type: FieldType.number, config: { unit: 'ms' } },
    ];
  }

  convertSeriesToFields(series: K6Series, metric: K6Metric, tags?: Map<string, string>, aggregation?: string) {
    const timeValues = _.map(series.values, (d) => {
      return dateTimeParse(d.timestamp).unix() * 1000;
    });
    const values = _.map(series.values, (d) => {
      return d.value;
    });
    let valueName = metric!.name;
    let tagsList = '';
    if (tags) {
      tagsList = _.join(
        _.map(Object.fromEntries(tags), (value, key) => `${key}:${value}`),
        ', '
      );
      if (tagsList !== '') {
        valueName = `${valueName}<${tagsList}>`;
      }
    }
    if (aggregation) {
      let m = aggregation.match(PERCENTILE_REGEX);
      if (m?.length === 2) {
        let percentile = parseFloat(m[1]);
        valueName = `p(${percentile}, ${valueName})`;
      } else {
        valueName = `${aggregation}(${valueName})`;
      }
    }
    return [
      { name: 'Time', values: timeValues, type: FieldType.time },
      {
        name: valueName,
        values: values,
        type: FieldType.number,
        config: { unit: getUnitFromMetric(metric!, aggregation) },
      },
    ];
  }

  async getOrganizations() {
    const cacheKey = `getOrganizations`;
    let data: K6Organization[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/v3/organizations`,
          method: 'GET',
          requestId: 'k6-cloud-v3-organizations',
        })
        .then((response) => {
          return _.map(response.data.organizations, (org) => {
            return {
              id: Number(org.id),
              name: String(org.name),
            };
          });
        })
        .catch((error) => {
          console.log('ERROR (getProjects): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_ORGANIZATIONS);
    }
    return data;
  }

  async getProjectsForOrganization(organizationId: number) {
    const cacheKey = `getProjectsForOrganization(${organizationId})`;
    let data: K6Project[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/v3/organizations/${organizationId}/projects`,
          method: 'GET',
          requestId: `k6-cloud-v3-organizations-${organizationId}-projects`,
        })
        .then((response) => {
          return _.map(response.data.projects, (project) => {
            return {
              id: Number(project.id),
              name: String(project.name),
              organizationId: organizationId,
              organizationName: '',
            };
          });
        })
        .catch((error) => {
          console.log('ERROR (getProjectsForOrganization): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_PROJECTS);
    }
    return data;
  }

  async getAllProjects() {
    const srv = getBackendSrv();
    return srv
      .datasourceRequest({
        url: this.url + '/base' + '/v3/organizations',
        method: 'GET',
        requestId: 'k6-cloud-v3-organizations',
      })
      .then((response) => {
        return Promise.all(
          _.map(response.data.organizations, (org) => {
            return srv
              .datasourceRequest({
                url: `${this.url}/base/v3/organizations/${org.id}/projects`,
                method: 'GET',
                requestId: `k6-cloud-v3-organizations-${org.id}-projects`,
              })
              .then((response) => {
                return _.map(response.data.projects, (project) => {
                  return {
                    id: Number(project.id),
                    name: String(project.name),
                    organizationId: Number(org.id),
                    organizationName: String(org.name),
                  };
                });
              })
              .catch((error) => {
                console.log('ERROR (getAllProjects): ', error);
                return [];
              });
          })
        );
      })
      .catch((error) => {
        console.log('ERROR (getAllProjects): ', error);
        return [];
      });
  }

  async getTestsForProject(projectId: number) {
    const cacheKey = `getTestsForProject(${projectId})`;
    let data: K6Test[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/loadtests/v2/tests?project_id=${projectId}&page=1&page_size=25&order_by=-last_run_time`,
          method: 'GET',
          requestId: `k6-cloud-loadtests-v2-project-${projectId}`,
        })
        .then((response) => {
          return _.sortBy(
            _.map(response.data['k6-tests'], (t) => {
              return {
                id: Number(t.id),
                projectId: Number(t.project_id),
                name: String(t.name),
                lastTestRunId: t.last_test_run_id ? Number(t.last_test_run_id) : undefined,
                created: new Date(t.created),
              };
            }),
            ['-lastTestRunId', '-created']
          );
        })
        .catch((error) => {
          console.log('ERROR (getTestsForProject): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_TESTS);
    }
    return data;
  }

  async getTestRunsForTest(testId: number) {
    const cacheKey = `getTestRunsForTest(${testId})`;
    let data: K6TestRun[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/loadtests/v2/runs?page=1&page_size=50&test_id=${testId}&order_by=-started&exclude_events=true&method=0.95`,
          method: 'GET',
          requestId: `k6-cloud-loadtests-v2-runs-${testId}`,
        })
        .then((response) => {
          return _.sortBy(
            _.map(response.data['k6-runs'], (t) => {
              return {
                id: Number(t.id),
                created: new Date(t.created),
                started: new Date(t.started),
                ended: new Date(t.ended),
                duration: Number(t.duration),
                vus: Number(t.vus),
                loadTime: parseFloat(t.load_time),
                rpsAvg: parseFloat(t.rps_avg),
                rpsMax: parseFloat(t.rps_max),
                runStatus: Number(t.run_status),
                resultStatus: Number(t.result_status),
              };
            }),
            ['-created']
          );
        })
        .catch((error) => {
          console.log('ERROR (getTestRunsForTest): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_TEST_RUNS);
    }
    return data;
  }

  async getURLsForTestRun(testRunId: number) {
    const cacheKey = `getURLsForTestRun(${testRunId})`;
    let data: K6Url[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/loadtests/v3/urls?test_run_id=${testRunId}`,
          method: 'GET',
          requestId: `k6-cloud-loadtests-v3-urls-${testRunId}`,
        })
        .then((response) => {
          return _.map(response.data['k6-urls'], (u) => {
            return {
              id: String(u.id),
              projectId: Number(u.project_id),
              testRunId: Number(u.test_run_id),
              groupId: u.group_id ? String(u.group_id) : undefined,
              metrics: undefined,
              url: String(u.name),
              method: String(u.method),
              status: Number(u.status),
              httpStatus: Number(u.http_status),
              isWebSocket: !!u.is_web_socket,
              count: Number(u.count),
              loadTime: parseFloat(u.load_time),
              min: parseFloat(u.min),
              max: parseFloat(u.max),
              mean: parseFloat(u.mean),
              stdev: parseFloat(u.stdev),
              p95: parseFloat(u.p95),
              p99: parseFloat(u.p99),
            };
          });
        })
        .catch((error) => {
          console.log('ERROR (getURLsForTestRun): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_URLS);
    }
    return data;
  }

  async getChecksForTestRun(testRunId: number) {
    const cacheKey = `getChecksForTestRun(${testRunId})`;
    let data: K6Check[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/loadtests/v3/checks?test_run_id=${testRunId}`,
          method: 'GET',
          requestId: `k6-cloud-loadtests-v3-checks-${testRunId}`,
        })
        .then((response) => {
          return _.map(response.data['k6-checks'], (c) => {
            return {
              id: String(c.id),
              projectId: Number(c.project_id),
              testRunId: Number(c.test_run_id),
              groupId: c.group_id ? String(c.group_id) : undefined,
              metrics: undefined,
              name: String(c.name),
              firstSeen: new Date(c.first_seen),
              success: !!c.success,
              successCount: Number(c.success_count),
              totalCount: Number(c.total_count),
            };
          });
        })
        .catch((error) => {
          console.log('ERROR (getChecksForTestRun): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_CHECKS);
    }
    return data;
  }

  async getThresholdsForTestRun(testRunId: number) {
    const cacheKey = `getThresholdsForTestRun(${testRunId})`;
    let data: K6Threshold[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/loadtests/v2/thresholds?test_run_id=${testRunId}`,
          method: 'GET',
          requestId: `k6-cloud-loadtests-v2-thresholds-${testRunId}`,
        })
        .then((response) => {
          return _.map(response.data['k6-thresholds'], (t) => {
            return {
              id: String(t.id),
              testRunId: Number(t.test_run_id),
              metricId: String(t.metric_id),
              name: String(t.name),
              stat: String(t.stat),
              calculatedValue: parseFloat(t.calculated_value),
              tainted: !!t.tainted,
              taintedAt: t.tainted_at ? new Date(t.tainted_at) : undefined,
              value: parseFloat(t.value),
            };
          });
        })
        .catch((error) => {
          console.log('ERROR (getThresholdsForTestRun): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_THRESHOLDS);
    }
    return data;
  }

  async getMetricsForTestRun(testRunId: number) {
    const cacheKey = `getMetricsForTestRun(${testRunId})`;
    let data: K6Metric[] = await this.cache?.get(cacheKey);
    if (!data) {
      const srv = getBackendSrv();
      data = await srv
        .datasourceRequest({
          url: `${this.url}/base/loadtests/v2/metrics?test_run_id=${testRunId}`,
          method: 'GET',
          // Note: no "requestId" here as we want to support running several panel queries
          // in parallel which depends on resolving metric names to metric IDs for the k6 Cloud API.
        })
        .then((response) => {
          return _.map(response.data['k6-metrics'], (t) => {
            return {
              id: String(t.id),
              name: String(t.name),
              type: getEnumFromMetricType(String(t.type)),
              contains: String(t.contains),
              groupId: t.group_id ? String(t.group_id) : undefined,
              urlId: t.url_id ? String(t.url_id) : undefined,
              thresholdId: t.threshold_id ? String(t.threshold_id) : undefined,
              checkId: t.check_id ? String(t.check_id) : undefined,
              tags: _.isObject(t.tags) ? new Map<string, string>(_.toPairs(t.tags)) : undefined,
            };
          });
        })
        .catch((error) => {
          console.log('ERROR (getMetricsForTestRun): ', error);
          return [];
        });
      await this.cache?.set(cacheKey, data, CACHE_TTL_METRICS);
    }
    return data;
  }

  async getSeriesForMetric(testRunId: number, metricId: string, aggregation?: string, tags?: Map<string, string>) {
    aggregation = aggregation ? aggregation : 'avg';
    let m = aggregation.match(PERCENTILE_REGEX);
    if (m?.length === 2) {
      let percentile = parseFloat(m[1]);
      aggregation = `${percentile / 100.0}`;
    }
    let tagsQs = '';
    if (tags) {
      tagsQs = _.join(
        Array.from(tags, (value) => `${encodeURIComponent(value[0])}:${encodeURIComponent(value[1])}`),
        `&${encodeURIComponent('tags[]')}=`
      );
    }
    if (tagsQs) {
      tagsQs = `${encodeURIComponent('tags[]')}=${tagsQs}`;
    }
    return getBackendSrv()
      .datasourceRequest({
        url: `${this.url}/base/loadtests/v2/series?test_run_id=${testRunId}&ids%5B%5D=${metricId}&method=${aggregation}&${tagsQs}`,
        method: 'GET',
        requestId: `k6-cloud-loadtests-v2-series-${testRunId}-${metricId}`,
      })
      .then((response) => {
        const d = response.data['k6-serie'][0];
        return {
          id: String(d.id),
          metricId: String(d.metric_id),
          aggregation: String(d.method),
          values: _.map(d.values || [], (p) => ({ timestamp: p.timestamp, value: parseFloat(p.value) })),
        };
      })
      .catch((error) => {
        return {
          id: error,
          metricId: error,
          aggregation: '',
          values: [],
        };
      });
  }

  async getTagsForTestRun(testRunId: number) {
    return getBackendSrv()
      .datasourceRequest({
        url: `${this.url}/base/loadtests/v2/runs/${testRunId}/tags`,
        method: 'GET',
        requestId: `k6-cloud-loadtests-v2-runs-${testRunId}-tags`,
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log('ERROR (getTagsForTestRun): ', error);
        return [];
      });
  }

  async getTagValuesForTag(testRunId: number, tag: string) {
    return getBackendSrv()
      .datasourceRequest({
        url: `${this.url}/base/loadtests/v2/runs/${testRunId}/tag-values/${tag}`,
        method: 'GET',
        requestId: `k6-cloud-loadtests-v2-runs-${testRunId}-tag-values-${tag}`,
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log('ERROR (getTagValuesForTag): ', error);
        return [];
      });
  }

  resolveVar(target: string, defaultValue?: number) {
    const resolved = getTemplateSrv().replace(target)?.match(VAR_QUERY_ID_REGEX);
    return resolved ? Number(resolved[1]) : defaultValue;
  }
}
