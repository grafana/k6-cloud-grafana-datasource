import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { VariableQueryEditor } from './components/VariableQueryEditor';
import { K6CloudDataSourceOptions, K6CloudQuery } from './types';

export const plugin = new DataSourcePlugin<DataSource, K6CloudQuery, K6CloudDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor);
