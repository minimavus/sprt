function methodFactory(method: string) {
  return function (template: TemplateStringsArray, ...params: string[]) {
    let s = "";
    for (let i = 0; i < template.length; i++) {
      s += template[i] + (params[i] ?? "");
    }
    if (s.length > 0 && s[0] !== "/") s = `/${s}`;
    return `/api/${method}${s}` as const;
  };
}

const api = { v2: methodFactory("v2"), ui: methodFactory("ui") };

export { api };
