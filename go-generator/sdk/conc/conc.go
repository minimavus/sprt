package conc

import (
	"context"

	"github.com/sourcegraph/conc/pool"
)

func NewResultPool[R any](ctx context.Context) *pool.ResultContextPool[R] {
	return NewResultPoolWithMaxGoroutines[R](ctx, 2)
}

func NewResultPoolWithMaxGoroutines[R any](ctx context.Context, maxGoroutines int) *pool.ResultContextPool[R] {
	return pool.NewWithResults[R]().
		WithContext(ctx).
		WithCollectErrored().
		WithMaxGoroutines(maxGoroutines).
		WithCancelOnError().
		WithFirstError()
}
