import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { MaytriLogo } from '@/components/common/MaytriLogo'
import heroSectionImg from '@/assets/herosection.webp'
import hero3Img from '@/assets/hero3.jpg'
import hero1Img from '@/assets/hero 1.webp'
import hero2Img from '@/assets/hero2.webp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiService } from '@/services/apiService'
import { toast } from '@/components/common/ToastNotification'

// Helper to extract only the clean, exact error message returned by backend
function extractCleanBackendError(data: any, defaultMsg = 'An error occurred. Please check your inputs.'): string {
  if (!data) return defaultMsg

  // 1. If backend returns "errors" map with field-specific error arrays
  if (data.errors && typeof data.errors === 'object') {
    const messages: string[] = []
    for (const [, val] of Object.entries(data.errors)) {
      if (Array.isArray(val)) {
        messages.push(val.join(', '))
      } else if (typeof val === 'string') {
        messages.push(val)
      }
    }
    if (messages.length > 0) {
      return messages.join(' • ')
    }
  }

  // 2. If backend returns detail array (Pydantic / Ninja schema validation)
  if (Array.isArray(data.detail)) {
    const msgs = data.detail.map((d: any) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d)))
    if (msgs.length > 0) return msgs.join(' • ')
  }

  // 3. If detail is a direct string
  if (typeof data.detail === 'string') {
    return data.detail
  }

  // 4. If message is present and not generic "Validation failed"
  if (data.message && data.message !== 'Validation failed') {
    return data.message
  }

  // 5. If message is present
  if (data.message) {
    return data.message
  }

  // 6. Direct error property
  if (data.error && typeof data.error === 'string') {
    return data.error
  }

  return defaultMsg
}

// Login Schema: email and password
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
})

export type LoginFormValues = z.infer<typeof loginSchema>

// Exact backend Register Schema: first_name, last_name, mobile, email, password
const registerSchema = z.object({
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  mobile: z.string().min(10, { message: 'Enter valid 10-digit mobile number' }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Enter a valid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

const HERO_BACKGROUND_IMAGES = [
  heroSectionImg,
  hero3Img,
  hero1Img,
  hero2Img,
]

interface AuthPageProps {
  onLoginSuccess: (
    user: { name: string; email: string; role: string },
    initialView?: 'kyc' | 'dashboard'
  ) => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentBgIndex, setCurrentBgIndex] = useState(0)

  // Registration OTP State
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)

  // 6-digit OTP Box State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 60-second Countdown Timer for Resend OTP
  const [countdown, setCountdown] = useState<number>(60)
  const [canResend, setCanResend] = useState<boolean>(false)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotResetToken, setForgotResetToken] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')

  // Hero image carousel effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_BACKGROUND_IMAGES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Resend OTP 60s countdown timer
  useEffect(() => {
    let interval: any = null
    if (otpSent && !otpVerified && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [otpSent, otpVerified, countdown])

  // React Hook Form for Login
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    setValue: setValueLogin,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // React Hook Form for Register
  const {
    register: registerRegister,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors },
    watch: watchRegister,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      mobile: '',
      email: '',
      password: '',
    },
  })

  const [lastSentMobile, setLastSentMobile] = useState('')
  const rawMobile = watchRegister('mobile') || ''
  const cleanMobile = rawMobile.replace(/[^0-9]/g, '').slice(-10)

  // Reset OTP state if mobile number changes
  useEffect(() => {
    if (lastSentMobile && cleanMobile !== lastSentMobile) {
      setOtpSent(false)
      setOtpVerified(false)
      setOtpDigits(['', '', '', '', '', ''])
      setAuthError(null)
    }
  }, [cleanMobile, lastSentMobile])

  // Handle Send OTP
  const handleSendOtp = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!cleanMobile || cleanMobile.length < 10) {
      setAuthError('Enter a valid 10-digit Indian mobile number.')
      return
    }
    setAuthError(null)
    setAuthSuccess(null)
    setOtpLoading(true)

    try {
      const res = await ApiService.sendOtp(cleanMobile)
      if (res.ok) {
        setLastSentMobile(cleanMobile)
        setOtpSent(true)
        setCountdown(60)
        setCanResend(false)
        setOtpDigits(['', '', '', '', '', ''])
        const successMsg = 'The OTP has been sent successfully to your mobile number.'
        setAuthSuccess(successMsg)
        toast.success(
          'OTP Sent Successfully',
          `A 6-digit verification code has been sent to +91 ${cleanMobile}.`
        )
        setTimeout(() => {
          otpInputRefs.current[0]?.focus()
        }, 150)
      } else {
        const errorPayload = res.data || (res.message ? { message: res.message } : null)
        const errorMsg = extractCleanBackendError(errorPayload, res.message || 'Unable to send OTP. Please check your mobile number.')
        const isAlreadyRegistered = errorMsg.toLowerCase().includes('already registered')
        const displayMsg = isAlreadyRegistered
          ? 'This mobile number is already registered. Please switch to the Login tab.'
          : errorMsg
        setAuthError(displayMsg)
        toast.error(isAlreadyRegistered ? 'Already Registered' : 'Unable to Send OTP', displayMsg)

        // If backend rate limit active ("Please wait X seconds..."), reveal boxes and sync timer
        const match = errorMsg.match(/wait\s+(\d+)\s+seconds/i)
        if (match && match[1]) {
          const remainingSecs = parseInt(match[1], 10)
          if (remainingSecs > 0) {
            setOtpSent(true)
            setCountdown(remainingSecs)
            setCanResend(false)
          }
        }
      }
    } catch (err: any) {
      const errText = err?.message || 'Unable to connect to OTP service. Please try again.'
      setAuthError(errText)
      toast.error('Connection Notice', errText)
    } finally {
      setOtpLoading(false)
    }
  }

  // Handle Resend OTP (active only after 60s countdown completes)
  const handleResendOtp = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!canResend || otpLoading) return
    if (!cleanMobile || cleanMobile.length < 10) {
      setAuthError('Please enter a valid 10-digit Indian mobile number.')
      toast.warning('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number.')
      return
    }
    setAuthError(null)
    setAuthSuccess(null)
    setOtpLoading(true)

    try {
      const res = await ApiService.resendOtp(cleanMobile)
      if (res.ok) {
        setCountdown(60)
        setCanResend(false)
        setOtpDigits(['', '', '', '', '', ''])
        const msg = 'The OTP has been resent successfully to your mobile number.'
        setAuthSuccess(msg)
        toast.success(
          'OTP Resent Successfully',
          `A new 6-digit verification code has been successfully resent to +91 ${cleanMobile}.`
        )
        setTimeout(() => {
          otpInputRefs.current[0]?.focus()
        }, 150)
      } else {
        const errorPayload = res.data || (res.message ? { message: res.message } : null)
        const errorMsg = extractCleanBackendError(errorPayload, res.message || 'Unable to resend OTP. Please try again in a moment.')
        setAuthError(errorMsg)
        toast.error('Resend Notice', errorMsg)

        // If backend says "Please wait X seconds", sync the countdown timer
        const match = errorMsg.match(/wait\s+(\d+)\s+seconds/i)
        if (match && match[1]) {
          const remainingSecs = parseInt(match[1], 10)
          if (remainingSecs > 0) {
            setCountdown(remainingSecs)
            setCanResend(false)
          }
        }
      }
    } catch (err: any) {
      const errText = err?.message || 'Unable to connect to OTP service. Please try again.'
      setAuthError(errText)
      toast.error('Connection Notice', errText)
    } finally {
      setOtpLoading(false)
    }
  }

  // Handle individual digit change in 6 OTP boxes
  const handleOtpDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '')
    const newDigit = cleaned.slice(-1)

    const updatedDigits = [...otpDigits]
    updatedDigits[index] = newDigit
    setOtpDigits(updatedDigits)

    // Clear previous error on typing
    if (authError) setAuthError(null)

    // Auto-focus next box if digit is entered
    if (newDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle keyboard navigation for OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Current is empty, go to previous and clear it
        const updatedDigits = [...otpDigits]
        updatedDigits[index - 1] = ''
        setOtpDigits(updatedDigits)
        otpInputRefs.current[index - 1]?.focus()
      } else {
        // Clear current
        const updatedDigits = [...otpDigits]
        updatedDigits[index] = ''
        setOtpDigits(updatedDigits)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle Paste for 6-digit OTP
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pasted) return

    const updatedDigits = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) {
      updatedDigits[i] = pasted[i]
    }
    setOtpDigits(updatedDigits)

    const focusIdx = Math.min(pasted.length, 5)
    otpInputRefs.current[focusIdx]?.focus()
  }

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join('')
    if (fullOtp.length !== 6) {
      setAuthError('Please enter all 6 digits of the OTP.')
      return
    }
    setAuthError(null)
    setAuthSuccess(null)
    setOtpLoading(true)

    try {
      const res = await ApiService.verifyOtp(cleanMobile, fullOtp)
      if (res.ok) {
        setOtpVerified(true)
        setOtpSent(false)
        setAuthSuccess('Verified successfully.')
        toast.success('Mobile Verified Successfully!', 'You can now complete your registration.')
      } else {
        const errorPayload = res.data || (res.message ? { message: res.message } : null)
        const errorMsg = extractCleanBackendError(errorPayload, res.message || 'Invalid or expired OTP. Please try again.')
        setAuthError(errorMsg)
        toast.error('Invalid OTP', errorMsg)
      }
    } catch (err: any) {
      const errText = err?.message || 'Error verifying OTP'
      setAuthError(errText)
      toast.error('Verification Error', errText)
    } finally {
      setOtpLoading(false)
    }
  }

  // Handle Login Submit
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setAuthError(null)
    setAuthSuccess(null)

    try {
      const res = await ApiService.login(data.email, data.password)
      if (res.ok && res.data) {
        const userObj = res.data?.user || res.data?.data?.user || res.data?.data
        let userName =
          userObj?.full_name ||
          userObj?.name ||
          (userObj?.first_name ? `${userObj.first_name} ${userObj.last_name || ''}`.trim() : '')

        const userRole = userObj?.role || 'Channel Partner'
        let targetView: 'kyc' | 'dashboard' = 'kyc'

        // Check live partner profile to determine actual full name and KYC status
        try {
          const profileRes = await ApiService.getPartnerProfile()
          if (profileRes.ok && profileRes.data) {
            const profile = profileRes.data?.data || profileRes.data?.profile || profileRes.data
            const profileFullName =
              profile?.full_name ||
              profile?.name ||
              (profile?.user?.first_name ? `${profile.user.first_name} ${profile.user.last_name || ''}`.trim() : '')
            if (profileFullName) {
              userName = profileFullName
              localStorage.setItem('maytri_profile_name', profileFullName)
            }
            const rawStatus = String(profile.kyc_status || profile.status || '').toUpperCase().trim()
            const isApproved = rawStatus === 'APPROVED' || profile.is_approved === true || rawStatus.includes('APPROV')
            targetView = isApproved ? 'dashboard' : 'kyc'
          } else {
            targetView = 'kyc'
          }
        } catch {
          targetView = 'kyc'
        }

        if (!userName || userName === 'Partner') {
          userName =
            localStorage.getItem('maytri_profile_name') ||
            localStorage.getItem('maytri_last_user_name') ||
            localStorage.getItem(`maytri_user_name_${data.email.toLowerCase()}`) ||
            (data.email ? data.email.split('@')[0] : 'Partner')
        }

        if (userName && userName !== 'Partner' && !userName.includes('@')) {
          localStorage.setItem('maytri_profile_name', userName)
          localStorage.setItem('maytri_last_user_name', userName)
        }

        toast.success('Signed in Successfully!', `Welcome back, ${userName}!`)

        setTimeout(() => {
          setIsLoading(false)
          onLoginSuccess(
            {
              name: userName,
              email: userObj?.email || data.email,
              role: userRole,
            },
            targetView
          )
        }, 350)
      } else {
        const fallbackMsg =
          res.status === 500
            ? 'Backend server internal error (500). Please check server logs.'
            : res.message || 'Invalid email address or password.'
        const errorMsg = extractCleanBackendError(res.data, fallbackMsg)
        setAuthError(errorMsg)
        toast.error('Login Failed', errorMsg)
        setIsLoading(false)
      }
    } catch (err: any) {
      setIsLoading(false)
      const errText = err?.message || 'Backend connection error. Please try again.'
      setAuthError(errText)
      toast.error('Connection Error', errText)
    }
  }

  // Handle Quick Demo Login (Instant access/testing)
  const handleDemoLogin = (role: string = 'Senior Director') => {
    setIsLoading(true)
    setAuthError(null)
    setAuthSuccess('Logging in as Director...')
    toast.success('Signed in as Director', 'Welcome to Maytri Group workspace.')
    setTimeout(() => {
      setIsLoading(false)
      onLoginSuccess({
        name: 'Mallikarjuna (Director)',
        email: 'mallikarjunap9963@gmail.com',
        role: role,
      })
    }, 400)
  }

  // Handle Register Submit
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    if (!otpVerified) {
      const err = 'Please verify your mobile number with OTP before completing registration.'
      setAuthError(err)
      toast.warning('OTP Required', err)
      return
    }

    setIsLoading(true)
    setAuthError(null)
    setAuthSuccess(null)

    try {
      const res = await ApiService.register({
        mobile: cleanMobile,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      })

      if (res.ok) {
        setIsLoading(false)
        toast.success('Registration Successful!', 'Welcome to Maytri Group!')

        const userObj = res.data?.user || res.data?.data?.user
        const fullName = userObj
          ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || `${data.first_name} ${data.last_name}`.trim()
          : `${data.first_name} ${data.last_name}`.trim()

        if (fullName) {
          localStorage.setItem('maytri_profile_name', fullName)
          localStorage.setItem('maytri_last_user_name', fullName)
          localStorage.setItem(`maytri_user_name_${data.email.toLowerCase()}`, fullName)
        }

        setTimeout(() => {
          onLoginSuccess(
            {
              name: fullName,
              email: data.email,
              role: userObj?.role || 'Channel Partner',
            },
            'kyc'
          )
        }, 200)
      } else {
        // Show ONLY the exact error message from the backend
        const errorMsg = extractCleanBackendError(res.data, 'Registration failed. Please check your inputs.')
        setAuthError(errorMsg)
        toast.error('Registration Failed', errorMsg)
        setIsLoading(false)
      }
    } catch (err: any) {
      setIsLoading(false)
      const errText = err?.message || 'Error submitting registration to backend.'
      setAuthError(errText)
      toast.error('Registration Error', errText)
    }
  }

  // Handle Forgot Password Flow
  const handleSendForgotOtp = async () => {
    if (!forgotEmail) {
      setAuthError('Please enter your registered email address.')
      return
    }
    setOtpLoading(true)
    setAuthError(null)
    const res = await ApiService.forgotPassword(forgotEmail)
    setOtpLoading(false)
    if (res.ok) {
      setForgotOtpSent(true)
      setAuthSuccess('Password reset OTP sent to your email!')
    } else {
      const errorMsg = extractCleanBackendError(res.data, 'Email address not found on backend.')
      setAuthError(errorMsg)
    }
  }

  const handleVerifyForgotOtp = async () => {
    if (!forgotOtp) {
      setAuthError('Please enter the OTP.')
      return
    }
    setOtpLoading(true)
    setAuthError(null)
    const res = await ApiService.verifyResetOtp(forgotEmail, forgotOtp)
    setOtpLoading(false)
    if (res.ok && res.data?.reset_token) {
      setForgotResetToken(res.data.reset_token)
      setAuthSuccess('OTP verified. Enter your new password.')
    } else {
      const errorMsg = extractCleanBackendError(res.data, 'Invalid or expired OTP.')
      setAuthError(errorMsg)
    }
  }

  const handleResetPasswordSubmit = async () => {
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      return
    }
    setIsLoading(true)
    setAuthError(null)
    const res = await ApiService.resetPassword(forgotResetToken, forgotNewPassword, forgotNewPassword)
    setIsLoading(false)
    if (res.ok) {
      setAuthSuccess('Password reset successfully! Please log in.')
      setTimeout(() => setAuthMode('login'), 1500)
    } else {
      const errorMsg = extractCleanBackendError(res.data, 'Failed to reset password.')
      setAuthError(errorMsg)
    }
  }

  return (
    <div className="relative h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#0092b3] selection:text-white font-outfit overflow-hidden">
      {/* HERO BACKGROUND IMAGE CAROUSEL */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {HERO_BACKGROUND_IMAGES.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={`Maytri Group Luxury Architecture ${idx + 1}`}
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-center scale-100 transition-opacity duration-1000',
              idx === currentBgIndex ? 'opacity-100' : 'opacity-0'
            )}
          />
        ))}
        <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/55 via-black/20 to-black/30" />
      </div>

      {/* TOP NAVBAR */}
      <header className="relative z-10 w-full bg-black/35 backdrop-blur-md border-b border-white/10 px-6 sm:px-10 flex items-center justify-between shrink-0 h-16 sm:h-18 font-outfit">
        <div className="flex items-center">
          <MaytriLogo size="md" />
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline tracking-wide">
            {authMode === 'login' ? "Don't have an account?" : 'Already registered?'}
          </span>
          <Button
            type="button"
            onClick={() => {
              setAuthError(null)
              setAuthSuccess(null)
              setAuthMode(authMode === 'login' ? 'register' : 'login')
            }}
            className="bg-[#0092b3] hover:bg-[#007d99] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-[#0092b3]/30 border border-cyan-300/30 cursor-pointer transition-all tracking-wider uppercase"
          >
            {authMode === 'login' ? 'Register' : 'Login'}
          </Button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl w-full mx-auto px-6 sm:px-10 py-4 sm:py-6 min-h-0 overflow-y-auto lg:overflow-hidden gap-6 lg:gap-8 font-outfit">
        {/* HERO LEFT BRAND SHOWCASE */}
        <div className="flex-1 text-white space-y-5 max-w-xl hidden lg:block my-auto">
          <div className="space-y-3.5">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.12] drop-shadow-xl font-outfit">
              Architecting Premium Living Spaces in Hyderabad
            </h1>
            <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed max-w-lg drop-shadow-md tracking-wide">
              Discover iconic residential developments, reserve prime unit layouts, and streamline client journeys with our unified partner ecosystem.
            </p>
          </div>
        </div>

        {/* HERO RIGHT GLASSMORPHISM FORM CARD */}
        <div className="relative w-full sm:w-[420px] max-w-[440px] shrink-0 my-auto py-1 font-outfit">
          <div className="absolute -top-6 -left-6 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <Card className="relative z-10 bg-white/12 backdrop-blur-3xl border-t border-l border-white/40 border-r border-b border-white/20 shadow-[0_15px_45px_0_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.4)] rounded-3xl p-5 space-y-3 text-white transition-all duration-300 hover:border-white/50 hover:shadow-[0_20px_50px_0_rgba(0,0,0,0.6),inset_0_1px_2px_0_rgba(255,255,255,0.5)] max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar font-outfit">
            {/* Header Title */}
            <div className="text-center space-y-1 pb-1 border-b border-white/15">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md font-outfit">
                {authMode === 'login'
                  ? 'Login to Maytri Group'
                  : authMode === 'register'
                    ? 'Register'
                    : 'Reset Account Password'}
              </h2>
              <p className="text-[11px] font-bold text-slate-200 tracking-wide">
                {authMode === 'login'
                  ? 'Enter your work email and password'
                  : authMode === 'register'
                    ? 'Fill in your details to create an account'
                    : 'Enter your registered email to reset'}
              </p>
            </div>

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-3.5 pt-1">
                {/* 1. Work Email Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5 drop-shadow-sm">
                    <Mail className="h-3.5 w-3.5 text-cyan-300" /> Work Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Input
                    {...registerLogin('email', {
                      onChange: () => {
                        if (authError) setAuthError(null)
                      },
                    })}
                    type="email"
                    placeholder="yourname@maytrigroup.com"
                    className="h-10 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold text-xs rounded-xl px-3.5 shadow-xs focus-visible:bg-white focus-visible:border-[#0092b3] focus-visible:ring-1 focus-visible:ring-[#0092b3] transition-all"
                  />
                  {loginErrors.email && (
                    <p className="text-[10px] font-bold text-rose-300">
                      {loginErrors.email.message}
                    </p>
                  )}
                </div>

                {/* 2. Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-white flex items-center gap-1.5 drop-shadow-sm">
                      <Lock className="h-3.5 w-3.5 text-slate-300" /> Password <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null)
                        setAuthSuccess(null)
                        setAuthMode('forgot')
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      {...registerLogin('password', {
                        onChange: () => {
                          if (authError) setAuthError(null)
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      className="h-10 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 font-semibold text-xs rounded-xl px-3.5 pr-10 shadow-xs focus-visible:bg-white focus-visible:border-[#0092b3] focus-visible:ring-1 focus-visible:ring-[#0092b3] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-[10px] font-bold text-rose-300">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10.5 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer transition-all border border-white/20"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      LOGGING IN...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      LOG IN <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleSubmitRegister(onRegisterSubmit)} className="space-y-3 pt-1 text-left font-outfit">
                {/* 1. First Name & Last Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white block">
                      First Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <Input
                      {...registerRegister('first_name')}
                      placeholder="First Name (min 2 chars)"
                      className="h-9 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold text-xs rounded-lg px-2.5"
                    />
                    {registerErrors.first_name && (
                      <p className="text-[9px] font-bold text-rose-300">{registerErrors.first_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white block">
                      Last Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <Input
                      {...registerRegister('last_name')}
                      placeholder="Last Name"
                      className="h-9 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold text-xs rounded-lg px-2.5"
                    />
                    {registerErrors.last_name && (
                      <p className="text-[9px] font-bold text-rose-300">{registerErrors.last_name.message}</p>
                    )}
                  </div>
                </div>

                {/* 2. Mobile with Manual 6-Box OTP Verification & 60s Resend Timer */}
                <div className="space-y-2 bg-white/5 p-2.5 rounded-xl border border-white/15">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-white flex items-center gap-1">
                      <Phone className="h-3 w-3 text-cyan-300" /> Mobile Number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {otpVerified && (
                      <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-300 stroke-[3]" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      {...registerRegister('mobile')}
                      disabled={otpVerified}
                      placeholder="9900112233"
                      className="h-8.5 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold text-xs rounded-md px-2.5 flex-1 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    {!otpVerified && (
                      <Button
                        type="button"
                        disabled={otpLoading || cleanMobile.length < 10}
                        onClick={(e) => handleSendOtp(e)}
                        className="h-8.5 px-3 bg-[#0092b3] hover:bg-[#007d99] text-white text-[10px] font-bold rounded-md shrink-0 cursor-pointer transition-all"
                      >
                        {otpLoading && !otpSent ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : otpSent ? (
                          'OTP Sent'
                        ) : (
                          'Send OTP'
                        )}
                      </Button>
                    )}
                  </div>

                  {registerErrors.mobile && (
                    <p className="text-[9px] font-bold text-rose-300">{registerErrors.mobile.message}</p>
                  )}

                  {/* 6 OTP Boxes Section when OTP is Sent */}
                  {otpSent && !otpVerified && (
                    <div className="space-y-2.5 pt-2 border-t border-white/10 animate-in fade-in">
                      <label className="text-[10px] font-bold text-slate-200 block text-center">
                        Enter 6-Digit Verification Code
                      </label>

                      {/* 6 OTP Input Boxes */}
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className="w-9 h-10 sm:w-10 sm:h-11 bg-white border border-slate-300 text-slate-900 font-black text-base sm:text-lg text-center rounded-lg shadow-xs focus:bg-white focus:border-[#0092b3] focus:ring-2 focus:ring-[#0092b3]/40 outline-none transition-all"
                          />
                        ))}
                      </div>

                      {/* Verify OTP Button */}
                      <Button
                        type="button"
                        disabled={otpLoading || otpDigits.join('').length < 6}
                        onClick={handleVerifyOtp}
                        className="w-full h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        {otpLoading ? (
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Verifying OTP...
                          </span>
                        ) : (
                          <span>Verify OTP</span>
                        )}
                      </Button>

                      {/* Resend OTP in 60s / Resend Button */}
                      <div className="text-center pt-0.5">
                        {countdown > 0 ? (
                          <p className="text-[11px] font-semibold text-slate-300">
                            Resend OTP in <span className="font-extrabold text-cyan-300">{countdown}s</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            disabled={otpLoading}
                            onClick={(e) => handleResendOtp(e)}
                            className="text-xs font-bold text-cyan-300 hover:text-white underline cursor-pointer transition-colors inline-flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" /> Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white block">
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Input
                    {...registerRegister('email')}
                    type="email"
                    placeholder="user@example.com"
                    className="h-9 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold text-xs rounded-lg px-2.5"
                  />
                  {registerErrors.email && (
                    <p className="text-[9px] font-bold text-rose-300">{registerErrors.email.message}</p>
                  )}
                </div>

                {/* 4. Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white block">
                    Password <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Input
                    {...registerRegister('password')}
                    type="password"
                    placeholder="Password@123"
                    className="h-9 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold text-xs rounded-lg px-2.5"
                  />
                  {registerErrors.password && (
                    <p className="text-[9px] font-bold text-rose-300">{registerErrors.password.message}</p>
                  )}
                </div>

                {/* Submit Register Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer transition-all border border-white/20"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> REGISTERING...
                    </span>
                  ) : (
                    <span>COMPLETE REGISTRATION & LOG IN</span>
                  )}
                </Button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <div className="space-y-3 pt-1 text-left">
                {!forgotOtpSent && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-white block">Registered Email Address</label>
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="h-9.5 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold text-xs rounded-md px-3"
                    />
                    <Button
                      type="button"
                      disabled={otpLoading || !forgotEmail}
                      onClick={handleSendForgotOtp}
                      className="w-full h-9.5 bg-[#0092b3] hover:bg-[#007d99] text-white text-xs font-bold rounded-xl"
                    >
                      {otpLoading ? 'Sending OTP...' : 'Send Password Reset OTP'}
                    </Button>
                  </div>
                )}

                {forgotOtpSent && !forgotResetToken && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-white block">Enter Email OTP</label>
                    <Input
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className="h-9.5 bg-white border border-slate-300 text-slate-900 font-semibold text-xs rounded-md px-3"
                    />
                    <Button
                      type="button"
                      disabled={otpLoading || !forgotOtp}
                      onClick={handleVerifyForgotOtp}
                      className="w-full h-9.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                    >
                      {otpLoading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </div>
                )}

                {forgotResetToken && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-white block">New Password</label>
                    <Input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-9.5 bg-white border border-slate-300 text-slate-900 font-semibold text-xs rounded-md px-3"
                    />
                    <Button
                      type="button"
                      disabled={isLoading}
                      onClick={handleResetPasswordSubmit}
                      className="w-full h-9.5 bg-[#0092b3] hover:bg-[#007d99] text-white text-xs font-bold rounded-xl"
                    >
                      {isLoading ? 'Resetting...' : 'Save New Password'}
                    </Button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-full text-center text-xs font-bold text-slate-300 hover:text-white pt-1"
                >
                  ← Back to Login
                </button>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full bg-black/40 backdrop-blur-md border-t border-white/10 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-bold text-slate-300 shrink-0 font-outfit gap-2">
        <div>© 2026 Maytri Group. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <a
            href="mailto:sales@maytrigroup.in"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-[#0092b3]" />
            <span>Email Us: sales@maytrigroup.in</span>
          </a>
          <span className="text-white/30 hidden sm:inline">•</span>
          <a
            href="tel:040-24200456"
            className="flex items-center gap-1.5 text-white font-extrabold hover:text-sky-300 transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-[#0092b3]" />
            <span>040-24200456</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default AuthPage
