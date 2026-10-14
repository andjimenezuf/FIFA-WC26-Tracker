import { ServerOff } from "lucide-react";
import { Notice } from "@/components/ui/notice";

/** Placeholder for any page whose data comes from the FastAPI backend, which
 *  doesn't exist yet — this frontend was scaffolded ahead of it on purpose so
 *  the app's shape (routing, header, design system) could be checked early. */
export function BackendPending({ page }: { page: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 items-start justify-center p-6">
      <Notice icon={ServerOff} tone="amber">
        {page} needs the FastAPI + Python ADK backend, which hasn't been built
        yet.
      </Notice>
    </div>
  );
}
