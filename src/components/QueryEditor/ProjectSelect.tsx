import { FieldSelect } from './FieldSelect';
import React, { useMemo } from 'react';
import { K6Project } from 'types';
import { SelectableValue } from '@grafana/data';

interface ProjectSelect {
  projects: K6Project[];
  value: string;
  onChange: (value: SelectableValue<string>) => void;
}

const PROJECT_VARIABLE = '$project';

export function ProjectSelect({ projects = [], value = '', onChange }: ProjectSelect) {
  const options: SelectableValue<string>[] = useMemo(() => {
    return [
      { label: PROJECT_VARIABLE, value: PROJECT_VARIABLE },
      ...projects.map((project: K6Project) => ({
        label: `${project.organizationName} / ${project.name}`,
        value: String(project.id),
      })),
    ];
  }, [projects]);

  return <FieldSelect label="Project" onChange={onChange} value={value} options={options} allowCustomValue />;
}
