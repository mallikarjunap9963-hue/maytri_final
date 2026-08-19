import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  LayoutDashboard,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Building2,
  Phone,
  UserCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Lead, Project } from '@/data/appData'
import { ApiService, AuthToken } from '@/services/apiService'
import { LeadsTableSkeleton } from '@/components/common/Skeletons'
import { LeadDetailPage } from '@/components/crm/LeadDetailPage'
import { toast } from '@/components/common/ToastNotification'
import { cn } from '@/lib/utils'

interface MyLeadsTabProps {
  onNavigateToDashboard?: () => void
  onScheduleVisitForLead?: (lead: Lead) => void
  refreshKey?: number
}

const STAGES: Lead['stage'][] = [
  'New',
  'Contacted',
  'Follow Up',
  'Interested',
  'Converted',
  'Lost',
]

const STAGE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; rowBg?: string }
> = {
  New: {
    label: 'New',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'New Inquiry': {
    label: 'New',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Contacted: {
    label: 'Contacted',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  'Follow Up': {
    label: 'Follow Up',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  'Site Visit Scheduled': {
    label: 'Site Visit',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  Interested: {
    label: 'Interested',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'Token / Negotiation': {
    label: 'Negotiation',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'Loan Processing': {
    label: 'Loan Processing',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  Converted: {
    label: 'Converted',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  Booked: {
    label: 'Booked',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  Lost: {
    label: 'Lost',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

// Strict helper to match lead with project
const isLeadMatchingProject = (lead: Lead, projectFilterName: string): boolean => {
  if (!lead || !projectFilterName || projectFilterName === 'ALL') return true
  const target = projectFilterName.toLowerCase().trim()
  const leadProj = (lead.project || (lead as any).project_name || '').toLowerCase().trim()
  if (leadProj) {
    if (leadProj === target || leadProj.includes(target) || target.includes(leadProj)) {
      return true
    }
  }
  return false
}

export const MyLeadsTab: React.FC<MyLeadsTabProps> = ({
  onNavigateToDashboard,
  onScheduleVisitForLead,
  refreshKey,
}) => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL')
  const [stageFilter, setStageFilter] = useState<string>('ALL')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editStatus, setEditStatus] = useState<Lead['stage']>('New Inquiry')
  const [editName, setEditName] = useState<string>('')
  const [editPhone, setEditPhone] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false)

  // Delete Lead State
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const handleConfirmDelete = async () => {
    if (!deletingLead) return
    setIsDeleting(true)
    const target = deletingLead
    const numericId = target.rawId ? Number(target.rawId) : Number(target.id.replace(/\D/g, ''))

    try {
      if (numericId && !isNaN(numericId)) {
        await ApiService.deleteLead(numericId)
      } else {
        await ApiService.deleteLead(target.id)
      }

      setLeads((prev) => prev.filter((l) => l.id !== target.id && l.rawId !== target.rawId))
      if (selectedLead && (selectedLead.id === target.id || selectedLead.rawId === target.rawId)) {
        setSelectedLead(null)
      }

      toast.success('Lead Deleted', `Lead "${target.name}" has been deleted from live database.`)
      setDeletingLead(null)
    } catch (err) {
      console.warn('Failed to delete lead:', err)
      toast.error('Delete Failed', 'Could not delete lead. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Current User Identification
  const currentUser = AuthToken.getUser()
  const currentUserName = (
    localStorage.getItem('maytri_profile_name') ||
    (currentUser
      ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() ||
        (currentUser as any).name ||
        currentUser.email
      : '') ||
    'POKALA REDDY'
  ).trim().toLowerCase()

  const currentUserId = currentUser?.id

  const fetchLeadsData = async () => {
    setLoading(true)
    try {
      const [leadsData, projectsData] = await Promise.all([
        ApiService.getLeads().catch(() => []),
        ApiService.getProjects().catch(() => []),
      ])

      setLeads(leadsData || [])
      setProjects(projectsData || [])
    } catch (err) {
      console.warn('Error loading My Leads from backend:', err)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadsData()
  }, [refreshKey])

  // Check if current user is CP Head
  const isCpHead = useMemo(() => {
    const cachedDesig = localStorage.getItem('maytri_profile_designation')
    const cachedRole = localStorage.getItem('maytri_user_role')
    const raw = (cachedDesig || currentUser?.role || cachedRole || '').toUpperCase()
    return raw.includes('HEAD') || raw === 'CP_HEAD' || raw === 'ADMIN'
  }, [currentUser])

  // Filter only the user's own direct leads
  const myDirectLeads = useMemo(() => {
    const seen = new Set<string>()
    const deduplicated = leads.filter((lead) => {
      const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '').slice(-10) : ''
      const key = `${lead.id}-${cleanPhone || lead.name}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (!isCpHead) {
      return deduplicated
    }

    const matched = deduplicated.filter((lead) => {
      const assigned = (lead.assignedTo || '').toLowerCase().trim()
      const source = (lead.source || '').toLowerCase().trim()
      const partnerId = (lead as any).partner_id || lead.partner_id || (lead as any).created_by_id

      if (currentUserId && partnerId && Number(partnerId) === Number(currentUserId)) {
        return true
      }
      if (assigned && (assigned.includes(currentUserName) || currentUserName.includes(assigned))) {
        return true
      }
      if (source && (source.includes(currentUserName) || currentUserName.includes(source))) {
        return true
      }
      return false
    })

    return matched.length > 0 ? matched : deduplicated
  }, [leads, currentUserName, currentUserId, isCpHead])

  // Extract unique projects from direct leads
  const availableProjects = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => {
      if (p.name) set.add(p.name)
    })
    myDirectLeads.forEach((l) => {
      if (l.project) set.add(l.project)
    })
    return Array.from(set).sort()
  }, [projects, myDirectLeads])

  // Filter leads based on selected filters
  const filteredLeads = useMemo(() => {
    return myDirectLeads.filter((lead) => {
      const matchesProject =
        selectedProjectFilter === 'ALL'
          ? true
          : isLeadMatchingProject(lead, selectedProjectFilter)
      const matchesStage = stageFilter === 'ALL' || lead.stage === stageFilter
      return matchesProject && matchesStage
    })
  }, [myDirectLeads, selectedProjectFilter, stageFilter])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLeads.slice(start, start + pageSize)
  }, [filteredLeads, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedProjectFilter, stageFilter])

  // Move lead stage helper and sync with backend
  const handleMoveStage = async (leadId: string, newStage: Lead['stage']) => {
    const targetLead = leads.find((l) => l.id === leadId)
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage: newStage,
              lastActivity: `Moved stage to ${newStage}`,
            }
          : l
      )
    )

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, stage: newStage } : null))
    }

    const numericId = targetLead?.rawId ? Number(targetLead.rawId) : Number(leadId.replace(/\D/g, ''))
    if (numericId && !isNaN(numericId)) {
      try {
        await ApiService.updateLead(numericId, { status: newStage })
        toast.success('Stage Updated', `Lead moved to "${newStage}".`)
      } catch (err) {
        console.warn('Failed to sync lead stage to backend:', err)
      }
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead)
    setEditStatus(lead.stage)
    setEditName(lead.name)
    setEditPhone(lead.phone)
    setEditNotes(lead.requirement || lead.notes || '')
  }

  // Submit Lead Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLead) return
    setIsSavingEdit(true)

    const numericId = editingLead.rawId ? Number(editingLead.rawId) : Number(editingLead.id.replace(/\D/g, ''))
    try {
      if (numericId && !isNaN(numericId)) {
        await ApiService.updateLead(numericId, {
          status: editStatus,
          customer_name: editName,
          mobile: editPhone,
          requirement: editNotes,
        })
      }

      setLeads((prev) =>
        prev.map((l) =>
          l.id === editingLead.id
            ? {
                ...l,
                name: editName,
                phone: editPhone,
                stage: editStatus,
                requirement: editNotes,
                notes: editNotes,
              }
            : l
        )
      )

      if (selectedLead && selectedLead.id === editingLead.id) {
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                name: editName,
                phone: editPhone,
                stage: editStatus,
                requirement: editNotes,
                notes: editNotes,
              }
            : null
        )
      }

      toast.success('Lead Updated Successfully!', `Saved details for ${editName}.`)
      setEditingLead(null)
    } catch (err) {
      console.warn('Failed to update lead:', err)
      toast.error('Update Failed', 'Could not save lead changes. Please try again.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  if (loading) {
    return <LeadsTableSkeleton />
  }

  // Render Full Page Lead Details View if a lead is selected
  if (selectedLead) {
    return (
      <LeadDetailPage
        lead={selectedLead}
        onBack={() => setSelectedLead(null)}
        onNavigateToDashboard={onNavigateToDashboard}
        onUpdateLeadStage={(id, stage) => {
          handleMoveStage(id, stage)
        }}
        onDeleteLead={(id) => {
          setLeads((prev) => prev.filter((l) => l.id !== id && l.rawId !== id))
          setSelectedLead(null)
        }}
        onScheduleVisit={onScheduleVisitForLead}
      />
    )
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* INTEGRATED CLEAN TOOLBAR */}
      <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Navigation & Pipeline Indicator */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToDashboard}
              className="h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Dashboard</span>
            </Button>
          )}

          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-extrabold px-1">
            <UserCheck className="h-4 w-4 text-[#0092b3]" />
            <span>My Leads</span>
          </div>
        </div>

        {/* Right Side: Project Filter Dropdown, Status Filter Dropdown & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between sm:justify-end">
          {/* Project Names Dropdown Filter */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0092b3] cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Projects ({availableProjects.length})</option>
            {availableProjects.map((pName) => {
              const count = myDirectLeads.filter((l) =>
                isLeadMatchingProject(l, pName)
              ).length
              return (
                <option key={pName} value={pName}>
                  {pName} ({count})
                </option>
              )
            })}
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0092b3] cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Status ({filteredLeads.length})</option>
            {STAGES.map((s) => {
              const count = myDirectLeads.filter(
                (l) => l.stage === s || (s === 'New' && l.stage === 'New Inquiry')
              ).length
              return (
                <option key={s} value={s}>
                  {s} ({count})
                </option>
              )
            })}
          </select>

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeadsData}
            disabled={loading}
            className="h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-2xs shrink-0"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-[#0092b3]', loading && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* LEADS DATA TABLE */}
      {filteredLeads.length === 0 ? (
        <Card className="p-16 rounded-3xl border border-slate-200 shadow-2xs text-center space-y-3 bg-white">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              {selectedProjectFilter !== 'ALL'
                ? `No Direct Leads for ${selectedProjectFilter}`
                : 'No Direct Customer Leads Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              {selectedProjectFilter !== 'ALL'
                ? `No prospective buyers are currently registered under your partner code for ${selectedProjectFilter}.`
                : 'Prospective buyers registered directly under your partner code will appear here.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Customer Info</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Follow Up</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLeads.map((lead) => {
                  const stageObj = STAGE_CONFIG[lead.stage] || {
                    label: lead.stage,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  }

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-black text-xs shrink-0">
                            {lead.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedLead(lead)}
                              className="font-bold text-slate-900 text-xs hover:text-[#0092b3] cursor-pointer text-left block"
                            >
                              {lead.name}
                            </button>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {lead.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          <Building2 className="h-3 w-3 text-[#0092b3]" />
                          <span>{lead.project || 'General'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                            stageObj.badgeClass
                          )}
                        >
                          {stageObj.label}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-slate-700">
                          {lead.assignedTo || 'POKALA REDDY'}
                        </span>
                      </td>

                      {/* Follow Up */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                        {lead.follow_up_date || '-'}
                      </td>

                      {/* Actions: View, Edit */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                            className="h-8 px-2.5 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg gap-1 cursor-pointer shadow-2xs"
                            title="View Lead Details"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#0092b3]" />
                            <span>View</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(lead)}
                            className="h-8 px-2.5 text-xs font-bold text-white bg-[#0092b3] hover:bg-[#007b99] border-[#0092b3] rounded-lg gap-1 cursor-pointer shadow-2xs"
                            title="Edit Lead"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-white" />
                            <span>Edit</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3.5 px-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50/40">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredLeads.length)} of{' '}
                {filteredLeads.length} leads
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40"
                >
                  Previous
                </Button>
                <span className="px-2 font-black text-slate-900">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      <Dialog
        open={Boolean(editingLead)}
        onOpenChange={(open) => {
          if (!open) setEditingLead(null)
        }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Edit Lead Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Update status, customer information, or requirement notes.
            </DialogDescription>
          </DialogHeader>

          {editingLead && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Lead Status / Stage
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#0092b3]"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Customer Name
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter full name"
                  className="h-10 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Phone Number
                </label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                  className="h-10 rounded-xl text-xs font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Requirement / Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Customer requirements, budget or site visit notes..."
                  className="w-full p-2.5 text-xs font-medium text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0092b3]"
                />
              </div>

              <DialogFooter className="pt-3 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const toDelete = editingLead
                    setEditingLead(null)
                    setDeletingLead(toDelete)
                  }}
                  className="h-9 px-3.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>Delete</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingLead(null)}
                    className="h-9 px-4 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingEdit}
                    className="h-9 px-5 rounded-xl text-xs font-black text-white bg-[#0092b3] hover:bg-[#007b99]"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(deletingLead)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingLead(null)
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  Delete Lead Record?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  This will permanently delete this lead from the live backend database.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingLead && (
            <div className="my-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Customer:</span>
                <strong className="text-slate-900 font-bold">{deletingLead.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Phone:</span>
                <span className="font-mono text-slate-700">{deletingLead.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Project:</span>
                <span className="text-slate-700 font-medium">{deletingLead.project}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingLead(null)}
              className="h-9 px-4 rounded-xl text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="h-9 px-4.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 gap-1.5 shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyLeadsTab
