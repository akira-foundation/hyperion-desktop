import type { LucideIcon } from "lucide-react";
import {
  Home,
  PenLine,
  Inbox,
  Sparkles,
  LayoutTemplate,
  Image,
  Github,
  FileText,
  Calendar,
  Plug,
  Settings,
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
    id: "library",
    title: "Library",
    items: [
      { to: "/", label: "Home", icon: Home },
      { to: "/drafts", label: "Drafts", icon: PenLine, count: 4 },
      { to: "/inbox", label: "Inbox", icon: Inbox },
    ],
  },
  {
    id: "create",
    title: "Create",
    items: [
      { to: "/generate", label: "Generate", icon: Sparkles },
      { to: "/templates", label: "Templates", icon: LayoutTemplate },
      { to: "/renders", label: "Renders", icon: Image },
    ],
  },
  {
    id: "sources",
    title: "Sources",
    items: [
      { to: "/sources/github", label: "GitHub", icon: Github },
      { to: "/sources/markdown", label: "Markdown", icon: FileText },
    ],
  },
  {
    id: "publish",
    title: "Publish",
    items: [
      { to: "/schedule", label: "Schedule", icon: Calendar },
      { to: "/connections", label: "Connections", icon: Plug },
    ],
  },
];

export const footerNav: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
];
