import React, { PureComponent } from 'react';
import { Button, Form, Stack } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { HaystackDataSourceOptions, HaystackQuery } from '../types';
import { HaystackQueryTypeSelector } from './HaystackQueryTypeSelector';
import { HaystackQueryInput } from './HaystackQueryInput';

type Props = QueryEditorProps<DataSource, HaystackQuery, HaystackDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onTypeChange(newType: string) {
    this.props.onChange({ ...this.props.query, type: newType });
  };
  onQueryChange(newQuery: string) {
    if (this.props.query.type === "eval") {
      this.props.onChange({ ...this.props.query, eval: newQuery });
    } else if (this.props.query.type === "hisRead") {
      this.props.onChange({ ...this.props.query, hisRead: newQuery });
    } else if (this.props.query.type === "hisReadFilter") {
      this.props.onChange({ ...this.props.query, hisReadFilter: newQuery });
    } else if (this.props.query.type === "read") {
      this.props.onChange({ ...this.props.query, read: newQuery });
    }
  };
  onSubmit(newQuery: Partial<HaystackQuery>) {
    this.props.onChange({ ...this.props.query, ...newQuery });
    this.props.onRunQuery();
  }
  
  render() {
    return (
      <Form onSubmit={(e) => this.onSubmit(e)}>
        {({ register, errors }) => {
          return (
            <Stack
              direction="column"
              alignItems="flex-start"
            >
              <HaystackQueryTypeSelector
                datasource={this.props.datasource}
                type={this.props.query.type}
                refId={this.props.query.refId}
                onChange={(e) => this.onTypeChange(e)}
              />
              <HaystackQueryInput
                query={this.props.query}
                onChange={(e) => this.onQueryChange(e)}
              />
              <Button type="submit" >Run</Button>
            </Stack>
          );
        }}
      </Form>
    );
  }
}
