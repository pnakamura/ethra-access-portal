import * as React from "react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  TooltipProps,
  LegendProps,
} from "recharts"

import { cn } from "@/lib/utils"

// Chart container component
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: Record<string, any>
  }
>(({ className, config, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "aspect-auto h-[350px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

// Simple chart tooltip
const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  any
>(({ active, payload, label, hideLabel = false, hideIndicator = false, indicator = "dot", className, nameKey, labelKey, ...props }, ref) => {
  if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!hideLabel && label && (
        <p className="text-muted-foreground">{label}</p>
      )}
      <div className="grid gap-1.5">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex w-full items-stretch gap-2">
            {!hideIndicator && (
              <div
                className={cn(
                  "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                  {
                    "h-2.5 w-2.5": indicator === "dot",
                    "w-1": indicator === "line",
                    "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                  }
                )}
                style={{
                  "--color-bg": item.color,
                  "--color-border": item.color,
                } as React.CSSProperties}
              />
            )}
            <div className="flex flex-1 justify-between leading-none">
              <div className="grid gap-1.5">
                <span className="text-muted-foreground">
                  {nameKey ? item.payload?.[nameKey] : item.name}
                </span>
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltip.displayName = "ChartTooltip"

// Chart tooltip content
const ChartTooltipContent = ChartTooltip

// Chart legend content
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: Array<{
      value: string
      type?: string
      color?: string
      dataKey?: string
    }>
    verticalAlign?: "top" | "bottom"
    hideIcon?: boolean
    nameKey?: string
  }
>(({ className, hideIcon = false, payload = [], verticalAlign = "bottom", nameKey }, ref) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" && "pb-3",
        className
      )}
    >
      {payload.map((item, index) => {
        const key = `${nameKey || item.dataKey || "value"}-${index}`

        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            )}
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {item.value}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

// Chart style object for consistent theming
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies Record<string, { label: string; color?: string }>

type ChartConfig = typeof chartConfig

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
}