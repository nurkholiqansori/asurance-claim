import { Badge } from "@/components/ui/badge";
import { ClaimStatus } from "@/types";

const config: Record<ClaimStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:     { label: "Draft",     variant: "outline" },
  submitted: { label: "Submitted", variant: "secondary" },
  reviewed:  { label: "Reviewed",  variant: "default" },
  approved:  { label: "Approved",  variant: "default" },
  rejected:  { label: "Rejected",  variant: "destructive" },
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  const { label, variant } = config[status] ?? { label: status, variant: "outline" };
  return (
    <Badge variant={variant} className={status === "approved" ? "bg-green-600 hover:bg-green-700" : ""}>
      {label}
    </Badge>
  );
}
