"use client";

import { usePathname } from "next/navigation";
import { User, BookOpen, GraduationCap } from "lucide-react";

export function OnboardingStepper() {
  const pathname = usePathname();

  const steps = [
    { num: 1, path: "/onboarding/2-perfil", label: "Conocerte", icon: User },
    { num: 2, path: "/onboarding/3-materiales", label: "Personalizar", icon: BookOpen },
    { num: 3, path: "/estudiar", label: "Estudiar", icon: GraduationCap },
  ];

  const currentStepNum = steps.find(s => pathname.startsWith(s.path))?.num || 0;

  return (
    <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between relative">
          
          {/* Progress bar background */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
          
          {/* Progress bar active */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStepNum - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {/* Steps */}
          {steps.map((step) => {
            const isActive = step.num === currentStepNum;
            const isCompleted = step.num < currentStepNum;

            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center bg-white px-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                      : isCompleted 
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium mt-2 absolute -bottom-6 whitespace-nowrap ${
                  isActive ? "text-indigo-900" : isCompleted ? "text-indigo-600" : "text-slate-400"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
