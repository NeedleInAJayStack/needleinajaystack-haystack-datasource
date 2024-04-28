package plugin

import (
	"github.com/NeedleInAJayStack/haystack"
)

// HaystackClient is an interface used to enable mocking of the haystack client in tests
type HaystackClient interface {
	Open() error
	Close() error
	About() (haystack.Dict, error)
	Ops() (haystack.Grid, error)
	Eval(string) (haystack.Grid, error)
	HisReadAbsDateTime(haystack.Ref, haystack.DateTime, haystack.DateTime) (haystack.Grid, error)
	Read(string) (haystack.Grid, error)
	ReadByIds([]haystack.Ref) (haystack.Grid, error)
	Nav(haystack.Val) (haystack.Grid, error)
}
