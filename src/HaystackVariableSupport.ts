import {
  CustomVariableSupport,
  DataQueryRequest,
  DataQueryResponse,
  DataFrame,
  Field,
  FieldType,
  MetricFindValue,
} from '@grafana/data';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HaystackVariableQueryEditor } from './components/HaystackVariableQueryEditor';
import { DataSource } from './datasource';
import { isRef, parseRef } from 'haystack';
import { HaystackVariableQuery } from './types';

export class HaystackVariableSupport extends CustomVariableSupport<DataSource, HaystackVariableQuery> {
  editor = HaystackVariableQueryEditor;

  constructor(private datasource: DataSource) {
    super();
  }

  query(request: DataQueryRequest<HaystackVariableQuery>): Observable<DataQueryResponse> {
    let variableQuery = request.targets[0];
    let observable = this.datasource.query(request);
    return observable.pipe(
      map((response) => {
        if (response === undefined || response.errors !== undefined || response.data === undefined) {
          return response;
        }

        let variableValues = response.data.reduce((acc: MetricFindValue[], frame: DataFrame) => {
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
              frame.fields.find((field: Field) => {
                return field.name === variableQuery.displayColumn;
              }) ?? displayColumn;
          }

          let variableValues = column.values.map((value, index) => {
            let variableValue = variableValueFromCell(value, column.type);

            let displayValue = displayColumn.values[index];
            let variableText = variableTextFromCell(displayValue, displayColumn.type);

            return { text: variableText, value: variableValue };
          });
          return acc.concat(variableValues);
        }, []);
        return { ...response, data: variableValues };
      })
    );
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
