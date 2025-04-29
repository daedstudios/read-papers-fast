export default function SurveyProgressBar({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const progress = Math.min((step / total) * 100, 100);

  return (
    <div className="fixed top-0 w-full bg-muted  h-[0.5rem] overflow-hidden mb-4">
      <div
        className="h-full bg-black transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
