import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  expr: string;
}

export const DEFAULT_QUERY: Partial<MyQuery> = {
  expr: "[{ts: now()-1hr, v0: 0}, {ts: now(), v0: 10}].toGrid",
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
