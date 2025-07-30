import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="fixed inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-[90%] w-xl bg-white border border-foreground rounded-sm shadow-none">
        <PricingTable />
      </div>
    </div>
  );
}
