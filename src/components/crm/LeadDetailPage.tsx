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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ApiService } from '@/services/apiService'
import type { BackendLeadActivity } from '@/services/apiService'
import type { Lead } from '@/data/appData'
import { cn } from '@/lib/utils'

interface LeadDetailPageProps {
  lead: Lead
  onBack: () => void
  onNavigateToDashboard?: () => void
  onUpdateLeadStage?: (leadId: string, newStage: Lead['stage']) => void
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

  useEffect(() => {
    setCurrentStage(lead.stage)
    loadActivities()
  }, [lead])

  const loadActivities = async () => {
    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) {
      setLoadingActivities(false)
      // Provide initial timeline item if none exist
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
      if (res.ok && Array.isArray(res.data?.items) && res.data.items.length > 0) {
        setActivities(res.data.items)
      } else {
        // Fallback default timeline entry
        setActivities([
          {
            id: 101,
            activity_type: 'Lead Registered',
            description: `Lead profile created for ${lead.project || 'Project'}.`,
            created_at: lead.createdDate ? `${lead.createdDate}T10:30:00Z` : new Date().toISOString(),
          },
        ])
      }
    } catch {
      setActivities([
        {
          id: 101,
          activity_type: 'Lead Registered',
          description: `Lead profile initialized for ${lead.project || 'Project'}.`,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleStageChange = async (newStage: Lead['stage']) => {
    if (newStage === currentStage || isUpdatingStage) return
    setIsUpdatingStage(true)
    setCurrentStage(newStage)
    if (onUpdateLeadStage) {
      onUpdateLeadStage(lead.id, newStage)
    }

    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    try {
      if (numericId && !isNaN(numericId)) {
        await ApiService.updateLead(numericId, { status: newStage })
      }

      // Add stage change to activity feed
      const stageActivity: BackendLeadActivity = {
        id: Date.now(),
        activity_type: 'Stage Changed',
        description: `Pipeline stage progressed to "${newStage}".`,
        created_at: new Date().toISOString(),
      }
      setActivities((prev) => [stageActivity, ...prev])
    } catch (err) {
      console.warn('Failed to update stage on backend:', err)
    } finally {
      setIsUpdatingStage(false)
    }
  }

  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setIsSubmittingNote(true)
    setNoteSuccess(false)

    const numericId = lead.rawId ? Number(lead.rawId) : Number(lead.id.replace(/\D/g, ''))
    const fullDesc = nextFollowUpDate
      ? `${newNote.trim()} (Next Follow-up: ${nextFollowUpDate})`
      : newNote.trim()

    try {
      if (numericId && !isNaN(numericId)) {
        await ApiService.addLeadNote(numericId, {
          activity_type: activityType,
          description: fullDesc,
        })
      }

      const newActivity: BackendLeadActivity = {
        id: Date.now(),
        activity_type: activityType,
        description: fullDesc,
        created_at: new Date().toISOString(),
      }
      setActivities((prev) => [newActivity, ...prev])
      setNewNote('')
      setNextFollowUpDate('')
      setNoteSuccess(true)
      setTimeout(() => setNoteSuccess(false), 3000)
    } catch (err) {
      console.warn('Failed to add note:', err)
    } finally {
      setIsSubmittingNote(false)
    }
  }

  // Format clean phone for WhatsApp
  const cleanPhone = lead.phone.replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=Hello%20${encodeURIComponent(
    lead.name
  )},%20thank%20you%20for%20your%20interest%20in%20${encodeURIComponent(lead.project)}.%20How%20can%20we%20assist%20you%20today?`

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
      </div>

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: CUSTOMER & PROPERTY PROFILE */}
        <div className="lg:col-span-1 space-y-4">
          {/* Customer Details Card */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 px-5 bg-slate-50/70 border-b border-slate-100">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#0092b3]" /> Buyer Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="h-3 w-3 text-[#0092b3]" /> Mobile Number
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(lead.phone, 'phone')}
                    className="text-slate-400 hover:text-slate-700 text-[10px] flex items-center gap-1"
                    title="Copy phone"
                  >
                    {copiedField === 'phone' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="font-extrabold text-slate-900 text-sm">
                  <a href={`tel:${lead.phone}`} className="hover:underline text-[#0092b3]">
                    {lead.phone}
                  </a>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="h-3 w-3 text-[#0092b3]" /> Email Address
                  </span>
                  {lead.email && lead.email !== '-' && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(lead.email, 'email')}
                      className="text-slate-400 hover:text-slate-700 text-[10px] flex items-center gap-1"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-xs truncate">
                  {lead.email && lead.email !== '-' ? (
                    <a href={`mailto:${lead.email}`} className="hover:underline text-[#0092b3]">
                      {lead.email}
                    </a>
                  ) : (
                    <span className="text-slate-400 font-normal">Not Provided</span>
                  )}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#0092b3]" /> Location / City
                </span>
                <p className="font-bold text-slate-900">{lead.city || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Property Requirement Card */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 px-5 bg-slate-50/70 border-b border-slate-100">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#0092b3]" /> Requirement & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Interested Project</span>
                <p className="font-extrabold text-slate-900 text-sm">{lead.project || '-'}</p>
              </div>

              {(lead.requirement || lead.notes) && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="h-3 w-3 text-purple-600" /> Buyer Requirement / Remarks
                  </span>
                  <p className="font-semibold text-slate-800 leading-relaxed">
                    {lead.requirement || lead.notes}
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-blue-600" /> Attribution & Executive
                </span>
                <p className="font-semibold text-slate-800">
                  {lead.source ? `Created by: ${lead.source}` : 'Channel Partner'}
                  {lead.assignedTo ? ` • Managed by: ${lead.assignedTo}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: INDUSTRY-LEVEL ACTIVITY TIMELINE & LOGGING */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 px-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-[#0092b3]" /> Activity Feed & Interaction Timeline
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Log phone calls, site visit impressions, remarks, and negotiation updates
                </CardDescription>
              </div>

              {noteSuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Activity logged successfully!
                </span>
              )}
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* LOG ACTIVITY CARD */}
              <form onSubmit={handleAddActivitySubmit} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-800">Log New Interaction</span>
                  {/* Activity Type Selector */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    {(['Call', 'Note', 'Site Visit', 'WhatsApp', 'Meeting'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActivityType(t)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-colors cursor-pointer',
                          activityType === t ? 'bg-[#0092b3] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={`Enter details about this ${activityType.toLowerCase()} (e.g. Customer requested floor plan brochure and price quote...)`}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0092b3]"
                  required
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Next Follow-up Date:</span>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0092b3]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingNote || !newNote.trim()}
                    className="h-8.5 px-4 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs gap-1.5 rounded-xl shadow-2xs cursor-pointer shrink-0"
                  >
                    {isSubmittingNote ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Save {activityType}</span>
                  </Button>
                </div>
              </form>

              {/* TIMELINE FEED SECTION */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Activity History ({activities.length})
                  </h4>
                </div>

                {loadingActivities ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#0092b3]" />
                    <span className="text-xs font-bold">Loading timeline history...</span>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1 text-slate-500">
                    <FileText className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                    <p className="text-xs font-bold text-slate-700">No activity logged yet</p>
                    <p className="text-[11px]">Use the input above to log your first remark or follow-up note.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activities.map((act) => {
                      const type = (act.activity_type || 'Note').toLowerCase()
                      const isCall = type.includes('call') || type.includes('phone')
                      const isVisit = type.includes('visit') || type.includes('tour')
                      const isStage = type.includes('stage')
                      const isWa = type.includes('whatsapp')

                      return (
                        <div key={act.id} className="relative flex items-start gap-3 text-xs group">
                          {/* Timeline Icon Node */}
                          <div
                            className={cn(
                              'absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-2xs shrink-0',
                              isCall
                                ? 'bg-blue-600 text-white'
                                : isVisit
                                  ? 'bg-purple-600 text-white'
                                  : isStage
                                    ? 'bg-amber-500 text-white'
                                    : isWa
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#0092b3] text-white'
                            )}
                          >
                            {isCall ? (
                              <Phone className="h-2.5 w-2.5" />
                            ) : isVisit ? (
                              <Calendar className="h-2.5 w-2.5" />
                            ) : isStage ? (
                              <Sparkles className="h-2.5 w-2.5" />
                            ) : isWa ? (
                              <MessageSquare className="h-2.5 w-2.5" />
                            ) : (
                              <FileText className="h-2.5 w-2.5" />
                            )}
                          </div>

                          <div className="flex-1 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1 hover:border-[#0092b3]/40 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  'font-extrabold text-xs',
                                  isCall
                                    ? 'text-blue-700'
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LeadDetailPage
