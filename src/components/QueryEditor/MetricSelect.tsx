import React, { FC, useMemo } from 'react';
import { SelectableValue } from '@grafana/data';
import { FieldSelect } from './FieldSelect';

interface MetricSelectProps {
  metrics: string[];
  value?: string;
  onChange: (value: SelectableValue<string>) => void;
  width?: number;
}

export const MetricSelect: FC<MetricSelectProps> = ({ metrics = [], value = '', onChange, width = 4 }) => {
  const options = useMemo(
    () =>
      metrics.map((item) => ({
        label: item,
        value: item,
      })),
    [metrics]
  );

  return <FieldSelect label="Metric" options={options} value={value} onChange={onChange} width={width} />;
};
