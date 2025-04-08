import { ComponentPropsWithRef, forwardRef, ReactNode } from "react";
import cx from "classnames";
import { motion } from "framer-motion";

import styles from "./Tabs.module.scss";

type MultiLevelTabsProps = ComponentPropsWithRef<"ul">;

export const MultiLevelTabs = forwardRef<HTMLUListElement, MultiLevelTabsProps>(
  ({ children, ...props }, ref) => {
    return (
      <nav className={styles.multi_tabs}>
        <ul ref={ref} {...props}>
          {children}
        </ul>
      </nav>
    );
  },
);

type MultiLevelTabsLinkProps =
  | (Omit<ComponentPropsWithRef<"a">, "prefix"> & {
      prefix?: ReactNode;
      suffix?: ReactNode;
      selected?: boolean;
      motioned?: false | undefined;
    })
  | (Omit<ComponentPropsWithRef<typeof motion.a>, "prefix"> & {
      prefix?: ReactNode;
      suffix?: ReactNode;
      selected?: boolean;
      motioned: true;
    });

export const MultiLevelTabsLink = forwardRef<
  HTMLAnchorElement,
  MultiLevelTabsLinkProps
>(({ children, prefix, suffix, selected, motioned, ...props }, ref) => {
  const Element: any = motioned ? motion.a : "a";
  return (
    <Element
      ref={ref}
      {...props}
      className={cx(styles.tab__item__link, {
        [styles.selected]: selected,
        [styles.with_suffix]: Boolean(suffix),
      })}
    >
      {prefix ? (
        <span className={styles.tab__item__link__prefix}>{prefix}</span>
      ) : null}
      <span className={styles.tab__item__link__content}>{children as any}</span>
      {suffix ? (
        <span className={styles.tab__item__link__suffix}>{suffix}</span>
      ) : null}
    </Element>
  );
});

type MultiLevelTabsItemProps =
  | (Omit<ComponentPropsWithRef<"li">, "content"> & {
      content: ReactNode;
      motioned?: false | undefined;
    })
  | (Omit<ComponentPropsWithRef<typeof motion.li>, "content"> & {
      content: ReactNode;
      motioned: true;
    });

export const MultiLevelTabsItem = forwardRef<
  HTMLLIElement,
  MultiLevelTabsItemProps
>(({ children, content, motioned, ...props }, ref) => {
  const Element: any = motioned ? motion.li : "li";
  return (
    <Element ref={ref} {...props}>
      <div className={styles.tab__item}>{content}</div>
      {children}
    </Element>
  );
});
