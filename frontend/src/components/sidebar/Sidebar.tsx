import { Hexagon } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { navSections, footerNav } from "./nav-config";

export function Sidebar() {
  return (
    <aside
      className="
        drag
        flex h-full w-[212px] shrink-0 flex-col
        rounded-[20px]
        bg-white/[0.035]
        backdrop-blur-2xl
        shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.07),0_10px_30px_-10px_rgba(0,0,0,0.5)]
      "
    >
      <div className="drag flex h-[56px] shrink-0 items-start justify-end pr-3.5 pt-[7px]">
        <div className="flex items-center gap-1.5 text-white/90">
          <Hexagon
            className="h-4 w-4 fill-(--color-primary)/15 text-(--color-primary)"
            strokeWidth={2}
          />
          <span className="text-[12.5px] font-semibold tracking-tight">Hyperion</span>
        </div>
      </div>

      <div className="no-drag flex-1 overflow-y-auto px-2">
        {navSections.map((section, i) => (
          <div key={section.id} className={i > 0 ? "mt-4" : ""}>
            {section.title ? (
              <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium text-white/40">
                {section.title}
              </div>
            ) : null}
            <ul className="flex flex-col gap-px">
              {section.items.map((item) => (
                <li key={item.to}>
                  <SidebarItem {...item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="no-drag px-2 pb-2 pt-1">
        <ul className="flex flex-col gap-px">
          {footerNav.map((item) => (
            <li key={item.to}>
              <SidebarItem {...item} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
