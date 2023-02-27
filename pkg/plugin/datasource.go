package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/NeedleInAJayStack/haystack"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces- only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// NewDatasource creates a new datasource instance.
func NewDatasource(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	log.DefaultLogger.Debug("NewDatasource called")

	// settings contains normal inputs in the .JSONData field in JSON byte form
	var options Options
	jsonErr := json.Unmarshal(settings.JSONData, &options)
	if jsonErr != nil {
		return nil, jsonErr
	}
	url := options.Url
	username := options.Username

	// settings contains secure inputs in .DecryptedSecureJSONData in a string:string map
	password := settings.DecryptedSecureJSONData["password"]

	// client := haystack.NewClient("http://host.docker.internal:8080/api/", "su", "5gXYG16s9gDLlyS2gNko")
	client := haystack.NewClient(url, username, password)
	openErr := client.Open()
	if openErr != nil {
		return nil, openErr
	}
	datasource := Datasource{client: client}
	return &datasource, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	client *haystack.Client
}

type Options struct {
	Url      string `json:"url"`
	Username string `json:"username"`
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// when logging at a non-Debug level, make sure you don't include sensitive information in the message
	// (like the *backend.QueryDataRequest)
	log.DefaultLogger.Debug("QueryData called", "numQueries", len(req.Queries))

	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := d.query(ctx, req.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type queryModel struct {
	Expr string `json:"expr"`
}

func (d *Datasource) query(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	// test query: [{ts: now()-1hr, v0: 0}, {ts: now(), v0: 23}].toGrid()

	var response backend.DataResponse

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	jsonErr := json.Unmarshal(query.JSON, &qm)
	if jsonErr != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", jsonErr.Error()))
	}

	eval, evalErr := d.client.Eval(qm.Expr)
	if evalErr != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Axon eval failure: %v", evalErr.Error()))
	}

	times := []time.Time{}
	vals := []*float64{}

	rowCount := eval.RowCount()
	colCount := eval.ColCount()
	if colCount > 2 { // TODO: Support multiple histories
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Axon eval failure: %v", evalErr.Error()))
	}
	for rowIndex := 0; rowIndex < rowCount; rowIndex++ {
		row := eval.RowAt(rowIndex)

		for colIndex := 0; colIndex < colCount; colIndex++ {
			col := eval.ColAt(colIndex)
			val := row.Get(col.Name())
			if col.Name() == "ts" {
				switch val := val.(type) {
				case *haystack.DateTime:
					times = append(times, val.ToGo())
				default:
					return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("'ts' value found on row %d is not DateTime", rowIndex))
				}
			} else {
				switch val := val.(type) {
				case *haystack.Number:
					float := val.Float()
					vals = append(vals, &float)
				case *haystack.Null:
					vals = append(vals, nil)
				default:
					return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("'%s' value found on row %d is not Number?", col.Name(), rowIndex))
				}
			}
		}
	}

	// create data frame response.
	// For an overview on data frames and how grafana handles them:
	// https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/
	frame := data.NewFrame("response")

	// add fields.
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, times),
		data.NewField("values", nil, vals),
	)

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)

	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	// when logging at a non-Debug level, make sure you don't include sensitive information in the message
	// (like the *backend.QueryDataRequest)
	log.DefaultLogger.Debug("CheckHealth called")

	_, err := d.client.About()
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Uh oh, something's wrong with the connection",
		}, err
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}
