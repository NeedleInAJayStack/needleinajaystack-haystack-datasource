import {
  DataSourceInstanceSettings,
  ScopedVars,
  DataQueryRequest,
  DataFrame,
  Field,
  getDefaultTimeRange,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { HaystackQuery, OpsQuery, HaystackDataSourceOptions, QueryType } from './types';
import { firstValueFrom } from 'rxjs';
import { HaystackVariableSupport } from 'HaystackVariableSupport';

export const queryTypes: QueryType[] = [
  { label: 'Eval', value: 'eval', apiRequirements: ['eval'], description: 'Evaluate an Axon expression' },
  { label: 'HisRead', value: 'hisRead', apiRequirements: ['hisRead'], description: 'Read the history of a point' },
  {
    label: 'HisRead via filter',
    value: 'hisReadFilter',
    apiRequirements: ['read', 'hisRead'],
    description: 'Read the history of points found using a filter',
  },
  { label: 'Read', value: 'read', apiRequirements: ['read'], description: 'Read the records matched by a filter' },
];

export class DataSource extends DataSourceWithBackend<HaystackQuery, HaystackDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<HaystackDataSourceOptions>) {
    super(instanceSettings);
    this.variables = new HaystackVariableSupport(this);
  }

  // Queries the available ops from the datasource and returns the queryTypes that are supported.
  async loadOps(refId: string): Promise<QueryType[]> {
    let opsRequest = this.opsRequest(refId);
    let stream = this.query(opsRequest);
    let result = await firstValueFrom(stream);
    if (result?.state === 'Error') {
      return [];
    }
    let frame = result?.data?.find((frame: DataFrame) => {
      return frame.refId === refId;
    });

    let ops: string[] = [];

    let defField = frame?.fields?.find((field: Field<[string]>) => {
      return field.name === 'def';
    });
    if (defField != null) {
      ops = defField.values.map((opSymbol: string) => {
        if (opSymbol.startsWith('^op:')) {
          return opSymbol.substring(4);
        } else {
          return opSymbol;
        }
      });
    } else {
      // Include back-support for old `ops` format, which uses "name", not "defs". Used by nhaystack
      let nameField = frame?.fields?.find((field: Field<[string]>) => {
        return field.name === 'name';
      });
      if (nameField != null) {
        ops = nameField.values;
      }
    }

    let availableQueryTypes = queryTypes.filter((queryType) => {
      return queryType.apiRequirements.every((apiRequirement) => {
        return (
          ops.find((op) => {
            return op === apiRequirement;
          }) !== undefined
        );
      });
    });

    return availableQueryTypes;
  }

  applyTemplateVariables(query: HaystackQuery, scopedVars: ScopedVars): HaystackQuery {
    return {
      ...query,
      eval: getTemplateSrv().replace(query.eval, scopedVars, 'csv'),
      hisRead: getTemplateSrv().replace(query.hisRead, scopedVars, 'csv'),
      hisReadFilter: getTemplateSrv().replace(query.hisReadFilter, scopedVars, 'csv'),
      read: getTemplateSrv().replace(query.read, scopedVars, 'csv'),
    };
  }

  // Returns a DataQueryRequest that gets the available ops from the datasource
  // This applies a bunch of defaults because it's not a time series query
  private opsRequest(refId: string): DataQueryRequest<HaystackQuery> {
    return {
      requestId: 'ops',
      dashboardUID: '0',
      interval: '0',
      intervalMs: 0,
      panelId: 0,
      range: getDefaultTimeRange(),
      scopedVars: {},
      targets: [new OpsQuery(refId)],
      timezone: 'UTC',
      app: 'ops',
      startTime: 0,
    };
  }
}
