import { Suspense } from "react";
import SharedFactCheckClient from "./SharedFactCheckClient";

type Props = {
  params: Promise<{ shareableId: string }>;
};

export default async function SharedFactCheckPage({ params }: Props) {
  const { shareableId } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      }
    >
      <SharedFactCheckClient shareableId={shareableId} />
    </Suspense>
  );
}
