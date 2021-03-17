import React, { FC, useMemo } from 'react';
import { K6TestRun } from 'types';
import { SelectableValue } from '@grafana/data';
import { FieldSelect } from './FieldSelect';

interface TestRunSelectProps {
  testRuns: K6TestRun[];
  value: string;
  onChange: (value: SelectableValue<string>) => void;
}

const TEST_RUN_VARIABLE = '$testrun';

export const TestRunSelect: FC<TestRunSelectProps> = ({ testRuns = [], value = '', onChange }) => {
  const options = useMemo(
    () => [
      { label: TEST_RUN_VARIABLE, value: TEST_RUN_VARIABLE },
      ...testRuns.map((item) => ({
        label: `${item.created.toLocaleString()} (vus: ${item.vus}, duration: ${item.duration})`,
        value: String(item.id),
      })),
    ],
    [testRuns]
  );

  return <FieldSelect label="Test Run" options={options} value={value} onChange={onChange} allowCustomValue />;
};
