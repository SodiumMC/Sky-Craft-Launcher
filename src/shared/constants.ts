/** 发布版内置的 Azure 应用 Client ID：留空时回落到用户在设置里填写的值 */
export const DEFAULT_MS_CLIENT_ID = ''

export const LIVE_AUTH_URL =
  'https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&prompt=select_account'
export const LIVE_REDIRECT = 'https://login.live.com/oauth20_desktop.srf'

/** 默认更新源；构建时可用 SCL_UPDATE_URL 覆盖，部署后改这里。 */
export const DEFAULT_UPDATE_URL = 'https://frp-jar.com:11354/latest.json'
