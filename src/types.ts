import { DataSourceJsonData, SelectableValue } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface HaystackQuery extends DataQuery {
  type: string; // Defines the type of query that should be executed
  eval: string;
  hisRead: string;
  hisReadFilter: string;
  read: string;
}

// OpsQuery is a query that is used to get the available ops from the datasource.
export class OpsQuery implements HaystackQuery {
  type = 'ops';
  eval = '';
  hisRead = '';
  hisReadFilter = '';
  read = '';

  refId: string;

  constructor(refId: string) {
    this.refId = refId;
  }
}

export interface QueryType extends SelectableValue<string> {
  apiRequirements: string[];
}

export interface HaystackVariableQuery extends HaystackQuery {
  column: string;
  displayColumn: string;
  refId: string;
}

export const DEFAULT_QUERY: Partial<HaystackQuery> = {
  type: 'read',
  eval: '[{ts: $__timeRange_start, v0: 0}, {ts: $__timeRange_end, v0: 10}].toGrid',
  hisRead: 'abcdef-123456',
  hisReadFilter: 'point and his and temp and air and outside',
  read: 'equip and ahu',
};

/**
 * These are options configured for each DataSource instance
 */
export interface HaystackDataSourceOptions extends DataSourceJsonData {
  url: string;
  username: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface HaystackSecureJsonData {
  password: string;
}
