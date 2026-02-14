import type { EnvironmentId } from "@/lib/environment-schemas"

/** Top-level navigation view IDs (non-environment views) */
export type NavigationViewId =
  | "dashboard"
  | "loading"
  | "workspaces"
  | "database-connections"
  | "commit-deploy"
  | "explorer"
  | "compare"
  | "rdb-export"
  | "smart-apply"
  | "settings"

/** Full application view — either a navigation view or an environment */
export type AppView = NavigationViewId | EnvironmentId

/** Views accessible from the top action bar */
export const actionBarViews = [
  "workspaces",
  "database-connections",
  "commit-deploy",
  "explorer",
  "compare",
  "rdb-export",
  "smart-apply",
  "settings",
] as const

export type ActionBarViewId = (typeof actionBarViews)[number]

/** Check whether a given view is one of the top-level module views */
export function isModuleView(view: AppView): view is ActionBarViewId {
  return (actionBarViews as readonly string[]).includes(view)
}
