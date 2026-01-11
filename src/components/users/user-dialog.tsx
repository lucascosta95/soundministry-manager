"use client"

import {useTranslations} from "next-intl"
import {Button} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {useState} from "react"
import {Loader2} from "lucide-react"

interface User {
  id?: string
  name: string
  email: string
  role: string
  password?: string
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user?: User
}

export function UserDialog({ open, onOpenChange, onSuccess, user }: UserDialogProps) {
  const t = useTranslations("users")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<User>({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "USER",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = user ? `/api/users/${user.id}` : "/api/users"
      const method = user ? "PUT" : "POST"
      
      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      if (!user && formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setFormData({ name: "", email: "", role: "USER", password: "" })
      } else {
        const data = await response.json()
        alert(data.error || t("createError"))
      }
    } catch (error) {
      alert(t("createError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? t("editUser") : t("newUser")}</DialogTitle>
          <DialogDescription>
            {user ? t("editUser") : t("newUser")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t("role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t("roleUser")}</SelectItem>
                  <SelectItem value="ADMIN">{t("roleAdmin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!user && (
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t("passwordOptional")}
                />
                <p className="text-xs text-muted-foreground">{t("defaultPassword")}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("actions")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("actions")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
