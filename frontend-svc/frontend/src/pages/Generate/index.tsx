import { type FC } from "react";
import { Outlet, useParams } from "react-router-dom";

import { PageLayout } from "@/components/Layout/PageLayout";
import { isRadiusProto, protoNames } from "@/utils/protos";

import { RadiusGeneratePage } from "./RADIUS";
import { TacacsGeneratePage } from "./TACACS";

export const ProtoDisplay: FC = () => {
  const { proto } = useParams();

  return isRadiusProto(proto!) ? (
    <RadiusGeneratePage />
  ) : (
    <TacacsGeneratePage />
  );
};

const Generate: FC = () => {
  const { proto } = useParams();
  return (
    <PageLayout
      title={
        proto && protoNames.has(proto)
          ? `Generate ${protoNames.get(proto)}`
          : "Generate"
      }
      fullHeight={false}
      key={proto}
    >
      {proto ? <Outlet /> : <>Select a protocol to generate</>}
    </PageLayout>
  );
};

export { Generate };
