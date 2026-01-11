"use client"

import {useTranslations} from "next-intl"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {Skeleton} from "@/components/ui/skeleton"
import {UserDialog} from "@/components/users/user-dialog"
import {DeleteUserDialog} from "@/components/users/delete-user-dialog"
import {ResetPasswordDialog} from "@/components/users/reset-password-dialog"
import {useToast} from "@/components/ui/use-toast"
import {useEffect, useState} from "react"
import {KeyRound, MoreHorizontal, Pencil, Plus, Trash2} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  preferredTheme: string
  preferredLocale: string
  createdAt: string
}

export default function UsersPage() {
  const t = useTranslations("users")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else if (response.status === 403) {
        toast({
          title: "Access denied",
          description: "You don't have permission to view users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("createError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (message: string) => {
    fetchUsers()
    toast({
      title: message,
    })
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setResetPasswordDialogOpen(true)
  }

  const handleNewUser = () => {
    setSelectedUser(undefined)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
        <Button onClick={handleNewUser}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newUser")}
        </Button>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array(10).fill(null).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {tc("noData")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead>{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === "ADMIN" ? t("roleAdmin") : t("roleUser")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {tc("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            {t("resetPassword")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tc("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => handleSuccess(selectedUser ? t("updateSuccess") : t("createSuccess"))}
        user={selectedUser}
      />

      {selectedUser && (
        <>
          <DeleteUserDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={() => handleSuccess(t("deleteSuccess"))}
            userId={selectedUser.id}
          />

          <ResetPasswordDialog
            open={resetPasswordDialogOpen}
            onOpenChange={setResetPasswordDialogOpen}
            onSuccess={() => handleSuccess(t("resetPasswordSuccess"))}
            userId={selectedUser.id}
          />
        </>
      )}
    </div>
  )
}
