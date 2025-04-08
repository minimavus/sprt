import { RouteObject } from "react-router-dom";

export const isWithTitle = <T extends RouteObject>(
  v: T,
): v is T & { handle: { title: string } } =>
  typeof (v.handle?.title as unknown) === "string";
