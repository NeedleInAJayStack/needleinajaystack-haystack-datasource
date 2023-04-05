import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface HaystackQuery extends DataQuery {
  type: string; // Defines the type of query that should be executed
  eval: string;
  hisRead: string;
  read: string;
}

export interface HaystackVariableQuery {
  column: string;
  eval: string;
}

export const DEFAULT_QUERY: Partial<HaystackQuery> = {
  type: "Eval",
  eval: "[{ts: $__timeRange_start, v0: 0}, {ts: $__timeRange_end, v0: 10}].toGrid",
  hisRead: "abcdef-123456",
  read: "point and temp and air and outside"
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
