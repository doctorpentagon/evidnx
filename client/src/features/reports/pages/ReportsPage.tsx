import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export function ReportsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Reports"
      description="Compile results into a Results and Discussion report, export to PDF/DOCX — built next."
    />
  );
}
