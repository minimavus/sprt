import { type LogLevel, type MethodFactory, type RootLogger } from "loglevel";
import { mergeDeepRight } from "rambda";

declare global {
  interface Window {
    remote: any;
  }
}

let CIRCULAR_ERROR_MESSAGE: string;

// https://github.com/nodejs/node/blob/master/lib/util.js
function tryStringify(arg: unknown) {
  try {
    return JSON.stringify(arg);
  } catch (error) {
    // Populate the circular error message lazily
    if (!CIRCULAR_ERROR_MESSAGE) {
      try {
        const a = {} as Record<string, unknown>;
        a.a = a;
        JSON.stringify(a);
      } catch (circular) {
        CIRCULAR_ERROR_MESSAGE = (circular as Error).message;
      }
    }
    if ((error as Error).message === CIRCULAR_ERROR_MESSAGE) {
      return "[Circular]";
    }
    throw error;
  }
}

function getConstructorName(obj: unknown) {
  if (!Object.getOwnPropertyDescriptor || !Object.getPrototypeOf) {
    return Object.prototype.toString.call(obj).slice(8, -1);
  }

  // https://github.com/nodejs/node/blob/master/lib/internal/util.js
  while (obj) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, "constructor");
    if (
      descriptor !== undefined &&
      typeof descriptor.value === "function" &&
      descriptor.value.name !== ""
    ) {
      return descriptor.value.name;
    }

    obj = Object.getPrototypeOf(obj);
  }

  return "";
}

function interpolate(array: unknown[]) {
  let result = "";
  let index = 0;

  if (array.length > 1 && typeof array[0] === "string") {
    result = array[0].replace(
      /(%?)(%([sdjo]))/g,
      (match, escaped, _ptn, flag) => {
        if (!escaped) {
          index += 1;
          const arg = array[index];
          let a = "";
          switch (flag) {
            case "s":
              a += arg;
              break;
            case "d":
              a += +(arg as number);
              break;
            case "j":
              a = tryStringify(arg);
              break;
            case "o": {
              let obj = tryStringify(arg);
              if (obj[0] !== "{" && obj[0] !== "[") {
                obj = `<${obj}>`;
              }
              a = getConstructorName(arg) + obj;
              break;
            }
          }
          return a;
        }
        return match;
      }
    );

    // update escaped %% values
    result = result.replace(/%{2,2}/g, "%");

    index += 1;
  }

  // arguments remaining after formatting
  if (array.length > index) {
    if (result) result += " ";
    result += array.slice(index).join(" ");
  }

  return result;
}

const { hasOwnProperty } = Object.prototype;

function getStacktrace() {
  try {
    throw new Error();
  } catch (trace) {
    return (trace as Error).stack;
  }
}

class Queue<T> {
  _queue: T[] = [];
  _sent: T[] = [];
  capacity: number;
  content = "";

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  length() {
    return this._queue.length;
  }

  sent() {
    return this._sent.length;
  }

  push(message: T) {
    this._queue.push(message);
    if (this._queue.length > this.capacity) {
      this._queue.shift();
    }
  }

  send() {
    if (!this._sent.length) {
      this._sent = this._queue;
      this._queue = [];
    }
    return this._sent;
  }

  confirm() {
    this._sent = [];
    this.content = "";
  }

  fail() {
    const overflow = 1 + this._queue.length + this._sent.length - this.capacity;

    if (overflow > 0) {
      this._sent.splice(0, overflow);
      this._queue = this._sent.concat(this._queue);
      this.confirm();
    }
    // if (queue.length + sent.length >= capacity) this.confirm();
  }
}

const hasStacktraceSupport = !!getStacktrace();

let loglevel: RootLogger | undefined;
let originalFactory: MethodFactory;
let pluginFactory: MethodFactory | undefined;

function plain(log: any) {
  return `[${log.timestamp}] ${log.level.label.toUpperCase()}${
    log.logger ? ` (${log.logger})` : ""
  }: ${log.message}${log.stacktrace ? `\n${log.stacktrace}` : ""}`;
}

function json(log: any) {
  log.level = log.level.label;
  return log;
}

function setToken() {
  throw new Error("You can't set token for a not appled plugin");
}

const save = window.remote;

const defaultCapacity = 500;

type Options = Partial<{
  url: string;
  method: string;
  headers: Record<string, string>;
  token: string;
  onUnauthorized: (token?: string) => void;
  timeout: number;
  interval: number;
  level: string;
  backoff:
    | {
        multiplier: number;
        jitter: number;
        limit: number;
      }
    | ((duration: number) => number);
  capacity: number;
  stacktrace: {
    levels: string[];
    depth: number;
    excess: number;
  };
  timestamp: () => string;
  format: (log: any) => string;
}>;

const defaults: Options = {
  url: "/logger",
  method: "POST",
  headers: {},
  token: "",
  onUnauthorized: () => void 0,
  timeout: 0,
  interval: 1000,
  level: "trace",
  backoff: {
    multiplier: 2,
    jitter: 0.1,
    limit: 30000,
  },
  capacity: 0,
  stacktrace: {
    levels: ["trace", "warn", "error"],
    depth: 3,
    excess: 0,
  },
  timestamp: () => new Date().toISOString(),
  format: plain,
};

type Remote = {
  noConflict: () => Remote;
  plain: (log: any) => string;
  json: (log: any) => any;
  apply(logger: RootLogger, options: Partial<Options>): RootLogger;
  disable(): void;
  setToken: (token?: string) => void;
};

const remote: Remote = {
  noConflict() {
    if (typeof window === "undefined") return remote;
    if (window.remote === remote) {
      window.remote = save;
    }
    return remote;
  },
  plain,
  json,
  apply(logger: RootLogger, options: Partial<Options>) {
    if (typeof window === "undefined") throw new Error("Only for browser");

    if (!logger || !logger.getLogger) {
      throw new TypeError("Argument is not a root loglevel object");
    }

    if (loglevel) {
      throw new Error("You can assign a plugin only one time");
    }

    if (!window.XMLHttpRequest) return logger;

    loglevel = logger;

    const config = mergeDeepRight<Options>(defaults, options);

    config.capacity = config.capacity || defaultCapacity;

    const { backoff } = config;

    const backoffFunc =
      typeof backoff === "object"
        ? (duration: number) => {
            let next = duration * backoff.multiplier;
            if (next > backoff.limit) next = backoff.limit;
            next += next * backoff.jitter * Math.random();
            return next;
          }
        : backoff;

    let { interval } = config;
    let contentType: string;
    let isJSON: boolean;
    let isSending = false;
    let isSuspended = false;

    const queue = new Queue(config.capacity);

    function send() {
      if (isSuspended || isSending || config.token === undefined) {
        return;
      }

      if (!queue.sent()) {
        if (!queue.length()) {
          return;
        }

        const logs = queue.send();

        queue.content = isJSON
          ? `{"logs":[${logs.join(",")}]}`
          : logs.join("\n");
      }

      isSending = true;

      const xhr = new window.XMLHttpRequest();
      xhr.open(config.method!, config.url!, true);
      xhr.setRequestHeader("Content-Type", contentType);
      if (config.token) {
        xhr.setRequestHeader("Authorization", `Bearer ${config.token}`);
      }

      const { headers } = config;
      for (const header in headers) {
        if (hasOwnProperty.call(headers, header)) {
          const value = (headers as Record<string, string>)[header];
          if (value) {
            xhr.setRequestHeader(header, value);
          }
        }
      }

      function suspend(successful?: boolean) {
        if (!successful) {
          // interval = config.backoff(interval || 1);
          interval = backoffFunc?.(interval || 1);
          queue.fail();
        }

        isSuspended = true;
        window.setTimeout(() => {
          isSuspended = false;
          send();
        }, interval);
      }

      let timeout: number;
      if (config.timeout) {
        timeout = window.setTimeout(() => {
          isSending = false;
          xhr.abort();
          suspend();
        }, config.timeout);
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) {
          return;
        }

        isSending = false;
        window.clearTimeout(timeout);

        if (xhr.status === 200) {
          // eslint-disable-next-line prefer-destructuring
          interval = config.interval;
          queue.confirm();
          suspend(true);
        } else {
          if (xhr.status === 401) {
            const { token } = config;
            config.token = undefined;
            config.onUnauthorized?.(token);
          }
          suspend();
        }
      };

      xhr.send(queue.content);
    }

    originalFactory = logger.methodFactory;

    pluginFactory = function remoteMethodFactory(
      methodName,
      logLevel,
      loggerName
    ) {
      const rawMethod = originalFactory(methodName, logLevel, loggerName);
      const needStack =
        hasStacktraceSupport &&
        config.stacktrace!.levels.some((level) => level === methodName);
      const levelVal =
        loglevel!.levels[methodName.toUpperCase() as keyof LogLevel];
      const needLog =
        levelVal >=
        loglevel!.levels[config.level!.toUpperCase() as keyof LogLevel];

      return (...args) => {
        if (needLog) {
          const timestamp = config.timestamp!();

          let stacktrace = needStack ? getStacktrace() : "";
          if (stacktrace) {
            const lines = stacktrace.split("\n");
            lines.splice(0, config.stacktrace!.excess + 3);
            const { depth } = config.stacktrace!;
            if (depth && lines.length !== depth + 1) {
              const shrink = lines.splice(0, depth);
              stacktrace = shrink.join("\n");
              if (lines.length) stacktrace += `\n    and ${lines.length} more`;
            } else {
              stacktrace = lines.join("\n");
            }
          }

          const log = config.format!({
            message: interpolate(args),
            level: {
              label: methodName,
              value: levelVal,
            },
            logger: loggerName || "",
            timestamp,
            stacktrace,
          });

          if (isJSON === undefined) {
            isJSON = typeof log !== "string";
            contentType = isJSON ? "application/json" : "text/plain";
          }

          let content = "";
          if (isJSON) {
            try {
              content += JSON.stringify(log);
            } catch (error) {
              rawMethod(...args);
              loglevel!.getLogger("logger").error(error);
              return;
            }
          } else {
            content += log;
          }

          queue.push(content);
          send();
        }

        rawMethod(...args);
      };
    };

    logger.methodFactory = pluginFactory;
    logger.setLevel(logger.getLevel());

    remote.setToken = (token) => {
      config.token = token;
      send();
    };

    return logger;
  },
  disable() {
    if (!loglevel) {
      throw new Error("You can't disable a not applied plugin");
    }

    if (pluginFactory !== loglevel.methodFactory) {
      throw new Error(
        "You can't disable a plugin after applying another plugin"
      );
    }

    loglevel.methodFactory = originalFactory;
    loglevel.setLevel(loglevel.getLevel());
    loglevel = undefined;
    remote.setToken = setToken;
  },
  setToken,
};

export default remote;
