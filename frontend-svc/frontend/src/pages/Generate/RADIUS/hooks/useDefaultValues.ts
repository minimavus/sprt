import { useRef } from "react";
import { useAsyncValue } from "react-router-dom";

import {
  getDefaultValue,
  //radiusForm,
  type RadiusForm,
} from "../form";

export const useDefaultValues = () => {
  const [raw] = useAsyncValue() as [unknown, unknown];

  const cached = useRef<RadiusForm | null>(null);

  if (cached.current) {
    return cached.current;
  }

  cached.current = (raw as any) ?? getDefaultValue();

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
