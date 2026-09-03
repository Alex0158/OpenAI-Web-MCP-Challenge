import type { ReactNode, SVGProps } from "react";

/** Stable visual IDs from the accepted CP-12 asset vocabulary. */
export const VISUAL_ICON_IDS = [
  "icon_wood",
  "icon_rock",
  "icon_pickaxe",
  "icon_sword",
  "icon_cargo",
  "icon_coin",
  "icon_warning",
  "icon_landmark",
] as const;

export type VisualIconId = (typeof VISUAL_ICON_IDS)[number];

const VISUAL_ICON_ID_SET: ReadonlySet<string> = new Set(VISUAL_ICON_IDS);

export function isVisualIconId(value: string): value is VisualIconId {
  return VISUAL_ICON_ID_SET.has(value);
}

export interface VisualIconProps extends Omit<SVGProps<SVGSVGElement>, "aria-hidden" | "aria-label" | "children" | "name" | "role"> {
  /** A stable ID, or an arbitrary value that will render the explicit fallback marker. */
  name: string;
  /** Add this only when the icon itself needs an accessible name. */
  label?: string;
}

const COMMON_PROPS = {
  stroke: "#1a2c31",
  strokeWidth: 1.25,
  strokeLinejoin: "round" as const,
};

function renderKnownIcon(name: VisualIconId): ReactNode {
  switch (name) {
    case "icon_wood":
      return (
        <>
          <path {...COMMON_PROPS} fill="#8a5a44" d="M4 18h16l-2-4H6z" />
          <path {...COMMON_PROPS} fill="#a56e33" d="M6 14l2-8 4 3 4-4 2 9z" />
          <path fill="#6e4739" d="M9 7l2 2v5H9zm6 0l2-2v9h-2z" />
        </>
      );
    case "icon_rock":
      return (
        <>
          <path {...COMMON_PROPS} fill="#b8c4c2" d="M4 18l3-8 5-3 6 3 2 8-5 2H7z" />
          <path fill="#d8dfd8" d="M8 10l4-2 4 3-4 2z" />
          <path fill="#8f9c9a" d="M6 13l5-1v6H6z" />
        </>
      );
    case "icon_pickaxe":
      return (
        <>
          <path stroke="#8a5a44" strokeWidth="2.5" strokeLinecap="round" d="M7 18L18 7" />
          <path stroke="#b8c4c2" strokeWidth="3" strokeLinecap="round" d="M8 7c4-4 8-4 11-1" />
          <path stroke="#d8dfd8" strokeWidth="1.5" strokeLinecap="round" d="M8 7c4-3 8-3 11-1" />
        </>
      );
    case "icon_sword":
      return (
        <>
          <path {...COMMON_PROPS} fill="#b8c4c2" d="M6 17L17 5l2 2L8 19z" />
          <path fill="#d8dfd8" d="M9 15l8-8 1 1-8 8z" />
          <path {...COMMON_PROPS} fill="#8a5a44" d="M5 18l3-3 2 2-3 3z" />
          <path stroke="#f4b942" strokeWidth="1.5" strokeLinecap="round" d="M7 15l3 3" />
        </>
      );
    case "icon_cargo":
      return (
        <>
          <path {...COMMON_PROPS} fill="#8a5a44" d="M4 8h16v11H4z" />
          <path {...COMMON_PROPS} fill="#a56e33" d="M4 8l3-3h10l3 3z" />
          <path fill="#f8e48b" d="M11 5h2v14h-2z" />
        </>
      );
    case "icon_coin":
      return (
        <>
          <circle {...COMMON_PROPS} fill="#f4b942" cx="12" cy="12" r="8" />
          <circle fill="none" stroke="#f8e48b" strokeWidth="1.25" cx="12" cy="12" r="5" />
          <path fill="#8a5a44" d="M11 8h2v8h-2zM9 10h6v2H9zM9 14h6v2H9z" />
        </>
      );
    case "icon_warning":
      return (
        <>
          <path {...COMMON_PROPS} fill="#f4b942" d="M12 3l10 17H2z" />
          <path fill="#1a2c31" d="M11 8h2v6h-2zm0 8h2v2h-2z" />
        </>
      );
    case "icon_landmark":
      return (
        <>
          <path {...COMMON_PROPS} fill="#f4b942" d="M5 5h12l-6 5 6 5H5z" />
          <path {...COMMON_PROPS} fill="#8a5a44" d="M5 4h2v16H5z" />
          <path {...COMMON_PROPS} fill="#b8c4c2" d="M3 20h7v2H3z" />
        </>
      );
  }
}

function renderFallback(): ReactNode {
  return (
    <>
      <path {...COMMON_PROPS} fill="#7d8f88" d="M12 3l10 17H2z" />
      <path fill="#08130f" d="M11 8h2v6h-2zm0 8h2v2h-2z" />
    </>
  );
}

export function VisualIcon({ name, label, className, ...svgProps }: VisualIconProps) {
  const known = isVisualIconId(name);
  const accessible = typeof label === "string" && label.trim() !== "";

  return (
    <svg
      {...svgProps}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      focusable="false"
      data-asset-id={known ? name : "unknown"}
      data-state="normal"
      {...(!known ? { "data-asset-fallback": "true", "data-requested-asset": name } : {})}
      {...(accessible
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      {known ? renderKnownIcon(name) : renderFallback()}
    </svg>
  );
}
