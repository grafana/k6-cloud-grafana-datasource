import _ from 'lodash';
import React, { PureComponent } from 'react';

import { Icon, InlineFormLabel } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';

import { TagSelector } from '../TagSelector';
import { DataSource } from 'DataSource';
import {
  K6CloudDataSourceOptions,
  K6CloudQuery,
  K6Metric,
  K6MetricType,
  K6MetricTypeName,
  K6Project,
  K6QueryType,
  K6SeriesTag,
  K6Test,
  K6TestRun,
} from 'types';
import { getMetricFromMetricNameAndTags, getMetricTypeById, getTypeFromMetricEnum } from 'utils';

import { AGGREGATION_TYPES } from './constants';
import { ProjectSelect } from './ProjectSelect';
import { QueryTypeSelect } from './QueryTypeSelect';
import { TestSelect } from './TestSelect';
import { TestRunSelect } from './TestRunSelect';
import { MetricSelect } from './MetricSelect';
import { AggregationSelect } from './AggregationSelect';

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
    const { datasource } = this.props;
    const [resolvedProjectId, resolvedTestId, resolvedTestRunId] = this.getResolvedFields();

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
    const { query } = this.props;
    const [resolvedProjectId, resolvedTestId, resolvedTestRunId] = this.getResolvedFields();

    if (resolvedProjectId !== undefined && query.projectId !== prevProps.query.projectId) {
      await this.fetchTestList(resolvedProjectId);
    }

    if (resolvedTestId !== undefined && query.testId !== prevProps.query.testId) {
      await this.fetchTestRun(resolvedTestId);
    }

    if (resolvedTestRunId !== undefined && query.testRunId !== prevProps.query.testRunId) {
      await this.initTestRun(resolvedTestRunId);
    }
  }

  getResolvedFields() {
    const { datasource, query } = this.props;
    const projectId = datasource.resolveVar(query.projectId, query.projectId ? Number(query.projectId) : undefined);
    const testId = datasource.resolveVar(query.testId, query.testId ? Number(query.testId) : undefined);
    const testRunId = datasource.resolveVar(query.testRunId, query.testRunId ? Number(query.testRunId) : undefined);

    return [projectId, testId, testRunId];
  }

  async fetchTestList(projectId: number) {
    const { datasource } = this.props;
    const testList = await datasource.getTestsForProject(projectId);
    this.setState({ testList, currentTest: null });
  }

  async fetchTestRun(testId: number) {
    const { datasource } = this.props;
    const testRunList = await datasource.getTestRunsForTest(testId);
    this.setState({ testRunList, currentTestRun: null });
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
    const { query, onRunQuery, onChange } = this.props;
    const qType = Number(item.value!);
    onChange({
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

  /**
   * @todo Condense/Split
   * @todo Naming
   * @param metricName
   * @param tagName
   * @param tagValues
   * @param currentTags
   */
  _getTagValuesForMetric(metricName: string, tagName: string, tagValues: string[], currentTags: K6SeriesTag[]) {
    const specialTags = ['url', 'method', 'status'];
    if (!specialTags.includes(tagName) || (currentTags && currentTags.length === 0)) {
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
    const { metricsList } = this.state;
    const metricName = item.value!;
    const metric = getMetricFromMetricNameAndTags(metricsList, metricName, query.tags);
    const metricType = this.currentMetricType;

    onChange({
      ...query,
      metric: metric?.name,
      aggregation: AGGREGATION_TYPES[metricType].default,
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

  get currentMetricType(): K6MetricTypeName {
    const { currentMetric: metric, metricsList = [] } = this.state;
    return metric ? getMetricTypeById(metric.id, metricsList) : getTypeFromMetricEnum(K6MetricType.TREND);
  }

  /**
   * @todo Move to its own component
   */
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

  render() {
    const query = this.props.query;
    const { qtype, projectId, testId, testRunId, metric, aggregation } = query;
    const { projectList, testList, testRunList, metricNameList } = this.state;

    const showProjectSelect = qtype !== K6QueryType.TEST_RUNS;
    const showTestSelect = showProjectSelect && projectId !== '';
    const showTestRunSelect = showTestSelect && testId !== '';
    const showMetricSelect = qtype === K6QueryType.METRIC && testRunId !== '';

    return (
      <div>
        <div className="gf-form-inline">
          <QueryTypeSelect value={qtype} onChange={this.onQueryTypeChange} />
          {showProjectSelect && (
            <ProjectSelect value={projectId} projects={projectList} onChange={this.onProjectChange} />
          )}
          {showTestSelect && <TestSelect tests={testList} value={testId} onChange={this.onTestChange} />}
          {showTestRunSelect && (
            <TestRunSelect testRuns={testRunList} value={testRunId} onChange={this.onTestRunChange} />
          )}
        </div>
        {showMetricSelect && (
          <div className="gf-form-inline">
            <MetricSelect metrics={metricNameList} value={metric} onChange={this.onMetricChange} />
            <AggregationSelect
              metric={metric}
              metricType={this.currentMetricType}
              value={aggregation}
              onChange={this.onAggregationChange}
            />
          </div>
        )}
        {qtype === K6QueryType.METRIC && testRunId !== '' && metric ? (
          <div>
            <div className="gf-form">
              <InlineFormLabel className="query-keyword" width={6}>
                Tags
              </InlineFormLabel>
            </div>
            {this.renderTagList()}
            <div className="gf-form">
              <div className="gf-form" onClick={this.onTagInsertClick}>
                <a className="gf-form-label query-part">
                  <Icon name="plus" />
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
