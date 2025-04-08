import React from "react";

// eslint-disable-next-line @typescript-eslint/ban-types
export function fixedForwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactNode,
): (props: P & React.RefAttributes<T>) => React.ReactNode {
  return React.forwardRef(render as any) as any;
}
