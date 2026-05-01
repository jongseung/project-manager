import { Diamond } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MilestoneMarkerProps {
  name: string;
  status: string;
  offsetDays: number;
  dayWidth: number;
}

export function MilestoneMarker({ name, status, offsetDays, dayWidth }: MilestoneMarkerProps) {
  return (
    <div className="h-9 relative">
      <div className="absolute top-2" style={{ left: offsetDays * dayWidth + dayWidth / 2 - 8 }}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Diamond
                className={cn(
                  "h-5 w-5",
                  status === "reached" ? "text-green-500 fill-green-500" :
                  status === "missed" ? "text-red-500 fill-red-500" :
                  "text-yellow-500 fill-yellow-500"
                )}
              />
            </TooltipTrigger>
            <TooltipContent><p>{name}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
