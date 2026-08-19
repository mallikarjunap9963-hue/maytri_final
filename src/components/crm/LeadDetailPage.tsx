import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  LayoutDashboard,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Tag,
  DollarSign,
  Send,
  Activity,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Clock,
  MessageSquare,
  ChevronRight,
  Plus,
  FileText,
  PhoneCall,
  CalendarDays,
  UserCheck,
  MapPin,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ApiService } from '@/services/apiService'
import type { BackendLeadActivity } from '@/services/apiService'
import type { Lead } from '@/data/appData'
import { toast } from '@/components/common/ToastNotification'
import { cn } from '@/lib/utils'

interface LeadDetailPageProps {
  lead: Lead
  onBack: () => void
  onNavigateToDashboard?: () => void
  onUpdateLeadStage?: (leadId: string, newStage: Lead['stage']) => void
  onDeleteLead?: (leadId: string) => void
  onScheduleVisit?: (lead: Lead) => void
}

const STAGES: { label: Lead['stage']; step: number; color: string; desc: string }[] = [
  { label: 'New', step: 1, color: 'emerald', desc: 'Initial lead registered' },
  { label: 'Contacted', step: 2, color: 'cyan', desc: 'Customer outreach completed' },
  { label: 'Follow Up', step: 3, color: 'purple', desc: 'Follow-up & discussions' },
  { label: 'Interested', step: 4, color: 'amber', desc: 'Active buyer interest' },
  { label: 'Converted', step: 5, color: 'emerald', desc: 'Deal closed & booked' },
  { label: 'Lost', step: 6, color: 'rose', desc: 'Dropped or closed' },
]

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({
  lead,
  onBack,
  onNavigateToDashboard,
  onUpdateLeadStage,
  onDeleteLead,
  onScheduleVisit,
}) => {
  const [currentStage, setCurrentStage] = useState<Lead['stage']>(lead.stage)
  const [activities, setActivities] = useState<BackendLeadActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState<boolean>(true)
  const [activityType, setActivityType] = useState<'Call' | 'Note' | 'Site Visit' | 'Meeting' | 'WhatsApp'>('Call')
  const [newNote, setNewNote] = useState('')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [noteSuccess, setNoteSuccess] = useState(false)
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Stage Change Confirmation State
  const [pendingStageChange, setPendingStageChange] = useState<Lead['stage'] | null>(null)

  // Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setCurrentStage(lead.stage)
    loadActivities()
  }, [lead])

  const loadActivities = async () => {
    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) {
      setLoadingActivities(false)
      setActivities([
        {
          id: 101,
          activity_type: 'Lead Registered',
          description: `Prospective buyer "${lead.name}" registered for ${lead.project || 'Project'}.`,
          created_at: lead.createdDate ? `${lead.createdDate}T10:30:00Z` : new Date().toISOString(),
        },
      ])
      return
    }

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
    if (newStage === currentStage || isUpdatingStage) return
    setIsUpdatingStage(true)

    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    try {
      if (!numericId || isNaN(numericId)) {
        throw new Error('Invalid lead identifier')
      }

      const res = await ApiService.updateLead(numericId, { status: newStage })
      if (!res.ok) {
        throw new Error(res.message || 'Server rejected stage update')
      }

      setCurrentStage(newStage)
      if (onUpdateLeadStage) {
        onUpdateLeadStage(lead.id, newStage)
      }

      await loadActivities()
      toast.success('Stage Updated', `Lead stage moved to "${newStage}" in database.`)
    } catch (err: any) {
      console.warn('Failed to update stage:', err)
      toast.error('Stage Update Failed', err.message || 'Could not sync stage change to server.')
    } finally {
      setIsUpdatingStage(false)
    }
  }

  const handleConfirmStageChange = async () => {
    if (!pendingStageChange) return
    const targetStage = pendingStageChange
    setPendingStageChange(null)
    await handleStageChange(targetStage)
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || isSubmittingNote) return
    setIsSubmittingNote(true)

    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))

    try {
      if (!numericId || isNaN(numericId)) {
        throw new Error('Invalid lead identifier')
      }

      const res = await ApiService.addLeadNote(numericId, {
        activity_type: activityType,
        description: newNote.trim(),
      })

      if (!res.ok) {
        throw new Error(res.message || 'Could not save note to server database')
      }

      setNewNote('')
      setNextFollowUpDate('')
      setNoteSuccess(true)
      await loadActivities()
      toast.success('Activity Logged', 'Note recorded to live timeline.')
      setTimeout(() => setNoteSuccess(false), 3000)
    } catch (err: any) {
      console.warn('Error adding lead activity note:', err)
      toast.error('Failed to Log Note', err.message || 'Could not save note to server.')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))

    try {
      if (!numericId || isNaN(numericId)) {
        throw new Error('Invalid lead identifier')
      }

      const res = await ApiService.deleteLead(numericId)
      if (!res.ok) {
        throw new Error(res.message || 'Could not delete lead from backend database')
      }

      toast.success('Lead Deleted', `Lead "${lead.name}" has been deleted from live database.`)
      setIsDeleteConfirmOpen(false)
      if (onDeleteLead) {
        onDeleteLead(lead.id)
      } else {
        onBack()
      }
    } catch (err: any) {
      console.warn('Failed to delete lead:', err)
      toast.error('Delete Failed', err.message || 'Could not delete lead from server. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : ''
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=Hello%20${encodeURIComponent(
    lead.name
  )},%20thank%20you%20for%20your%20interest%20in%20${encodeURIComponent(lead.project || 'Maytri Properties')}.%20How%20can%20we%20assist%20you%20today?`

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* TOP HEADER WITH NAVIGATION & DIRECT ACTIONS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            <span>Back to Leads</span>
          </Button>

          {onNavigateToDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToDashboard}
              className="h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-2xs"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Dashboard</span>
            </Button>
          )}

          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-0.5" />

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] font-black flex items-center justify-center text-sm border border-[#0092b3]/20 shrink-0">
              {lead.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{lead.name}</h2>
                <span className="font-mono text-[10.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {lead.id}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                    currentStage === 'Booked'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentStage === 'Lost'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-[#0092b3]/15 text-[#0092b3]'
                  )}
                >
                  {currentStage}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Project: <strong className="text-slate-800 font-bold">{lead.project}</strong> • Registered on {lead.createdDate || 'Recent'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header: Delete Lead Action */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="h-9 px-3.5 border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
            title="Delete this lead permanently"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span>Delete Lead</span>
          </Button>
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: CUSTOMER & PROPERTY PROFILE (STICKY) */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4 self-start">
          {/* Customer Details Card */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Customer Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Full Name
                </span>
                <p className="font-extrabold text-slate-900 text-sm">{lead.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Phone Number
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {lead.phone || 'Not Provided'}
                  </span>
                  {lead.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopy(lead.phone, 'phone')}
                      className="p-1 rounded-md text-slate-400 hover:text-[#0092b3] hover:bg-slate-100 transition-colors"
                      title="Copy phone"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {lead.email && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 truncate">{lead.email}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(lead.email, 'email')}
                      className="p-1 rounded-md text-slate-400 hover:text-[#0092b3] hover:bg-slate-100 transition-colors"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Communication Actions */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100/80 text-[#0092b3] font-bold text-xs transition-colors border border-cyan-200/60"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Call Lead</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-bold text-xs transition-colors border border-emerald-200/60"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Project & Property Requirements Card */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Property Interest</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assigned Project:</span>
                <strong className="text-slate-900 font-black">{lead.project || 'General Inquiry'}</strong>
              </div>

              {lead.budget && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Budget Range:</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                    {lead.budget}
                  </span>
                </div>
              )}

              {lead.requirement && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Requirements
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {lead.requirement}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-medium">Assigned Executive:</span>
                <span className="font-bold text-slate-800">{lead.assignedTo || 'POKALA REDDY'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: PIPELINE STEPPER & ACTIVITY TIMELINE */}
        <div className="lg:col-span-2 space-y-5">
          {/* PIPELINE PROGRESS STEPPER */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#0092b3]" />
                  <span>Lead Stage Progression</span>
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Click any stage below to upgrade the customer status in real-time.
                </CardDescription>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#0092b3]/10 text-[#0092b3] border border-[#0092b3]/20">
                {currentStage}
              </span>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {STAGES.map((s) => {
                  const isActive = currentStage === s.label
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={isUpdatingStage}
                      onClick={() => {
                        if (s.label !== currentStage) {
                          setPendingStageChange(s.label)
                        }
                      }}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[84px] group relative overflow-hidden',
                        isActive
                          ? 'bg-[#0092b3] text-white border-[#0092b3] shadow-sm ring-2 ring-[#0092b3]/20'
                          : 'bg-slate-50/80 hover:bg-cyan-50/50 border-slate-200 hover:border-cyan-200 text-slate-700'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            'text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200/80 text-slate-600 group-hover:bg-cyan-100 group-hover:text-[#0092b3]'
                          )}
                        >
                          {s.step}
                        </span>
                        {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div>
                        <h4
                          className={cn(
                            'text-xs font-black leading-tight',
                            isActive ? 'text-white' : 'text-slate-800'
                          )}
                        >
                          {s.label}
                        </h4>
                        <p
                          className={cn(
                            'text-[9.5px] font-medium leading-tight mt-0.5 line-clamp-1',
                            isActive ? 'text-cyan-100' : 'text-slate-400'
                          )}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* LOG ACTIVITY / NOTE FORM */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Log New Interaction / Follow-up Note</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleAddNote} className="space-y-3.5">
                {/* Activity Type Selection Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['Call', 'Note', 'Site Visit', 'Meeting', 'WhatsApp'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActivityType(type)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border',
                        activityType === type
                          ? 'bg-[#0092b3] text-white border-[#0092b3] shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {type === 'Call' && <Phone className="h-3 w-3 inline mr-1" />}
                      {type === 'Site Visit' && <Calendar className="h-3 w-3 inline mr-1" />}
                      {type === 'Note' && <FileText className="h-3 w-3 inline mr-1" />}
                      {type}
                    </button>
                  ))}
                </div>

                {/* Note Textarea */}
                <div className="space-y-1">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={`Write notes on the ${activityType.toLowerCase()} with ${lead.name}...`}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0092b3] bg-slate-50/40"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold">Next Follow-up:</span>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingNote || !newNote.trim()}
                    className="h-8.5 px-4 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs gap-1.5 rounded-xl cursor-pointer shadow-2xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmittingNote ? 'Saving...' : 'Save Activity Note'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ACTIVITY & AUDIT TIMELINE */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Activity History & Audit Timeline</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadActivities}
                className="h-7 px-2 text-[11px] font-bold text-slate-500 hover:text-[#0092b3]"
              >
                <RefreshCw className={cn('h-3 w-3 mr-1', loadingActivities && 'animate-spin')} />
                <span>Refresh</span>
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {loadingActivities ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#0092b3]" />
                  <span>Loading activity timeline...</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <MessageSquare className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No interaction notes recorded yet</p>
                  <p className="font-normal text-[11px]">Log your first call or site visit update using the form above.</p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 before:pointer-events-none">
                  {activities.map((act) => {
                    const isCall = act.activity_type?.toLowerCase().includes('call')
                    const isVisit = act.activity_type?.toLowerCase().includes('visit')
                    const isStage = act.activity_type?.toLowerCase().includes('stage')

                    return (
                      <div key={act.id} className="relative flex items-start gap-3.5 pl-1 group">
                        <div
                          className={cn(
                            'h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-2xs border',
                            isCall
                              ? 'bg-cyan-50 text-[#0092b3] border-cyan-200'
                              : isVisit
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : isStage
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {isCall ? (
                            <Phone className="h-3.5 w-3.5" />
                          ) : isVisit ? (
                            <Calendar className="h-3.5 w-3.5" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-xs font-extrabold uppercase tracking-wider',
                                isCall
                                  ? 'text-[#0092b3]'
                                  : isVisit
                                    ? 'text-purple-700'
                                    : isStage
                                      ? 'text-amber-700'
                                      : 'text-slate-900'
                              )}
                            >
                              {act.activity_type || 'Note'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" />
                              {act.created_at ? new Date(act.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed font-medium">
                            {act.description}
                          </p>
                          {act.performed_by && (
                            <p className="text-[10px] font-semibold text-slate-400 pt-0.5">
                              Logged by: {act.performed_by.first_name} {act.performed_by.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* STAGE CHANGE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(pendingStageChange)}
        onOpenChange={(open) => {
          if (!open && !isUpdatingStage) setPendingStageChange(null)
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-cyan-50 text-[#0092b3] flex items-center justify-center shrink-0 border border-cyan-200">
                <Sparkles className="h-5 w-5 text-[#0092b3]" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  Update Pipeline Stage?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  Confirm to upgrade this lead&apos;s stage in the database.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {pendingStageChange && (
            <div className="my-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Customer:</span>
                <strong className="text-slate-900 font-bold">{lead.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Current Stage:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                  {currentStage}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                <span className="text-[#0092b3] font-bold">New Stage:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#0092b3] text-white shadow-2xs">
                  {pendingStageChange}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isUpdatingStage}
              onClick={() => setPendingStageChange(null)}
              className="h-9 px-4 rounded-xl text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isUpdatingStage}
              onClick={handleConfirmStageChange}
              className="h-9 px-5 rounded-xl text-xs font-black text-white bg-[#0092b3] hover:bg-[#007d99] gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isUpdatingStage ? 'Updating...' : `Confirm: ${pendingStageChange}`}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setIsDeleteConfirmOpen(false)
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

          <div className="my-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Customer:</span>
              <strong className="text-slate-900 font-bold">{lead.name}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Phone:</span>
              <span className="font-mono text-slate-700">{lead.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Project:</span>
              <span className="text-slate-700 font-medium">{lead.project}</span>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDeleteConfirmOpen(false)}
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

export default LeadDetailPage
