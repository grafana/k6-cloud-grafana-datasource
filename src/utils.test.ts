import { K6Metric, K6MetricType, K6TestRunResultStatus, K6TestRunStatus, K6VariableQueryType } from './types';
import {
  getEnumFromMetricType,
  getMetricTypeById,
  getMetricTypeEnumById,
  getResultStatusFromEnum,
  getRunStatusFromEnum,
  getTypeFromMetricEnum,
  getTypeFromVariableQueryEnum,
  getUnitFromMetric,
  reduceByObjectProp,
  toTitleCase,
} from './utils';

describe('getTypeFromVariableQueryEnum', () => {
  [
    [K6VariableQueryType.ORGANIZATIONS, 'organizations'],
    [K6VariableQueryType.PROJECTS, 'projects'],
    [K6VariableQueryType.ORGANIZATIONS, 'organizations'],
    [K6VariableQueryType.TESTS, 'tests'],
    [K6VariableQueryType.TEST_RUNS, 'test runs'],
    ['__DEFAULT_RETURN__', 'test runs'],
  ].forEach(([type, expected]) =>
    test(`${type} => ${expected}`, () => {
      expect(getTypeFromVariableQueryEnum(type as K6VariableQueryType)).toBe(expected);
    })
  );
});

describe('getRunStatusFromEnum', () => {
  [
    [K6TestRunStatus.CREATED, 'created'],
    [K6TestRunStatus.VALIDATED, 'validated'],
    [K6TestRunStatus.QUEUED, 'queued'],
    [K6TestRunStatus.INITIALIZING, 'initializing'],
    [K6TestRunStatus.RUNNING, 'running'],
    [K6TestRunStatus.FINISHED, 'finished'],
    [K6TestRunStatus.TIMED_OUT, 'timed out'],
    [K6TestRunStatus.ABORTED_USER, 'aborted (by user)'],
    [K6TestRunStatus.ABORTED_SYSTEM, 'aborted (by system)'],
    [K6TestRunStatus.ABORTED_SCRIPT_ERROR, 'aborted (by script error)'],
    [K6TestRunStatus.ABORTED_THRESHOLD, 'aborted (by threshold)'],
    [K6TestRunStatus.ABORTED_LIMIT, 'aborted (by limit)'],
    ['__DEFAULT_RETURN__', 'unknown'],
  ].forEach(([status, expected]) =>
    test(`${status} => ${expected}`, () => {
      expect(getRunStatusFromEnum(status as K6TestRunStatus)).toBe(expected);
    })
  );
});

describe('getResultStatusFromEnum', () => {
  [
    [K6TestRunResultStatus.PASSED, 'passed'],
    [K6TestRunResultStatus.FAILED, 'failed'],
    ['__DEFAULT_RETURN__', 'unknown'],
  ].forEach(([status, expected]) =>
    test(`${status} => ${expected}`, () => {
      expect(getResultStatusFromEnum(status as K6TestRunResultStatus)).toBe(expected);
    })
  );
});

describe('getEnumFromMetricType', () => {
  [
    [K6MetricType.COUNTER, 'counter'],
    [K6MetricType.GAUGE, 'gauge'],
    [K6MetricType.RATE, 'rate'],
    [K6MetricType.TREND, '__DEFAULT_RETURN__'],
  ].forEach(([expected, type]) =>
    test(`${type} => ${expected}`, () => {
      expect(getEnumFromMetricType(type as string)).toBe(expected);
    })
  );
});

describe('getTypeFromMetricEnum', () => {
  [
    [K6MetricType.COUNTER, 'counter'],
    [K6MetricType.GAUGE, 'gauge'],
    [K6MetricType.RATE, 'rate'],
    ['__DEFAULT_RETURN__', 'trend'],
  ].forEach(([type, expected]) =>
    test(`${type} => ${expected}`, () => {
      expect(getTypeFromMetricEnum(type as K6MetricType)).toBe(expected);
    })
  );
});

describe('getUnitFromMetric', () => {
  function getMockMetric(type: K6MetricType, name: string = '__DEFAULT__', contains: string = '__DEFAULT__') {
    return ({ type, name, contains } as unknown) as K6Metric;
  }

  [
    // Counter
    [getMockMetric(K6MetricType.COUNTER, 'data_received'), 'rps', 'bps'],
    [getMockMetric(K6MetricType.COUNTER, 'data_received'), '__DEFAULT__', 'bytes'],
    [getMockMetric(K6MetricType.COUNTER, 'data_sent'), 'rps', 'bps'],
    [getMockMetric(K6MetricType.COUNTER, 'data_sent'), '__DEFAULT__', 'bytes'],
    [getMockMetric(K6MetricType.COUNTER), 'rps', 'rps'],
    [getMockMetric(K6MetricType.COUNTER), '__DEFAULT__', ''],
    // Trend
    [getMockMetric(K6MetricType.TREND, undefined, 'time'), '__DEFAULT__', 'ms'],
    [getMockMetric(K6MetricType.TREND), '__DEFAULT__', ''],
    // Rate
    [getMockMetric(K6MetricType.RATE), '__DEFAULT__', '/s'],
    // Gauge
    [getMockMetric(K6MetricType.GAUGE, 'vus'), '__DEFAULT__', 'VUs'],
    [getMockMetric(K6MetricType.GAUGE, 'vus_max'), '__DEFAULT__', 'VUs'],
    [getMockMetric(K6MetricType.GAUGE), '__DEFAULT__', ''],
    // Default
    [getMockMetric(('__DEFAULT__' as unknown) as K6MetricType, 'vus_max'), '__DEFAULT__', ''],
  ].forEach(([metric, aggregation, expected], index) => {
    test(`${index}:(${JSON.stringify(metric)}, ${aggregation})`, () => {
      expect(getUnitFromMetric(metric as K6Metric, aggregation as string)).toBe(expected);
    });
  });
});

describe('reduceByObjectProp', () => {
  const listOfObjects: { [key: string]: any }[] = [
    { foo: 1, bar: false, baz: 'Hello' },
    { foo: 2, bar: true, baz: 'World' },
    { foo: 3, bar: false, baz: 'this' },
    { foo: 4, bar: true, baz: 'is a' },
    { foo: 5, bar: false, baz: 'Test' },
  ];

  [
    ['foo', [1, 2, 3, 4, 5]],
    ['bar', [false, true, false, true, false]],
    ['baz', ['Hello', 'World', 'this', 'is a', 'Test']],
  ].forEach(([propName, expected]) =>
    expect(reduceByObjectProp(listOfObjects, propName as string)).toStrictEqual(expected)
  );
});

describe('toTitleCase', () => {
  [
    ['Testing', 'Testing'],
    ['testing', 'Testing'],
    ['testing-stuff', 'Testing-stuff'],
    ['testing_stuff', 'Testing_stuff'],
    ['TestingStuff', 'Testingstuff'],
    ['_TestingStuff', '_testingstuff'],
  ].forEach(([s, expected]) => test(`${s} => ${expected}`, () => expect(toTitleCase(s)).toBe(expected)));
});

describe('getMetricTypeEnumById', () => {
  function getMockMetric(type: K6MetricType, id: string) {
    return ({ type, id } as unknown) as K6Metric;
  }
  const metricList = [
    getMockMetric(K6MetricType.COUNTER, 'COUNTER:1'),
    getMockMetric(K6MetricType.TREND, 'TREND:2'),
    getMockMetric(K6MetricType.GAUGE, 'GAUGE:3'),
    getMockMetric(K6MetricType.RATE, 'RATE:4'),
  ];

  [
    ['COUNTER:1', K6MetricType.COUNTER],
    ['TREND:2', K6MetricType.TREND],
    ['GAUGE:3', K6MetricType.GAUGE],
    ['RATE:4', K6MetricType.RATE],
  ].forEach(([id, expected]) =>
    test(`${id} => ${expected}`, () => {
      expect(getMetricTypeEnumById(id as string, metricList)).toBe(expected);
    })
  );
});

describe('getMetricTypeById', () => {
  function getMockMetric(type: K6MetricType, id: string) {
    return ({ type, id } as unknown) as K6Metric;
  }
  const metricList = [
    getMockMetric(K6MetricType.COUNTER, 'COUNTER:1'),
    getMockMetric(K6MetricType.TREND, 'TREND:2'),
    getMockMetric(K6MetricType.GAUGE, 'GAUGE:3'),
    getMockMetric(K6MetricType.RATE, 'RATE:4'),
  ];
  [
    ['COUNTER:1', 'counter'],
    ['TREND:2', 'trend'],
    ['GAUGE:3', 'gauge'],
    ['RATE:4', 'rate'],
  ].forEach(([id, expected]) =>
    test(`${id} => ${expected}`, () => {
      expect(getMetricTypeById(id as string, metricList)).toBe(expected);
    })
  );
});
