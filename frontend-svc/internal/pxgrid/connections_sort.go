package pxgrid

import (
	"sort"

	pxgrider_proto "github.com/vkumov/go-pxgrider/pkg"
)

type ConnectionSorter []*pxgrider_proto.Connection

var _ sort.Interface = (ConnectionSorter)(nil)

func (cs ConnectionSorter) Len() int {
	return len(cs)
}

func (cs ConnectionSorter) Less(i, j int) bool {
	return cs[i].Id < cs[j].Id
}

func (cs ConnectionSorter) Swap(i, j int) {
	cs[i], cs[j] = cs[j], cs[i]
}
