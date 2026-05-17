import type { LucideIcon } from "lucide-react";
import {
  Hexagon,
  Palette,
  Workflow,
  LayoutPanelTop,
  NotebookPen,
  Images,
  SlidersHorizontal,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: "workspace",
    items: [
      { to: "/", label: "Home", icon: Hexagon },
      { to: "/studio", label: "Studio", icon: Palette },
      { to: "/skills", label: "Skills", icon: Workflow },
    ],
  },
  {
    id: "library",
    title: "Library",
    items: [
      { to: "/templates", label: "Templates", icon: LayoutPanelTop },
      { to: "/drafts", label: "Drafts", icon: NotebookPen },
      { to: "/assets", label: "Assets", icon: Images },
    ],
  },
];

export const footerNav: NavItem[] = [
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
];
