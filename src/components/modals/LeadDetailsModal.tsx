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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ApiService } from '@/services/apiService'
import type { BackendLeadActivity } from '@/services/apiService'
import type { Lead } from '@/data/appData'

interface LeadDetailsModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onUpdateLeadStage?: (leadId: string, newStage: Lead['stage']) => void
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
  onScheduleVisit,
}) => {
  const [currentStage, setCurrentStage] = useState<Lead['stage']>('New Inquiry')
  const [activities, setActivities] = useState<BackendLeadActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [noteSuccess, setNoteSuccess] = useState(false)

  useEffect(() => {
    if (lead) {
      setCurrentStage(lead.stage)
      loadActivities(lead.id)
    }
  }, [lead, isOpen])

  const loadActivities = async (leadIdStr: string) => {
    const numericId = Number(leadIdStr.replace(/\D/g, ''))
    if (!numericId) return

    setLoadingActivities(true)
    try {
      const res = await ApiService.getLeadActivities(numericId)
      if (res.ok && res.data?.items) {
        setActivities(res.data.items)
      } else {
        setActivities([])
      }
    } catch {
      setActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleStageChange = async (newStage: Lead['stage']) => {
    if (!lead) return
    setCurrentStage(newStage)
    if (onUpdateLeadStage) {
      onUpdateLeadStage(lead.id, newStage)
    }

    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    if (numericId && !isNaN(numericId)) {
      await ApiService.updateLead(numericId, { status: newStage })
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !lead) return

    setIsSubmittingNote(true)
    setNoteSuccess(false)

    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    try {
      if (numericId && !isNaN(numericId)) {
        await ApiService.addLeadNote(numericId, {
          activity_type: 'Note',
          description: newNote.trim(),
        })
      }

      // Optimistic activity timeline update
      const newActivity: BackendLeadActivity = {
        id: Date.now(),
        activity_type: 'Note',
        description: newNote.trim(),
        created_at: new Date().toISOString(),
      }
      setActivities([newActivity, ...activities])
      setNewNote('')
      setNoteSuccess(true)
      setTimeout(() => setNoteSuccess(false), 3000)
    } catch (err) {
      console.warn('Failed to add note:', err)
    } finally {
      setIsSubmittingNote(false)
    }
  }

  if (!isOpen || !lead) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold text-lg shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {lead.name}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  {lead.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Lead inquiry details & live activity timeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 font-sans">
          {/* STAGE & STATUS CONTROL BAR */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Pipeline Stage
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                  STAGE_BADGES[currentStage] || 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                {currentStage}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Update Stage:</label>
              <select
                value={currentStage}
                onChange={(e) => handleStageChange(e.target.value as Lead['stage'])}
                className="h-8.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0092b3] cursor-pointer"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KEY DETAILS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-[#0092b3]" /> Phone Number
              </span>
              <p className="font-extrabold text-slate-900">
                <a href={`tel:${lead.phone}`} className="hover:underline text-[#0092b3]">
                  {lead.phone}
                </a>
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[#0092b3]" /> Email Address
              </span>
              <p className="font-bold text-slate-900 truncate">{lead.email || 'None'}</p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-[#0092b3]" /> Project Interest
              </span>
              <p className="font-extrabold text-slate-900">{lead.project}</p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-purple-600" /> Configuration
              </span>
              <p className="font-extrabold text-slate-900">{lead.unitType || '2/3 BHK'}</p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Budget Bracket
              </span>
              <p className="font-extrabold text-slate-900">{lead.budget || '₹ 1.2 Cr'}</p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-600" /> Registration Date
              </span>
              <p className="font-extrabold text-slate-900">{lead.createdDate || 'Recently'}</p>
            </div>
          </div>

          {/* REQUIREMENTS & NOTES */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Requirements & Notes
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              {lead.notes || 'No custom notes provided for this lead.'}
            </p>
          </div>

          {/* ADD NOTE / ACTIVITY LOGGING */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#0092b3]" /> Live Activity Log & Timeline
              </h4>
              {noteSuccess && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Note saved to backend!
                </span>
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a call note, follow-up remark, or feedback..."
                className="h-9.5 text-xs bg-slate-50 border-slate-200 rounded-xl"
              />
              <Button
                type="submit"
                disabled={isSubmittingNote || !newNote.trim()}
                className="h-9.5 px-4 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs gap-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
              >
                {isSubmittingNote ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Add Note</span>
              </Button>
            </form>

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
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 border-slate-300 text-slate-700 font-bold text-xs rounded-xl px-4 cursor-pointer"
          >
            Close
          </Button>

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
