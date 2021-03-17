import React, { FC, useMemo } from 'react';
import { K6Test } from 'types';
import { SelectableValue } from '@grafana/data';
import { FieldSelect } from './FieldSelect';

interface TestSelectProps {
  tests: K6Test[];
  value: string;
  onChange: (value: SelectableValue<string>) => void;
  width?: number;
}

const TEST_VARIABLE = '$test';

export const TestSelect: FC<TestSelectProps> = ({ tests = [], value = '', onChange, width = 4 }) => {
  const options = useMemo(
    () => [
      { label: TEST_VARIABLE, value: TEST_VARIABLE },
      ...tests.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    ],
    [tests]
  );

  return (
    <FieldSelect label="Test" options={options} value={value} onChange={onChange} width={width} allowCustomValue />
  );
};
