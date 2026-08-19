import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Tag,
  DollarSign,
  Clock,
  Send,
  Plus,
  Activity,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ApiService } from '@/services/apiService'
import type { BackendLeadActivity } from '@/services/apiService'
import type { Lead } from '@/data/appData'
import { toast } from '@/components/common/ToastNotification'

interface LeadDetailsModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onUpdateLeadStage?: (leadId: string, newStage: Lead['stage']) => void
  onDeleteLead?: (leadId: string) => void
  onScheduleVisit?: (lead: Lead) => void
}

const STAGES: Lead['stage'][] = [
  'New Inquiry',
  'Site Visit Scheduled',
  'Token / Negotiation',
  'Loan Processing',
  'Booked',
  'Lost',
]

const STAGE_BADGES: Record<string, string> = {
  'New Inquiry': 'bg-blue-100 text-blue-800 border-blue-200',
  'Site Visit Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
  'Token / Negotiation': 'bg-amber-100 text-amber-800 border-amber-200',
  'Loan Processing': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Booked: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Lost: 'bg-rose-100 text-rose-800 border-rose-200',
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateLeadStage,
  onDeleteLead,
  onScheduleVisit,
}) => {
  const [currentStage, setCurrentStage] = useState<Lead['stage']>('New Inquiry')
  const [activities, setActivities] = useState<BackendLeadActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (lead) {
      setCurrentStage(lead.stage)
      loadActivities()
    }
  }, [lead])

  if (!isOpen || !lead) return null

  const loadActivities = async () => {
    if (!lead) return
    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) return

    setLoadingActivities(true)
    try {
      const res = await ApiService.getLeadActivities(numericId)
      if (res.ok && Array.isArray(res.data?.items)) {
        setActivities(res.data.items)
      }
    } catch {
      // Ignored fallback
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleStageChange = async (newStage: Lead['stage']) => {
    setCurrentStage(newStage)
    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    if (numericId && !isNaN(numericId)) {
      try {
        await ApiService.updateLead(numericId, { status: newStage })
      } catch {
        // Fallback
      }
    }
    if (onUpdateLeadStage) {
      onUpdateLeadStage(lead.id, newStage)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || isSubmitting) return
    setIsSubmitting(true)

    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))

    try {
      if (numericId && !isNaN(numericId)) {
        const res = await ApiService.addLeadNote(numericId, {
          activity_type: 'Note',
          description: newNote.trim(),
        })
        if (res.ok && res.data) {
          const act = res.data.data || res.data.activity || res.data
          setActivities((prev) => [
            {
              id: act.id || Date.now(),
              activity_type: 'Note',
              description: newNote.trim(),
              created_at: new Date().toISOString(),
            },
            ...prev,
          ])
        }
      }
      setNewNote('')
      toast.success('Note Recorded', 'Added to lead activity timeline.')
    } catch (err) {
      console.warn('Failed to add note:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))

    try {
      if (numericId && !isNaN(numericId)) {
        await ApiService.deleteLead(numericId)
      } else {
        await ApiService.deleteLead(lead.id)
      }

      toast.success('Lead Deleted', `Lead "${lead.name}" has been removed.`)
      setShowDeleteConfirm(false)
      onClose()
      if (onDeleteLead) {
        onDeleteLead(lead.id)
      }
    } catch (err) {
      console.warn('Failed to delete lead:', err)
      toast.error('Delete Failed', 'Could not delete lead. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-5 px-6 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-black text-sm">
              {lead.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{lead.name}</h3>
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                  {lead.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{lead.project}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* DELETE CONFIRMATION ALERT (IF TRIGGERED) */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Are you sure you want to permanently delete lead &quot;{lead.name}&quot;?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="h-7 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-7 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* CUSTOMER DETAILS & STAGE SELECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-3.5 w-3.5 text-[#0092b3]" />
                <span className="font-mono font-bold text-slate-900">{lead.phone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-3.5 w-3.5 text-[#0092b3]" />
                  <span>{lead.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>{lead.project}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Assigned: <strong className="text-slate-800">{lead.assignedTo || 'CP Team'}</strong></span>
              </div>
            </div>

            {/* STAGE SELECTOR */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Update Pipeline Stage
              </label>
              <select
                value={currentStage}
                onChange={(e) => handleStageChange(e.target.value as Lead['stage'])}
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0092b3]"
              >
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 font-medium">
                Changing the stage syncs immediately with your team's live pipeline.
              </p>
            </div>
          </div>

          {/* NOTE INPUT */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Add Interaction Note
            </label>
            <div className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a call outcome or customer request..."
                className="h-9 rounded-xl text-xs"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className="h-9 px-4 bg-[#0092b3] hover:bg-[#007d99] text-white font-bold text-xs rounded-xl shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Save</span>
              </Button>
            </div>
          </form>

          {/* ACTIVITY TIMELINE */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Activity Timeline</span>
              </span>
              <button
                type="button"
                onClick={loadActivities}
                className="text-[11px] font-bold text-[#0092b3] hover:underline"
              >
                Refresh
              </button>
            </div>

            {/* TIMELINE ITEMS */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {loadingActivities ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0092b3]" />
                  Loading activity timeline...
                </div>
              ) : activities.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-100">
                  No previous activity recorded. Add the first note above!
                </div>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-start gap-2.5"
                  >
                    <div className="h-6 w-6 rounded-full bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="h-3 w-3" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-slate-800 font-semibold">{act.description}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {act.created_at ? new Date(act.created_at).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 border-slate-300 text-slate-700 font-bold text-xs rounded-xl px-4 cursor-pointer"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-9 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl px-3 cursor-pointer gap-1"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Delete</span>
            </Button>
          </div>

          {onScheduleVisit && (
            <Button
              onClick={() => {
                onClose()
                onScheduleVisit(lead)
              }}
              className="h-9 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs gap-1.5 rounded-xl px-5 shadow-xs cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Schedule Site Visit</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeadDetailsModal
