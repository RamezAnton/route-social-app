import { Tooltip } from "@heroui/react";
import { timeAgo, formatExactDate } from "../../utils/timeAgo";

export function DateWithTooltip({ value }: { value?: string }) {
  const exact = formatExactDate(value);
  const label = value ? timeAgo(value) : "";
  if (!exact) return <span>{label}</span>;
  return (
    <Tooltip delay={200} closeDelay={100}>
      <Tooltip.Trigger>
        <span className="cursor-default hover:underline">{label}</span>
      </Tooltip.Trigger>
      <Tooltip.Content showArrow>{exact}</Tooltip.Content>
    </Tooltip>
  );
}
