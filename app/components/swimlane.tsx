import { cn } from "~/utils/cn";

interface SwimlaneProps {
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
}

export function Swimlane({ className, children, ref, style }: SwimlaneProps) {
  return (
    <div
      ref={ref}
      style={style}
      className={cn([
        "grid w-full grid-flow-col justify-start",
        "snap-x snap-mandatory",
        "hidden-scroll overflow-x-scroll",
        className,
      ])}
    >
      {children}
    </div>
  );
}
