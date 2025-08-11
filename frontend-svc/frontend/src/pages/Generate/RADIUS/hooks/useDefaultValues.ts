import { useRef } from "react";
import { useAsyncValue, useParams } from "react-router-dom";

import {
  getDefaultValue,
  //radiusForm,
  type RadiusForm,
} from "../form";

export const useDefaultValues = () => {
  const [raw] = useAsyncValue() as [unknown, unknown];
  const { proto } = useParams<{ proto: string }>();

  const cached = useRef<RadiusForm | null>(null);

  if (cached.current) {
    return cached.current;
  }

  if ((raw as RadiusForm)?.general?.job) {
    (raw as RadiusForm).general.job.proto = proto!;
  }

  cached.current = (raw as any) ?? getDefaultValue(proto!);

  // if (raw) {
  // const { success, data, error } = radiusForm.safeParse(raw);
  // if (success) {
  //   cached.current = data;
  // } else {
  //   console.error(error);
  //   cached.current = getDefaultValue();
  // }
  // }

  return cached.current as RadiusForm;
};
