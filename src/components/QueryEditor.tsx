import _ from 'lodash';
import React, { PureComponent } from 'react';

import { Icon, InlineFormLabel, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';

import { TagSelector } from './TagSelector';
import { DataSource } from '../DataSource';
import {
  K6CloudDataSourceOptions,
  K6CloudQuery,
  K6Metric,
  K6MetricType,
  K6Project,
  K6QueryType,
  K6SeriesTag,
  K6Test,
  K6TestRun,
} from '../types';
import { getMetricFromMetricNameAndTags, getTypeFromMetricEnum, getTypeFromQueryTypeEnum, toTitleCase } from '../utils';

import { QuerySelect } from './QuerySelect';

type Props = QueryEditorProps<DataSource, K6CloudQuery, K6CloudDataSourceOptions>;

type QueryEditorState = {
  projectList: K6Project[];
  currentProject: K6Project | null;
  testList: K6Test[];
  currentTest: K6Test | null;
  testRunList: K6TestRun[];
  currentTestRun: K6TestRun | null;
  metricsList: K6Metric[];
  metricNameList: string[];
  currentMetric: K6Metric | null;
  currentTags: K6SeriesTag[];
  tagsList: string[];
  tagsValues: Map<string, string[]>;
};

enum SelectFieldType {
  PROJECT,
  TESTS,
  TEST_RUNS,
}

enum FieldVariableName {
  PROJECT = '$project',
  TESTS = '$tests',
  TEST_RUNS = '$testruns',
}

const AGGREGATION_TYPES = {
  trend: {
    methods: ['avg', 'min', 'max', 'mean', 'median', 'std', 'p(75)', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'p(99.99)'],
    default: 'avg',
  },
  counter: {
    methods: ['count', 'rps'],
    default: 'count',
  },
  rate: {
    methods: ['rate'],
    default: 'rate',
  },
  gauge: {
    methods: ['value'],
    default: 'value',
  },
};

export class QueryEditor extends PureComponent<Props, QueryEditorState> {
  url?: string;
  lastTagId: number;
  state: QueryEditorState = {
    projectList: [],
    currentProject: null,
    testList: [],
    currentTest: null,
    testRunList: [],
    currentTestRun: null,
    metricsList: [],
    metricNameList: [],
    currentMetric: null,
    currentTags: [],
    tagsList: [],
    tagsValues: new Map<string, string[]>(),
  };

  constructor(props: Readonly<Props>) {
    super(props);
    this.url = props.datasource.url;
    this.lastTagId = 0;
  }

  async componentDidMount() {
    const { query, datasource } = this.props;

    query.qtype = query.qtype === null ? K6QueryType.METRIC : query.qtype;
    query.projectId = query.projectId || '';
    query.testId = query.testId || '';
    query.testRunId = query.testRunId || '';

    const resolvedProjectId = datasource.resolveVar(
      query.projectId,
      query.projectId ? Number(query.projectId) : undefined
    );
    const resolvedTestId = datasource.resolveVar(query.testId, query.testId ? Number(query.testId) : undefined);
    const resolvedTestRunId = datasource.resolveVar(
      query.testRunId,
      query.testRunId ? Number(query.testRunId) : undefined
    );

    const projectList = _.flatten(await datasource.getAllProjects());
    const current: any = _.find(projectList, { id: resolvedProjectId });
    this.setState({ projectList: projectList, currentProject: current });

    if (resolvedProjectId !== undefined) {
      const testList = await datasource.getTestsForProject(resolvedProjectId);
      this.setState({ testList: testList, currentTest: null });
    }
    if (resolvedTestId !== undefined) {
      const testRunList = await datasource.getTestRunsForTest(resolvedTestId);
      this.setState({ testRunList: testRunList, currentTestRun: null });
    }
    if (resolvedTestRunId !== undefined) {
      await this.initTestRun(resolvedTestRunId);
    }
  }

  async componentDidUpdate(prevProps: Props) {
    const { query, datasource } = this.props;

    const resolvedProjectId = datasource.resolveVar(
      query.projectId,
      query.projectId ? Number(query.projectId) : undefined
    );
    const resolvedTestId = datasource.resolveVar(query.testId, query.testId ? Number(query.testId) : undefined);
    const resolvedTestRunId = datasource.resolveVar(
      query.testRunId,
      query.testRunId ? Number(query.testRunId) : undefined
    );

    if (resolvedProjectId !== undefined && query.projectId !== prevProps.query.projectId) {
      const testList = await datasource.getTestsForProject(resolvedProjectId);
      this.setState({ testList: testList, currentTest: null });
    }
    if (resolvedTestId !== undefined && query.testId !== prevProps.query.testId) {
      const testRunList = await datasource.getTestRunsForTest(resolvedTestId);
      this.setState({ testRunList: testRunList, currentTestRun: null });
    }
    if (resolvedTestRunId !== undefined && query.testRunId !== prevProps.query.testRunId) {
      await this.initTestRun(resolvedTestRunId);
    }
  }

  async initTestRun(testRunId: number) {
    const { datasource, query } = this.props;
    const currentTestRun = _.head(_.filter(this.state.testRunList, { id: testRunId }))!;
    const metricsList = await datasource.getMetricsForTestRun(testRunId);
    const metricNameList: string[] = _.reduce(
      metricsList,
      function (result, metric) {
        if (!_.includes(result, metric.name)) {
          result.push(metric.name);
        }
        return result;
      },
      [] as string[]
    );
    const tagsList = await datasource.getTagsForTestRun(testRunId);
    const metric = getMetricFromMetricNameAndTags(metricsList, query.metric!, query.tags);
    this.setState({
      currentTestRun: currentTestRun,
      metricsList: metricsList,
      metricNameList: metricNameList,
      currentMetric: metric ? metric : null,
      tagsList: tagsList,
    });
    if (currentTestRun && currentTestRun.started && currentTestRun.ended) {
      getLocationSrv().update({
        partial: true,
        // For some reason we need to cast the `started` and `ended` props to Date here,
        // even though they're typed as Date, as the prototype seems to be missing `getTime()`.
        query: { from: new Date(currentTestRun.started).getTime(), to: new Date(currentTestRun.ended).getTime() },
      });
    }
  }

  onQueryTypeChange = (item: SelectableValue<string>) => {
    const { query, onRunQuery } = this.props;
    const qType = Number(item.value!);
    this.props.onChange({
      ...query,
      qtype: qType,
      projectId: '',
      testId: '',
      testRunId: '',
      metric: undefined,
    });
    if (qType !== K6QueryType.METRIC) {
      onRunQuery();
    }
  };

  onProjectChange = (item: SelectableValue<string>) => {
    this.props.onChange({
      ...this.props.query,
      projectId: item.value!,
      testId: '',
      testRunId: '',
      metric: undefined,
    });
  };

  onTestChange = (item: SelectableValue<string>) => {
    this.props.onChange({
      ...this.props.query,
      testId: item.value!,
      testRunId: '',
      metric: undefined,
    });
  };

  onTestRunChange = (item: SelectableValue<string>) => {
    this.props.onChange({
      ...this.props.query,
      testRunId: item.value!,
      metric: undefined,
    });
  };

  _getTagValuesForMetric(metricName: string, tagName: string, tagValues: string[], currentTags: K6SeriesTag[]) {
    const specialTags = ['url', 'method', 'status'];
    if (!_.includes(specialTags, tagName) || currentTags === []) {
      return tagValues;
    }
    return _.uniq(
      _.reduce(
        _.filter(this.state.metricsList, { name: metricName }),
        (result, value) => {
          const tagsObj = Object.fromEntries(value.tags || []);
          const currentTagsToCheck = _.reduce(
            currentTags,
            (result, value) => {
              if (_.includes(_.pull(specialTags, tagName), value.key)) {
                result.set(value.key, value.value);
              }
              return result;
            },
            new Map<string, string>()
          );
          const tagsToCheck = [...currentTagsToCheck.keys()];

          if (_.isEmpty(currentTagsToCheck)) {
            if (tagsObj[tagName]) {
              result.push(tagsObj[tagName]);
            }
          } else {
            const matched = _.every(
              _.reduce(
                tagsToCheck,
                (result, value) => {
                  if (
                    tagsObj[value] &&
                    currentTagsToCheck.has(value) &&
                    tagsObj[value] === currentTagsToCheck.get(value)
                  ) {
                    result.push(true);
                  } else {
                    result.push(false);
                  }
                  return result;
                },
                [] as boolean[]
              )
            );
            if (matched) {
              result.push(tagsObj[tagName]);
            }
          }

          return result;
        },
        [] as string[]
      )
    );
  }

  onMetricChange = (item: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    const metricName = item.value!;
    const metric = getMetricFromMetricNameAndTags(this.state.metricsList, metricName, query.tags);
    const metricType = this._metricIdToMetricType(metric!.id);
    const metricTypeAsStr = getTypeFromMetricEnum(metricType !== undefined ? metricType : K6MetricType.TREND);
    onChange({
      ...query,
      metric: metric?.name,
      aggregation: AGGREGATION_TYPES[metricTypeAsStr].default,
    });
    this.setState({
      currentMetric: metric ? metric : null,
    });
    onRunQuery();
  };

  onAggregationChange = (item: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({
      ...query,
      aggregation: item.value!,
    });
    onRunQuery();
  };

  _updateTags = (id: number, tags: Map<string, string>) => {
    const { onChange, query, onRunQuery } = this.props;

    let metric = getMetricFromMetricNameAndTags(this.state.metricsList, this.state.currentMetric!.name, tags);
    this.setState({
      currentMetric: metric ? metric : null,
    });

    onChange({
      ...query,
      metric: metric?.name,
      tags: tags,
    });
    onRunQuery();
  };

  onTagChange = (id: number, key: string | undefined, value: string | undefined) => {
    const { query, datasource } = this.props;

    const resolvedTestRunId = datasource.resolveVar(query.testRunId, Number(query.testRunId));

    let tag = _.find(this.state.currentTags, { id: id });
    if (tag && key) {
      tag.key = key;
      tag.value = '';
    }
    if (tag && value) {
      tag.value = value;
    }

    if (key) {
      if (!this.state.tagsValues.has(key)) {
        datasource.getTagValuesForTag(resolvedTestRunId!, key).then((tagValues) => {
          this.state.tagsValues.set(key, tagValues);
        });
      }
    }

    let tags = new Map<string, string>();
    this.state.currentTags.forEach((item) => tags.set(item.key, item.value));

    this._updateTags(id, tags);
  };

  onTagDelete = (id: number) => {
    let clone = _.clone(this.state.currentTags);
    clone.splice(_.findIndex(this.state.currentTags, { id: id }), 1);
    this.setState({ currentTags: clone });

    let tags = new Map<string, string>();
    clone.forEach((item) => tags.set(item.key, item.value));

    this._updateTags(id, tags);
  };

  onTagInsertClick = () => {
    let clone = _.clone(this.state.currentTags);
    clone.push({ id: this.lastTagId++, key: '', value: '' });
    this.setState({ currentTags: clone });
  };

  renderQueryTypeList() {
    const { query } = this.props;

    const options = _.map(
      _.filter(Object.keys(K6QueryType), (k) => !_.isNaN(Number(k))),
      (item) => {
        return {
          label: toTitleCase(getTypeFromQueryTypeEnum(Number(item) as K6QueryType)),
          value: item,
        };
      }
    );
    const current = options.find((item) => item.value === String(query.qtype));

    return (
      <div className="gf-form">
        <InlineFormLabel className="query-keyword" width={6}>
          Query Type
        </InlineFormLabel>
        <Select options={options} value={current} onChange={this.onQueryTypeChange} />
      </div>
    );
  }

  /**
   * Returns select data to be used with QuerySelect component
   * @param {[]}list
   * @param {string} queryValue
   * @param {string} fieldName
   * @param {function} valueCreator
   * @returns [SelectableValue<string>, SelectableValue<string>[]]
   */
  getSelectData<T = any>(
    list: T[],
    queryValue: string,
    fieldName: string,
    valueCreator: (item: T) => SelectableValue<string>
  ): [SelectableValue<string> | undefined, SelectableValue[]] {
    const fieldOptions = list.map(valueCreator);
    const options = [{ label: fieldName, value: fieldName }, ...fieldOptions];
    const current = options.find((item) => item.value === queryValue);

    return [current, options];
  }

  getSelectDataFor(fieldType: SelectFieldType) {
    const { query } = this.props;

    switch (fieldType) {
      case SelectFieldType.PROJECT:
        return this.getSelectData<K6Project>(
          this.state.projectList,
          String(query.projectId),
          FieldVariableName.PROJECT,
          (item) => ({
            label: `${item.organizationName} / ${item.name}`,
            value: String(item.id),
          })
        );
      default:
        return [];
    }
  }

  renderProjectList() {
    const [current, options] = this.getSelectDataFor(SelectFieldType.PROJECT);
    return (
      <QuerySelect label="Project" onChange={this.onProjectChange} options={options} value={current} allowCustomValue />
    );
  }

  renderTestList() {
    const { query } = this.props;
    const { testList } = this.state;
    const queryValue = String(query.testId);

    const [current, options] = this.getSelectData<K6Test>(testList, queryValue, '$test', (item) => ({
      label: item.name,
      value: String(item.id),
    }));

    return (
      <QuerySelect
        label="Test"
        onChange={this.onTestChange}
        options={options}
        value={current}
        width={4}
        allowCustomValue
      />
    );
  }

  renderTestRunList() {
    const { query } = this.props;
    const { testRunList } = this.state;
    const queryValue = String(query.testRunId);

    const [current, options] = this.getSelectData<K6TestRun>(testRunList, queryValue, '$testrun', (item) => ({
      label: `${item.created.toLocaleString()} (vus: ${item.vus}, duration: ${item.duration})`,
      value: String(item.id),
    }));

    return (
      <QuerySelect
        label="Test runs"
        onChange={this.onTestRunChange}
        options={options}
        value={current}
        allowCustomValue
      />
    );
  }

  _metricIdToMetricType(metricId: string) {
    return _.find(this.state.metricsList, { id: metricId })?.type;
  }

  renderMetricsList() {
    const { query } = this.props;
    const { metricNameList } = this.state;
    const options = metricNameList.map((item) => {
      return {
        label: item,
        value: item,
      };
    });

    const current = query.metric ? options.find((item) => item.value === query.metric) : undefined;

    return <QuerySelect label="Metric" onChange={this.onMetricChange} options={options} value={current} />;
  }

  renderAggregationList() {
    const { query } = this.props;
    const metric = this.state.currentMetric;
    let metricTypeDef = AGGREGATION_TYPES[getTypeFromMetricEnum(K6MetricType.TREND)].default;
    let options: Array<SelectableValue<string>> = [];
    if (metric) {
      const metricType = this._metricIdToMetricType(metric!.id);
      const metricTypeAsStr = getTypeFromMetricEnum(metricType !== undefined ? metricType : K6MetricType.TREND);
      metricTypeDef = AGGREGATION_TYPES[metricTypeAsStr].default;
      const aggTypesForMetricType = AGGREGATION_TYPES[metricTypeAsStr].methods;
      options = aggTypesForMetricType.map((item) => {
        let label = item;
        if (_.includes(['data_received', 'data_sent'], query.metric)) {
          if (label === 'count') {
            label = 'bytes';
          } else if (label === 'rps') {
            label = 'bytes/s';
          }
        } else if (_.includes(['vus', 'vus_max'], query.metric)) {
          label = 'VUs';
        }
        return {
          label: label,
          value: item,
        };
      });
    }

    const current = options.find(
      (item) => item.value === (query.aggregation !== '' ? query.aggregation : metricTypeDef)
    );

    return (
      <div className="gf-form">
        <InlineFormLabel className="query-keyword" width={6}>
          Aggregation
        </InlineFormLabel>
        <Select options={options} value={current} onChange={this.onAggregationChange} />
      </div>
    );
  }

  renderTagList() {
    const query = this.props.query;
    const tagKeys: string[] = this.state.tagsList;
    return _.map(this.state.currentTags, (item) => {
      let tagValues: string[] = [];
      if (this.state.tagsValues.has(item.key)) {
        tagValues = this._getTagValuesForMetric(
          query.metric!,
          item.key,
          this.state.tagsValues.get(item.key)!,
          this.state.currentTags
        );
      }
      return (
        <TagSelector
          tag={item}
          keys={tagKeys}
          values={tagValues}
          onChange={this.onTagChange}
          onDelete={this.onTagDelete}
        />
      );
    });
  }

  renderTagInsertButton() {
    return (
      <div className="gf-form" onClick={this.onTagInsertClick}>
        <a className="gf-form-label query-part">
          <Icon name="plus" />
        </a>
      </div>
    );
  }

  render() {
    const query = this.props.query;
    const { qtype, projectId, testId, testRunId, metric } = query;

    return (
      <div>
        <div className="gf-form-inline">
          {this.renderQueryTypeList()}
          {qtype !== K6QueryType.TEST_RUNS ? this.renderProjectList() : null}
          {qtype !== K6QueryType.TEST_RUNS && projectId !== '' ? this.renderTestList() : null}
          {qtype !== K6QueryType.TEST_RUNS && testId !== '' ? this.renderTestRunList() : null}
        </div>
        {qtype === K6QueryType.METRIC && testRunId !== '' ? (
          <div className="gf-form-inline">
            {testRunId !== '' ? this.renderMetricsList() : null}
            {metric ? this.renderAggregationList() : null}
          </div>
        ) : null}
        {qtype === K6QueryType.METRIC && testRunId !== '' && metric ? (
          <div>
            <div className="gf-form">
              <InlineFormLabel className="query-keyword" width={6}>
                Tags
              </InlineFormLabel>
            </div>
            {this.renderTagList()}
            <div className="gf-form">{this.renderTagInsertButton()}</div>
          </div>
        ) : null}
      </div>
    );
  }
}
