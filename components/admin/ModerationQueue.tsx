"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveFlag, restoreContent, softDelete } from "@/lib/actions";
import { Button, Card, timeAgo } from "@/components/ui/Primitives";
import type { QueueItem } from "@/app/admin/page";

export function ModerationQueue({ items }: { items: QueueItem[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <Card className="mt-8 p-10 text-center">
        <p className="text-[15px] text-muted">
          Nothing flagged. The queue is clear.
        </p>
      </Card>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      {items.map(({ flag, body, displayName, isDeleted }) => (
        <Card key={flag.id} className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-chip bg-cream px-2.5 py-1 text-[12px] font-medium capitalize text-muted">
              {flag.target_type}
            </span>
            {isDeleted ? (
              <span className="rounded-chip bg-menstrual/12 px-2.5 py-1 text-[12px] font-medium text-menstrual">
                Removed
              </span>
            ) : null}
            <span className="text-[13px] text-faint">
              flagged {timeAgo(flag.created_at)}
            </span>
          </div>

          <p className="mt-3 text-[14px] font-medium text-ink">
            {displayName ?? "Author unavailable"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {body ?? "This content is no longer available."}
          </p>

          {flag.reason ? (
            <p className="mt-3 rounded-2xl bg-cream p-3 text-[14px] text-muted">
              Reason given: {flag.reason}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {isDeleted ? (
              <Button
                variant="quiet"
                disabled={pending}
                onClick={() =>
                  run(() => restoreContent(flag.target_type, flag.target_id))
                }
              >
                Restore
              </Button>
            ) : (
              <Button
                variant="quiet"
                disabled={pending}
                onClick={() =>
                  run(() => softDelete(flag.target_type, flag.target_id))
                }
              >
                Remove from feed
              </Button>
            )}
            <Button
              disabled={pending}
              onClick={() => run(() => resolveFlag(flag.id))}
            >
              Mark reviewed
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
