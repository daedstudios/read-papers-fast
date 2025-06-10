import { useEffect, useState } from "react";

export default function SurveyProgressBar({ loading }: { loading: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) return;

    let frame: NodeJS.Timeout;

    const increment = () => {
      setProgress((prev) => {
        const next = prev + Math.random() * 5;
        return next >= 95 ? 95 : next;
      });

      frame = setTimeout(increment, 1800);
    };

    increment();

    return () => clearTimeout(frame);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 w-full h-[0.5rem] bg-transparent overflow-hidden mb-4 z-50">
      <div
        className="h-full bg-foreground transition-all duration-300 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
