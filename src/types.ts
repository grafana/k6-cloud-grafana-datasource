import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface K6VariableQuery {
  qtype: K6VariableQueryType;
  query: string;
}

export enum K6VariableQueryType {
  ORGANIZATIONS,
  PROJECTS,
  TESTS,
  TEST_RUNS,
}

export interface K6CloudQuery extends DataQuery {
  qtype: K6QueryType;
  projectId: string;
  testId: string;
  testRunId: string;
  metric?: string;
  aggregation: string;
  tags?: Map<string, string>;
}

export enum K6QueryType {
  TEST_RUNS,
  METRIC,
  URLS,
  CHECKS,
  THRESHOLDS,
}

export const defaultQuery: Partial<K6CloudQuery> = {};

/**
 * These are options configured for each DataSource instance
 */
export interface K6CloudDataSourceOptions extends DataSourceJsonData {}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface K6CloudSecureJsonData {
  apiToken?: string;
}

export interface K6TestRunListItem {
  /*organizationId: number;
  organizationName: string;
  projectId: number;
  projectName: string;
  testId: number;
  testName: string;
  testCreated: Date;*/
  testRunId: number;
  testRunCreated: Date;
  testRunStarted: Date;
  testRunStartedEpoch: number;
  testRunEnded: Date;
  testRunEndedEpoch: number;
  testRunStatus: number;
  testRunResultStatus: number;
  testRunVUs: number;
  testRunDuration: number;
  testRunLoadTime: number;
}

export interface K6Organization {
  id: number;
  name: string;
}

export interface K6Project {
  id: number;
  name: string;
  organizationId: number;
  organizationName: string;
}

export interface K6Test {
  id: number;
  projectId: number;
  name: string;
  lastTestRunId?: number;
  created: Date;
}

export enum K6TestRunStatus {
  CREATED = -2,
  VALIDATED = -1,
  QUEUED = 0,
  INITIALIZING = 1,
  RUNNING = 2,
  FINISHED = 3,
  TIMED_OUT = 4,
  ABORTED_USER = 5,
  ABORTED_SYSTEM = 6,
  ABORTED_SCRIPT_ERROR = 7,
  ABORTED_THRESHOLD = 8,
  ABORTED_LIMIT = 9,
}

export enum K6TestRunResultStatus {
  PASSED = 0,
  FAILED = 1,
}

export interface K6TestRun {
  id: number;
  created: Date;
  started: Date;
  ended: Date;
  duration: number;
  vus: number;
  loadTime: number;
  rpsAvg: number;
  rpsMax: number;
  runStatus: K6TestRunStatus;
  resultStatus: K6TestRunResultStatus;
}

export enum K6MetricType {
  COUNTER,
  GAUGE,
  RATE,
  TREND,
}

export type K6MetricTypeName = 'counter' | 'gauge' | 'rate' | 'trend';

export interface K6Url {
  id: string;
  projectId: number;
  testRunId: number;
  groupId?: string;
  metrics?: K6Metric[];
  url: string;
  method: string;
  status: number;
  httpStatus: number;
  isWebSocket: boolean;
  count: number;
  loadTime: number;
  min: number;
  max: number;
  mean: number;
  stdev: number;
  p95: number;
  p99: number;
}

export interface K6Check {
  id: string;
  projectId: number;
  testRunId: number;
  groupId?: string;
  metrics?: K6Metric[];
  name: string;
  firstSeen: Date;
  success: boolean;
  successCount: number;
  totalCount: number;
}

export interface K6Threshold {
  id: string;
  testRunId: number;
  metricId: string;
  name: string;
  stat: string;
  calculatedValue: number;
  tainted: boolean;
  taintedAt?: Date;
  value: number;
}

export interface K6Metric {
  id: string;
  name: string;
  type: K6MetricType;
  contains: string;
  groupId?: string;
  urlId?: string;
  thresholdId?: string;
  checkId?: string;
  tags?: Map<string, string>;
}

export interface K6SeriesDataPoint {
  timestamp: string;
  value: number;
}

export interface K6Series {
  id: string;
  metricId: string;
  aggregation: string;
  values: K6SeriesDataPoint[];
}

export interface K6SeriesTag {
  id: number;
  key: string;
  value: string;
}
