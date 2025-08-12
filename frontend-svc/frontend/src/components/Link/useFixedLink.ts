import { type MouseEvent as ReactMouseEvent, useCallback } from "react";
import { type To, useHref, useLinkClickHandler } from "react-router-dom";

import { useQueryUser } from "@/hooks/useQueryUser";

export type FixedLinkProps = {
  target?: React.HTMLAttributeAnchorTarget | undefined;
  replace?: boolean | undefined;
  state?: any;
  onClick?: (event: ReactMouseEvent<HTMLAnchorElement, MouseEvent>) => void;
};

const isAbsoluteURL = (url: To): url is `http${string}` => {
  return typeof url === "string" && /^https?:\/\//.test(url);
};

const parseTo = (to: To): Exclude<To, string> => {
  if (typeof to !== "string") {
    return to;
  }

  let pathname = "",
    search = "",
    hash = "";

  if (to.includes("#")) {
    const idx = to.indexOf("#");
    hash = to.slice(idx + 1);
    to = to.slice(0, idx);
  }

  if (to.includes("?")) {
    const idx = to.indexOf("?");
    pathname = to.slice(0, idx);
    search = to.slice(idx + 1);
  }

  if (pathname === "") {
    pathname = to;
  }

  return { pathname, search, hash };
};

const useToWithUser = (to: To, absolute: boolean): To => {
  const [user] = useQueryUser();
  if (!user) {
    return to;
  }

  if (absolute) {
    return to;
  }

  const parsed = parseTo(to);
  const params = new URLSearchParams(parsed.search);
  if (params.has("user")) {
    return to;
  }

  params.set("user", user);
  parsed.search = params.toString();

  return parsed;
};

export const useFixedLink = (
  to: To,
  { replace, target, state, onClick: _onClick }: FixedLinkProps = {},
) => {
  const absolute = isAbsoluteURL(to);
  to = useToWithUser(to, absolute);

  const href = useHref(to);
  const handleClick = useLinkClickHandler(to, {
    replace,
    state,
    target,
  });

  const onClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement, MouseEvent>) => {
      _onClick?.(event);
      if (!event.defaultPrevented) {
        handleClick(event);
      }
    },
    [_onClick, handleClick],
  );

  return { href: absolute ? (to as string) : href, onClick, target };
};
