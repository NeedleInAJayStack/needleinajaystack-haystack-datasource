import {
  DataSourceInstanceSettings,
  CoreApp,
  ScopedVars,
  DataQueryRequest,
  DataFrame,
  Field,
  MetricFindValue,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { HaystackQuery, HaystackDataSourceOptions, DEFAULT_QUERY, HaystackVariableQuery } from './types';

export class DataSource extends DataSourceWithBackend<HaystackQuery, HaystackDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<HaystackDataSourceOptions>) {
    super(instanceSettings);
  }

  applyTemplateVariables(query: HaystackQuery, scopedVars: ScopedVars): Record<string, any> {
    return {
      ...query,
      eval: getTemplateSrv().replace(query.eval, scopedVars, 'csv'),
      hisRead: getTemplateSrv().replace(query.hisRead, scopedVars, 'csv'),
      read: getTemplateSrv().replace(query.read, scopedVars, 'csv'),
    };
  }

  // This is called when the user is selecting a variable value
  async metricFindQuery(query: HaystackVariableQuery, options?: any) {
    let request: HaystackQuery = {
      refId: 'VariableQuery',
      type: 'Eval',
      eval: query.eval,
      hisRead: '',
      read: '',
    };
    let response = await this.query({ targets: [request] } as DataQueryRequest<HaystackQuery>).toPromise();

    if (response === undefined || response.data === undefined) {
      return [];
    }

    return response.data.reduce((acc: MetricFindValue[], frame: DataFrame) => {
      let field = frame.fields[0];
      if (query.column !== undefined && query.column !== '') {
        // If a column was input, match the column name
        field = frame.fields.find((field: Field) => field.name === query.column) ?? field;
      }

      let fieldVals = field.values.toArray().map((value) => {
        if (value.startsWith('@')) {
          // Detect ref using @ prefix, and adjust value to just the Ref
          let spaceIndex = value.indexOf(' ');
          let id = value.substring(0, spaceIndex);
          return { text: value, value: id };
        } else {
          // Otherwise, just use the value directly
          return { text: value, value: value };
        }
      });
      return acc.concat(fieldVals);
    }, []);
  }

  getDefaultQuery(_: CoreApp): Partial<HaystackQuery> {
    return DEFAULT_QUERY;
  }
}
