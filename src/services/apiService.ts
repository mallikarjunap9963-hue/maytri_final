import type {
  Project,
  Lead,
  InventoryItem,
  SiteVisit,
  Booking,
} from '@/data/appData'
import { DEFAULT_PROJECTS } from '@/data/appData'

export const DIRECT_BACKEND_URL = 'https://maytri-channel-partner-backend.onrender.com'
const RAW_ENV_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim()

export const API_BASE_URL = RAW_ENV_URL || DIRECT_BACKEND_URL
export const BACKEND_MEDIA_HOST = RAW_ENV_URL || DIRECT_BACKEND_URL

// Helper to build absolute media URLs for backend relative file paths (e.g. /media/...)
export function getFullMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path
  const base = (BACKEND_MEDIA_HOST || 'https://maytri-channel-partner-backend.onrender.com')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

export interface BackendUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role?: string
  mobile?: string
}

export interface BackendProjectMedia {
  id: number
  media_type: string
  file_url: string
  title: string
  display_order: number
}

export interface BackendProject {
  id: number
  project_code: string
  title: string
  slug: string
  location: string
  city: string
  state: string
  pincode: string
  status: string
  is_active: boolean
  description?: string | null
  developer_name?: string | null
  start_date?: string | null
  completion_date?: string | null
  rera_number?: string | null
  thumbnail?: string | null
  brochure?: string | null
  media?: BackendProjectMedia[] | null
  created_at: string
  updated_at: string
}

export interface BackendLead {
  id: number
  customer_name: string
  mobile: string
  email?: string | null
  city?: string | null
  project: {
    id: number
    title: string
    project_code: string
  }
  requirement?: string | null
  status: string
  created_by?: BackendUser | null
  assigned_to?: BackendUser | null
  follow_up_date?: string | null
  created_at: string
  updated_at: string
}

export interface BackendLeadActivity {
  id: number
  activity_type: string
  description: string
  old_status?: string | null
  new_status?: string | null
  performed_by?: BackendUser | null
  created_at: string
}

export interface BackendPartner {
  id: number
  partner_type: string
  superior_code?: string | null
  company_name?: string | null
  address: string
  city: string
  state: string
  pincode: string
  pan_number: string
  aadhar_number: string
  bank_name: string
  bank_account_number: string
  bank_ifsc: string
  is_approved?: boolean
  status?: string
}

export interface DashboardProjectStats {
  project: {
    id: number
    title: string
    project_code: string
  }
  total: number
  statuses: Record<string, number>
}

export interface DashboardPartnerStats {
  partner: {
    id: number
    name: string
    company?: string | null
  }
  total: number
}

export interface DashboardSummary {
  total: number
  statuses: Record<string, number>
  projects: DashboardProjectStats[]
  partners?: DashboardPartnerStats[] | null
}

export interface LeadDashboardData {
  my_leads: DashboardSummary
  partner_leads?: DashboardSummary | null
}

export interface LeadDashboardParams {
  q?: string
  status?: string
  project_id?: number
  city?: string
  partner_id?: number
  from_date?: string
  to_date?: string
}

// Token storage helpers
export const AuthToken = {
  getAccess: () => localStorage.getItem('maytri_access_token') || '',
  setAccess: (token: string) => localStorage.setItem('maytri_access_token', token),
  getRefresh: () => localStorage.getItem('maytri_refresh_token') || '',
  setRefresh: (token: string) => localStorage.setItem('maytri_refresh_token', token),
  clear: () => {
    localStorage.removeItem('maytri_access_token')
    localStorage.removeItem('maytri_refresh_token')
    localStorage.removeItem('maytri_user')
    localStorage.removeItem('maytri_profile_name')
    localStorage.removeItem('maytri_profile_code')
    localStorage.removeItem('maytri_profile_designation')
    localStorage.removeItem('maytri_last_user_name')
  },
  getUser: (): BackendUser | null => {
    const raw = localStorage.getItem('maytri_user')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  setUser: (user: BackendUser) => localStorage.setItem('maytri_user', JSON.stringify(user)),
}

// Helper to extract detailed error messages from backend response
function parseApiErrorMessage(data: any, status: number): string {
  if (!data) {
    if (status === 400) return 'Bad Request: Please verify submitted information.'
    if (status === 401) return 'Unauthorized: Please log in again.'
    if (status === 403) return 'Forbidden: You do not have permission.'
    if (status === 404) return 'Resource not found on server.'
    if (status === 500) return 'Internal Server Error: Backend service error.'
    return `Request failed with HTTP status ${status}`
  }
  if (typeof data === 'string') return data
  if (data.message && typeof data.message === 'string') return data.message
  if (data.detail) {
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
    }
  }
  if (data.error && typeof data.error === 'string') return data.error
  if (data.errors) {
    if (typeof data.errors === 'string') return data.errors
    if (Array.isArray(data.errors)) return data.errors.join(', ')
    if (typeof data.errors === 'object') {
      const msgs = Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      return msgs.join('; ')
    }
  }
  return `Server returned error (${status})`
}

// Reusable HTTP fetcher with Bearer Authorization and Auto Refresh
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; status: number; message?: string; errors?: any }> {
  const base = (API_BASE_URL || DIRECT_BACKEND_URL).replace(/\/+$/, '')
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  if (!cleanEndpoint.startsWith('/api/') && cleanEndpoint !== '/api') {
    cleanEndpoint = `/api${cleanEndpoint}`
  }

  const targetUrl = `${base}${cleanEndpoint}`
  const token = AuthToken.getAccess()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const res = await fetch(targetUrl, { ...options, headers })
    let data: any = null
    try {
      data = await res.json()
    } catch {
      // Non-JSON response
    }

    // Auto-refresh token on 401 Unauthorized (unless requesting auth endpoints)
    if (
      res.status === 401 &&
      AuthToken.getRefresh() &&
      !cleanEndpoint.includes('/accounts/refresh') &&
      !cleanEndpoint.includes('/accounts/login')
    ) {
      const refreshResult = await ApiService.refreshToken()
      const newAccess = AuthToken.getAccess()
      if (refreshResult.ok && newAccess) {
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${newAccess}`,
        }
        const retryRes = await fetch(targetUrl, { ...options, headers: retryHeaders })
        let retryData: any = null
        try {
          retryData = await retryRes.json()
        } catch {}

        if (retryRes.ok) {
          return { ok: true, data: retryData, status: retryRes.status }
        }
        return {
          ok: false,
          data: retryData,
          status: retryRes.status,
          message: parseApiErrorMessage(retryData, retryRes.status),
          errors: retryData?.errors,
        }
      } else {
        AuthToken.clear()
      }
    }

    const isSuccess = res.ok
    return {
      ok: isSuccess,
      data,
      status: res.status,
      message: isSuccess ? undefined : parseApiErrorMessage(data, res.status),
      errors: data?.errors,
    }
  } catch (err: any) {
    const isNetworkOrFetchFail =
      err?.message === 'Failed to fetch' ||
      err?.message?.includes('fetch') ||
      err?.name === 'TypeError'

    return {
      ok: false,
      status: 0,
      message: isNetworkOrFetchFail
        ? 'Unable to connect to backend server. The server may be waking up or offline. Please retry in a moment.'
        : err?.message || 'Network connection failed',
    }
  }
}

let projectsData: Project[] = [...DEFAULT_PROJECTS]
let leadsData: Lead[] = []

export const ApiService = {
  baseUrl: API_BASE_URL,

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/docs`, { method: 'GET' })
      return res.status < 500
    } catch {
      return false
    }
  },

  // Auth: Send OTP
  async sendOtp(mobile: string) {
    const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10)
    const res = await apiFetch('/api/accounts/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile: cleanMobile }),
    })
    // If send-otp fails for non-validation reasons (e.g. 404/405/502), try resend-otp as fallback
    if (!res.ok && res.status !== 400 && res.status !== 429 && res.status !== 500) {
      return apiFetch('/api/accounts/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile: cleanMobile }),
      })
    }
    return res
  },

  // Auth: Resend OTP
  async resendOtp(mobile: string) {
    const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10)
    const res = await apiFetch('/api/accounts/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile: cleanMobile }),
    })
    // If resend-otp endpoint fails for any network/server error other than rate limit or validation, try send-otp
    if (!res.ok && res.status !== 429 && res.status !== 400) {
      return apiFetch('/api/accounts/send-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile: cleanMobile }),
      })
    }
    return res
  },

  // Auth: Verify OTP
  async verifyOtp(mobile: string, otp: string) {
    const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10)
    return apiFetch('/api/accounts/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile: cleanMobile, otp: otp.trim() }),
    })
  },

  // Auth: Register
  async register(params: {
    mobile: string
    email: string
    password: string
    first_name: string
    last_name: string
  }) {
    const res = await apiFetch('/api/accounts/register', {
      method: 'POST',
      body: JSON.stringify(params),
    })

    if (res.ok && res.data) {
      const d = res.data.data || res.data
      const accessToken =
        d.access_token ||
        d.access ||
        d.token ||
        res.data.access_token ||
        res.data.access ||
        res.data.token ||
        d.tokens?.access
      const refreshToken =
        d.refresh_token ||
        d.refresh ||
        res.data.refresh_token ||
        res.data.refresh ||
        d.tokens?.refresh
      const user = d.user || res.data.user

      if (accessToken) AuthToken.setAccess(accessToken)
      if (refreshToken) AuthToken.setRefresh(refreshToken)
      if (user) AuthToken.setUser(user)
    }

    return res
  },

  // Auth: Login
  async login(emailOrMobile: string, password: string) {
    const isEmail = emailOrMobile.includes('@')
    const cleanMobile = !isEmail ? emailOrMobile.replace(/[^0-9]/g, '').slice(-10) : emailOrMobile

    const payload: any = {
      username: emailOrMobile.trim(),
      email: emailOrMobile.trim(),
      mobile: isEmail ? emailOrMobile.trim() : cleanMobile,
      password,
    }

    const res = await apiFetch('/api/accounts/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (res.status === 500) {
      return {
        ok: false,
        status: 500,
        message: 'Backend server internal error (500). Please check server logs or database credentials.',
        data: {
          detail: 'Internal Server Error (500) on /api/accounts/login',
        },
      }
    }

    if (res.ok && res.data) {
      const d = res.data.data || res.data
      const accessToken =
        d.access_token ||
        d.access ||
        d.token ||
        res.data.access_token ||
        res.data.access ||
        res.data.token ||
        d.tokens?.access
      const refreshToken =
        d.refresh_token ||
        d.refresh ||
        res.data.refresh_token ||
        res.data.refresh ||
        d.tokens?.refresh
      const user = d.user || res.data.user

      if (accessToken) AuthToken.setAccess(accessToken)
      if (refreshToken) AuthToken.setRefresh(refreshToken)
      if (user) AuthToken.setUser(user)
    }

    return res
  },

  // Auth: Refresh Token (POST /api/accounts/refresh)
  async refreshToken(): Promise<{ ok: boolean; status: number; data?: { access_token: string } }> {
    const refreshToken = AuthToken.getRefresh()
    if (!refreshToken) return { ok: false, status: 401 }

    const res = await apiFetch<any>('/api/accounts/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    const newAccess =
      res.data?.access_token ||
      res.data?.access ||
      res.data?.data?.access_token ||
      res.data?.data?.access

    if (res.ok && newAccess) {
      AuthToken.setAccess(newAccess)
      return { ok: true, data: { access_token: newAccess }, status: res.status }
    }

    return { ok: false, status: res.status }
  },

  // Auth: Current User Me
  async getMe() {
    const res = await apiFetch<any>('/api/accounts/me')
    if (res.ok && res.data) {
      const user = res.data?.data || res.data?.user || res.data
      const name =
        user.full_name ||
        user.name ||
        `${user.first_name || ''} ${user.last_name || ''}`.trim()
      if (name && !name.includes('@')) {
        localStorage.setItem('maytri_profile_name', name)
        localStorage.setItem('maytri_last_user_name', name)
      }
      return {
        ...res,
        data: user,
      }
    }
    return res
  },

  // Auth: Forgot Password (POST /api/accounts/forgot-password)
  async forgotPassword(email: string) {
    return apiFetch('/api/accounts/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    })
  },

  // Auth: Verify Reset OTP (POST /api/accounts/verify-reset-otp)
  async verifyResetOtp(email: string, otp: string) {
    return apiFetch('/api/accounts/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    })
  },

  // Auth: Reset Password (POST /api/accounts/reset-password)
  async resetPassword(reset_token: string, new_password: string, confirm_password: string) {
    return apiFetch('/api/accounts/reset-password', {
      method: 'POST',
      body: JSON.stringify({ reset_token, new_password, confirm_password }),
    })
  },

  // Auth: Logout (POST /api/accounts/logout)
  async logout() {
    const refreshToken = AuthToken.getRefresh()
    if (refreshToken) {
      try {
        await apiFetch('/api/accounts/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      } catch (e) {
        console.warn('Logout API network notice:', e)
      }
    }

    // Clean session tokens and user state
    AuthToken.clear()
    return { ok: true, message: 'Logged out successfully' }
  },

  // Partners: Profile
  async getPartnerProfile() {
    const res = await apiFetch<any>('/api/partners/profile')
    if (res.ok && res.data) {
      const unwrapped = res.data?.data || res.data?.profile || res.data
      const name =
        unwrapped.full_name ||
        `${unwrapped.user?.first_name || ''} ${unwrapped.user?.last_name || ''}`.trim() ||
        unwrapped.company_name ||
        ''
      if (name) {
        localStorage.setItem('maytri_profile_name', name)
        localStorage.setItem('maytri_last_user_name', name)
      }
      if (unwrapped.partner_code) {
        localStorage.setItem('maytri_profile_code', unwrapped.partner_code)
      }
      if (unwrapped.partner_type) {
        localStorage.setItem('maytri_profile_designation', unwrapped.partner_type)
      }
      return {
        ...res,
        data: unwrapped,
      }
    }
    return res
  },

  // Partners: Submit KYC
  async submitKYC(formData: FormData) {
    return apiFetch('/api/partners/kyc', {
      method: 'POST',
      body: formData,
    })
  },

  // Partners: Approve
  async approvePartner(partnerId: number) {
    return apiFetch(`/api/partners/${partnerId}/approve`, {
      method: 'POST',
    })
  },

  // Partners: Reject
  async rejectPartner(partnerId: number) {
    return apiFetch(`/api/partners/${partnerId}/reject`, {
      method: 'POST',
    })
  },

  // Partners: Tree
  async getPartnerTree() {
    return apiFetch('/api/partners/tree')
  },

  // Partners: My Team
  async getMyTeam() {
    return apiFetch('/api/partners/my-team')
  },

  // Projects: List
  async getProjects(params?: {
    q?: string
    status?: string
    city?: string
    is_active?: boolean
    page?: number
    page_size?: number
  }): Promise<Project[]> {
    const query = new URLSearchParams()
    if (params?.q) query.set('q', params.q)
    if (params?.status) query.set('status', params.status)
    if (params?.city) query.set('city', params.city)
    if (params?.is_active !== undefined) query.set('is_active', String(params.is_active))
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))

    const qs = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch<any>(`/api/projects/${qs}`)

    const items: BackendProject[] =
      res.data?.items ||
      res.data?.results ||
      res.data?.data?.items ||
      res.data?.data?.results ||
      (Array.isArray(res.data?.data) ? res.data.data : null) ||
      (Array.isArray(res.data) ? res.data : [])

    if (res.ok && Array.isArray(items) && items.length > 0) {
      const mapped = items.map((p) => {
        const thumbUrl = p.thumbnail ? getFullMediaUrl(p.thumbnail) : null
        return {
          id: String(p.id),
          rawId: p.id,
          name: p.title,
          location: `${p.location || ''}, ${p.city || ''}`.replace(/^,\s*/, '').trim(),
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          status: (p.status || 'Ongoing') as any,
          thumbnail: thumbUrl,
          image: thumbUrl || '',
          description: p.description || null,
          brochure: p.brochure ? getFullMediaUrl(p.brochure) : null,
          reraNumber: p.rera_number || null,
          developerName: p.developer_name || null,
          startDate: p.start_date || null,
          completionDate: p.completion_date || null,
          projectCode: p.project_code || `MAY-${p.id}`,
          slug: p.slug || '',
          isActive: p.is_active !== false,
          media:
            p.media && Array.isArray(p.media)
              ? p.media.map((m) => ({
                ...m,
                file_url: getFullMediaUrl(m.file_url),
              }))
              : [],
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }
      })
      projectsData = mapped
      return mapped
    }

    return projectsData && projectsData.length > 0 ? [...projectsData] : [...DEFAULT_PROJECTS]
  },

  // Projects: Detail
  async getProject(projectId: number) {
    const res = await apiFetch<any>(`/api/projects/${projectId}/`)
    if (res.ok && res.data) {
      const p: BackendProject = res.data.data || res.data
      return {
        ...res,
        data: {
          ...p,
          thumbnail: getFullMediaUrl(p.thumbnail),
          brochure: getFullMediaUrl(p.brochure),
          media: (p.media || []).map((m) => ({
            ...m,
            file_url: getFullMediaUrl(m.file_url),
          })),
        },
      }
    }
    return res
  },

  // Helper to convert frontend lead stage to backend status choices
  toBackendStatus(stage?: string): string {
    if (!stage) return 'NEW'
    const s = stage.toLowerCase().trim().replace(/[\s_-]+/g, '')
    if (s.includes('new') || s.includes('inquiry') || s.includes('fresh')) return 'NEW'
    if (s.includes('contact') || s.includes('called')) return 'CONTACTED'
    if (s.includes('follow') || s.includes('visit') || s.includes('tour')) return 'FOLLOW_UP'
    if (s.includes('interest') || s.includes('negotiat') || s.includes('token') || s.includes('loan')) return 'INTERESTED'
    if (s.includes('convert') || s.includes('book') || s.includes('won')) return 'CONVERTED'
    if (s.includes('lost') || s.includes('reject') || s.includes('drop')) return 'LOST'
    return stage.toUpperCase().replace(/\s+/g, '_')
  },

  // Helper to normalize lead stage string from backend
  normalizeLeadStage(rawStatus?: string): Lead['stage'] {
    if (!rawStatus) return 'New'
    const s = rawStatus.toLowerCase().trim().replace(/[\s_-]+/g, '')
    if (s.includes('new') || s.includes('inquiry') || s.includes('fresh') || s.includes('uncontacted')) return 'New'
    if (s.includes('contact') || s.includes('called')) return 'Contacted'
    if (s.includes('follow') || s.includes('visit') || s.includes('tour')) return 'Follow Up'
    if (s.includes('interest') || s.includes('negotiat') || s.includes('token') || s.includes('loan')) return 'Interested'
    if (s.includes('convert') || s.includes('book') || s.includes('won')) return 'Converted'
    if (s.includes('lost') || s.includes('last') || s.includes('reject') || s.includes('drop')) return 'Lost'
    return rawStatus as Lead['stage']
  },

  // Leads: List
  async getLeads(params?: {
    q?: string
    status?: string
    project_id?: number
    city?: string
    partner_id?: number
    page?: number
    page_size?: number
  }): Promise<Lead[]> {
    const query = new URLSearchParams()
    if (params?.q) query.set('q', params.q)
    if (params?.status) query.set('status', params.status)
    if (params?.project_id) query.set('project_id', String(params.project_id))
    if (params?.city) query.set('city', params.city)
    if (params?.partner_id) query.set('partner_id', String(params.partner_id))
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))

    const qs = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch<any>(`/api/leads/${qs}`)

    const items: BackendLead[] =
      res.data?.items ||
      res.data?.results ||
      res.data?.data?.items ||
      res.data?.data?.results ||
      (Array.isArray(res.data?.data) ? res.data.data : null) ||
      (Array.isArray(res.data) ? res.data : [])

    if (res.ok && Array.isArray(items)) {
      const mapped = items.map((l) => {
        const creatorName = l.created_by
          ? `${l.created_by.first_name || ''} ${l.created_by.last_name || ''}`.trim() || l.created_by.email
          : ''
        const assigneeName = l.assigned_to
          ? `${l.assigned_to.first_name || ''} ${l.assigned_to.last_name || ''}`.trim() || l.assigned_to.email
          : ''

        const formatDateTime = (dateStr?: string | null) => {
          if (!dateStr) return '-'
          try {
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return dateStr
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const month = months[d.getMonth()]
            const day = String(d.getDate()).padStart(2, '0')
            const year = d.getFullYear()
            const hours = String(d.getHours()).padStart(2, '0')
            const minutes = String(d.getMinutes()).padStart(2, '0')
            return `${month} ${day}, ${year} ${hours}:${minutes}`
          } catch {
            return dateStr
          }
        }

        const rawBackendStage = this.normalizeLeadStage(l.status)

        return {
          id: `LD-${l.id}`,
          rawId: l.id,
          name: l.customer_name || 'Buyer',
          phone: l.mobile || '',
          email: l.email || '',
          city: l.city || '',
          project: l.project?.title || '',
          project_id: l.project?.id,
          partner_id: l.created_by?.id || (l as any).partner_id,
          created_by_id: l.created_by?.id,
          unitType: l.requirement || '',
          requirement: l.requirement || '',
          budget: '',
          stage: rawBackendStage,
          source: creatorName || '',
          assignedTo: assigneeName || '',
          notes: l.requirement || '',
          createdDate: l.created_at ? l.created_at.split('T')[0] : '',
          follow_up_date: l.follow_up_date
            ? formatDateTime(l.follow_up_date)
            : l.created_at
              ? formatDateTime(l.created_at)
              : '-',
          lastActivity: l.follow_up_date
            ? `Follow-up: ${l.follow_up_date.split('T')[0]}`
            : l.updated_at
              ? `Updated: ${l.updated_at.split('T')[0]}`
              : '',
        }
      })

      leadsData = mapped
      return mapped
    }

    return [...leadsData]
  },

  // Leads: Detail (GET /api/leads/{lead_id}/)
  async getLead(leadId: number | string): Promise<{ ok: boolean; data?: Lead; status: number; message?: string }> {
    const numericId = typeof leadId === 'number' ? leadId : Number(String(leadId).replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) {
      return { ok: false, status: 400, message: 'Invalid lead ID' }
    }

    const res = await apiFetch<any>(`/api/leads/${numericId}/`)
    if (res.ok && res.data) {
      const l: BackendLead = res.data?.data || res.data
      const creatorName = l.created_by
        ? `${l.created_by.first_name || ''} ${l.created_by.last_name || ''}`.trim() || l.created_by.email
        : ''
      const assigneeName = l.assigned_to
        ? `${l.assigned_to.first_name || ''} ${l.assigned_to.last_name || ''}`.trim() || l.assigned_to.email
        : ''

      const mapped: Lead = {
        id: `LD-${l.id}`,
        rawId: l.id,
        name: l.customer_name || 'Buyer',
        phone: l.mobile || '',
        email: l.email || '',
        city: l.city || '',
        project: l.project?.title || '',
        project_id: l.project?.id,
        partner_id: l.created_by?.id || (l as any).partner_id,
        created_by_id: l.created_by?.id,
        unitType: l.requirement || '',
        requirement: l.requirement || '',
        budget: '',
        stage: this.normalizeLeadStage(l.status),
        source: creatorName || '',
        assignedTo: assigneeName || '',
        notes: l.requirement || '',
        createdDate: l.created_at ? l.created_at.split('T')[0] : '',
        follow_up_date: l.follow_up_date || l.created_at || '-',
        lastActivity: l.updated_at ? `Updated: ${l.updated_at.split('T')[0]}` : '',
      }

      return { ok: true, data: mapped, status: res.status }
    }

    return { ok: false, status: res.status, message: res.message || 'Lead not found' }
  },

  // Leads: Create (POST /api/leads/)
  async createLead(newLeadData: {
    customer_name?: string
    mobile?: string
    email?: string
    city?: string
    project_id?: number
    requirement?: string
    follow_up_date?: string
    name?: string
    phone?: string
    project?: string
    unitType?: string
    budget?: string
    stage?: string
    source?: string
    notes?: string
    assignedTo?: string
  }): Promise<{ ok: boolean; data?: Lead; error?: string; status?: number }> {
    const rawMobile = newLeadData.mobile || newLeadData.phone || ''
    const cleanMobile = rawMobile.replace(/[^0-9]/g, '').slice(-10) || '9876543210'

    const payload: Record<string, any> = {
      customer_name: (newLeadData.customer_name || newLeadData.name || 'New Customer').trim(),
      mobile: cleanMobile,
      project_id: Number(newLeadData.project_id) || 1,
    }

    if (newLeadData.city?.trim()) {
      payload.city = newLeadData.city.trim()
    }
    if (newLeadData.email?.trim()) {
      payload.email = newLeadData.email.trim()
    }

    const reqText = (newLeadData.requirement || newLeadData.notes || newLeadData.unitType || '').trim()
    if (reqText) {
      payload.requirement = reqText
    }

    if (newLeadData.follow_up_date) {
      try {
        const d = new Date(newLeadData.follow_up_date)
        payload.follow_up_date = !isNaN(d.getTime()) ? d.toISOString() : newLeadData.follow_up_date
      } catch {
        payload.follow_up_date = newLeadData.follow_up_date
      }
    }

    const res = await apiFetch<BackendLead>('/api/leads/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (res.ok && res.data) {
      const created = res.data
      const createdLead: Lead = {
        id: `LD-${created.id}`,
        rawId: created.id,
        name: created.customer_name || payload.customer_name,
        phone: created.mobile || payload.mobile,
        email: created.email || payload.email || '',
        project: created.project?.title || newLeadData.project || 'Project',
        unitType: newLeadData.unitType || '3 BHK',
        budget: newLeadData.budget || '₹ 1.2 - 1.5 Cr',
        stage: this.normalizeLeadStage(created.status),
        source: newLeadData.source || 'Channel Partner',
        assignedTo: created.assigned_to ? `${created.assigned_to.first_name} ${created.assigned_to.last_name}` : 'Unassigned',
        notes: created.requirement || '',
        createdDate: created.created_at ? created.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        lastActivity: 'Lead registered in backend database',
      }

      leadsData = [createdLead, ...leadsData.filter((l) => l.rawId !== createdLead.rawId)]
      return { ok: true, data: createdLead, status: res.status }
    }

    return { ok: false, error: res.message || 'Failed to create lead on server', status: res.status }
  },

  // Leads: Update (PATCH /api/leads/{lead_id}/)
  async updateLead(leadId: number | string, updateData: {
    customer_name?: string
    mobile?: string
    email?: string
    city?: string
    requirement?: string
    status?: string
    follow_up_date?: string
  }): Promise<{ ok: boolean; data?: Lead; status: number; message?: string; errors?: any }> {
    const numericId = typeof leadId === 'number' ? leadId : Number(String(leadId).replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) {
      return { ok: false, status: 400, message: 'Invalid lead ID for update' }
    }

    // Prepare LeadUpdateSchema payload as defined in Swagger
    const payload: Record<string, any> = {}
    if (updateData.customer_name !== undefined) payload.customer_name = updateData.customer_name?.trim() || null
    if (updateData.mobile !== undefined) payload.mobile = updateData.mobile?.replace(/[^0-9]/g, '').slice(-10) || null
    if (updateData.email !== undefined) payload.email = updateData.email?.trim() || null
    if (updateData.city !== undefined) payload.city = updateData.city?.trim() || null
    if (updateData.requirement !== undefined) payload.requirement = updateData.requirement?.trim() || null
    if (updateData.status !== undefined) payload.status = this.toBackendStatus(updateData.status)
    if (updateData.follow_up_date !== undefined) {
      if (updateData.follow_up_date) {
        try {
          const d = new Date(updateData.follow_up_date)
          payload.follow_up_date = !isNaN(d.getTime()) ? d.toISOString() : updateData.follow_up_date
        } catch {
          payload.follow_up_date = updateData.follow_up_date
        }
      } else {
        payload.follow_up_date = null
      }
    }

    // Call PATCH /api/leads/{lead_id}/
    const res = await apiFetch<any>(`/api/leads/${numericId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      // Re-fetch lead from backend to ensure state matches the database exactly
      const fetched = await this.getLead(numericId)
      if (fetched.ok && fetched.data) {
        leadsData = leadsData.map((l) => (l.rawId === numericId || l.id === `LD-${numericId}` ? fetched.data! : l))
        return { ok: true, data: fetched.data, status: res.status }
      }
      return { ok: true, status: res.status, message: 'Lead updated successfully in database' }
    }

    return {
      ok: false,
      status: res.status,
      message: res.message || 'Failed to update lead in backend database',
      errors: res.errors,
    }
  },

  // Leads: Delete (DELETE /api/leads/{lead_id}/)
  async deleteLead(leadId: number | string): Promise<{ ok: boolean; status: number; message?: string }> {
    const numericId = typeof leadId === 'number' ? leadId : Number(String(leadId).replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) {
      return { ok: false, status: 400, message: 'Invalid lead ID for deletion' }
    }

    // Call DELETE /api/leads/{lead_id}/ on the live backend
    const res = await apiFetch<any>(`/api/leads/${numericId}/`, {
      method: 'DELETE',
    })

    if (res.ok) {
      // Only remove from in-memory cache after backend confirms successful deletion
      leadsData = leadsData.filter((l) => l.rawId !== numericId && l.id !== `LD-${numericId}` && l.id !== String(leadId))
      return { ok: true, status: res.status, message: 'Lead deleted from database' }
    }

    return {
      ok: false,
      status: res.status,
      message: res.message || 'Failed to delete lead from server database',
    }
  },

  // Leads: List Activities (GET /api/leads/{lead_id}/activities/)
  async getLeadActivities(leadId: number | string, page = 1, pageSize = 50): Promise<{
    ok: boolean
    data?: { items: BackendLeadActivity[]; count: number }
    status: number
    message?: string
  }> {
    const numericId = typeof leadId === 'number' ? leadId : Number(String(leadId).replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) {
      return { ok: false, status: 400, message: 'Invalid lead ID', data: { items: [], count: 0 } }
    }

    const res = await apiFetch<any>(
      `/api/leads/${numericId}/activities/?page=${page}&page_size=${pageSize}`
    )

    if (res.ok && res.data) {
      const rawList =
        res.data?.items ||
        res.data?.results ||
        res.data?.data?.items ||
        res.data?.data?.results ||
        (Array.isArray(res.data?.data) ? res.data.data : null) ||
        (Array.isArray(res.data) ? res.data : [])

      const mapped: BackendLeadActivity[] = (Array.isArray(rawList) ? rawList : []).map((a: any) => ({
        id: a.id,
        activity_type: a.activity_type || 'Note',
        description: a.description || '',
        old_status: a.old_status || null,
        new_status: a.new_status || null,
        performed_by: a.performed_by,
        created_at: a.created_at || new Date().toISOString(),
      }))

      return {
        ok: true,
        status: res.status,
        data: {
          items: mapped,
          count: res.data?.count !== undefined ? res.data.count : mapped.length,
        },
      }
    }

    return {
      ok: false,
      status: res.status,
      message: res.message || 'Failed to fetch activities from server',
      data: { items: [], count: 0 },
    }
  },

  // Leads: Add Note / Activity (POST /api/leads/{lead_id}/activities/)
  async addLeadNote(leadId: number | string, data: { activity_type: string; description: string }): Promise<{
    ok: boolean
    status: number
    message?: string
    data?: any
  }> {
    const numericId = typeof leadId === 'number' ? leadId : Number(String(leadId).replace(/\D/g, ''))
    if (!numericId || isNaN(numericId)) {
      return { ok: false, status: 400, message: 'Invalid lead ID' }
    }

    const payload = {
      activity_type: data.activity_type || 'Note',
      description: data.description?.trim() || '',
    }

    const res = await apiFetch<any>(`/api/leads/${numericId}/activities/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      return { ok: true, status: res.status, data: res.data, message: 'Activity note recorded to database' }
    }

    return {
      ok: false,
      status: res.status,
      message: res.message || 'Failed to save activity note to server database',
    }
  },

  // Leads: Assign (POST /api/leads/{lead_id}/assign/)
  async assignLead(leadId: number, assignedToId: number) {
    return apiFetch(`/api/leads/${leadId}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to_id: assignedToId }),
    })
  },

  // Leads: Live Dashboard & Pipeline Aggregation Analytics
  async getLeadsDashboard(params?: LeadDashboardParams) {
    const query = new URLSearchParams()
    if (params?.q) query.set('q', params.q)
    if (params?.status) query.set('status', params.status)
    if (params?.project_id) query.set('project_id', String(params.project_id))
    if (params?.city) query.set('city', params.city)
    if (params?.partner_id) query.set('partner_id', String(params.partner_id))
    if (params?.from_date) query.set('from_date', params.from_date)
    if (params?.to_date) query.set('to_date', params.to_date)

    const qs = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch<any>(`/api/leads/dashboard/${qs}`)
    if (res.ok && res.data) {
      const unwrapped: LeadDashboardData = res.data?.data || res.data
      return {
        ...res,
        data: unwrapped,
      }
    }
    return res
  },

  // Extra Mock data helpers
  async getInventory(): Promise<InventoryItem[]> {
    return [
      { id: 'inv-101', project: 'Ambhuja By Maytri', block: 'Tower A', unitNo: 'A-102', floor: 1, type: '2 BHK', sqft: 1250, facing: 'East', price: '₹ 1.15 Cr', numericPrice: 11500000, status: 'Available' },
      { id: 'inv-102', project: 'Ambhuja By Maytri', block: 'Tower A', unitNo: 'A-405', floor: 4, type: '3 BHK', sqft: 1680, facing: 'East', price: '₹ 1.45 Cr', numericPrice: 14500000, status: 'Reserved' },
      { id: 'inv-103', project: 'Ambhuja By Maytri', block: 'Tower A', unitNo: 'A-901', floor: 9, type: '3 BHK', sqft: 1850, facing: 'North', price: '₹ 1.60 Cr', numericPrice: 16000000, status: 'Booked' },
      { id: 'inv-104', project: 'Ambhuja By Maytri', block: 'Tower B', unitNo: 'B-1204', floor: 12, type: '4 BHK Penthouse', sqft: 2800, facing: 'East', price: '₹ 2.40 Cr', numericPrice: 24000000, status: 'Available' },
    ]
  },

  async getSiteVisits(): Promise<SiteVisit[]> {
    return [
      {
        id: 'SV-501',
        leadName: 'Rajesh Sharma',
        leadPhone: '+91 98765 43210',
        project: 'Ambhuja By Maytri',
        date: '2026-08-04',
        time: '11:00 AM',
        salesExecutive: 'Vikram Reddy',
        status: 'Scheduled',
        cabRequired: true,
        notes: 'Pick up from Financial District. Family of 4 coming.',
      },
    ]
  },

  async createSiteVisit(newVisitData: Omit<SiteVisit, 'id'>): Promise<SiteVisit> {
    const createdVisit: SiteVisit = {
      ...newVisitData,
      id: `SV-${Math.floor(500 + Math.random() * 500)}`,
    }
    return createdVisit
  },

  async getBookings(): Promise<Booking[]> {
    return [
      {
        id: 'BK-2026-089',
        customerName: 'Amitabh Sen',
        phone: '+91 98300 45678',
        project: 'Maytri Heights',
        unitNo: '1-804',
        agreementValue: '₹ 1.85 Cr',
        amountPaid: '₹ 45.0 Lakhs',
        balanceDue: '₹ 1.40 Cr',
        constructionStage: 'Structure 50%',
        bankName: 'ICICI Bank',
        bookingDate: '2026-07-30',
        nextMilestone: 'Plastering Stage - ₹ 25 Lakhs due on 2026-09-15',
      },
    ]
  },
}
