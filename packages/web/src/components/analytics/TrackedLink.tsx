"use client";

import Link, { type LinkProps } from "next/link";
import { type ReactNode } from "react";
import {
  trackLaunchEvent,
  type LaunchEventName,
  type LaunchEventPayload,
} from "@/lib/analytics/launch-events";

type TrackedLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  eventName: LaunchEventName;
  eventPayload: LaunchEventPayload;
};

export function TrackedLink({
  children,
  className,
  eventName,
  eventPayload,
  ...linkProps
}: TrackedLinkProps) {
  return (
    <Link
      {...linkProps}
      className={className}
      onClick={() => {
        trackLaunchEvent(eventName, eventPayload);
      }}
    >
      {children}
    </Link>
  );
}
