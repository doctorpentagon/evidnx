import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export function LiteraturePage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Literature"
      description="Manually add references with automatic APA/MLA/Harvard citation formatting — built next."
    />
  );
}
