import React, { useState, useEffect, useRef } from 'react'
import logoPng from '@/assets/logo.png'
import { MaytriLogo } from '@/components/common/MaytriLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  FileText,
  Upload,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  LogOut,
  Sparkles,
  RefreshCw,
  FileCheck,
  Landmark,
  MapPin,
  IdCard,
  Building,
  ArrowRight,
  Lock,
  Hourglass,
  BadgeCheck,
  XCircle,
  PhoneCall,
  Mail,
  Edit3,
} from 'lucide-react'
import { ApiService, AuthToken } from '@/services/apiService'
import { cn } from '@/lib/utils'

interface WelcomeKycPageProps {
  currentUser: { name: string; email: string; role: string } | null
  onLogout: () => void
  onNavigateToDashboard: () => void
}

// Clean error extractor helper
function extractCleanBackendError(data: any, defaultMsg = 'An error occurred. Please check your inputs.'): string {
  if (!data) return defaultMsg

  if (data.errors && typeof data.errors === 'object') {
    const messages: string[] = []
    for (const [, val] of Object.entries(data.errors)) {
      if (Array.isArray(val)) {
        messages.push(val.join(', '))
      } else if (typeof val === 'string') {
        messages.push(val)
      }
    }
    if (messages.length > 0) return messages.join(' • ')
  }

  if (Array.isArray(data.detail)) {
    const msgs = data.detail.map((d: any) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d)))
    if (msgs.length > 0) return msgs.join(' • ')
  }

  if (typeof data.detail === 'string') return data.detail
  if (data.message && data.message !== 'Validation failed') return data.message
  if (data.message) return data.message
  if (data.error && typeof data.error === 'string') return data.error

  return defaultMsg
}

export const WelcomeKycPage: React.FC<WelcomeKycPageProps> = ({
  currentUser,
  onLogout,
  onNavigateToDashboard,
}) => {
  // Existing profile / KYC status
  const [existingProfile, setExistingProfile] = useState<any | null>(null)
  const [isKycModalOpen, setIsKycModalOpen] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Form State matching exact backend fields (no default prefilled text)
  const [formData, setFormData] = useState({
    partner_type: 'CP_HEAD' as 'CP_HEAD' | 'CHANNEL_PARTNER',
    superior_code: '',
    company_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    pan_number: '',
    aadhar_number: '',
    bank_name: '',
    bank_account_number: '',
    confirm_bank_account: '',
    bank_ifsc: '',
  })

  // Document Uploads
  const [panFile, setPanFile] = useState<File | null>(null)
  const [aadharFile, setAadharFile] = useState<File | null>(null)
  const [chequeFile, setChequeFile] = useState<File | null>(null)

  // Feedback & Loading State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // File drag states
  const [panDragOver, setPanDragOver] = useState(false)
  const [aadharDragOver, setAadharDragOver] = useState(false)
  const [chequeDragOver, setChequeDragOver] = useState(false)

  const panInputRef = useRef<HTMLInputElement>(null)
  const aadharInputRef = useRef<HTMLInputElement>(null)
  const chequeInputRef = useRef<HTMLInputElement>(null)

  // Check if partner already has a profile submitted
  const checkPartnerProfile = async (showFeedback = false) => {
    setIsCheckingStatus(true)
    setStatusMessage(null)
    try {
      const res = await ApiService.getPartnerProfile()
      if (res.ok && res.data) {
        // Robust unwrapping of profile data
        const profile = res.data?.data || res.data?.profile || res.data
        setExistingProfile(profile)

        const rawStatus = String(profile.kyc_status || profile.status || '').toUpperCase().trim()
        const isAppr = rawStatus === 'APPROVED' || profile.is_approved === true || rawStatus.includes('APPROV')
        const isRej = rawStatus === 'REJECTED' || rawStatus.includes('REJECT')

        if (isAppr) {
          onNavigateToDashboard()
          return
        } else if (isRej) {
          if (showFeedback) {
            setStatusMessage('KYC application was rejected. Please see details and contact support.')
          }
        } else if (showFeedback) {
          setStatusMessage('Your application is still under review. Please wait for admin approval.')
        }
      } else if (showFeedback) {
        setStatusMessage('No submitted KYC application found. Please complete the form below.')
      }
    } catch (err) {
      console.warn('Profile check error:', err)
      if (showFeedback) {
        setStatusMessage('Could not refresh status at this moment.')
      }
    } finally {
      setIsCheckingStatus(false)
      setIsInitialLoading(false)
    }
  }

  // Initial check on mount to check if partner already has a profile submitted
  useEffect(() => {
    checkPartnerProfile(false)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errorMessage) setErrorMessage(null)
  }

  const handlePanFileSelect = (file: File | null) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('PAN Document file size must be less than 2MB')
      return
    }
    setPanFile(file)
    if (errorMessage) setErrorMessage(null)
  }

  const handleAadharFileSelect = (file: File | null) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Aadhaar Document file size must be less than 2MB')
      return
    }
    setAadharFile(file)
    if (errorMessage) setErrorMessage(null)
  }

  const handleChequeFileSelect = (file: File | null) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Cancelled Cheque Document file size must be less than 2MB')
      return
    }
    setChequeFile(file)
    if (errorMessage) setErrorMessage(null)
  }

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Client-side validations
    if (formData.partner_type === 'CHANNEL_PARTNER' && !formData.superior_code.trim()) {
      setErrorMessage('Superior Code is mandatory for Channel-Partner.')
      return
    }

    if (formData.pincode.trim() && formData.pincode.replace(/\D/g, '').length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Pincode.')
      return
    }

    const cleanPan = formData.pan_number.trim().toUpperCase()
    if (cleanPan.length !== 10) {
      setErrorMessage('PAN Card Number must be exactly 10 alphanumeric characters (e.g. ABCDE1234F).')
      return
    }

    const cleanAadhar = formData.aadhar_number.replace(/\D/g, '')
    if (cleanAadhar.length !== 12) {
      setErrorMessage('Aadhaar Number must be exactly 12 numeric digits.')
      return
    }

    if (formData.confirm_bank_account.trim() && formData.bank_account_number.trim() && formData.bank_account_number.trim() !== formData.confirm_bank_account.trim()) {
      setErrorMessage('Bank account numbers do not match. Please verify.')
      return
    }

    // Mandatory Document Validations
    if (!panFile) {
      setErrorMessage('Please upload your PAN Card document (JPG, PNG, or PDF).')
      return
    }

    if (!aadharFile) {
      setErrorMessage('Please upload your Aadhaar Card document (JPG, PNG, or PDF).')
      return
    }

    if (!chequeFile) {
      setErrorMessage('Please upload your Cancelled Cheque / Bank Proof document (JPG, PNG, or PDF).')
      return
    }

    setIsSubmitting(true)

    // Construct FormData for multipart submission
    const form = new FormData()
    form.append('partner_type', formData.partner_type)
    if (formData.superior_code.trim()) {
      form.append('superior_code', formData.superior_code.trim())
    }
    if (formData.company_name.trim()) {
      form.append('company_name', formData.company_name.trim())
    }
    form.append('address', formData.address.trim())
    form.append('city', formData.city.trim())
    form.append('state', formData.state.trim())
    form.append('pincode', formData.pincode.trim())
    form.append('pan_number', cleanPan)
    form.append('aadhar_number', cleanAadhar)
    form.append('bank_name', formData.bank_name.trim())
    form.append('bank_account_number', formData.bank_account_number.trim())
    form.append('bank_ifsc', formData.bank_ifsc.trim().toUpperCase())
    if (panFile) {
      form.append('pan_document', panFile)
    }
    if (aadharFile) {
      form.append('aadhar_document', aadharFile)
    }
    if (chequeFile) {
      form.append('cancelled_cheque_document', chequeFile)
      form.append('cheque_document', chequeFile)
      form.append('bank_document', chequeFile)
    }

    try {
      const res = await ApiService.submitKYC(form)
      if (res.ok) {
        setSuccessMessage('KYC submitted successfully! Waiting for admin approval.')
        const profile = res.data?.data || res.data?.profile || res.data || { kyc_status: 'SUBMITTED' }
        setExistingProfile(profile)
        setIsKycModalOpen(false)
      } else {
        const err = extractCleanBackendError(res.data, 'Failed to submit KYC. Please verify your details.')
        setErrorMessage(err)
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error submitting KYC form to backend.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentKycStatus = String(existingProfile?.kyc_status || existingProfile?.status || '').toUpperCase().trim()
  const isApproved = currentKycStatus === 'APPROVED' || existingProfile?.is_approved === true || currentKycStatus.includes('APPROV')
  const isRejected = currentKycStatus === 'REJECTED' || currentKycStatus.includes('REJECT')
  const isSubmitted = currentKycStatus === 'SUBMITTED' || currentKycStatus === 'PENDING' || currentKycStatus === 'UNDER_REVIEW' || currentKycStatus === 'REVIEW' || (Boolean(existingProfile?.pan_number) && !isApproved && !isRejected)
  const isWaitingApproval = isSubmitted && !isApproved && !isRejected

  // Periodically check for approval ONLY when KYC is submitted and awaiting admin approval
  useEffect(() => {
    if (!isWaitingApproval || isKycModalOpen) return

    const interval = setInterval(() => {
      checkPartnerProfile(false)
    }, 8000)

    return () => clearInterval(interval)
  }, [isWaitingApproval, isKycModalOpen])

  // Sync profile details into form fields if available
  useEffect(() => {
    if (existingProfile) {
      setFormData((prev) => ({
        ...prev,
        partner_type: existingProfile.partner_type || prev.partner_type,
        superior_code: existingProfile.superior_code || prev.superior_code,
        company_name: existingProfile.company_name || prev.company_name,
        address: existingProfile.address || prev.address,
        city: existingProfile.city || prev.city,
        state: existingProfile.state || prev.state,
        pincode: existingProfile.pincode || prev.pincode,
        pan_number: existingProfile.pan_number || prev.pan_number,
        aadhar_number: existingProfile.aadhar_number || prev.aadhar_number,
        bank_name: existingProfile.bank_name || prev.bank_name,
        bank_account_number: existingProfile.bank_account_number || prev.bank_account_number,
        confirm_bank_account: existingProfile.bank_account_number || prev.confirm_bank_account,
        bank_ifsc: existingProfile.bank_ifsc || prev.bank_ifsc,
      }))
    }
  }, [existingProfile])

  // If approved, trigger navigation immediately
  useEffect(() => {
    if (isApproved) {
      onNavigateToDashboard()
    }
  }, [isApproved])

  // Resolve clean human display name from live API profile, cache, or auth session
  const getDisplayName = (): string => {
    // 1. Live profile data
    if (existingProfile?.full_name && !existingProfile.full_name.includes('@')) {
      return existingProfile.full_name
    }
    if (existingProfile?.name && !existingProfile.name.includes('@')) {
      return existingProfile.name
    }
    if (existingProfile?.user?.first_name || existingProfile?.user?.last_name) {
      const uName = `${existingProfile.user.first_name || ''} ${existingProfile.user.last_name || ''}`.trim()
      if (uName && !uName.includes('@')) return uName
    }

    // 2. Cached profile name from localStorage
    const cachedProfileName =
      localStorage.getItem('maytri_profile_name') ||
      localStorage.getItem('maytri_last_user_name')
    if (cachedProfileName && cachedProfileName !== 'Partner' && !cachedProfileName.includes('@')) {
      return cachedProfileName
    }

    // 3. Saved user from AuthToken
    const savedUser = AuthToken.getUser()
    if (savedUser) {
      const u = (savedUser as any)?.data || (savedUser as any)?.user || savedUser
      const uName =
        `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
        u.full_name ||
        u.name
      if (uName && uName !== 'Partner' && !uName.includes('@')) {
        return uName
      }
    }

    // 4. Current user state from props
    const raw = currentUser?.name || ''
    if (raw && raw !== 'Partner' && !raw.includes('@')) return raw

    // 5. Clean name from email if available (e.g. pokala.reddy@gmail.com -> Pokala Reddy)
    const email = currentUser?.email || savedUser?.email || ''
    if (email) {
      const stored =
        localStorage.getItem(`maytri_user_name_${email.toLowerCase()}`)
      if (stored && stored !== 'Partner' && !stored.includes('@')) return stored

      const prefix = email.split('@')[0]
      const words = prefix.replace(/[._0-9]/g, ' ').trim().split(/\s+/).filter(Boolean)
      if (words.length > 0) {
        return words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }
    }

    if (existingProfile?.company_name) {
      return existingProfile.company_name
    }

    return 'Partner'
  }

  const displayName = getDisplayName()

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-[#0092b3] selection:text-white">
        <div className="relative flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          {/* Ambient Glow */}
          <div className="absolute w-36 h-36 rounded-full bg-[#0092b3]/25 blur-2xl animate-pulse pointer-events-none" />

          {/* Circular Spinner Ring */}
          <div className="h-28 w-28 rounded-full border-[4px] border-slate-200/70 border-t-[#0092b3] border-r-[#0092b3]/50 animate-spin" />

          {/* Centered Zoomed Logo Container */}
          <div className="absolute inset-2.5 rounded-full bg-white flex items-center justify-center p-2 shadow-sm border border-slate-100 overflow-hidden">
            <img
              src={logoPng}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/maytri-logo.svg'
              }}
              alt="Maytri"
              className="h-20 w-20 object-contain scale-125 select-none"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-[#0092b3] selection:text-white">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 flex h-16 sm:h-18 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-xs">
        <div className="flex items-center gap-6">
          <MaytriLogo size="md" />
        </div>

        {/* Logout Action */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onLogout}
            title="Sign Out"
            className="h-9 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md shadow-red-600/25 border border-red-500 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#007d99] via-[#0092b3] to-[#2a94b5] p-6 sm:p-10 text-white shadow-xl shadow-[#0092b3]/20 border border-cyan-300/30">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Welcome {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-cyan-50 font-medium leading-relaxed drop-shadow-xs">
              {isRejected
                ? 'Your KYC application was rejected by the admin. Please see details and contact support below.'
                : isWaitingApproval
                  ? 'Your KYC application has been submitted and is currently waiting for admin approval.'
                  : 'Follow these quick steps and get your account approved to start adding leads and earn amazing benefits.'}
            </p>
          </div>

          {/* 2 STEPS WORKFLOW CARDS */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mt-8">
            <div
              onClick={() => {
                if (!isWaitingApproval && !isRejected && !isApproved) {
                  setIsKycModalOpen(true)
                }
              }}
              className={cn(
                "bg-white rounded-2xl p-4 text-center text-slate-800 shadow-md border flex flex-col items-center justify-center space-y-2 transition-all",
                (isWaitingApproval || isRejected)
                  ? "border-emerald-400/80 bg-emerald-50/40"
                  : "border-white/40 hover:border-cyan-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-black text-base shadow-xs">
                {(isWaitingApproval || isRejected) ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <FileText className="h-5 w-5" />}
              </div>
              <span className="text-xs font-black text-slate-900">1. Fill KYC Details</span>
              <p className="text-[10.5px] font-medium text-slate-600 leading-snug">
                {(isWaitingApproval || isRejected) ? 'Completed & Submitted' : 'Partner classification, address & bank details'}
              </p>
              {!isWaitingApproval && !isRejected && !isApproved && (
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsKycModalOpen(true)
                  }}
                  className="h-8 px-4 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-[11px] rounded-xl shadow-sm cursor-pointer mt-1 gap-1"
                >
                  <span>Fill KYC Online</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div
              className={cn(
                "bg-white rounded-2xl p-4 text-center text-slate-800 shadow-md border flex flex-col items-center justify-center space-y-2 transition-all",
                isRejected
                  ? "border-rose-400 bg-rose-50/70"
                  : isWaitingApproval
                    ? "border-amber-400 bg-amber-50/70 shadow-sm"
                    : "border-white/40"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center font-black text-base shadow-xs",
                isRejected ? "bg-rose-100 text-rose-700" : isWaitingApproval ? "bg-amber-100 text-amber-700" : "bg-[#0092b3]/10 text-[#0092b3]"
              )}>
                {isRejected ? <XCircle className="h-5 w-5 text-rose-600" /> : isWaitingApproval ? <Hourglass className="h-5 w-5 animate-pulse" /> : <Building className="h-5 w-5" />}
              </div>
              <span className="text-xs font-black text-slate-900">
                {isRejected ? '2. Rejected by Admin' : isWaitingApproval ? '2. Waiting for Approval' : '2. Submit for Approval'}
              </span>
              <p className="text-[10.5px] font-medium text-slate-600 leading-snug">
                {isRejected ? 'Action required - Contact support' : isWaitingApproval ? 'Under review by Admin' : 'Verification by Admin'}
              </p>
              {isWaitingApproval && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => checkPartnerProfile(true)}
                  disabled={isCheckingStatus}
                  className="h-8 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-xl shadow-md shadow-amber-500/20 cursor-pointer mt-1 gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isCheckingStatus && "animate-spin")} />
                  <span>{isCheckingStatus ? 'Checking...' : 'Check Approval Status'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold shadow-sm animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-blue-50 border border-blue-300 text-blue-800 text-xs font-bold shadow-sm animate-in fade-in">
            <Clock className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="flex-1">{statusMessage}</span>
          </div>
        )}

        {/* STATE 1: REJECTED SCREEN WITH REJECTION MESSAGE & CONTACT INFO */}
        {isRejected && (
          <Card className="border-2 border-rose-300 bg-white shadow-xl rounded-3xl overflow-hidden animate-in fade-in">
            <div className="bg-rose-50/90 border-b border-rose-200 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-rose-800 uppercase tracking-widest bg-rose-200/80 px-2.5 py-0.5 rounded-full">
                    KYC Rejected by Admin
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    Your KYC Application was Rejected
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsKycModalOpen(true)}
                  className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Re-Submit KYC</span>
                </Button>
                <Button
                  onClick={() => checkPartnerProfile(true)}
                  disabled={isCheckingStatus}
                  variant="outline"
                  className="h-9 px-4 rounded-xl border-rose-300 bg-white hover:bg-rose-50 text-rose-900 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isCheckingStatus && "animate-spin")} />
                  <span>Check Status</span>
                </Button>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Rejection Reason Notice */}
              {existingProfile?.rejection_reason ? (
                <div className="p-4.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <span>Admin Rejection Reason:</span>
                  </div>
                  <p className="text-xs font-bold text-rose-800 pl-6 leading-relaxed">
                    "{existingProfile.rejection_reason}"
                  </p>
                </div>
              ) : (
                <div className="p-4.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <p className="text-xs font-bold text-rose-900">
                    Your KYC application was not approved by the admin desk. One or more documents or details may have been incomplete or invalid.
                  </p>
                </div>
              )}

              {/* CONTACT SUPPORT DESK SECTION */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Please Contact Maytri Group Support Desk
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Please get in touch with our partner onboarding team to clarify the rejection reason or verify your documents:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Phone Support */}
                  <a
                    href="tel:040-24200456"
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-[#0092b3]/5 hover:border-[#0092b3]/40 transition-all flex items-center gap-3.5 group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center shrink-0 group-hover:bg-[#0092b3] group-hover:text-white transition-colors">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Call Support Desk</p>
                      <p className="text-sm font-black text-slate-900">040-24200456</p>
                      <p className="text-[10px] text-slate-500 font-medium">Mon - Sat: 9:30 AM - 6:30 PM</p>
                    </div>
                  </a>

                  {/* Email Support */}
                  <a
                    href="mailto:sales@maytrigroup.in?subject=KYC%20Rejection%20Assistance"
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-[#0092b3]/5 hover:border-[#0092b3]/40 transition-all flex items-center gap-3.5 group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center shrink-0 group-hover:bg-[#0092b3] group-hover:text-white transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Email Us</p>
                      <p className="text-sm font-black text-slate-900">sales@maytrigroup.in</p>
                      <p className="text-[10px] text-slate-500 font-medium">Response within 2-4 hours</p>
                    </div>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}



        {/* STATE 3: APPROVED SCREEN (UNLOCKED DASHBOARD) */}
        {isApproved && (
          <Card className="border-2 border-emerald-300 bg-white shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 text-center space-y-4 animate-in fade-in">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <BadgeCheck className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                KYC Approved & Verified!
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Congratulations! Your Maytri Channel Partner account has been approved. You now have full access to add leads, book site visits, and manage commissions.
              </p>
            </div>
            <Button
              onClick={onNavigateToDashboard}
              className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer gap-2 mx-auto"
            >
              <span>ENTER DASHBOARD</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        )}

        {/* KYC POPUP APPLICATION DIALOG */}
        <Dialog open={isKycModalOpen} onOpenChange={setIsKycModalOpen}>
          <DialogContent className="w-[96vw] max-w-4xl max-h-[92vh] p-0 overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col mx-auto">
            {/* Modal Header */}
            <div className="border-b border-slate-100 bg-slate-50/90 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-2 shrink-0">
              <div>
                <DialogTitle className="text-sm sm:text-lg font-black text-slate-900">
                  Partner KYC Verification Form
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5">
                  Please provide accurate details matching your official government identity documents
                </DialogDescription>
              </div>
            </div>

            {/* Modal Body - Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 sm:space-y-6">
              {errorMessage && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold shadow-sm animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitKyc} className="space-y-7">
                {/* SECTION 1: PARTNER CLASSIFICATION & BUSINESS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Building2 className="h-4 w-4 text-[#0092b3]" />
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      1. Partner Classification & Business Info
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Partner / Applicant Full Name (Fetched Live from API) */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Applicant / Partner Name <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <Input
                        value={displayName}
                        disabled
                        readOnly
                        className="h-10 bg-slate-100 border-slate-300 text-xs font-extrabold text-slate-900 rounded-xl cursor-not-allowed select-none"
                      />
                    </div>

                    {/* Partner Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        Partner Type <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <select
                        value={formData.partner_type}
                        onChange={(e) => {
                          const newType = e.target.value as 'CP_HEAD' | 'CHANNEL_PARTNER'
                          setFormData((prev) => ({
                            ...prev,
                            partner_type: newType,
                            superior_code: newType === 'CP_HEAD' ? '' : prev.superior_code,
                          }))
                          if (errorMessage) setErrorMessage(null)
                        }}
                        className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0092b3] focus:ring-1 focus:ring-[#0092b3] shadow-2xs cursor-pointer"
                      >
                        <option value="CP_HEAD">CP_Head</option>
                        <option value="CHANNEL_PARTNER">Channel-Partner</option>
                      </select>
                    </div>

                    {/* Superior Code (Disabled for CP_Head, enabled & required for Channel-Partner) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block flex items-center justify-between">
                        <span>
                          Superior Code {formData.partner_type === 'CHANNEL_PARTNER' ? <span className="text-red-500 font-bold ml-0.5">*</span> : <span className="text-slate-400 font-medium text-[10px]">(Disabled)</span>}
                        </span>
                        {formData.partner_type === 'CP_HEAD' && (
                          <span className="text-[10px] font-bold text-slate-400">Not Applicable</span>
                        )}
                      </label>
                      <Input
                        placeholder={
                          formData.partner_type === 'CHANNEL_PARTNER'
                            ? 'Enter Superior Code'
                            : 'Disabled for CP_Head'
                        }
                        disabled={formData.partner_type === 'CP_HEAD'}
                        value={formData.partner_type === 'CP_HEAD' ? '' : formData.superior_code}
                        onChange={(e) => handleInputChange('superior_code', e.target.value.toUpperCase())}
                        className={cn(
                          'h-10 text-xs font-bold rounded-xl uppercase transition-all',
                          formData.partner_type === 'CP_HEAD'
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none placeholder:text-slate-400'
                            : 'bg-white border-slate-300 text-slate-900 focus-visible:border-[#0092b3]'
                        )}
                        required={formData.partner_type === 'CHANNEL_PARTNER'}
                      />
                    </div>

                    {/* Company / Firm Name */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Company / Agency Name <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                      </label>
                      <Input
                        placeholder="Enter company or agency name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="h-10 bg-white border-slate-300 text-xs font-bold text-slate-900 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: REGISTERED LOCATION & ADDRESS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MapPin className="h-4 w-4 text-[#0092b3]" />
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      2. Registered Address
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        Office / Residential Address
                      </label>
                      <Input
                        placeholder="Enter flat/door no, building, street, area, landmark"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="h-10 bg-white border-slate-300 text-xs font-semibold text-slate-900 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* City */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 block">
                          City
                        </label>
                        <Input
                          placeholder="Enter city (e.g. Hyderabad)"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="h-10 bg-white border-slate-300 text-xs font-semibold text-slate-900 rounded-xl"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 block">
                          State
                        </label>
                        <Input
                          placeholder="Enter state (e.g. Telangana)"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="h-10 bg-white border-slate-300 text-xs font-semibold text-slate-900 rounded-xl"
                        />
                      </div>

                      {/* Pincode */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 block">
                          Pincode (6 digits)
                        </label>
                        <Input
                          placeholder="Enter 6-digit PIN"
                          maxLength={6}
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, ''))}
                          className="h-10 bg-white border-slate-300 text-xs font-semibold text-slate-900 rounded-xl font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: TAX & IDENTITY DETAILS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <IdCard className="h-4 w-4 text-[#0092b3]" />
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      3. Identity & Tax Verification
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PAN Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        PAN Card Number (10 alphanumeric) <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <Input
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        value={formData.pan_number}
                        onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                        className="h-10 bg-white border-slate-300 text-xs font-extrabold text-slate-900 rounded-xl font-mono uppercase tracking-wider"
                        required
                      />
                    </div>

                    {/* Aadhaar Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        Aadhaar Card Number (12 digits) <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <Input
                        placeholder="Enter 12-digit Aadhaar number"
                        maxLength={12}
                        value={formData.aadhar_number}
                        onChange={(e) => handleInputChange('aadhar_number', e.target.value.replace(/\D/g, ''))}
                        className="h-10 bg-white border-slate-300 text-xs font-extrabold text-slate-900 rounded-xl font-mono tracking-wider"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: BANK ACCOUNT DETAILS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Landmark className="h-4 w-4 text-[#0092b3]" />
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      4. Bank Account Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Bank Name */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Bank Name
                      </label>
                      <Input
                        placeholder="Enter bank name (e.g. HDFC Bank)"
                        value={formData.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        className="h-10 bg-white border-slate-300 text-xs font-semibold text-slate-900 rounded-xl"
                      />
                    </div>

                    {/* Bank Account Number */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Account Number
                      </label>
                      <Input
                        placeholder="Enter account number"
                        value={formData.bank_account_number}
                        onChange={(e) => handleInputChange('bank_account_number', e.target.value.replace(/\s/g, ''))}
                        className="h-10 bg-white border-slate-300 text-xs font-bold text-slate-900 rounded-xl font-mono"
                      />
                    </div>

                    {/* Confirm Account Number */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Confirm Account
                      </label>
                      <Input
                        placeholder="Re-enter account number"
                        value={formData.confirm_bank_account}
                        onChange={(e) => handleInputChange('confirm_bank_account', e.target.value.replace(/\s/g, ''))}
                        className="h-10 bg-white border-slate-300 text-xs font-bold text-slate-900 rounded-xl font-mono"
                      />
                    </div>

                    {/* IFSC Code */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        IFSC Code
                      </label>
                      <Input
                        placeholder="e.g. HDFC0001234"
                        maxLength={11}
                        value={formData.bank_ifsc}
                        onChange={(e) => handleInputChange('bank_ifsc', e.target.value.toUpperCase())}
                        className="h-10 bg-white border-slate-300 text-xs font-extrabold text-slate-900 rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 5: DOCUMENT UPLOADS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-[#0092b3]" />
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        5. Mandatory KYC Document Uploads (JPG / PNG / PDF)
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      All 3 files required *
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* 1. PAN Card Upload Box */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setPanDragOver(true)
                      }}
                      onDragLeave={() => setPanDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setPanDragOver(false)
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handlePanFileSelect(e.dataTransfer.files[0])
                        }
                      }}
                      onClick={() => panInputRef.current?.click()}
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]',
                        panDragOver
                          ? 'border-[#0092b3] bg-[#0092b3]/5'
                          : panFile
                            ? 'border-emerald-400 bg-emerald-50/50'
                            : 'border-slate-300 hover:border-[#0092b3] bg-slate-50/50'
                      )}
                    >
                      <input
                        ref={panInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files && handlePanFileSelect(e.target.files[0])}
                      />

                      {panFile ? (
                        <div className="space-y-1">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <FileCheck className="h-4.5 w-4.5" />
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 truncate max-w-[200px]">
                            {panFile.name}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-bold">
                            {(panFile.size / 1024).toFixed(1)} KB • Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="h-9 w-9 rounded-full bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center mx-auto">
                            <Upload className="h-4.5 w-4.5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            1. PAN Card Document <span className="text-red-500 font-bold ml-0.5">*</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Drag & drop or browse (Max 2MB)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 2. Aadhaar Card Upload Box */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setAadharDragOver(true)
                      }}
                      onDragLeave={() => setAadharDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setAadharDragOver(false)
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleAadharFileSelect(e.dataTransfer.files[0])
                        }
                      }}
                      onClick={() => aadharInputRef.current?.click()}
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]',
                        aadharDragOver
                          ? 'border-[#0092b3] bg-[#0092b3]/5'
                          : aadharFile
                            ? 'border-emerald-400 bg-emerald-50/50'
                            : 'border-slate-300 hover:border-[#0092b3] bg-slate-50/50'
                      )}
                    >
                      <input
                        ref={aadharInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files && handleAadharFileSelect(e.target.files[0])}
                      />

                      {aadharFile ? (
                        <div className="space-y-1">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <FileCheck className="h-4.5 w-4.5" />
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 truncate max-w-[200px]">
                            {aadharFile.name}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-bold">
                            {(aadharFile.size / 1024).toFixed(1)} KB • Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="h-9 w-9 rounded-full bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center mx-auto">
                            <Upload className="h-4.5 w-4.5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            2. Aadhaar Card Document <span className="text-red-500 font-bold ml-0.5">*</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Drag & drop or browse (Max 2MB)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. Cancelled Cheque Upload Box */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setChequeDragOver(true)
                      }}
                      onDragLeave={() => setChequeDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setChequeDragOver(false)
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleChequeFileSelect(e.dataTransfer.files[0])
                        }
                      }}
                      onClick={() => chequeInputRef.current?.click()}
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]',
                        chequeDragOver
                          ? 'border-[#0092b3] bg-[#0092b3]/5'
                          : chequeFile
                            ? 'border-emerald-400 bg-emerald-50/50'
                            : 'border-slate-300 hover:border-[#0092b3] bg-slate-50/50'
                      )}
                    >
                      <input
                        ref={chequeInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files && handleChequeFileSelect(e.target.files[0])}
                      />

                      {chequeFile ? (
                        <div className="space-y-1">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <FileCheck className="h-4.5 w-4.5" />
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 truncate max-w-[200px]">
                            {chequeFile.name}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-bold">
                            {(chequeFile.size / 1024).toFixed(1)} KB • Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="h-9 w-9 rounded-full bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center mx-auto">
                            <Upload className="h-4.5 w-4.5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            3. Cancelled Cheque <span className="text-red-500 font-bold ml-0.5">*</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Drag & drop or browse (Max 2MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SUBMIT BUTTON BAR */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Your documents are securely encrypted.</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsKycModalOpen(false)}
                      className="w-full sm:w-auto h-11 px-5 rounded-xl border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto h-11 px-8 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#0092b3]/30 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Submitting KYC...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit KYC</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>


      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-2">
        <div>© 2026 Maytri Group. All rights reserved. RERA Registered: https://rera.telangana.gov.in/</div>
        <div className="flex items-center gap-4 font-bold text-slate-700">
          <span>Support: 040-24200456</span>
          <span>•</span>
          <span>Email Us: sales@maytrigroup.in</span>
        </div>
      </footer>
    </div>
  )
}

export default WelcomeKycPage
