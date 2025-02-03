import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { HaystackQuery, HaystackDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, HaystackQuery, HaystackDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
