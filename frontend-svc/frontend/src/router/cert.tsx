import type { RouteObject } from "react-router-dom";

import { CertificateDetails } from "@/pages/Certificates/CertificateDetails";
import { CertificateTemplates } from "@/pages/Certificates/CertificateTemplates";
import {
  TemplateEditModal,
  templateLoader,
} from "@/pages/Certificates/CertificateTemplates/EditModal";
import { IdentityCertificates } from "@/pages/Certificates/IdentityCertificates";
import { IdentityCertificateFromScep } from "@/pages/Certificates/IdentityCertificates/FromScep";
import { ImportIdentityCertificate } from "@/pages/Certificates/IdentityCertificates/ImportCertificate";
import { UploadIdentityCertificate } from "@/pages/Certificates/IdentityCertificates/UploadCertificate";
import { SCEP, scepLoader } from "@/pages/Certificates/SCEP";
import { SCEPServerEdit } from "@/pages/Certificates/SCEP/SCEPServerEdit";
import { TrustedCertificates } from "@/pages/Certificates/TrustedCertificates";
import { ImportTrustedCertificate } from "@/pages/Certificates/TrustedCertificates/ImportCertificate";
import { UploadTrustedCertificate } from "@/pages/Certificates/TrustedCertificates/UploadCertificate";

export const certRoutes: RouteObject = {
  path: "/cert",
  children: [
    {
      path: "identity",
      element: <IdentityCertificates />,
      handle: { title: "Identity certificates" },
      children: [
        {
          path: "upload",
          element: <UploadIdentityCertificate />,
        },
        {
          path: "import",
          element: <ImportIdentityCertificate />,
        },
        {
          path: "from-scep",
          element: <IdentityCertificateFromScep />,
        },
        {
          path: ":id",
          element: <CertificateDetails type="identity" />,
        },
      ],
    },
    {
      path: "trusted",
      element: <TrustedCertificates />,
      handle: { title: "Trusted certificates" },
      children: [
        {
          path: "upload",
          element: <UploadTrustedCertificate />,
        },
        {
          path: "import",
          element: <ImportTrustedCertificate />,
        },
        {
          path: ":id",
          element: <CertificateDetails type="trusted" />,
        },
      ],
    },
    {
      path: "scep",
      element: <SCEP />,
      handle: { title: "SCEP" },
      loader: scepLoader,
      children: [
        {
          path: "servers/:id",
          element: <SCEPServerEdit />,
        },
        {
          path: "signing-certificates/:id",
          element: <CertificateDetails type="signer" levelsUp={2} />,
        },
      ],
    },
    {
      path: "templates",
      element: <CertificateTemplates />,
      handle: { title: "Certificate templates" },
      children: [
        {
          path: "new",
          element: <TemplateEditModal />,
          loader: templateLoader,
        },
        {
          path: ":id",
          element: <TemplateEditModal />,
          loader: templateLoader,
        },
      ],
    },
  ],
};
