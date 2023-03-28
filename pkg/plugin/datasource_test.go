package plugin

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/NeedleInAJayStack/haystack"
	"github.com/google/go-cmp/cmp"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestQueryData_Eval(t *testing.T) {
	evalResponse := haystack.NewGridBuilder()
	evalResponse.AddCol("a", map[string]haystack.Val{})
	evalResponse.AddCol("b", map[string]haystack.Val{})
	evalResponse.AddRow([]haystack.Val{haystack.NewStr("a"), haystack.NewStr("b")})

	client := &testHaystackClient{
		evalResponse: evalResponse.ToGrid(),
	}

	actual := getResponse(
		client,
		&QueryModel{
			Type: "Eval",
			Eval: "{a: \"a\", b: \"b\"}",
		},
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

func getResponse(
	client HaystackClient,
	queryModel *QueryModel,
	t *testing.T,
) *data.Frame {
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
					RefID: refID,
					JSON:  rawJson,
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

// TestHaystackClient is a mock of the HaystackClient interface
type testHaystackClient struct {
	evalResponse    haystack.Grid
	hisReadResponse haystack.Grid
	readResponse    haystack.Grid
}

// Open is a no-op
func (c *testHaystackClient) Open() error {
	return nil
}

// Close is a no-op
func (c *testHaystackClient) Close() error {
	return nil
}

// About returns an empty dict
func (c *testHaystackClient) About() (haystack.Dict, error) {
	return haystack.Dict{}, nil
}

// Eval returns the EvalResponse
func (c *testHaystackClient) Eval(query string) (haystack.Grid, error) {
	return c.evalResponse, nil
}

// HisRead returns the HisReadResponse
func (c *testHaystackClient) HisReadAbsDateTime(ref haystack.Ref, start haystack.DateTime, end haystack.DateTime) (haystack.Grid, error) {
	return c.hisReadResponse, nil
}

// Read returns the ReadResponse
func (c *testHaystackClient) Read(query string) (haystack.Grid, error) {
	return c.readResponse, nil
}
