"use client"

import {
  Users,
  Package,
  Bug,
  ScrollText,
  Zap,
  Gamepad2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"

const managementItems = [
  {
    title: "NPCs Manager",
    icon: Users,
    id: "npcs",
  },
  {
    title: "Items Manager",
    icon: Package,
    id: "items",
  },
  {
    title: "Monster Manager",
    icon: Bug,
    id: "monsters",
  },
  {
    title: "Quest Manager",
    icon: ScrollText,
    id: "quests",
  },
  {
    title: "Skills Manager",
    icon: Zap,
    id: "skills",
  },
]

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/10">
            <Gamepad2 className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">RZManager</h2>
            <p className="text-xs text-muted-foreground">RPG Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    tooltip={item.title}
                    className="gap-3"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">v1.0.0</p>
          <p className="text-[10px] text-muted-foreground/60">LOSDC Studio</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
