import React, { useState } from 'react'
import {
  Users,
  Plus,
  Download,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  ShieldCheck,
  ChevronDown,
  Edit3,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApiService } from '@/services/apiService'
import { TableDataSkeleton } from '@/components/common/Skeletons'

export interface UserAccount {
  id: string
  name: string
  email: string
  phone: string
  sellDoLeadId: string
  payment: 'Yes' | 'No'
  role: string
  status: 'Confirmed' | 'Pending' | 'Disabled'
}

export const UsersAccountsTab: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      try {
        const res = await ApiService.getMyTeam()
        const rawItems = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || [])
        
        const isApprovedAccount = (p: any): boolean => {
          if (!p) return false
          if (p.is_approved === true) return true
          const raw = String(p.status || p.kyc_status || '').toUpperCase().trim()
          return raw === 'APPROVED' || raw === 'ACTIVE' || raw === 'CONFIRMED' || raw.includes('APPROV') || p.user?.is_approved === true
        }

        const approvedList = (Array.isArray(rawItems) ? rawItems : []).filter(isApprovedAccount)

        if (approvedList.length > 0) {
          const mapped: UserAccount[] = approvedList.map((p: any, idx: number) => ({
            id: String(p.id || `usr-${idx + 1}`),
            name: p.user?.first_name ? `${p.user.first_name} ${p.user.last_name || ''}`.trim() : (p.company_name || `Partner #${p.id}`),
            email: p.user?.email || '-',
            phone: p.user?.mobile || '-',
            sellDoLeadId: p.superior_code || '-',
            payment: 'No',
            role: p.partner_type || 'Channel Partner',
            status: 'Confirmed',
          }))
          setUsers(mapped)
        } else {
          setUsers([])
        }
      } catch (err) {
        console.warn('Failed to load user accounts:', err)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete user account for "${name}"?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== id))
    }
  }

  const handleEditUser = (user: UserAccount) => {
    const newName = prompt('Edit User Full Name:', user.name)
    if (newName && newName.trim() !== '') {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, name: newName.trim() } : u))
      )
    }
  }

  if (loading) {
    return <TableDataSkeleton rows={6} columns={6} />
  }

  return (
    <div className="space-y-5 text-slate-900 font-semibold">
      {/* Top Action Bar Header (Matching User Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#0092b3]" />
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Users Accounts
          </h1>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Total Count Badge */}
          <div className="border border-[#0092b3]/40 bg-[#0092b3]/10 text-[#0092b3] font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <span>Total :</span>
            <span className="font-extrabold">{users.length}</span>
          </div>

          {/* Add User Dropdown */}
          <Button
            variant="outline"
            size="sm"
            className="border border-[#0092b3]/50 text-[#0092b3] hover:bg-[#0092b3]/10 font-bold text-xs h-8.5 px-3 rounded-lg gap-1.5"
            onClick={() => alert('Add User Form Modal')}
          >
            <span>Add User</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          {/* Exports Dropdown */}
          <Button
            variant="outline"
            size="sm"
            className="border border-[#0092b3]/50 text-[#0092b3] hover:bg-[#0092b3]/10 font-bold text-xs h-8.5 px-3 rounded-lg gap-1.5"
            onClick={() => alert('Exporting Users Data CSV/Excel')}
          >
            <span>Exports</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            className="border border-[#0092b3]/50 text-[#0092b3] hover:bg-[#0092b3]/10 h-8.5 w-8.5 p-0 rounded-lg flex items-center justify-center"
          >
            <Filter className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Users Accounts Table Card (Exact Match to Screenshot) */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#0092b3] text-white font-medium text-xs tracking-wide">
                <th className="py-3 px-5 min-w-[280px] font-medium">Name / Email / Phone</th>
                <th className="py-3 px-4 text-center font-medium">Sell.Do Lead ID</th>
                <th className="py-3 px-4 text-center font-medium">Payment</th>
                <th className="py-3 px-4 text-center font-medium">Role</th>
                <th className="py-3 px-4 text-center font-medium">Status</th>
                <th className="py-3 px-4 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {users.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                >
                  {/* Name / Email / Phone */}
                  <td className="py-3.5 px-5 space-y-0.5">
                    <h4 className="font-medium text-xs text-[#0092b3] hover:underline cursor-pointer">
                      {user.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-normal">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-normal">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  </td>

                  {/* Sell.Do Lead ID */}
                  <td className="py-3.5 px-4 text-center text-slate-600 font-normal">
                    {user.sellDoLeadId}
                  </td>

                  {/* Payment */}
                  <td className="py-3.5 px-4 text-center font-normal text-slate-800">
                    {user.payment}
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 text-center font-normal text-slate-800">
                    {user.role}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-800">
                      {user.status}
                    </span>
                  </td>

                  {/* Actions (Edit & Delete Icons) */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="Edit User Account"
                        className="p-1.5 text-slate-600 hover:text-[#0092b3] hover:bg-[#0092b3]/10 rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        title="Delete User Account"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
