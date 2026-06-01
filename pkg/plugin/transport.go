package plugin

import (
	"crypto/tls"
	"net/http"
	"sync"
)

var (
	insecureHostsMu      sync.RWMutex
	insecureHostsCount   = map[string]int{}
	transportOnce        sync.Once
	originalTransport    http.RoundTripper
	insecureHTTPTransport http.RoundTripper
)

// registerInsecureHost marks a URL host as one that should skip TLS verification.
// On the first call, it replaces http.DefaultTransport with a routing transport that
// directs insecure hosts to a TLS-skipping transport and all others to the original.
func registerInsecureHost(host string) {
	transportOnce.Do(func() {
		originalTransport = http.DefaultTransport
		if dt, ok := originalTransport.(*http.Transport); ok {
			clone := dt.Clone()
			clone.TLSClientConfig = &tls.Config{InsecureSkipVerify: true} // #nosec G402
			insecureHTTPTransport = clone
		} else {
			insecureHTTPTransport = &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // #nosec G402
			}
		}
		http.DefaultTransport = &routingTransport{}
	})

	insecureHostsMu.Lock()
	defer insecureHostsMu.Unlock()
	insecureHostsCount[host]++
}

// unregisterInsecureHost removes the host from the insecure set when its ref count reaches zero.
func unregisterInsecureHost(host string) {
	insecureHostsMu.Lock()
	defer insecureHostsMu.Unlock()
	insecureHostsCount[host]--
	if insecureHostsCount[host] <= 0 {
		delete(insecureHostsCount, host)
	}
}

// routingTransport routes HTTP requests to the appropriate transport based on the target host.
type routingTransport struct{}

func (t *routingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	insecureHostsMu.RLock()
	count := insecureHostsCount[req.URL.Host]
	insecureHostsMu.RUnlock()

	if count > 0 {
		return insecureHTTPTransport.RoundTrip(req)
	}
	return originalTransport.RoundTrip(req)
}
