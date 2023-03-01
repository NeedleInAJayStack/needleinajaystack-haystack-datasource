package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/NeedleInAJayStack/haystack"
	"github.com/NeedleInAJayStack/haystack/client"
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
	client := client.NewClient(url, username, password)
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
	client *client.Client
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

func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	log.DefaultLogger.Error("Context:", ctx)

	var response backend.DataResponse

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	jsonErr := json.Unmarshal(query.JSON, &qm)
	if jsonErr != nil {
		log.DefaultLogger.Error(jsonErr.Error())
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal failure: %v", jsonErr.Error()))
	}

	eval, evalErr := d.client.Eval(qm.Expr)
	if evalErr != nil {
		log.DefaultLogger.Error(evalErr.Error())
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Axon eval failure: %v", evalErr.Error()))
	}

	frame, frameErr := dataFrameFromGrid(eval)
	if frameErr != nil {
		log.DefaultLogger.Error(frameErr.Error())
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Frame conversion failure: %v", frameErr.Error()))
	}

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

func dataFrameFromGrid(grid haystack.Grid) (*data.Frame, error) {
	fields := []*data.Field{}

	for _, col := range grid.Cols() {
		columnType := none
		for _, row := range grid.Rows() {
			val := row.Get(col.Name())
			switch val.(type) {
			case haystack.Null:
				continue
			case haystack.DateTime, haystack.Date:
				if columnType == none || columnType == dateTime {
					columnType = dateTime
				} else {
					columnType = mixed
				}
			case haystack.Number:
				if columnType == none || columnType == number {
					columnType = number
				} else {
					columnType = mixed
				}
			case haystack.Bool:
				if columnType == none || columnType == boolean {
					columnType = boolean
				} else {
					columnType = mixed
				}
			default:
				if columnType == none || columnType == str {
					columnType = str
				} else {
					columnType = mixed
				}
			}
		}

		var field *data.Field
		if columnType == dateTime {
			values := []*time.Time{}
			for _, row := range grid.Rows() {
				val := row.Get(col.Name())
				switch val := val.(type) {
				case haystack.DateTime:
					value := val.ToGo()
					values = append(values, &value)
				case haystack.Date:
					value := time.Date(val.Year(), time.Month(val.Month()), val.Day(), 0, 0, 0, 0, time.Local)
					values = append(values, &value)
				default:
					values = append(values, nil)
				}
			}
			field = data.NewField(col.Name(), nil, values)
		} else if columnType == number {
			values := []*float64{}
			for _, row := range grid.Rows() {
				val := row.Get(col.Name())
				switch val := val.(type) {
				case haystack.Number:
					value := val.Float()
					values = append(values, &value)
				default:
					values = append(values, nil)
				}
			}
			field = data.NewField(col.Name(), nil, values)
		} else if columnType == boolean {
			values := []*bool{}
			for _, row := range grid.Rows() {
				val := row.Get(col.Name())
				switch val := val.(type) {
				case haystack.Bool:
					value := val.ToBool()
					values = append(values, &value)
				default:
					values = append(values, nil)
				}
			}
			field = data.NewField(col.Name(), nil, values)
		} else {
			values := []*string{}
			for _, row := range grid.Rows() {
				val := row.Get(col.Name())
				switch val := val.(type) {
				case haystack.Str:
					value := val.String()
					values = append(values, &value)
				default:
					value := val.ToZinc()
					values = append(values, &value)
				}
			}
			field = data.NewField(col.Name(), nil, values)
		}

		// TODO: For some reason setting the config below causes failures...

		// field.Config.DisplayName = col.Name()
		// switch unit := col.Meta().Get("unit").(type) {
		// case haystack.Str:
		// 	field.Config.Unit = unit.String()
		// default:
		// 	field.Config.Unit = ""
		// }
		// log.DefaultLogger.Error("Field named to %s", field.Config.Unit)

		fields = append(fields, field)
	}

	frame := data.NewFrame("response", fields...)

	switch dis := grid.Meta().Get("dis").(type) {
	case haystack.Str:
		frame.Name = dis.String()
	default:
		frame.Name = ""
	}

	return frame, nil
}

type colType int

const (
	none colType = iota
	dateTime
	number
	str
	boolean
	mixed
)
