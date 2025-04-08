package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/aohorodnyk/mimeheader"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/labstack/echo/v4"
)

func (m *controller) bindAndValidate(c echo.Context, i interface{}) error {
	if err := c.Bind(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error()).SetInternal(err)
	}
	if err := c.Validate(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error()).SetInternal(err)
	}
	return nil
}

type Pagination struct {
	Page  int `query:"page" validate:"omitempty,numeric,gte=0"`
	Limit int `query:"limit" validate:"omitempty,numeric,gte=0"`
}

func getPagination(c echo.Context) Pagination {
	page := c.QueryParam("page")
	limit := c.QueryParam("limit")

	var found Pagination
	found.Page, _ = strconv.Atoi(page)
	found.Limit, _ = strconv.Atoi(limit)

	if found.Page < 0 {
		found.Page = 0
	}
	if found.Limit < 0 {
		found.Limit = 0
	}

	return found
}

func (p *Pagination) DBPagination() *db.Pagination {
	if p.Limit == 0 && p.Page == 0 {
		return nil
	}
	return &db.Pagination{
		Limit:  p.Limit,
		Offset: p.Page * p.Limit,
	}
}

func (p *Pagination) MapWithTotal(total int64) map[string]any {
	return map[string]any{
		"page":  p.Page,
		"limit": p.Limit,
		"total": total,
	}
}

func (p *Pagination) CalculateOffset() int64 {
	return int64((p.Page - 1) * p.Limit)
}

func getSort(c echo.Context, defaultSort *db.Sort) db.Sort {
	var s db.Sort
	s.SortBy = c.QueryParam("sort_by")
	s.SortDirection = db.OrderByDirection(strings.ToUpper(c.QueryParam("sort_direction")))

	if s.SortBy == "" && defaultSort != nil {
		s.SortBy = defaultSort.SortBy
		s.RawSortBy = defaultSort.RawSortBy
	}
	if s.SortDirection == "" && defaultSort != nil {
		s.SortDirection = defaultSort.SortDirection
	}
	if !s.SortDirection.Valid() {
		s.SortDirection = ""
	}

	return s
}

func isMultipartFormData(c echo.Context) bool {
	contentType := c.Request().Header.Get(echo.HeaderContentType)
	ch := mimeheader.ParseAcceptHeader(contentType)
	if _, t, matched := ch.Negotiate([]string{echo.MIMEMultipartForm}, ""); matched {
		if t == echo.MIMEMultipartForm {
			return true
		}
	}
	return false
}

func getFilter(c echo.Context) *db.Filter {
	var f db.Filter

	f.Value = c.QueryParam("filter_value")
	if f.Value == "" {
		return nil
	}

	f.Term = c.QueryParam("filter_term")
	return &f
}
