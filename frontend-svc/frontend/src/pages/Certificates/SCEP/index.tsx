import { FC, Suspense } from "react";
import { Stack } from "@mantine/core";
import { DefaultError } from "@tanstack/react-query";
import { Await, LoaderFunction, Outlet, useLoaderData } from "react-router-dom";

import { AwaitError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import {
  CertificatesByTypeResponse,
  getCertificatesOfTypeKeyAndEnsureDefaults,
} from "@/hooks/certificates";
import {
  getScepServersKeyAndEnsureDefaults,
  ScepServers,
} from "@/hooks/certificates/scep";
import { queryClient } from "@/hooks/queryClient";

import { SCEPServers } from "./Servers";
import { SCEPSigningCertificates } from "./SigningCertificates";

const Page: FC = () => {
  const data = useLoaderData() as LoaderData;
  return (
    <>
      <PageLayout fullHeight={false} uncontained title={false}>
        <Suspense fallback={<DefaultLoaderFallback />}>
          <Await
            resolve={data.data}
            errorElement={<AwaitError before={null} />}
          >
            <Stack gap="lg" flex={1}>
              <SCEPServers />
              <SCEPSigningCertificates />
            </Stack>
          </Await>
        </Suspense>
      </PageLayout>
      <Outlet />
    </>
  );
};

export { Page as SCEP };

export type LoaderData = {
  data: Promise<[ScepServers | null, CertificatesByTypeResponse]>;
};

export const scepLoader: LoaderFunction = async ({ request }) => {
  const user = new URL(request.url).searchParams.get("user");

  const serversKey = getScepServersKeyAndEnsureDefaults(user);
  const signingCertificatesKey = getCertificatesOfTypeKeyAndEnsureDefaults(
    "signer",
    user,
  );

  const servers = queryClient.ensureQueryData<
    unknown,
    DefaultError,
    ScepServers | null
  >({
    queryKey: serversKey,
  });
  const signingCertificates = queryClient.ensureQueryData<
    unknown,
    DefaultError,
    CertificatesByTypeResponse
  >({
    queryKey: signingCertificatesKey,
  });

  return {
    data: Promise.all([servers, signingCertificates]),
  };
};
