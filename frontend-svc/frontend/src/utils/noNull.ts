type ReplaceNullWithUndefined<T> = T extends null ? undefined : T;
export const noNull = <T>(v: T): ReplaceNullWithUndefined<T> =>
  (v === null ? undefined : v) as any;
