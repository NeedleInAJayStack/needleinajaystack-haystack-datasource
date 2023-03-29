package plugin

import (
	"github.com/NeedleInAJayStack/haystack"
)

// HaystackClient is an interface used to enable mocking of the haystack client in tests
type HaystackClient interface {
	Open() error
	Close() error
	About() (haystack.Dict, error)
	Eval(string) (haystack.Grid, error)
	HisReadAbsDateTime(haystack.Ref, haystack.DateTime, haystack.DateTime) (haystack.Grid, error)
	Read(string) (haystack.Grid, error)
}
