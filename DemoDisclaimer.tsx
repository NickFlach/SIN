import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DemoDisclaimerProps {
  variant?: "banner" | "alert";
}

export default function DemoDisclaimer({ variant = "alert" }: DemoDisclaimerProps) {
  if (variant === "banner") {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground py-2 px-4 text-center z-50">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">
            This is a demonstration environment. All data shown is simulated and functionality is limited.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        This is a demonstration environment using simulated data. All metrics, nodes, and applications shown are for illustration purposes only.
      </AlertDescription>
    </Alert>
  );
}