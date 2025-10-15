'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { getCurrentUser, canManageUsers } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { UserPlus, Loader2, MoreVertical, Shield, User, Eye, Trash2 } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    role: 'user',
  })

  useEffect(() => {
    checkPermissions()
    loadUsers()
  }, [])

  const checkPermissions = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      const hasPermission = await canManageUsers(user.id)
      setIsAdmin(hasPermission)
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const loadUsers = async () => {
    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users')
      }

      setUsers(data.users)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.fullName) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    setInviteLoading(true)

    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: inviteForm.email,
          fullName: inviteForm.fullName,
          role: inviteForm.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user')
      }

      toast({
        title: 'User invited!',
        description: `${inviteForm.fullName} has been added to your team. Temporary password: ${data.tempPassword}`,
      })

      setShowInviteDialog(false)
      setInviteForm({ email: '', fullName: '', role: 'user' })
      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite user',
        variant: 'destructive',
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      toast({
        title: 'User updated',
        description: `User has been ${!currentStatus ? 'activated' : 'deactivated'}`,
      })

      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      toast({
        title: 'User deleted',
        description: `${userName} has been removed from your team`,
      })

      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      })
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      company_admin: { label: 'Company Admin', icon: Shield, color: 'text-purple-600 bg-purple-50' },
      admin: { label: 'Admin', icon: Shield, color: 'text-blue-600 bg-blue-50' },
      user: { label: 'User', icon: User, color: 'text-gray-600 bg-gray-50' },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Team Members</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Manage your team and their access levels
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInviteDialog(true)} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            All team members with access to your company's surveys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium truncate">{user.full_name}</h3>
                      {getRoleBadge(user.role)}
                      {!user.is_active && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Added {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {isAdmin && user.role !== 'company_admin' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new user to your team. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User - View Only</SelectItem>
                  <SelectItem value="admin">Admin - Manage Surveys</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {inviteForm.role === 'admin'
                  ? 'Can create and manage surveys, send surveys, and view responses'
                  : 'Can view surveys and responses only'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={inviteLoading}>
              {inviteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

