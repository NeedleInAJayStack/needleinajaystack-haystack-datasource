import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  type: string; // Defines the type of query that should be executed
  eval: string;
  hisRead: string;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  type: "Eval",
  eval: "[{ts: $__timeRange_start, v0: 0}, {ts: $__timeRange_end, v0: 10}].toGrid",
  hisRead: "abcdef-123456"
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url: string;
  username: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  password: string;
}
