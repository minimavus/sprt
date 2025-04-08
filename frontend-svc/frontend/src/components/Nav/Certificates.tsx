import { FC } from "react";

import { NavSubLink } from "./NavSubLink";
import { SubMenuComponentProps } from "./types";

export const Certificates: FC<SubMenuComponentProps> = ({ asMenu }) => {
  return (
    <>
      <NavSubLink asMenu={asMenu} href="/cert/identity">
        Identity Certificates
      </NavSubLink>
      <NavSubLink asMenu={asMenu} href="/cert/trusted">
        Trusted Certificates
      </NavSubLink>
      <NavSubLink asMenu={asMenu} href="/cert/scep">
        SCEP
      </NavSubLink>
      <NavSubLink asMenu={asMenu} href="/cert/templates">
        Templates
      </NavSubLink>
    </>
  );
};
