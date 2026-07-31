import { OnboardingStepper } from "@/components/OnboardingStepper";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col bg-slate-50">
      <OnboardingStepper />
      <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 pb-24">
        {children}
      </div>
    </div>
  );
}
