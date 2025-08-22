package db

import (
	"context"

	"github.com/aarondl/sqlboiler/v4/queries/qm"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
)

const GlobalDictionariesOwner = "__GLOBAL__"

type DictionariesManipulator interface {
	GetDictionariesOfType(ctx context.Context, user, dictType string, includeGlobal bool) (models.DictionarySlice, error)
	DeleteDictionariesOfType(ctx context.Context, user, dictType string, includeGlobal bool) (int64, error)
	GetDictionaryByID(ctx context.Context, id, user string) (*models.Dictionary, error)
	GetDictionaryByName(ctx context.Context, name, user string) (*models.Dictionary, error)
	DeleteDictionaryByID(ctx context.Context, id, user string) (bool, error)
}

var _ DictionariesManipulator = (*execute)(nil)

func (e *execute) GetDictionariesOfType(ctx context.Context, user, dictType string, includeGlobal bool) (models.DictionarySlice, error) {
	q := mods{qm.Select(
		models.DictionaryColumns.ID,
		models.DictionaryColumns.Name,
		models.DictionaryColumns.Owner,
		models.DictionaryColumns.Type,
	)}

	if includeGlobal {
		q = append(q, models.DictionaryWhere.Owner.IN([]string{user, GlobalDictionariesOwner}))
	} else {
		q = append(q, models.DictionaryWhere.Owner.EQ(user))
	}

	q = append(q, models.DictionaryWhere.Type.EQ(dictType))

	e.s = &Sort{SortBy: models.DictionaryColumns.Name, SortDirection: OrderByAsc}

	d, err := models.Dictionaries(q.fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return d, nil
}

func (e *execute) DeleteDictionariesOfType(ctx context.Context, user, dictType string, includeGlobal bool) (int64, error) {
	q := mods{}

	if includeGlobal {
		q = append(q, models.DictionaryWhere.Owner.IN([]string{user, GlobalDictionariesOwner}))
	} else {
		q = append(q, models.DictionaryWhere.Owner.EQ(user))
	}

	q = append(q, models.DictionaryWhere.Type.EQ(dictType))

	d, err := models.Dictionaries(q.fromExec(e, nil)...).DeleteAll(ctx, e.db)
	if err != nil {
		return 0, noErrorIfNoRows(err)
	}

	return d, nil
}

func (e *execute) GetDictionaryByID(ctx context.Context, id, user string) (*models.Dictionary, error) {
	q := mods{
		models.DictionaryWhere.ID.EQ(id),
		models.DictionaryWhere.Owner.IN([]string{user, GlobalDictionariesOwner}),
	}

	d, err := models.Dictionaries(q...).One(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}
	return d, nil
}

func (e *execute) GetDictionaryByName(ctx context.Context, name, user string) (*models.Dictionary, error) {
	q := mods{
		models.DictionaryWhere.Name.EQ(name),
		models.DictionaryWhere.Owner.IN([]string{user, GlobalDictionariesOwner}),
	}

	d, err := models.Dictionaries(q...).One(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}
	return d, nil
}

func (e *execute) DeleteDictionaryByID(ctx context.Context, id, user string) (bool, error) {
	d, err := models.Dictionaries(models.DictionaryWhere.ID.EQ(id), models.DictionaryWhere.Owner.EQ(user)).One(ctx, e.db)
	if err != nil {
		return false, noErrorIfNoRows(err)
	}

	n, err := d.Delete(ctx, e.db)
	if err != nil {
		return false, noErrorIfNoRows(err)
	}

	return n > 0, nil
}
