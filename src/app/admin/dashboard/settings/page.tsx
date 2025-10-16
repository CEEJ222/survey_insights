'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Tag, 
  Users, 
  Plug, 
  Bell,
  Shield,
  Database,
  Globe,
  Key,
  Palette
} from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'General',
      description: 'Basic settings and preferences',
      icon: Settings,
      items: [
        { name: 'Company Information', description: 'Update company name, logo, and details', href: '/admin/dashboard/settings/company' },
        { name: 'Notifications', description: 'Email and in-app notification preferences', href: '/admin/dashboard/settings/notifications' },
        { name: 'Appearance', description: 'Theme, colors, and display preferences', href: '/admin/dashboard/settings/appearance' },
      ]
    },
    {
      title: 'Team & Users',
      description: 'Manage team members and permissions',
      icon: Users,
      items: [
        { name: 'Roles & Permissions', description: 'Configure user roles and access levels', href: '/admin/dashboard/settings/permissions' },
        { name: 'Invitations', description: 'Send and manage team invitations', href: '/admin/dashboard/settings/invitations' },
        { name: 'Team Members', description: 'View and manage admin users', href: '/admin/dashboard/users' },
      ]
    },
    {
      title: 'Data & Analytics',
      description: 'Configure data collection and analysis',
      icon: Database,
      items: [
        { name: 'Tags & Themes', description: 'Manage feedback tags and AI theme discovery', href: '/admin/dashboard/settings/tags' },
        { name: 'Data Export', description: 'Export and backup your data', href: '/admin/dashboard/settings/export' },
        { name: 'Privacy Settings', description: 'Configure data privacy and retention', href: '/admin/dashboard/settings/privacy' },
      ]
    },
    {
      title: 'Integrations',
      description: 'Connect with external services',
      icon: Plug,
      items: [
        { name: 'API Keys', description: 'Manage API keys and webhooks', href: '/admin/dashboard/settings/api' },
        { name: 'Slack Integration', description: 'Connect with Slack for notifications', href: '/admin/dashboard/settings/slack' },
        { name: 'CRM Integration', description: 'Sync with your CRM system', href: '/admin/dashboard/settings/crm' },
      ]
    },
    {
      title: 'Security',
      description: 'Security and compliance settings',
      icon: Shield,
      items: [
        { name: 'Authentication', description: 'Password policies and 2FA settings', href: '/admin/dashboard/settings/auth' },
        { name: 'Audit Logs', description: 'View system activity and changes', href: '/admin/dashboard/settings/audit' },
        { name: 'GDPR Compliance', description: 'Data protection and privacy compliance', href: '/admin/dashboard/settings/gdpr' },
      ]
    }
  ]

  const getStatusBadge = (href: string) => {
    const workingPages = [
      '/admin/dashboard/users',
      '/admin/dashboard/settings/tags'
    ]
    
    if (workingPages.includes(href)) {
      return <Badge variant="default">Available</Badge>
    }
    return <Badge variant="secondary">Coming Soon</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account, team, and application preferences
        </p>
      </div>

      <div className="grid gap-6">
        {settingsCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {category.items.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.href)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Overview of your current settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm text-gray-600">Active Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-gray-600">Active Tags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2</div>
              <div className="text-sm text-gray-600">AI Themes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
