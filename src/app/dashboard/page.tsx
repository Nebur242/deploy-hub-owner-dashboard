import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";

/**
 * Renders the dashboard page layout.
 *
 * This component returns a flex column layout that displays section cards above an interactive chart area.
 * The layout applies responsive spacing to ensure a consistent appearance across devices.
 *
 * @returns The JSX element representing the dashboard layout.
 */
export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6">
      <SectionCards />
      <ChartAreaInteractive />
    </div>
  );
}
