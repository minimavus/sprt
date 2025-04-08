import { lensPath, set as setR } from "rambda";

const set = <T, V>(path: string, value: V, obj: T): T => {
  const l = lensPath(path);

  return setR(l, value, obj);
};

export default set;
