package variables

type (
	LoadableResultFields struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	}

	LoadableResultColumn struct {
		Title string `json:"title"`
		Field string `json:"field"`
	}

	LoadableResultColumns []LoadableResultColumn

	LoadParams struct {
		Link    string         `json:"link"`
		Method  string         `json:"method"`
		Request map[string]any `json:"request,omitempty"`
		Result  struct {
			Type             LoadParamsResultType  `json:"type,omitempty"`
			Paging           bool                  `json:"paging,omitempty"`
			Attribute        string                `json:"attribute,omitempty"`
			Fields           LoadableResultFields  `json:"fields,omitempty"`
			Columns          LoadableResultColumns `json:"columns,omitempty"`
			ResultObjectPath string                `json:"result_object_path,omitempty"`
			PaginationPath   string                `json:"pagination_path,omitempty"`
		} `json:"result"`
	}

	LoadParamsResultType string
)

const (
	LoadParamsResultTypeGroups LoadParamsResultType = "groups"
	LoadParamsResultTypeTable  LoadParamsResultType = "table"
)

func NewLoadParams(link, method string) *LoadParams {
	return &LoadParams{
		Link:   link,
		Method: method,
	}
}

func (l *LoadParams) WithAPIPrefix() *LoadParams {
	l.Link = "{{API_PREFIX}}" + l.Link
	return l
}

func (l *LoadParams) SetRequest(request map[string]any) *LoadParams {
	l.Request = request
	return l
}

func (l *LoadParams) SetResultAsTable() *LoadParams {
	l.Result.Type = LoadParamsResultTypeTable
	return l
}

func (l *LoadParams) SetResultAsGroups() *LoadParams {
	l.Result.Type = LoadParamsResultTypeGroups
	return l
}

func (l *LoadParams) SetResultType(resultType LoadParamsResultType) *LoadParams {
	l.Result.Type = resultType
	return l
}

func (l *LoadParams) SetResultPaging(paging bool) *LoadParams {
	l.Result.Paging = paging
	return l
}

func (l *LoadParams) SetResultAttribute(attribute string) *LoadParams {
	l.Result.Attribute = attribute
	return l
}

func (l *LoadParams) SetResultFields(name, id string) *LoadParams {
	l.Result.Fields = LoadableResultFields{
		Name: name,
		ID:   id,
	}
	return l
}

func (l *LoadParams) SetResultColumns(columns LoadableResultColumns) *LoadParams {
	l.Result.Columns = columns
	return l
}

func (l *LoadParams) SetResultObjectPath(path string) *LoadParams {
	l.Result.ResultObjectPath = path
	return l
}

func (l *LoadParams) SetPaginationPath(path string) *LoadParams {
	l.Result.PaginationPath = path
	return l
}
