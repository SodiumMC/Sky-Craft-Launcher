/**
 * 微软认证：
 * - 设备码流程（需要 Azure Client ID，暂未启用）
 * - Live Connect 授权码流程（当前唯一入口，无需 Azure 租户）
 * 两条路径最终都走 Xbox Live → XSTS → Minecraft Services，返回正版档案。
 */

const CONSUMERS = 'https://login.microsoftonline.com/consumers/oauth2/v2.0'
const SCOPE = 'XboxLive.signin offline_access'

export interface DeviceCodeInfo {
  deviceCode: string
  userCode: string
  verificationUri: string
  interval: number
  expiresIn: number
}

export interface MsaTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface McProfile {
  name: string
  id: string
  accessToken: string
}

async function post<T>(url: string, body: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error_description?: string }).error_description ?? `HTTP ${res.status}`)
  return data as T
}

export async function startDeviceCode(clientId: string): Promise<DeviceCodeInfo> {
  const data = await post<{ device_code: string; user_code: string; verification_uri: string; interval: number; expires_in: number }>(
    `${CONSUMERS}/devicecode`,
    new URLSearchParams({ client_id: clientId, scope: SCOPE }).toString(),
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  )
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    interval: data.interval,
    expiresIn: data.expires_in
  }
}

export async function pollDeviceCode(clientId: string, deviceCode: string): Promise<MsaTokens | 'pending'> {
  const res = await fetch(`${CONSUMERS}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: deviceCode
    }).toString()
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, string>
  if (data.error === 'authorization_pending' || data.error === 'slow_down') return 'pending'
  if (!res.ok || !data.access_token) throw new Error(data.error_description ?? '登录失败')
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: Number(data.expires_in ?? 3600) }
}

export async function loginWithMsa(msaAccessToken: string): Promise<McProfile> {
  return loginWithTicket(msaAccessToken, 'd')
}

export async function loginWithTicket(token: string, prefix: 'd' | 't'): Promise<McProfile> {
  const xbl = await post<{ Token: string; DisplayClaims: { xui: { uhs: string }[] } }>(
    'https://user.auth.xboxlive.com/user/authenticate',
    JSON.stringify({
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `${prefix}=${token}` },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    })
  )
  const uhs = xbl.DisplayClaims.xui[0].uhs
  const xsts = await post<{ Token: string }>(
    'https://xsts.auth.xboxlive.com/xsts/authorize',
    JSON.stringify({
      Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.Token] },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    })
  )
  const mc = await post<{ access_token: string }>(
    'https://api.minecraftservices.com/authentication/login_with_xbox',
    JSON.stringify({ identityToken: `XBL3.0 x=${uhs};${xsts.Token}` })
  )
  const profileRes = await fetch('https://api.minecraftservices.com/minecraft/profile', {
    headers: { Authorization: `Bearer ${mc.access_token}` }
  })
  if (!profileRes.ok) throw new Error('该微软账户没有 Minecraft: Java Edition 所有权')
  const profile = (await profileRes.json()) as { id: string; name: string }
  return { id: profile.id, name: profile.name, accessToken: mc.access_token }
}


export async function refreshMsa(clientId: string, refreshToken: string): Promise<MsaTokens> {
  const res = await fetch(`${CONSUMERS}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: SCOPE
    }).toString()
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, string>
  if (!res.ok || !data.access_token) throw new Error(data.error_description ?? '刷新微软登录失败')
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: Number(data.expires_in ?? 3600)
  }
}

export interface MicrosoftAccountLike {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

export async function ensureFreshAccount<T extends MicrosoftAccountLike>(
  account: T,
  clientId: string
): Promise<T> {
  if (!account.refreshToken) throw new Error('缺少刷新令牌，请重新登录')
  if (account.expiresAt && account.expiresAt > Date.now() + 60_000) return account
  if (!clientId) throw new Error('未配置 Azure Client ID，无法刷新登录')
  const tokens = await refreshMsa(clientId, account.refreshToken)
  const profile = await loginWithMsa(tokens.accessToken)
  return {
    ...account,
    accessToken: profile.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000
  }
}


/** 旧版 Live Connect 授权码换 token（无需 Azure 租户） */
export async function exchangeLiveCode(code: string, redirectUri: string): Promise<MsaTokens> {
  const res = await fetch('https://login.live.com/oauth20_token.srf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '00000000402b5328',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code
    }).toString()
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, string>
  if (!res.ok || !data.access_token) throw new Error(data.error_description ?? '授权码换取令牌失败')
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? '',
    expiresIn: Number(data.expires_in ?? 3600)
  }
}

export async function refreshLive(refreshToken: string): Promise<MsaTokens> {
  const res = await fetch('https://login.live.com/oauth20_token.srf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '00000000402b5328',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'service::user.auth.xboxlive.com::MBI_SSL'
    }).toString()
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, string>
  if (!res.ok || !data.access_token) throw new Error(data.error_description ?? '刷新微软登录失败')
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: Number(data.expires_in ?? 3600)
  }
}

export interface LiveAccountLike {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

export async function ensureFreshLive<T extends LiveAccountLike>(account: T): Promise<T> {
  if (account.expiresAt && account.expiresAt > Date.now() + 60_000) return account
  if (!account.refreshToken) throw new Error('缺少刷新令牌，请重新登录')
  const tokens = await refreshLive(account.refreshToken)
  const profile = await loginWithTicket(tokens.accessToken, 't')
  return {
    ...account,
    accessToken: profile.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000
  }
}

export const LIVE_AUTH_URL =
  'https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&prompt=select_account'
export const LIVE_REDIRECT = 'https://login.live.com/oauth20_desktop.srf'
