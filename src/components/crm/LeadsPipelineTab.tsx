import React, { useState, useEffect } from 'react'
import {
  Plus,
  Phone,
  Calendar,
  Users,
  LayoutDashboard,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Building2,
  Layers,
  Filter,
  UserCheck,
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
import { ApiService } from '@/services/apiService'
import { MiniLoader } from '@/components/common/MiniLoader'
import { LeadsTableSkeleton } from '@/components/common/Skeletons'
import { LeadDetailPage } from '@/components/crm/LeadDetailPage'
import { toast } from '@/components/common/ToastNotification'
import { cn } from '@/lib/utils'

interface LeadsPipelineTabProps {
  searchQuery?: string
  selectedProject?: string
  selectedPartner?: { id?: number; name?: string } | string | null
  onClearProjectFilter?: () => void
  onClearPartnerFilter?: () => void
  onOpenAddLead?: (projectName?: string) => void
  onScheduleVisitForLead?: (lead: Lead) => void
  onNavigateToDashboard?: () => void
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
  { label: string; badgeClass: string }
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

export const LeadsPipelineTab: React.FC<LeadsPipelineTabProps> = ({
  searchQuery: externalSearch = '',
  selectedProject = 'ALL',
  selectedPartner = null,
  onClearProjectFilter,
  onClearPartnerFilter,
  onOpenAddLead,
  onScheduleVisitForLead,
  onNavigateToDashboard,
  refreshKey,
}) => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [stageFilter, setStageFilter] = useState<string>('ALL')
  const [internalProjectFilter, setInternalProjectFilter] = useState<string>(selectedProject || 'ALL')
  const [internalPartnerFilter, setInternalPartnerFilter] = useState<string>(
    typeof selectedPartner === 'string' ? selectedPartner : selectedPartner?.name || 'ALL'
  )
  const [internalSearch, setInternalSearch] = useState<string>('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editStatus, setEditStatus] = useState<Lead['stage']>('New Inquiry')
  const [editName, setEditName] = useState<string>('')
  const [editPhone, setEditPhone] = useState<string>('')
  const [editFollowUp, setEditFollowUp] = useState<string>('')
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

  // Synchronize when external props change
  useEffect(() => {
    if (selectedProject) {
      setInternalProjectFilter(selectedProject)
    }
  }, [selectedProject])

  useEffect(() => {
    if (selectedPartner) {
      const name = typeof selectedPartner === 'string' ? selectedPartner : selectedPartner.name
      setInternalPartnerFilter(name || 'ALL')
    } else {
      setInternalPartnerFilter('ALL')
    }
  }, [selectedPartner])

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
      console.warn('Error loading leads from backend:', err)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadsData()
  }, [refreshKey, selectedPartner])

  const effectiveSearch = (externalSearch || internalSearch).toLowerCase().trim()

  // Extract unique available projects from fetched projects & leads
  const availableProjects = React.useMemo(() => {
    const set = new Set<string>()
    if (selectedProject && selectedProject !== 'ALL') {
      set.add(selectedProject)
    }
    projects.forEach((p) => {
      if (p.name) set.add(p.name)
    })
    leads.forEach((l) => {
      if (l.project) set.add(l.project)
    })
    return Array.from(set).sort()
  }, [projects, leads, selectedProject])

  // Extract unique available channel partners from leads
  const availablePartners = React.useMemo(() => {
    const set = new Set<string>()
    leads.forEach((l) => {
      if (l.assignedTo && l.assignedTo.trim() !== '-' && l.assignedTo.trim().length > 1) {
        set.add(l.assignedTo.trim())
      }
      if (
        l.source &&
        l.source.trim() !== '-' &&
        l.source.trim().length > 1 &&
        !l.source.toLowerCase().includes('direct') &&
        !l.source.toLowerCase().includes('website')
      ) {
        set.add(l.source.trim())
      }
    })
    if (internalPartnerFilter && internalPartnerFilter !== 'ALL') {
      set.add(internalPartnerFilter)
    }
    return Array.from(set).sort()
  }, [leads, internalPartnerFilter])

  // Filter leads: By selected project, partner, stage and search
  const filteredLeads = React.useMemo(() => {
    const seen = new Set<string>()
    const partnerFilterLower = internalPartnerFilter.toLowerCase().trim()

    return leads
      .filter((lead) => {
        const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '').slice(-10) : ''
        const key = `${lead.id}-${cleanPhone || lead.name}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .filter((lead) => {
        // Project matching
        const matchesProject =
          internalProjectFilter === 'ALL'
            ? true
            : isLeadMatchingProject(lead, internalProjectFilter)

        // Partner matching
        const matchesPartner =
          internalPartnerFilter === 'ALL'
            ? true
            : (lead.assignedTo &&
                (lead.assignedTo.toLowerCase() === partnerFilterLower ||
                  lead.assignedTo.toLowerCase().includes(partnerFilterLower) ||
                  partnerFilterLower.includes(lead.assignedTo.toLowerCase()))) ||
              (lead.source &&
                (lead.source.toLowerCase() === partnerFilterLower ||
                  lead.source.toLowerCase().includes(partnerFilterLower) ||
                  partnerFilterLower.includes(lead.source.toLowerCase()))) ||
              (lead.partner_id && String(lead.partner_id) === internalPartnerFilter)

        // Stage matching
        const matchesStage = stageFilter === 'ALL' || lead.stage === stageFilter

        // Search matching
        const matchesSearch =
          !effectiveSearch ||
          lead.name.toLowerCase().includes(effectiveSearch) ||
          lead.phone.includes(effectiveSearch) ||
          lead.email.toLowerCase().includes(effectiveSearch) ||
          lead.id.toLowerCase().includes(effectiveSearch) ||
          lead.project.toLowerCase().includes(effectiveSearch) ||
          lead.stage.toLowerCase().includes(effectiveSearch) ||
          (lead.assignedTo && lead.assignedTo.toLowerCase().includes(effectiveSearch))

        return matchesProject && matchesPartner && matchesStage && matchesSearch
      })
  }, [
    leads,
    internalProjectFilter,
    internalPartnerFilter,
    stageFilter,
    effectiveSearch,
  ])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const paginatedLeads = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLeads.slice(start, start + pageSize)
  }, [filteredLeads, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [internalProjectFilter, internalPartnerFilter, stageFilter, effectiveSearch])

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
    setEditFollowUp(lead.follow_up_date || '')
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
            <Users className="h-4 w-4 text-[#0092b3]" />
            <span>All Leads ({filteredLeads.length})</span>
          </div>

          {/* Active Filter Badges */}
          {internalProjectFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-[#0092b3] border border-cyan-200 shadow-2xs">
              <Building2 className="h-3 w-3" />
              <span>{internalProjectFilter}</span>
              <button
                type="button"
                onClick={() => {
                  setInternalProjectFilter('ALL')
                  if (onClearProjectFilter) onClearProjectFilter()
                }}
                className="hover:text-rose-600 ml-0.5 cursor-pointer"
                title="Clear Project Filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {internalPartnerFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <UserCheck className="h-3 w-3" />
              <span>Partner: {internalPartnerFilter}</span>
              <button
                type="button"
                onClick={() => {
                  setInternalPartnerFilter('ALL')
                  if (onClearPartnerFilter) onClearPartnerFilter()
                }}
                className="hover:text-rose-600 ml-0.5 cursor-pointer"
                title="Clear Partner Filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* Right Side: Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between sm:justify-end">
          {/* Project Filter */}
          <select
            value={internalProjectFilter}
            onChange={(e) => {
              setInternalProjectFilter(e.target.value)
              if (e.target.value === 'ALL' && onClearProjectFilter) {
                onClearProjectFilter()
              }
            }}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0092b3] cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Projects ({availableProjects.length})</option>
            {availableProjects.map((pName) => {
              const count = leads.filter((l) => isLeadMatchingProject(l, pName)).length
              return (
                <option key={pName} value={pName}>
                  {pName} ({count})
                </option>
              )
            })}
          </select>

          {/* Channel Partner Filter */}
          <select
            value={internalPartnerFilter}
            onChange={(e) => {
              setInternalPartnerFilter(e.target.value)
              if (e.target.value === 'ALL' && onClearPartnerFilter) {
                onClearPartnerFilter()
              }
            }}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0092b3] cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Partners ({availablePartners.length})</option>
            {availablePartners.map((partnerName) => (
              <option key={partnerName} value={partnerName}>
                {partnerName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0092b3] cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Status</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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

          {/* Add Lead Action */}
          {onOpenAddLead && (
            <Button
              size="sm"
              onClick={() => onOpenAddLead(internalProjectFilter !== 'ALL' ? internalProjectFilter : undefined)}
              className="h-9 px-3.5 bg-[#0092b3] hover:bg-[#007d99] text-white font-black text-xs gap-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Lead</span>
            </Button>
          )}
        </div>
      </div>

      {/* LEADS DATA TABLE */}
      {filteredLeads.length === 0 ? (
        <Card className="p-16 rounded-3xl border border-slate-200 bg-white shadow-2xs text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              {internalProjectFilter !== 'ALL' ? `No Leads for ${internalProjectFilter}` : 'No Prospective Buyer Leads Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              {effectiveSearch
                ? 'No leads matched your search keyword.'
                : internalProjectFilter !== 'ALL'
                ? `No prospective leads have been assigned to ${internalProjectFilter} yet.`
                : 'No leads available across projects.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">CUSTOMER INFO</th>
                  <th className="py-4 px-5">PROJECT</th>
                  <th className="py-4 px-5">STATUS</th>
                  <th className="py-4 px-5">ASSIGNED TO</th>
                  <th className="py-4 px-5">FOLLOW UP</th>
                  <th className="py-4 px-6 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedLeads.map((lead) => {
                  const stageConfig = STAGE_CONFIG[lead.stage] || {
                    label: lead.stage || 'New',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  }

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#0092b3]/5 transition-colors group"
                    >
                      {/* CUSTOMER INFO */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-black text-xs shrink-0">
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
                              className="font-black text-slate-900 text-xs hover:text-[#0092b3] cursor-pointer text-left block"
                            >
                              {lead.name}
                            </button>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {lead.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* PROJECT */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                          <Building2 className="h-3.5 w-3.5 text-[#0092b3]" />
                          <span>{lead.project || 'Unassigned'}</span>
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-5">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs',
                            stageConfig.badgeClass
                          )}
                        >
                          {stageConfig.label}
                        </span>
                      </td>

                      {/* ASSIGNED TO */}
                      <td className="py-4 px-5 text-xs text-slate-700 font-medium">
                        {lead.assignedTo || lead.source || '-'}
                      </td>

                      {/* FOLLOW UP */}
                      <td className="py-4 px-5 text-xs text-slate-700 font-medium whitespace-nowrap">
                        {lead.follow_up_date || '-'}
                      </td>

                      {/* ACTIONS: View, Edit */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                            title="View Lead Details"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lead)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0092b3] hover:bg-[#007d99] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                            title="Edit Lead"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-white" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="p-3.5 px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <p className="font-medium">
                Showing <strong className="text-slate-900">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLeads.length)}</strong> of <strong className="text-slate-900">{filteredLeads.length}</strong> leads
              </p>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  Prev
                </Button>
                <span className="px-2 font-bold text-slate-900">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* EDIT LEAD MODAL */}
      <Dialog
        open={Boolean(editingLead)}
        onOpenChange={(open) => {
          if (!open) setEditingLead(null)
        }}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Edit Lead Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Update prospect contact information and pipeline stage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Full Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full Name"
                className="h-9 rounded-lg border border-slate-300 text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Mobile number"
                className="h-9 rounded-lg border border-slate-300 font-mono text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Status / Stage</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Lead['stage'])}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Requirement Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                placeholder="Buyer preferences, unit size, budget remarks..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0092b3]"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const toDelete = editingLead
                  setEditingLead(null)
                  setDeletingLead(toDelete)
                }}
                className="h-8.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Delete</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLead(null)}
                  className="h-8.5 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="h-8.5 bg-[#0092b3] hover:bg-[#007d99] text-white font-bold text-xs gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
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

export default LeadsPipelineTab
