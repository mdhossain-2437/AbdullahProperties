import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { OfficeActionState } from "@/features/office/actions";

export function OfficeActionFeedback({ state }: { state: OfficeActionState }) {
  if (state.status === "idle") return null;
  const Icon = state.status === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`office-alert office-alert--${state.status}`} role={state.status === "error" ? "alert" : "status"} tabIndex={-1}>
      <Icon aria-hidden="true" />
      <div><strong>{state.status === "success" ? "Saved" : "Review required"}</strong><p>{state.message}</p></div>
    </div>
  );
}
