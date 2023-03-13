package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/NeedleInAJayStack/haystack/client"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/joho/godotenv"
	"github.com/unknwon/log"
)

// To run these tests, do the following:
// 1. Start a Haystack server you can access
// 1. Set up a `.env` file in the `/pkg` directory with these env vars: `TEST_URL`, `TEST_USERNAME`, `TEST_PASSWORD`

func TestQueryData_Eval(t *testing.T) {
	data := getResponse(
		&QueryModel{
			Type: "Eval",
			Eval: "[{ts: now()-1hr, v0: 0}, {ts: now(), v0: 10}].toGrid",
		},
		backend.TimeRange{},
		t,
	)
	table, _ := data.StringTable(10, 100)
	fmt.Printf("frame: %v\n", table)
}

func TestQueryData_Eval_Variables(t *testing.T) {
	data := getResponse(
		&QueryModel{
			Type: "Eval",
			Eval: "[{ts: $__timeRange_start, v0: 0}, {ts: $__timeRange_end, v0: 10}].toGrid",
		},
		backend.TimeRange{
			From: time.Now().Add(-1 * time.Hour),
			To:   time.Now(),
		},
		t,
	)
	table, _ := data.StringTable(10, 100)
	fmt.Printf("frame: %v\n", table)
}

func getResponse(queryModel *QueryModel, timeRange backend.TimeRange, t *testing.T) data.Frame {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Warn(".env file not found, falling back to local environment")
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
	return *queryResponse.Frames[0]
}
