import type { FC } from "react";

import { NavSubDivider, NavSubLink, NavSubSection } from "./NavSubLink";
import type { SubMenuComponentProps } from "./types";

export const Generate: FC<SubMenuComponentProps> = ({ asMenu }) => {
  return (
    <>
      <NavSubSection asMenu={asMenu}>RADIUS</NavSubSection>
      <NavSubLink asMenu={asMenu} href="/generate/mab">
        MAB
      </NavSubLink>
      <NavSubLink asMenu={asMenu} href="/generate/pap-chap">
        PAP/CHAP
      </NavSubLink>
      <NavSubLink asMenu={asMenu} href="/generate/peap">
        PEAP
      </NavSubLink>
      <NavSubLink asMenu={asMenu} href="/generate/eap-tls">
        EAP-TLS
      </NavSubLink>
      <NavSubDivider asMenu={asMenu} />
      <NavSubSection asMenu={asMenu}>TACACS+</NavSubSection>
      <NavSubLink asMenu={asMenu} href="/generate/tacacs">
        TACACS+
      </NavSubLink>
    </>
  );
};
