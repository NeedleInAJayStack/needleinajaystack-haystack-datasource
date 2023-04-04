import { DataSourceInstanceSettings, CoreApp, ScopedVars, DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { Observable } from 'rxjs';

import { HaystackQuery, HaystackDataSourceOptions, DEFAULT_QUERY } from './types';

export class DataSource extends DataSourceWithBackend<HaystackQuery, HaystackDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<HaystackDataSourceOptions>) {
    super(instanceSettings);
  }

  applyTemplateVariables(query: HaystackQuery, scopedVars: ScopedVars): Record<string, any> {
    return {
      ...query,
      eval: getTemplateSrv().replace(query.eval, scopedVars),
      hisRead: getTemplateSrv().replace(query.hisRead, scopedVars),
      read: getTemplateSrv().replace(query.read, scopedVars),
    };
  }

  getDefaultQuery(_: CoreApp): Partial<HaystackQuery> {
    return DEFAULT_QUERY
  }
}
