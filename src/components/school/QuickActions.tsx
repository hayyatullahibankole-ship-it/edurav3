import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Users, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { generateSchoolManual } from "@/utils/schoolManualGenerator";

interface QuickActionsProps {
  onAddStudent: () => void;
  onViewReports: () => void;
  onViewStudents: () => void;
  schoolId: string;
}

export default function QuickActions({ onAddStudent, onViewReports, onViewStudents, schoolId }: QuickActionsProps) {
  const handleDownloadReport = () => {
    toast.info("Report download feature coming soon");
  };

  const handleDownloadManual = () => {
    try {
      generateSchoolManual();
      toast.success("User manual downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download manual. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={onAddStudent}
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-xs font-medium">Add Student</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={handleDownloadManual}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-medium">User Manual</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={onViewStudents}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">View Students</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={onViewReports}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">View Reports</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
