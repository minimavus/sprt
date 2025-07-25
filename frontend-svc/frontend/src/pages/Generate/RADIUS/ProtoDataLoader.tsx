import { useObserveEffect } from "@legendapp/state/react";
import { Text } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { type FC, Suspense } from "react";
import { Await, useLoaderData } from "react-router-dom";

import { fadeInClampOut } from "@/animations";

import type { LoaderData } from "../loader";
import styles from "./data_loader.module.scss";
import { radiusParamsStore$ } from "./store";

const ProtoDataSet: FC = () => {
  // const ctx = useFormContext<RadiusForm>();

  useObserveEffect(() => {
    let ofProto =
      radiusParamsStore$.radius.protoSpecific.accessRequest.keys.get();
    if (ofProto?.length) {
      const val = [];
      for (const f of ofProto) {
        const fv =
          radiusParamsStore$.radius.protoSpecific.accessRequest.byName[f].get();
        val.push({
          name: f,
          value: fv.value,
          dictionary: fv.dictionary,
          vendor: fv.vendor,
        });
      }
      radiusParamsStore$.radius.protoSpecific.accessRequest.formValues.set(val);
      // ctx.setValue("radius.attributes.accessRequest", val, {
      //   shouldDirty: false,
      //   shouldValidate: false,
      //   shouldTouch: false,
      // });
    }

    ofProto =
      radiusParamsStore$.radius.protoSpecific.accountingStart.keys.get();
    if (ofProto?.length) {
      const val = [];
      for (const f of ofProto) {
        const fv =
          radiusParamsStore$.radius.protoSpecific.accountingStart.byName[
            f
          ].get();
        val.push({
          name: f,
          value: fv.value,
          dictionary: fv.dictionary,
          vendor: fv.vendor,
        });
      }
      radiusParamsStore$.radius.protoSpecific.accountingStart.formValues.set(
        val,
      );
      // ctx.setValue("radius.attributes.accountingStart", val, {
      //   shouldDirty: false,
      //   shouldValidate: false,
      //   shouldTouch: false,
      // });
    }
  });

  return <></>;
};

export const ProtoDataLoader: FC = () => {
  const data = useLoaderData() as LoaderData;

  return (
    <AnimatePresence>
      <Suspense
        fallback={
          <Text
            component={motion.span}
            className={styles["data-loader"]}
            size="xs"
            {...fadeInClampOut}
          >
            Loading proto data
          </Text>
        }
      >
        <Await resolve={data?.proto}>
          {(d) => (d ? <ProtoDataSet /> : null)}
        </Await>
      </Suspense>
    </AnimatePresence>
  );
};
