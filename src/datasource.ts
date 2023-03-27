import { DataSourceInstanceSettings, CoreApp } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';

import { HaystackQuery, HaystackDataSourceOptions, DEFAULT_QUERY } from './types';

export class DataSource extends DataSourceWithBackend<HaystackQuery, HaystackDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<HaystackDataSourceOptions>) {
    super(instanceSettings);
  }

  getDefaultQuery(_: CoreApp): Partial<HaystackQuery> {
    return DEFAULT_QUERY
  }
}
