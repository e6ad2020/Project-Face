import { Camera, HelpCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  currentStep: number;
  totalSteps: number;
}

export function BottomNav({ currentStep }: BottomNavProps) {
  // Map steps to the 3 main sections
  // 0: Face shot
  // 1-3: Questions
  // 4-7: Your skin routine

  let activeSection = 0;
  if (currentStep >= 1 && currentStep <= 5) activeSection = 1;
  if (currentStep >= 6) activeSection = 2;

  const sections = [
    { id: 0, label: "Face shot", icon: Camera },
    { id: 1, label: "Questions", icon: HelpCircle },
    { id: 2, label: "Your skin routine", icon: FileText }, // Using FileText instead of a custom cream icon for now
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 bg-background/80 backdrop-blur-sm z-50">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-3 items-end mb-2 px-4">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={cn(
                "flex flex-col gap-2",
                idx === 0 ? "items-start" : idx === 1 ? "items-center" : "items-end"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300",
                  activeSection >= idx
                    ? "bg-[#D946EF] text-white shadow-lg shadow-purple-200"
                    : "bg-transparent text-gray-300 border-2 border-gray-100"
                )}
              >
                <section.icon size={20} strokeWidth={activeSection >= idx ? 2 : 1.5} />
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar Container */}
        <div className="relative h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[#D946EF] transition-all duration-500 ease-out"
            style={{ width: `${((activeSection + 1) / 3) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 mt-2 px-4 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
          <span className="text-left">Face shot</span>
          <span className="text-center">Questions</span>
          <span className="text-right">Your skin routine</span>
        </div>
      </div>
    </div>
  );
}
