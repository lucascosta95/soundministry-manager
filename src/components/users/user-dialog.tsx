"use client"

import {useTranslations} from "next-intl"
import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {useEffect, useState} from "react"
import {Loader2} from "lucide-react"
import {createUser, updateUser} from "@/actions/users"

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
  const tc = useTranslations("common")
  const [loading, setLoading] = useState(false)
  const buildInitialFormData = (u?: User): User => ({
    name: u?.name || "",
    email: u?.email || "",
    role: u?.role || "USER",
    password: "",
  })
  const [formData, setFormData] = useState<User>(buildInitialFormData(user))
  useEffect(() => {
    setFormData(buildInitialFormData(user))
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
        const formDataObj = new FormData()
        formDataObj.append("name", formData.name)
        formDataObj.append("email", formData.email)
        formDataObj.append("role", formData.role)
        if (!user && formData.password) {
            formDataObj.append("password", formData.password)
        }

        const result = user
            ? await updateUser(user.id!, {}, formDataObj)
            : await createUser({}, formDataObj)

      if (result.success) {
        onSuccess()
        onOpenChange(false)
        setFormData({ name: "", email: "", role: "USER", password: "" })
      } else {
        alert(result.error || t("createError"))
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
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
