import type { FC } from "react";
import { AppShell } from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { Outlet, useMatches } from "react-router-dom";

import Header from "@/components/Header/Header";
import Nav from "@/components/Nav";
import { useAllUserAttributes } from "@/hooks/useUser";

import { isWithTitle } from "./isWithTitle";

const RootLayout: FC = () => {
  const m = useMatches();
  useDocumentTitle(
    m
      .filter(isWithTitle)
      .map((mt) => mt.handle.title)
      .join(" - "),
  );
  const { data: attributes } = useAllUserAttributes();
  const opened = !(attributes?.ui?.collapseMenu ?? false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: opened ? 300 : 80,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Navbar>
        <Nav />
      </AppShell.Navbar>
      <AppShell.Main display="flex" style={{ flexDirection: "column" }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export { RootLayout };
