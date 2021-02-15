import React, { FC, useMemo } from 'react';
import { SelectableValue } from '@grafana/data';
import { FieldSelect } from './FieldSelect';
import { K6MetricTypeName } from 'types';
import { AGGREGATION_TYPES, AggregationMethods } from './constants';

interface AggregationSelectProps {
  metric?: string;
  metricType: K6MetricTypeName;
  value: string;
  onChange: (value: SelectableValue<string>) => void;
  width?: number;
}

export const AggregationSelect: FC<AggregationSelectProps> = ({
  metric,
  metricType,
  value = '',
  onChange,
  width = 6,
}) => {
  const typeConfig = AGGREGATION_TYPES[metricType];

  const options = useMemo(() => {
    const isData = metric && ['data_received', 'data_sent'].includes(metric);
    const isVUs = metric && ['vus', 'vus_max'].includes(metric);

    return (typeConfig.methods as AggregationMethods).map((method) => {
      if (isData && ['count', 'rps'].includes(method)) {
        return {
          label: method === 'count' ? 'bytes' : 'bytes/s',
          value: method,
        };
      }

      if (isVUs) {
        return {
          label: 'VUs',
          value: method,
        };
      }

      return {
        label: method,
        value: method,
      };
    });
  }, [typeConfig, metric]);

  return (
    <FieldSelect
      label="Aggregation"
      options={options}
      value={value || typeConfig.default}
      onChange={onChange}
      width={width}
    />
  );
};
