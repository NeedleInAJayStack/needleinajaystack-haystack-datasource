package plugin

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/NeedleInAJayStack/haystack"
	"github.com/google/go-cmp/cmp"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestQueryData_Eval(t *testing.T) {
	response := haystack.NewGridBuilder()
	response.AddCol("a", map[string]haystack.Val{})
	response.AddCol("b", map[string]haystack.Val{})
	response.AddRow([]haystack.Val{haystack.NewStr("a"), haystack.NewStr("b")})

	client := &testHaystackClient{
		evalResponse: response.ToGrid(),
	}

	actual := getResponse(
		client,
		&QueryModel{
			Type: "eval",
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

func TestQueryData_Eval_Dis(t *testing.T) {
	response := haystack.NewGridBuilder()
	response.AddCol("a", map[string]haystack.Val{"id": haystack.NewRef("abc", "dis")})
	response.AddRow([]haystack.Val{haystack.NewStr("a")})

	client := &testHaystackClient{
		evalResponse: response.ToGrid(),
	}

	actual := getResponse(
		client,
		&QueryModel{
			Type: "eval",
			Eval: "test()",
		},
		t,
	)

	aVal := "a"
	expected := data.NewFrame("",
		data.NewField("a", nil, []*string{&aVal}).SetConfig(&data.FieldConfig{DisplayName: "dis"}),
	)

	if !cmp.Equal(actual, expected, data.FrameTestCompareOptions()...) {
		t.Error(cmp.Diff(actual, expected, data.FrameTestCompareOptions()...))
	}
}

func TestQueryData_HisRead(t *testing.T) {
	response := haystack.NewGridBuilder()
	response.AddCol("ts", map[string]haystack.Val{})
	response.AddCol("v0", map[string]haystack.Val{})
	response.AddRow([]haystack.Val{haystack.NewDateTimeFromGo(time.Unix(0, 0)), haystack.NewNumber(5, "kWh")})

	client := &testHaystackClient{
		hisReadResponse: response.ToGrid(),
	}

	actual := getResponse(
		client,
		&QueryModel{
			Type:    "hisRead",
			HisRead: "abcdefg-12345678",
		},
		t,
	)

	tsVal := time.Unix(0, 0)
	v0Val := 5.0
	expected := data.NewFrame("",
		data.NewField("ts", nil, []*time.Time{&tsVal}).SetConfig(&data.FieldConfig{DisplayName: "ts"}),
		data.NewField("v0", nil, []*float64{&v0Val}).SetConfig(&data.FieldConfig{DisplayName: "v0", Unit: "kWh"}),
	)

	if !cmp.Equal(actual, expected, data.FrameTestCompareOptions()...) {
		t.Error(cmp.Diff(actual, expected, data.FrameTestCompareOptions()...))
	}
}

func TestQueryData_Read(t *testing.T) {
	response := haystack.NewGridBuilder()
	response.AddCol("id", map[string]haystack.Val{})
	response.AddCol("dis", map[string]haystack.Val{})
	response.AddCol("ahu", map[string]haystack.Val{})
	response.AddRow([]haystack.Val{
		haystack.NewRef("abcdefg-12345678", "AHU-1"),
		haystack.NewStr("AHU-1"),
		haystack.NewMarker(),
	})

	client := &testHaystackClient{
		readResponse: response.ToGrid(),
	}

	actual := getResponse(
		client,
		&QueryModel{
			Type: "read",
			Read: "ahu",
		},
		t,
	)

	idVal := "@abcdefg-12345678 \"AHU-1\""
	disVal := "AHU-1"
	ahuVal := "✓"
	expected := data.NewFrame("",
		data.NewField("id", nil, []*string{&idVal}).SetConfig(&data.FieldConfig{DisplayName: "id"}),
		data.NewField("dis", nil, []*string{&disVal}).SetConfig(&data.FieldConfig{DisplayName: "dis"}),
		data.NewField("ahu", nil, []*string{&ahuVal}).SetConfig(&data.FieldConfig{DisplayName: "ahu"}),
	)

	if !cmp.Equal(actual, expected, data.FrameTestCompareOptions()...) {
		t.Error(cmp.Diff(actual, expected, data.FrameTestCompareOptions()...))
	}
}

func TestQueryData_Nav(t *testing.T) {
	response := haystack.NewGridBuilder()
	response.AddCol("id", map[string]haystack.Val{})
	response.AddCol("dis", map[string]haystack.Val{})
	response.AddCol("ahu", map[string]haystack.Val{})
	response.AddRow([]haystack.Val{
		haystack.NewRef("abcdefg-12345678", "AHU-1"),
		haystack.NewStr("AHU-1"),
		haystack.NewMarker(),
	})

	client := &testHaystackClient{
		navResponse: response.ToGrid(),
	}

	idVal := "@abcdefg-12345678 \"AHU-1\""
	disVal := "AHU-1"
	ahuVal := "✓"
	expected := data.NewFrame("",
		data.NewField("id", nil, []*string{&idVal}).SetConfig(&data.FieldConfig{DisplayName: "id"}),
		data.NewField("dis", nil, []*string{&disVal}).SetConfig(&data.FieldConfig{DisplayName: "dis"}),
		data.NewField("ahu", nil, []*string{&ahuVal}).SetConfig(&data.FieldConfig{DisplayName: "ahu"}),
	)

	// Test that the root query works and the response is returned.
	actual_root := getResponse(
		client,
		&QueryModel{
			Type: "nav",
			Nav:  nil,
		},
		t,
	)
	if !cmp.Equal(actual_root, expected, data.FrameTestCompareOptions()...) {
		t.Error(cmp.Diff(actual_root, expected, data.FrameTestCompareOptions()...))
	}

	// Test that the branch query parses and the response is returned.
	actual_branch := getResponse(
		client,
		&QueryModel{
			Type: "nav",
			Nav:  &idVal,
		},
		t,
	)
	if !cmp.Equal(actual_branch, expected, data.FrameTestCompareOptions()...) {
		t.Error(cmp.Diff(actual_root, expected, data.FrameTestCompareOptions()...))
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
	navResponse     haystack.Grid
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

// Ops returns an empty grid
func (c *testHaystackClient) Ops() (haystack.Grid, error) {
	return haystack.EmptyGrid(), nil
}

func (c *testHaystackClient) Nav(navId haystack.Val) (haystack.Grid, error) {
	return c.navResponse, nil
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
