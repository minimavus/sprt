import "react";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

declare global {
  type NonFalsy<T> = T extends false | 0 | "" | null | undefined | 0n
    ? never
    : T;

  interface Array<T> {
    filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
  }

  interface ReadonlyArray<T> {
    filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  type NonFunctionGuard<T> = T extends Function ? never : T;

  // eslint-disable-next-line @typescript-eslint/ban-types
  type StringWithKnownValues<T> = T | (string & {});

  type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

  type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  type Camelize<T extends string> = T extends `${infer A}-${infer B}`
    ? `${A}${Capitalize<B>}`
    : T;

  type CapitalizeSnakeCase<T extends string> = T extends `${infer F}_${infer R}`
    ? `${Capitalize<F>}${CapitalizeSnakeCase<R>}`
    : Capitalize<T>;

  type Prettify<T> = {
    [K in keyof T]: T[K];
  } & {};

  type DeepNonNullable<T> = { [K in keyof T]: NonNullable<T[K]> };

  interface Map<K, V> {
    // Works if there are other known strings.
    has<KnownKeys extends string, CheckedString extends string>(
      this: MapWith<string, V, KnownKeys>,
      key: CheckedString,
    ): this is MapWith<K, V, CheckedString | KnownKeys>;

    has<CheckedString extends string>(
      this: Map<string, V>,
      key: CheckedString,
    ): this is MapWith<K, V, CheckedString>;
  }

  interface MapWith<K, V, DefiniteKey extends K> extends Map<K, V> {
    get(k: DefiniteKey): V;
    get(k: K): V | undefined;
  }
}
