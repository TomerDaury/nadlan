import { Badge } from "@/components/ui/badge";

// Whether the client still receives updates (notifications_active).
export function UpdatesBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "success" : "neutral"}>{active ? "פעיל" : "לא פעיל"}</Badge>;
}
