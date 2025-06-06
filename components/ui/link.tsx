"use client";

import NextLink from "next/link";
import { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof NextLink> & {
  external?: boolean;
};

export const Link = ({ external, href, ...props }: LinkProps) => {
  const isExternal =
    external ?? (typeof href === "string" && href.startsWith("http"));

  if (isExternal) {
    return (
      <a
        href={typeof href === "string" ? href : String(href)}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  }

  return <NextLink href={href} {...props} />;
};
