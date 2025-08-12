import { Burger, type BurgerProps } from "@mantine/core";
import type { FC } from "react";

import { useAllUserAttributes } from "@/hooks/useUser";

type OurBurgerProps = {
  alwaysVisible?: boolean;
} & BurgerProps;

export const OurBurger: FC<OurBurgerProps> = ({ alwaysVisible, ...props }) => {
  const { data: attributes, update } = useAllUserAttributes();
  const opened = !(attributes?.ui?.collapseMenu ?? false);
  const toggle = () => {
    update({
      attribute: "ui.collapseMenu",
      value: opened,
    });
  };

  return (
    <Burger
      opened={opened}
      onClick={toggle}
      hiddenFrom={alwaysVisible ? undefined : "sm"}
      size="sm"
      {...props}
    />
  );
};
