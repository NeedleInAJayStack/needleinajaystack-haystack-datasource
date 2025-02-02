import {
  DataSourceInstanceSettings,
  ScopedVars,
  DataQueryRequest,
  DataFrame,
  Field,
  MetricFindValue,
  getDefaultTimeRange,
  FieldType,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { HaystackQuery, OpsQuery, HaystackDataSourceOptions, HaystackVariableQuery, QueryType } from './types';
import { firstValueFrom } from 'rxjs';
import { isRef, parseRef } from 'haystack';

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

  // This is called when the user is selecting a variable value
  async metricFindQuery(variableQuery: HaystackVariableQuery, options?: any) {
    let request: HaystackQuery = variableQuery;
    let observable = this.query({ targets: [request] } as DataQueryRequest<HaystackQuery>);
    let response = await firstValueFrom(observable);

    if (response === undefined || response.data === undefined) {
      return [];
    }

    return response.data.reduce((acc: MetricFindValue[], frame: DataFrame) => {
      // Default to the first field
      let column = frame.fields[0];
      if (variableQuery.column !== undefined && variableQuery.column !== '') {
        // If a column was input, match the column name
        column = frame.fields.find((field: Field) => field.name === variableQuery.column) ?? column;
      } else if (frame.fields.some((field: Field) => field.name === 'id')) {
        // If there is an id column, use that
        column = frame.fields.find((field: Field) => field.name === 'id') ?? column;
      }

      // Default to the selected column
      let displayColumn = column;
      if (variableQuery.displayColumn !== undefined && variableQuery.displayColumn !== '') {
        // If a column was input, match the column name
        displayColumn =
          frame.fields.find((field: Field) => field.name === variableQuery.displayColumn) ?? displayColumn;
      }

      let variableValues = column.values.map((value, index) => {
        let variableValue = variableValueFromCell(value, column.type);

        let displayValue = displayColumn.values[index];
        let variableText = variableTextFromCell(displayValue, displayColumn.type);

        return { text: variableText, value: variableValue };
      });

      return acc.concat(variableValues);
    }, []);
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

function variableValueFromCell(value: string, columnType: FieldType): string {
  switch (columnType) {
    case FieldType.string:
      if (isRef(value)) {
        return parseRef(value).id;
      }
  }
  return value;
}

function variableTextFromCell(value: string, columnType: FieldType): string {
  switch (columnType) {
    case FieldType.string:
      if (isRef(value)) {
        let ref = parseRef(value);
        return ref.dis ?? ref.id;
      }
  }
  return value;
}
