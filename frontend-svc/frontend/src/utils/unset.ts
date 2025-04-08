import { dissocPath } from "rambda";

const unset = <T>(path: string, obj: T): T => {
  return dissocPath(path, obj);
};

export default unset;
