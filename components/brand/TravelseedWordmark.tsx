import type { ElementType } from "react";

type TravelseedWordmarkProps = {
  as?: ElementType;
  className?: string;
  tone?: "dark" | "light";
};

export function TravelseedWordmark({ as: Component = "span", className = "", tone = "dark" }: TravelseedWordmarkProps) {
  return (
    <Component
      className={`text-[1.35rem] font-semibold leading-none tracking-normal ${tone === "light" ? "text-white" : "text-slate-950"} [font-family:'Optima','Avenir_Next','Inter',ui-sans-serif,system-ui,sans-serif] ${className}`}
    >
      Travelseed
    </Component>
  );
}
