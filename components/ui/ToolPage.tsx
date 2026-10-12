import * as React from "react";
import { menuItems, groupConfig, GroupName } from "../Layout/Header";

// Gradient for the icon tile, keyed by sidebar group so every tool's header
// matches the colour of its menu entry.
const GROUP_GRADIENT: Record<GroupName, string> = {
  Data: "from-blue-500 to-indigo-600",
  Encode: "from-emerald-500 to-teal-600",
  Text: "from-orange-500 to-amber-600",
  Util: "from-violet-500 to-purple-600",
  Fun: "from-rose-500 to-pink-600",
};

interface ToolPageProps {
  /** Menu slug — used to pick the icon and group colour. */
  slug: string;
  /** Overrides the menu label as the page title. */
  title?: string;
  description?: React.ReactNode;
  /** Controls rendered on the right side of the header bar. */
  actions?: React.ReactNode;
  /**
   * "fill"   — body is a non-scrolling flex column with no padding (split panes, editors).
   * "scroll" — body scrolls and gets the standard p-4 padding.
   */
  variant?: "fill" | "scroll";
  /** Max width of the scroll body's content. */
  width?: "narrow" | "medium" | "wide" | "full";
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const WIDTH: Record<NonNullable<ToolPageProps["width"]>, string> = {
  narrow: "max-w-2xl",
  medium: "max-w-4xl",
  wide: "max-w-6xl",
  full: "",
};

export default function ToolPage({
  slug,
  title,
  description,
  actions,
  variant = "scroll",
  width = "full",
  icon,
  children,
}: ToolPageProps) {
  const item = menuItems.find((m) => m.slug === slug);
  const Icon = icon || item?.icon;
  const group = (item?.group || "Util") as GroupName;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-base-300/60 bg-base-100 shrink-0 min-h-[52px] flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {Icon && (
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GROUP_GRADIENT[group]} flex items-center justify-center shrink-0 shadow-sm`}
              title={groupConfig[group].label}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight truncate">{title || item?.label}</h1>
            {description && (
              <p className="text-xs opacity-60 leading-snug truncate hidden sm:block">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>

      {variant === "fill" ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className={`${WIDTH[width]} w-full mx-auto flex flex-col gap-4`}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ── Panel: a titled pane used inside split layouts ───────────────────────────
interface PanelProps {
  label: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Panel({ label, actions, footer, children }: PanelProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 h-9 text-xs font-medium border-b border-base-300/60 bg-base-200/40 shrink-0">
        <span className="opacity-70 truncate">{label}</span>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div>
      {footer && <div className="px-3 py-2 border-t border-base-300/60 bg-base-100 shrink-0">{footer}</div>}
    </>
  );
}

// ── Segmented control (Encode / Decode style toggles) ────────────────────────
interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="join">
      {options.map((o) => (
        <button
          key={o.value}
          className={`join-item btn btn-sm ${value === o.value ? "btn-primary" : "btn-soft"}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
