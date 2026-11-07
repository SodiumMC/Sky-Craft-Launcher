import React from 'react'
import { Icon } from './components/Icons'

export default function LoginWindow(): React.ReactElement {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('userCode') ?? '----------'
  const url = params.get('url') ?? 'https://microsoft.com/link'
  return (
    <div className="login-win">
      <div className="login-card">
        <div className="login-head">
          <div className="card-brand">
            SCL<span>微软正版登录</span>
          </div>
          <button className="win-btn" title="关闭" onClick={() => void window.scl.closeLoginWindow()}>
            <Icon name="close" size={12} />
          </button>
        </div>
        <p className="login-desc">在浏览器中打开下面的地址，输入设备代码完成授权。</p>
        <button className="login-code" title="复制代码" onClick={() => void navigator.clipboard.writeText(code)}>
          {code}
        </button>
        <a className="login-link" href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
        <div className="login-wait">
          <span className="spinner" /> 等待授权…
        </div>
      </div>
    </div>
  )
}
