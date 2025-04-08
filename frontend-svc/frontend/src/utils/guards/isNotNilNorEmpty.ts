import { isEmpty, isNil } from "rambda";

export const isNotNilNorEmpty = <T>(
  value: T,
): value is Exclude<T, undefined | null> => !isNil(value) && !isEmpty(value);
