package queue

import (
	"context"

	"github.com/cisco-open/sprt/go-generator/sdk/conc"
)

func forAllGenerators[T any](ctx context.Context, q *QueueClient, fn func(ctx context.Context, generatorID string) ([]T, error)) ([]T, error) {
	generators, err := q.GetGenerators(ctx)
	if err != nil {
		return nil, err
	}

	q.app.Logger().Debug().Strs("generators", generators).Msg("Found generators")

	pool := conc.NewResultPoolWithMaxGoroutines[[]T](ctx, len(generators))

	for _, generatorID := range generators {
		pool.Go(func(ctx context.Context) ([]T, error) {
			return fn(ctx, generatorID)
		})
	}

	t, err := pool.Wait()
	if err != nil {
		return nil, err
	}

	var res []T
	for _, v := range t {
		if v == nil {
			continue
		}
		res = append(res, v...)
	}

	return res, nil
}
