import React, { useState, useEffect } from 'react'
import {
  X,
  Users,
  Building2,
  Phone,
  Mail,
  Calendar,
  Tag,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LeadDetailsModal } from '@/components/modals/LeadDetailsModal'
import type { Project, Lead } from '@/data/appData'

interface ProjectLeadsModalProps {
  project: Project | null
  leads: Lead[]
  isOpen: boolean
  onClose: () => void
  onOpenAddLead?: (projectName?: string) => void
  onScheduleVisit?: (lead: Lead) => void
}

const STAGE_BADGES: Record<string, string> = {
  'New Inquiry': 'bg-blue-100 text-blue-800 border-blue-200',
  'Site Visit Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
  'Token / Negotiation': 'bg-amber-100 text-amber-800 border-amber-200',
  'Loan Processing': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Booked: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Lost: 'bg-rose-100 text-rose-800 border-rose-200',
}

export const ProjectLeadsModal: React.FC<ProjectLeadsModalProps> = ({
  project,
  leads,
  isOpen,
  onClose,
  onOpenAddLead,
  onScheduleVisit,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null)
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const isLeadForProject = (l: Lead, p: Project): boolean => {
    if (!l || !p) return false
    const projName = (p.name || '').toLowerCase().trim()
    const leadProj = (l.project || (l as any).project_name || '').toLowerCase().trim()
    if (leadProj && projName) {
      if (leadProj === projName || leadProj.includes(projName) || projName.includes(leadProj)) {
        return true
      }
    }
    const pId = String(p.id || '').toLowerCase()
    const lProjId = String((l as any).project_id || (l as any).projectId || '').toLowerCase()
    if (pId && lProjId && pId === lProjId) {
      return true
    }
    const numPId = Number(pId.replace(/\D/g, ''))
    const numLId = Number(lProjId.replace(/\D/g, ''))
    if (numPId > 0 && numLId > 0 && numPId === numLId) {
      return true
    }
    return false
  }

  const projectLeads = project
    ? leads.filter((l) => isLeadForProject(l, project))
    : []

  const filteredLeads = projectLeads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.stage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, project, isOpen])

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* HEADER */}
        <div className="p-5 px-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {project.name} Leads
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-[#0092b3] text-white">
                  {projectLeads.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Click on any lead below to inspect full contact history, update stages, and log activity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8.5 w-8.5 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SEARCH & ACTIONS TOOLBAR */}
        <div className="p-4 px-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, stage..."
              className="h-9 pl-9 bg-slate-50 border-slate-200 text-xs font-semibold rounded-xl focus-visible:bg-white"
            />
          </div>

          {onOpenAddLead && (
            <Button
              onClick={() => {
                onClose()
                onOpenAddLead(project.name)
              }}
              size="sm"
              className="h-9 px-4 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Lead for this Project</span>
            </Button>
          )}
        </div>

        {/* LEADS LIST CONTENT (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 font-sans">
          {filteredLeads.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">No Leads Found</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {searchQuery ? 'No leads matching your search criteria.' : 'No prospective leads added for this project yet.'}
                </p>
              </div>
              {onOpenAddLead && (
                <Button
                  onClick={() => {
                    onClose()
                    onOpenAddLead(project.name)
                  }}
                  size="sm"
                  className="h-8.5 px-4 bg-[#0092b3] text-white font-bold text-xs rounded-xl mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add First Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadForDetails(lead)
                    setIsLeadDetailsOpen(true)
                  }}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0092b3] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs cursor-pointer group"
                >
                  {/* Customer Details */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#0092b3] transition-colors flex items-center gap-1.5">
                        {lead.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {lead.id}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          STAGE_BADGES[lead.stage] || 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {lead.stage}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium text-[11px] pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#0092b3]" />
                        <span className="font-semibold text-slate-900">{lead.phone}</span>
                      </span>
                      {lead.email && lead.email !== '-' && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{lead.email}</span>
                        </span>
                      )}
                      {lead.createdDate && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>{lead.createdDate}</span>
                        </span>
                      )}
                    </div>

                    {lead.notes && (
                      <p className="text-[11px] text-slate-500 font-medium italic pt-1 line-clamp-1">
                        "{lead.notes}"
                      </p>
                    )}
                  </div>

                  {/* Budget & Action Button */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0 text-right space-y-1.5">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{lead.budget || '₹ 1.2 Cr'}</span>
                      <span className="text-[10px] font-bold text-slate-500 block">{lead.unitType || '2/3 BHK'}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0092b3] group-hover:underline">
                      <span>View Details</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER & PAGINATION */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLeads.length)}</strong> of <strong className="text-slate-900">{filteredLeads.length}</strong> leads
          </p>

          <div className="flex items-center gap-2">
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 w-7 rounded-lg text-xs font-black transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#0092b3] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              className="h-8.5 border-slate-300 text-slate-700 font-bold text-xs rounded-xl px-4 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* LEAD DETAILS INSPECTION MODAL */}
      <LeadDetailsModal
        lead={selectedLeadForDetails}
        isOpen={isLeadDetailsOpen}
        onClose={() => {
          setIsLeadDetailsOpen(false)
          setSelectedLeadForDetails(null)
        }}
        onScheduleVisit={onScheduleVisit}
      />
    </div>
  )
}

export default ProjectLeadsModal
