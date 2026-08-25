import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-butter-100 dark:bg-butter-900/30 flex items-center justify-center mb-6">
        <Construction className="w-10 h-10 text-butter-600 dark:text-butter-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h1>
      <p className="text-muted-foreground max-w-xs mb-8">
        The Study Hub is getting a major upgrade. Check back shortly for an even better learning experience.
      </p>
      <Button onClick={() => navigate(-1)} variant="outline" className="gap-2 rounded-full">
        <ArrowLeft className="w-4 h-4" />
        Go back
      </Button>
    </div>
  );
}
