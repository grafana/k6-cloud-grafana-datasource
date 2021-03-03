import _ from 'lodash';

import {
  K6Metric,
  K6MetricType,
  K6MetricTypeName,
  K6QueryType,
  K6TestRunResultStatus,
  K6TestRunStatus,
  K6VariableQueryType,
} from './types';

export const getMetricFromMetricNameAndTags = (
  metricsList: K6Metric[],
  metricName: string,
  tags: Map<string, string> | undefined
) => {
  return _.find(_.filter(metricsList, { name: metricName }), (item) => {
    const tagMatches = _.map(_.pick(Object.fromEntries(tags || []), ['url', 'method', 'status']), (value, key) => {
      return item.tags instanceof Map && item.tags?.has(key) ? item.tags?.get(key) === value : false;
    });
    return tagMatches.length === 0 || _.every(tagMatches);
  });
};

export const getTypeFromVariableQueryEnum = (type: K6VariableQueryType) => {
  switch (type) {
    case K6VariableQueryType.ORGANIZATIONS:
      return 'organizations';
    case K6VariableQueryType.PROJECTS:
      return 'projects';
    case K6VariableQueryType.TESTS:
      return 'tests';
    default:
      return 'test runs';
  }
};

export const getRunStatusFromEnum = (status: K6TestRunStatus) => {
  switch (status) {
    case K6TestRunStatus.CREATED:
      return 'created';
    case K6TestRunStatus.VALIDATED:
      return 'validated';
    case K6TestRunStatus.QUEUED:
      return 'queued';
    case K6TestRunStatus.INITIALIZING:
      return 'initializing';
    case K6TestRunStatus.RUNNING:
      return 'running';
    case K6TestRunStatus.FINISHED:
      return 'finished';
    case K6TestRunStatus.TIMED_OUT:
      return 'timed out';
    case K6TestRunStatus.ABORTED_USER:
      return 'aborted (by user)';
    case K6TestRunStatus.ABORTED_SYSTEM:
      return 'aborted (by system)';
    case K6TestRunStatus.ABORTED_SCRIPT_ERROR:
      return 'aborted (by script error)';
    case K6TestRunStatus.ABORTED_THRESHOLD:
      return 'aborted (by threshold)';
    case K6TestRunStatus.ABORTED_LIMIT:
      return 'aborted (by limit)';
    default:
      return 'unknown';
  }
};

export const getResultStatusFromEnum = (status: K6TestRunResultStatus) => {
  switch (status) {
    case K6TestRunResultStatus.PASSED:
      return 'passed';
    case K6TestRunResultStatus.FAILED:
      return 'failed';
    default:
      return 'unknown';
  }
};

export const getEnumFromMetricType = (type: string) => {
  switch (type) {
    case 'counter':
      return K6MetricType.COUNTER;
    case 'gauge':
      return K6MetricType.GAUGE;
    case 'rate':
      return K6MetricType.RATE;
    default:
      return K6MetricType.TREND;
  }
};

export const getTypeFromMetricEnum = (type: K6MetricType): K6MetricTypeName => {
  switch (type) {
    case K6MetricType.COUNTER:
      return 'counter';
    case K6MetricType.GAUGE:
      return 'gauge';
    case K6MetricType.RATE:
      return 'rate';
    default:
      return 'trend';
  }
};

export const getTypeFromQueryTypeEnum = (type: K6QueryType) => {
  switch (type) {
    case K6QueryType.METRIC:
      return 'metrics';
    case K6QueryType.TEST_RUNS:
      return 'test runs';
    case K6QueryType.URLS:
      return 'urls';
    case K6QueryType.CHECKS:
      return 'checks';
    case K6QueryType.THRESHOLDS:
      return 'thresholds';
    default:
      return 'unknown';
  }
};

export const getUnitFromMetric = (metric: K6Metric, aggregation?: string) => {
  switch (metric.type) {
    case K6MetricType.COUNTER:
      if (_.includes(['data_received', 'data_sent'], metric.name)) {
        return aggregation === 'rps' ? 'bps' : 'bytes';
      }
      return aggregation === 'rps' ? 'rps' : '';
    case K6MetricType.TREND:
      return metric.contains === 'time' ? 'ms' : '';
    case K6MetricType.RATE:
      return '/s';
    case K6MetricType.GAUGE:
      if (_.includes(['vus', 'vus_max'], metric.name)) {
        return 'VUs';
      }
      return '';
    default:
      return '';
  }
};

export const reduceByObjectProp = <T, K extends keyof T>(listOfObjects: T[], propName: K): Array<T[K]> =>
  _.reduce<T, Array<T[K]>>(
    listOfObjects,
    function (a, i) {
      a.push(i[propName]);
      return a;
    },
    []
  );

export const toTitleCase = (s: string) => {
  return s.toLowerCase().replace(/\w\S*/g, function (t: string) {
    const i = t.indexOf('url');
    if (i === 0) {
      return t.substr(0, 3).toUpperCase() + t.substr(3).toLowerCase();
    }
    return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase();
  });
};

export function getMetricTypeEnumById(id: string, metricList: K6Metric[] = []): K6MetricType {
  return metricList.find((metric) => metric.id === id)?.type ?? K6MetricType.TREND;
}

export function getMetricTypeById(id: string, metricList: K6Metric[] = []): K6MetricTypeName {
  return getTypeFromMetricEnum(getMetricTypeEnumById(id, metricList));
}
