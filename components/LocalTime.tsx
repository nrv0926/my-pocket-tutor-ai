"use client";

import { useEffect, useState } from "react";

/**
 * Renders a timestamp in the VIEWER's timezone.
 *
 * Calling toLocaleString() inside a server component formats in the
 * server's timezone, which on Vercel is UTC — so a teacher in Ontario saw
 * every session stamped four or five hours late, and an evening session
 * appeared to happen the next morning.
 *
 * The server and the first client paint both render the UTC-anchored date,
 * so hydration matches; the effect then swaps in the local rendering once
 * the browser can tell us where it is.
 */
function stable(iso: string, dateOnly: boolean): string {
  const opts: Intl.DateTimeFormatOptions = dateOnly
    ? { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }
    : { timeZone: "UTC", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  return new Intl.DateTimeFormat("en-CA", opts).format(new Date(iso));
}

export default function LocalTime({
  iso,
  dateOnly = false,
}: {
  iso: string;
  dateOnly?: boolean;
}) {
  const [text, setText] = useState(() => stable(iso, dateOnly));

  useEffect(() => {
    const d = new Date(iso);
    setText(dateOnly ? d.toLocaleDateString() : d.toLocaleString());
  }, [iso, dateOnly]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
