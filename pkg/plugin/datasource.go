package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/NeedleInAJayStack/haystack"
	"github.com/NeedleInAJayStack/haystack/client"
	"github.com/NeedleInAJayStack/haystack/io"
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
	client HaystackClient
}

type Options struct {
	Url      string `json:"url"`
	Username string `json:"username"`
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (datasource *Datasource) Dispose() {
	datasource.client.Close()
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (datasource *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// when logging at a non-Debug level, make sure you don't include sensitive information in the message
	// (like the *backend.QueryDataRequest)
	log.DefaultLogger.Debug("QueryData called", "numQueries", len(req.Queries))

	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, query := range req.Queries {
		queryResponse := datasource.query(ctx, req.PluginContext, query)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[query.RefID] = queryResponse
	}

	return response, nil
}

type QueryModel struct {
	Type          string  `json:"type"`
	Nav           *string `json:"nav"` // A zinc-encoded Ref or null
	Eval          string  `json:"eval"`
	HisRead       string  `json:"hisRead"`
	HisReadFilter string  `json:"hisReadFilter"`
	Read          string  `json:"read"`
}

func (datasource *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	// Unmarshal the JSON into our queryModel.
	var model QueryModel

	jsonErr := json.Unmarshal(query.JSON, &model)
	if jsonErr != nil {
		log.DefaultLogger.Error(jsonErr.Error())
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal failure: %v", jsonErr.Error()))
	}

	variables := map[string]string{
		"$__timeRange_start": haystack.NewDateTimeFromGo(query.TimeRange.From.UTC()).ToAxon(),
		"$__timeRange_end":   haystack.NewDateTimeFromGo(query.TimeRange.To.UTC()).ToAxon(),
		"$__maxDataPoints":   strconv.FormatInt(query.MaxDataPoints, 10),
		"$__interval":        haystack.NewNumber(query.Interval.Minutes(), "min").ToZinc(),
	}

	switch model.Type {
	case "":
		// If no type is specified, just return an empty response.
		return responseFromGrids([]haystack.Grid{})
	case "ops":
		ops, err := datasource.ops()
		if err != nil {
			log.DefaultLogger.Error(err.Error())
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Ops failure: %v", err.Error()))
		}
		return responseFromGrids([]haystack.Grid{ops})
	case "nav":
		nav, err := datasource.nav(model.Nav)
		if err != nil {
			log.DefaultLogger.Error(err.Error())
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Nav failure: %v", err.Error()))
		}
		return responseFromGrids([]haystack.Grid{nav})
	case "eval":
		eval, err := datasource.eval(model.Eval, variables)
		if err != nil {
			log.DefaultLogger.Error(err.Error())
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Eval failure: %v", err.Error()))
		}
		return responseFromGrids([]haystack.Grid{eval})
	case "hisRead":
		hisRead, err := datasource.hisRead(haystack.NewRef(model.HisRead, ""), query.TimeRange)
		if err != nil {
			log.DefaultLogger.Error(err.Error())
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("HisRead failure: %v", err.Error()))
		}
		response := responseFromGrids([]haystack.Grid{hisRead})
		// Make the display name on the "val" field the name of the point.
		for _, frame := range response.Frames {
			for _, field := range frame.Fields {
				if field.Name == "val" {
					field.Config.DisplayName = frame.Name
				}
			}
		}
		return response

	case "hisReadFilter":
		pointsGrid, readErr := datasource.read(model.HisReadFilter+" and hisStart", variables)
		if readErr != nil {
			log.DefaultLogger.Error(readErr.Error())
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("HisReadFilter failure: %v", readErr.Error()))
		}
		points := pointsGrid.Rows()
		recLimit := 300
		if len(points) > recLimit {
			errMsg := fmt.Sprintf("Query exceeded record limit of %d: %d records", recLimit, len(points))
			log.DefaultLogger.Error(errMsg)
			return backend.ErrDataResponse(backend.StatusBadRequest, errMsg)
		}

		// Function to read a single point and send it to a channel.
		readPoint := func(point haystack.Row, hisReadChannel chan haystack.Grid, wg *sync.WaitGroup) {
			id := point.Get("id")
			var ref haystack.Ref
			switch id.(type) {
			case haystack.Ref:
				ref = id.(haystack.Ref)
			default:
				errMsg := fmt.Sprintf("id is not a ref: %v", id)
				log.DefaultLogger.Error(errMsg)
				hisReadChannel <- haystack.EmptyGrid()
			}
			hisRead, err := datasource.hisRead(ref, query.TimeRange)
			if err != nil {
				log.DefaultLogger.Error(err.Error())
				hisReadChannel <- haystack.EmptyGrid()
			}
			hisReadChannel <- hisRead
			wg.Done()
		}

		// Start a goroutine to collect all the grids into a slice.
		hisReadChannel := make(chan haystack.Grid)
		combinedChannel := make(chan []haystack.Grid)
		go func() {
			grids := []haystack.Grid{}
			for grid := range hisReadChannel {
				grids = append(grids, grid)
			}
			combinedChannel <- grids
		}()

		// Read all the points in parallel using goroutines.
		var wg sync.WaitGroup
		wg.Add(len(points))
		for _, point := range points {
			go readPoint(point, hisReadChannel, &wg)
		}
		wg.Wait()
		close(hisReadChannel)

		grids := <-combinedChannel
		response := responseFromGrids(grids)
		// Make the display name on the "val" fields the names of the points.
		for _, frame := range response.Frames {
			for _, field := range frame.Fields {
				if field.Name == "val" {
					field.Config.DisplayName = frame.Name
				}
			}
		}
		return response
	case "read":
		read, err := datasource.read(model.Read, variables)
		if err != nil {
			log.DefaultLogger.Error(err.Error())
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Read failure: %v", err.Error()))
		}
		return responseFromGrids([]haystack.Grid{read})
	default:
		warnMsg := fmt.Sprintf("Invalid type %s, returning empty Grid", model.Type)
		log.DefaultLogger.Warn(warnMsg)
		return backend.ErrDataResponse(backend.StatusBadRequest, warnMsg)
	}
}

// Creates a response from the input grids. The frames in the result are sorted by display name.
func responseFromGrids(grids []haystack.Grid) backend.DataResponse {
	frames := data.Frames{}
	for _, grid := range grids {
		frame, frameErr := dataFrameFromGrid(grid)
		if frameErr != nil {
			log.DefaultLogger.Error(frameErr.Error())
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("Frame conversion failure: %v", frameErr.Error()))
		}
		frames = append(frames, frame)
	}

	sort.Slice(frames, func(i, j int) bool {
		return frames[i].Name < frames[j].Name
	})

	var response backend.DataResponse
	response.Frames = frames
	response.Status = backend.StatusOK
	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (datasource *Datasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	// when logging at a non-Debug level, make sure you don't include sensitive information in the message
	// (like the *backend.QueryDataRequest)
	log.DefaultLogger.Debug("CheckHealth called")

	_, err := datasource.client.About()
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

func (datasource *Datasource) ops() (haystack.Grid, error) {
	return datasource.withRetry(
		func() (haystack.Grid, error) {
			return datasource.client.Ops()
		},
	)
}

func (datasource *Datasource) eval(expr string, variables map[string]string) (haystack.Grid, error) {
	for name, val := range variables {
		expr = strings.ReplaceAll(expr, name, val)
	}

	return datasource.withRetry(
		func() (haystack.Grid, error) {
			return datasource.client.Eval(expr)
		},
	)
}

func (datasource *Datasource) hisRead(id haystack.Ref, timeRange backend.TimeRange) (haystack.Grid, error) {
	start := haystack.NewDateTimeFromGo(timeRange.From.UTC())
	end := haystack.NewDateTimeFromGo(timeRange.To.UTC())

	return datasource.withRetry(
		func() (haystack.Grid, error) {
			return datasource.client.HisReadAbsDateTime(id, start, end)
		},
	)
}

func (datasource *Datasource) read(filter string, variables map[string]string) (haystack.Grid, error) {
	for name, val := range variables {
		filter = strings.ReplaceAll(filter, name, val)
	}

	return datasource.withRetry(
		func() (haystack.Grid, error) {
			return datasource.client.Read(filter)
		},
	)
}

// nav returns the grid for the given navId, or the root nav if navId is nil
// `navId` is expected to be a zinc-encoded Ref
func (datasource *Datasource) nav(navId *string) (haystack.Grid, error) {
	return datasource.withRetry(
		func() (haystack.Grid, error) {
			if navId != nil {
				zincReader := io.ZincReader{}
				zincReader.InitString(*navId)
				val, err := zincReader.ReadVal()
				if err != nil {
					return haystack.EmptyGrid(), err
				}
				ref := val.(haystack.Ref)
				return datasource.client.Nav(ref)
			} else {
				return datasource.client.Nav(haystack.NewNull())
			}
		},
	)
}

// withRetry will retry the given operation if it fails with a 403 or 404 error
func (datasource *Datasource) withRetry(
	operation func() (haystack.Grid, error),
) (haystack.Grid, error) {
	result, err := operation()
	// If the error is a 403 or 404, try to reconnect and try again
	switch error := err.(type) {
	case client.HTTPError:
		if error.Code == 404 || error.Code == 403 {
			datasource.client.Open()
			return operation()
		} else {
			return result, err
		}
	default:
		return result, err
	}
}

// dataFrameFromGrid converts a haystack grid to a Grafana data frame
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
				case haystack.Marker:
					value := "✓"
					values = append(values, &value)
				case haystack.Null:
					values = append(values, nil)
				default:
					value := val.ToZinc()
					values = append(values, &value)
				}
			}
			field = data.NewField(col.Name(), nil, values)
		}

		// Set Grafana field info from Haystack grid info
		config := &data.FieldConfig{}
		config.DisplayName = col.Name()
		config.Unit = unitFromGrid(grid, col)
		field.Config = config
		fields = append(fields, field)
	}

	frame := data.NewFrame("response", fields...)

	switch id := grid.Meta().Get("id").(type) {
	case haystack.Ref:
		frame.Name = id.Dis()
	default:
		frame.Name = ""
	}
	return frame, nil
}

// unitFromGrid returns the unit of a column in a haystack grid
// It is expected that the column is from the grid
// The unit is determined in the following order:
// 1. If the column has a unit meta, return it
// 2. If the column has a unit in the first row, return it
// 3. Return empty string
func unitFromGrid(grid haystack.Grid, col haystack.Col) string {
	switch unit := col.Meta().Get("unit").(type) {
	case haystack.Str:
		return unit.String()
	default:
		if grid.RowCount() >= 1 {
			row := grid.RowAt(0)
			val := row.Get(col.Name())
			switch val := val.(type) {
			case haystack.Number:
				return val.Unit()
			}
		}
		return ""
	}
}

type colType int

// colType represents the type of a column in a haystack grid
const (
	none colType = iota
	dateTime
	number
	str
	boolean
	mixed
)
