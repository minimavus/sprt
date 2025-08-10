package variables

import (
	j "encoding/json"
	"fmt"
	"log"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

func (b *infoParameter) ToJSONSchema() (any, error) {
	return nil, nil
}

func (b *basicValueInputParameter[T]) ToJSONSchema() (any, error) {
	var t string

	switch any(b.Value).(type) {
	case string:
		t = "string"
	case int:
		t = "number"
	default:
		return nil, fmt.Errorf("unsupported type %T", b.Value)
	}

	m := map[string]any{
		"type": t,
	}
	if b.Readonly {
		m["const"] = b.Value
	}
	return m, nil
}

func (b *checkboxParameter) ToJSONSchema() (any, error) {
	return map[string]any{
		"type": "boolean",
	}, nil
}

func (b *hiddenParameter) ToJSONSchema() (any, error) {
	return map[string]any{
		"type":  "string",
		"const": b.Value,
	}, nil
}

func (b *selectParameter[T]) ToJSONSchema() (any, error) {
	enum := make([]string, 0, len(b.Options))
	for _, o := range b.Options {
		enum = append(enum, o.Value)
	}

	if b.Multi {
		m := map[string]any{
			"type": "array",
			"items": map[string]any{
				"type": "string",
				"enum": enum,
			},
			"uniqueItems": true,
		}
		return m, nil
	}

	m := map[string]any{
		"type": "string",
		"enum": enum,
	}
	return m, nil
}

func (b *loadableSelectParameter) ToJSONSchema() (any, error) {
	m := map[string]any{
		"type": "array",
		"items": map[string]any{
			"type": "string",
		},
		"uniqueItems": true,
	}
	if !b.Multi {
		m["maxItems"] = 1
	}
	return m, nil
}

func (b *radioParameter) ToJSONSchema() (any, error) {
	m := make(map[string]any)
	options := make([]any, 0, len(b.Options))
	for _, o := range b.Options {
		options = append(options, map[string]any{
			"type":  "string",
			"const": o.Value,
		})
	}
	m["oneOf"] = options
	return m, nil
}

func (b *columnsParameter) ToJSONSchema() (any, error) {
	return nil, nil
}

func (b *variantsParameter) ToJSONSchema() (any, error) {
	options := make([]any, 0, len(b.Variants))
	for _, v := range b.Variants {
		vv := v.(*variant)
		option := make(map[string]any)
		option["type"] = "object"
		option["properties"] = make(map[string]any)
		option["properties"].(map[string]any)["variant"] = map[string]any{
			"type":  "string",
			"const": vv.Name,
		}
		option["additionalProperties"] = false
		option["required"] = []string{"variant"}

		addProperties(option["properties"].(map[string]any), vv.Fields)

		options = append(options, option)
	}
	return map[string]any{
		"anyOf": options,
	}, nil
}

func (b *dictionaryParameter) ToJSONSchema() (any, error) {
	m := make(map[string]any)
	m["type"] = "object"
	m["additionalProperties"] = false
	props := make(map[string]any)
	props["allowRepeats"] = map[string]any{
		"type": "boolean",
	}
	props["dictionaries"] = map[string]any{
		"type": "array",
		"items": map[string]any{
			"type": "string",
		},
		"uniqueItems": true,
	}
	props["select"] = map[string]any{
		"type": "string",
		"enum": []string{"sequential", "random"},
	}
	m["properties"] = props
	return m, nil
}

func (b *checkboxesParameter[T]) ToJSONSchema() (any, error) {
	m := make(map[string]any)
	m["type"] = "object"
	m["additionalProperties"] = false
	m["properties"] = make(map[string]any)
	for _, o := range b.Options {
		m["properties"].(map[string]any)[o.Name] = map[string]any{
			"type": "boolean",
		}
	}
	return m, nil
}

func (b *listParameter) ToJSONSchema() (any, error) {
	return map[string]any{
		"type": "string",
	}, nil
}

func (b *fieldSet) ToJSONSchema() (any, error) {
	return nil, nil
}

func addProperties(m map[string]any, p []Parameter) {
	for _, pr := range p {
		switch pr.GetType() {
		case paramColumns:
			c := pr.(*columnsParameter)
			for _, col := range c.Value {
				addProperties(m, col)
			}
			continue
		case paramFieldSet, paramCollapseSet:
			fs := pr.(*fieldSet)
			addProperties(m, fs.Fields)
		case paramText, paramDivider:
			continue
		default:
			b, err := pr.ToJSONSchema()
			if err != nil {
				log.Fatalf("Failed to convert parameters to json schema: %v", err)
			}
			m[pr.GetName()] = b
		}
	}
}

func (pb *ParametersBlock) ToJSONSchema() (j.RawMessage, error) {
	m := make(map[string]any)

	m["type"] = "object"
	m["additionalProperties"] = false
	m["properties"] = make(map[string]any)

	addProperties(m["properties"].(map[string]any), pb.Parameters)

	return json.Marshal(m)
}

func (p *Params) ToJSONSchema() []j.RawMessage {
	schemas := make([]j.RawMessage, 0, len(*p))
	for _, pb := range *p {
		b, err := pb.ToJSONSchema()
		if err != nil {
			log.Fatalf("Failed to convert proto params to json schema: %v", err)
		}
		schemas = append(schemas, b)
	}
	return schemas
}
