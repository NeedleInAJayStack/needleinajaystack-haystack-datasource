package plugin

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/NeedleInAJayStack/haystack/client"
	"github.com/google/go-cmp/cmp"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/joho/godotenv"
)

// To run these tests, do the following:
// 1. Start a Haystack server you can access
// 1. Set up a `.env` file in the `/pkg` directory with these env vars: `TEST_URL`, `TEST_USERNAME`, `TEST_PASSWORD`

func TestQueryData_Eval(t *testing.T) {
	actual := getResponse(
		&QueryModel{
			Type: "Eval",
			Eval: "{a: \"a\", b: \"b\"}",
		},
		backend.TimeRange{},
		t,
	)

	aVal := "a"
	bVal := "b"
	expected := data.NewFrame("",
		data.NewField("a", nil, []*string{&aVal}).SetConfig(&data.FieldConfig{DisplayName: "a"}),
		data.NewField("b", nil, []*string{&bVal}).SetConfig(&data.FieldConfig{DisplayName: "b"}),
	)

	if !cmp.Equal(actual, expected, data.FrameTestCompareOptions()...) {
		t.Error(cmp.Diff(actual, expected, data.FrameTestCompareOptions()...))
	}
}

func TestQueryData_Eval_Variables(t *testing.T) {
	actual := getResponse(
		&QueryModel{
			Type: "Eval",
			Eval: "[{ts: $__timeRange_start, v0: 0}, {ts: $__timeRange_end, v0: 10}].toGrid",
		},
		backend.TimeRange{
			From: time.Unix(0, 0),
			To:   time.Unix(60, 0),
		},
		t,
	)

	var v0_0, v0_1 float64
	ts_0 := time.Unix(0, 0)
	v0_0 = 0
	ts_1 := time.Unix(60, 0)
	v0_1 = 10
	expected := data.NewFrame("",
		data.NewField("ts", nil, []*time.Time{
			&ts_0,
			&ts_1,
		}).SetConfig(&data.FieldConfig{DisplayName: "ts"}),
		data.NewField("v0", nil, []*float64{
			&v0_0,
			&v0_1,
		}).SetConfig(&data.FieldConfig{DisplayName: "v0"}),
	)

	if !cmp.Equal(actual, expected, data.FrameTestCompareOptions()...) {
		t.Error(cmp.Diff(actual, expected, data.FrameTestCompareOptions()...))
	}
}

func getResponse(queryModel *QueryModel, timeRange backend.TimeRange, t *testing.T) *data.Frame {
	err := godotenv.Load("../.env")
	if err != nil {
		log.DefaultLogger.Warn(".env file not found, falling back to local environment")
	}

	client := client.NewClient(
		os.Getenv("TEST_URL"),
		os.Getenv("TEST_USERNAME"),
		os.Getenv("TEST_PASSWORD"),
	)
	if client.Open() != nil {
		t.Fatal("Failed to open connection. Is a local Haxall server running?")
	}

	ds := Datasource{
		client: client,
	}

	rawJson, err := json.Marshal(queryModel)
	if err != nil {
		t.Error(err)
	}

	refID := "A"

	resp, err := ds.QueryData(
		context.Background(),
		&backend.QueryDataRequest{
			Queries: []backend.DataQuery{
				{
					RefID:     refID,
					JSON:      rawJson,
					TimeRange: timeRange,
				},
			},
		},
	)
	if err != nil {
		t.Error(err)
	}

	if len(resp.Responses) != 1 {
		t.Fatal("QueryData must return a response")
	}

	queryResponse := resp.Responses[refID]

	if queryResponse.Status != backend.StatusOK {
		t.Fatalf("Query %v had non-OK status '%v'", refID, queryResponse.Status)
	}

	if len(queryResponse.Frames) != 1 {
		t.Fatal("Currently only support single-frame results")
	}
	return queryResponse.Frames[0]
}
