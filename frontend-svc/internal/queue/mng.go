package queue

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/queue"
)

type connection struct {
	Name string `json:"name"`
	CID  int    `json:"cid"`
}

type connz struct {
	Connections []connection `json:"connections"`
}

func (q *QueueClient) GetGenerators(ctx context.Context) ([]string, error) {
	cl := http.Client{
		Timeout: 10 * time.Second,
	}
	defer cl.CloseIdleConnections()

	url, err := q.getMngURL("/connz")
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := cl.Do(req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	var c connz
	if err := json.NewDecoder(resp.Body).Decode(&c); err != nil {
		return nil, err
	}

	var generators []string

	for _, v := range c.Connections {
		if id, ok := strings.CutPrefix(v.Name, string(queue.QueueClientNameGenerator)+"/"); ok {
			generators = append(generators, id)
		}
	}

	return generators, nil
}

func (q *QueueClient) getMngURL(path string) (string, error) {
	u, err := url.Parse(q.cfg.Nats.ManagementURL)
	if err != nil {
		return "", err
	}
	u.Path = path
	return u.String(), nil
}

func (q *QueueClient) getGeneratorQueue(generatorID string) string {
	return fmt.Sprintf("%s.%s", q.cfg.ControlQueue, generatorID)
}
