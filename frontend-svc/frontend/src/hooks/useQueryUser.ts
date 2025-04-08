import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type QueryUser = string | null | undefined;
type SetQueryUser = (
  nextUser: QueryUser | ((prev: QueryUser) => QueryUser),
) => void;

export function useQueryUser(): [QueryUser, SetQueryUser] {
  const [sp, setSp] = useSearchParams();
  const user = sp.get("user") || undefined;

  const setQueryUser: SetQueryUser = useCallback(
    (nextUser: QueryUser | ((prev: QueryUser) => QueryUser)) => {
      setSp((prev) => {
        if (typeof nextUser === "function") {
          const pu = prev.get("user");
          if (pu === null) nextUser = nextUser(undefined);
          else nextUser = nextUser(pu);
        }

        if (typeof nextUser === "string") {
          prev.set("user", nextUser);
        } else {
          prev.delete("user");
        }
        return prev;
      });
    },
    [setSp],
  );

  return [user, setQueryUser];
}
