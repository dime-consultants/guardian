import Link from "next/link";
import { ServerOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BackendEmptyState() {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ServerOff className="size-5" />
      </div>
      <h2 className="text-base font-semibold text-foreground">Awaiting Backend Connection</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Connect to the Django backend to view live scrutiny data, or enable Demo Mode.
      </p>
      <Link href="/settings">
        <Button variant="outline" className="mt-4">Configure Backend</Button>
      </Link>
    </div>
  );
}
