"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Music, Users, UsersRound, CalendarX, LogOut, Menu, ChevronDown, ChevronRight, FolderOpen, UserCircle, Settings, CalendarDays, CalendarClock } from "lucide-react"
import { useState } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav")
  const tc = useTranslations("common")
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRecordsOpen, setIsRecordsOpen] = useState(true)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const recordsItems = [
    { name: t("operators"), href: "/operators", icon: Users },
    { name: t("pairs"), href: "/pairs", icon: UsersRound },
    { name: t("restrictions"), href: "/restrictions", icon: CalendarX },
    { name: t("serviceDays"), href: "/service-days", icon: CalendarDays },
    { name: t("users"), href: "/users", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">{tc("appName")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale="pt-BR" />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="border-t p-4 space-y-2">
            {/* Dashboard Mobile */}
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <Music className="h-5 w-5" />
              <span>{t("dashboard")}</span>
            </Link>

            <Link
              href="/schedules"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === "/schedules"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <CalendarDays className="h-5 w-5" />
              <span>{t("schedules")}</span>
            </Link>

            <div className="space-y-1">
              <button
                onClick={() => setIsRecordsOpen(!isRecordsOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent w-full"
              >
                <FolderOpen className="h-5 w-5" />
                <span className="flex-1 text-left">{t("cadastros")}</span>
                {isRecordsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isRecordsOpen && (
                <div className="ml-4 space-y-1 border-l-2 border-border pl-4">
                  {recordsItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === "/profile"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <UserCircle className="h-5 w-5" />
              <span>{t("profile")}</span>
            </Link>

            

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {tc("logout")}
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 border-r bg-card">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-lg">{tc("appName")}</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {/* Dashboard */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <Music className="h-5 w-5" />
              <span>{t("dashboard")}</span>
            </Link>

            <Link
              href="/schedules"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === "/schedules"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <CalendarDays className="h-5 w-5" />
              <span>{t("schedules")}</span>
            </Link>

            <div className="space-y-1">
              <button
                onClick={() => setIsRecordsOpen(!isRecordsOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent w-full"
              >
                <FolderOpen className="h-5 w-5" />
                <span className="flex-1 text-left">{t("cadastros")}</span>
                {isRecordsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isRecordsOpen && (
                <div className="ml-4 space-y-1 border-l-2 border-border pl-4">
                  {recordsItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === "/profile"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <UserCircle className="h-5 w-5" />
              <span>{t("profile")}</span>
            </Link>

            
          </nav>

          {/* Bottom Actions */}
          <div className="border-t p-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <LanguageSwitcher locale="pt-BR" />
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {tc("logout")}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
