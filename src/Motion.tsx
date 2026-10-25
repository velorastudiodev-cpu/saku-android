import { useEffect, useRef, useState } from "react";
import { money } from "./domain";
export function AnimatedMoney({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      from === value
    ) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 200);
      setDisplay(Math.round(from + (value - from) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <>
      <span aria-hidden="true">{money(display)}</span>
      <span className="sr-only">{money(value)}</span>
    </>
  );
}
export function GoalProgress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const fraction = Math.min(1, Math.max(0, value / max));
  const step = Math.floor(fraction * 4);
  const previous = useRef(step);
  const [milestone, setMilestone] = useState<number | null>(null);
  useEffect(() => {
    if (step > previous.current) setMilestone(step * 25);
    else setMilestone(null);
    previous.current = step;
    const timer = setTimeout(() => setMilestone(null), 2400);
    return () => clearTimeout(timer);
  }, [step]);
  return (
    <>
      <div
        className="goal-progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <span style={{ transform: `scaleX(${fraction})` }} />
      </div>
      {milestone !== null && (
        <span className="goal-milestone" role="status">
          {milestone}% target tercapai
        </span>
      )}
    </>
  );
}
