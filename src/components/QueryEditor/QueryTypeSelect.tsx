import React from 'react';
import { toTitleCase } from 'utils';
import { SelectableValue } from '@grafana/data';
import { FieldSelect } from './FieldSelect';
import { K6QueryType } from 'types';

const QUERY_TYPE_MAP: { [key in K6QueryType]: string } = {
  [K6QueryType.TEST_RUNS]: 'Test Runs',
  [K6QueryType.METRIC]: 'Metric',
  [K6QueryType.URLS]: 'URLs',
  [K6QueryType.CHECKS]: 'Checks',
  [K6QueryType.THRESHOLDS]: 'Thresholds',
};

const options: Array<SelectableValue<string>> = Object.entries(QUERY_TYPE_MAP).map(([key, value]) => ({
  label: toTitleCase(value),
  value: key,
}));

interface QueryTypeSelectProps {
  value: K6QueryType;
  onChange: (value: SelectableValue<string>) => void;
  width?: number;
}

export function QueryTypeSelect({ value, onChange, width = 6 }: QueryTypeSelectProps) {
  return <FieldSelect label="Query Type" options={options} value={String(value)} width={width} onChange={onChange} />;
}
