import {
  DataSourceInstanceSettings,
  CoreApp,
  ScopedVars,
  DataQueryRequest,
  DataFrame,
  Field,
  MetricFindValue,
  Vector,
  getDefaultTimeRange,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { HaystackQuery, HaystackDataSourceOptions, DEFAULT_QUERY, HaystackVariableQuery, QueryType } from './types';

export const queryTypes: QueryType[] = [
  { label: 'Read', value: 'read', apiRequirements: ['read'], description: 'Read the records matched by a filter' },
  { label: 'HisRead', value: 'hisRead', apiRequirements: ['hisRead'], description: 'Read the history of a point' },
  { label: 'Eval', value: 'eval', apiRequirements: ['eval'], description: 'Evaluate an Axon expression' },
];

export class DataSource extends DataSourceWithBackend<HaystackQuery, HaystackDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<HaystackDataSourceOptions>) {
    super(instanceSettings);
  }

  // Queries the available ops from the datasource and returns the queryTypes that are supported.
  loadOps(refId: string): Promise<QueryType[]> {
    let opsRequest: DataQueryRequest<HaystackQuery> = {
      requestId: 'ops',
      dashboardId: 0,
      interval: '0',
      intervalMs: 0,
      panelId: 0,
      range: getDefaultTimeRange(),
      scopedVars: {},
      targets: [{ type: 'ops', eval: '', read: '', hisRead: '', refId: refId }],
      timezone: 'UTC',
      app: 'ops',
      startTime: 0,
    };
    return this.query(opsRequest)
      .toPromise()
      .then((result) => {
        if (result?.state === 'Error') {
          return [];
        }
        let frame = result?.data?.find((frame: DataFrame) => {
          return frame.refId === refId;
        });
        let opSymbols =
          frame?.fields?.find((field: Field<any, Vector<string>>) => {
            return field.name === 'def';
          }).values ?? [];
        let ops: string[] = opSymbols.map((opSymbol: string) => {
          if (opSymbol.startsWith('^op:')) {
            return opSymbol.substring(4);
          } else {
            return opSymbol;
          }
        });

        return queryTypes.filter((queryType) => {
          return queryType.apiRequirements.every((apiRequirement) => {
            return (
              ops.find((op) => {
                return op === apiRequirement;
              }) !== undefined
            );
          });
        });
      });
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
  async metricFindQuery(variableQuery: HaystackVariableQuery, options?: any) {
    let request: HaystackQuery = variableQuery.query;
    let response = await this.query({ targets: [request] } as DataQueryRequest<HaystackQuery>).toPromise();

    if (response === undefined || response.data === undefined) {
      return [];
    }

    return response.data.reduce((acc: MetricFindValue[], frame: DataFrame) => {
      let field = frame.fields[0];
      if (variableQuery.column !== undefined && variableQuery.column !== '') {
        // If a column was input, match the column name
        field = frame.fields.find((field: Field) => field.name === variableQuery.column) ?? field;
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
