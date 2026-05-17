import type { LucideIcon } from "lucide-react";
import {
  Home,
  Wand2,
  LayoutTemplate,
  PenLine,
  Image,
  Settings,
  Sparkles,
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
      { to: "/", label: "Home", icon: Home },
      { to: "/studio", label: "Studio", icon: Wand2 },
      { to: "/skills", label: "Skills", icon: Sparkles },
    ],
  },
  {
    id: "library",
    title: "Library",
    items: [
      { to: "/templates", label: "Templates", icon: LayoutTemplate },
      { to: "/drafts", label: "Drafts", icon: PenLine },
      { to: "/assets", label: "Assets", icon: Image },
    ],
  },
];

export const footerNav: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
];
