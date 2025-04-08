import logLevel from "loglevel";

import { api } from "@/utils/apiCompose";

import { default as remote } from "./loglevel-plugin-remote";

const log = remote
  .apply(logLevel, {
    url: api.v2`logger`,
    format: remote.json,
    level: "warn",
  })
  .getLogger("pool-manager-ui");
log.setLevel("DEBUG");
export { log };
