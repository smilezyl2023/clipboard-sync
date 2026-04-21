'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

type RecordType = 'text' | 'image' | 'file'

// 记录类型（与服务端 Record 接口对齐，uploading 为纯前端态）
interface Record {
  id: string
  timestamp: number
  preview: string
  type?: RecordType
  content?: string
  fileName?: string
  mimeType?: string
  size?: number
  blobUrl?: string
  blobPathname?: string
  expiresAt?: number
  uploading?: boolean
  /** 仅上传占位：0–100，完成后由服务端记录替换 */
  uploadProgress?: number
}

interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}

const PHONE_STORAGE_KEY = 'clipboard_sync_user_phone'
const PHONE_RE = /^1[3-9]\d{9}$/

// 与服务端 create-media 保持一致
const IMAGE_MAX_BYTES = 10 * 1024 * 1024
const FILE_MAX_BYTES = 50 * 1024 * 1024

function isImageMime(mime: string | undefined): boolean {
  return !!mime && mime.startsWith('image/')
}

function sanitizeFileName(name: string): string {
  // 保留中文、字母、数字、常见符号；其他替换为下划线
  const cleaned = name.replace(/[^\w.\-\u4e00-\u9fa5]/g, '_').slice(0, 120)
  return cleaned || 'file'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Home() {
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const [records, setRecords] = useState<Record[]>([])
  const [recordsLoadStatus, setRecordsLoadStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>(undefined)
  const loadRecordsRequestId = useRef(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [content, setContent] = useState('')
  const [, setLastModified] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  /** 移动端左滑展开删除时，同时仅一行保持展开 */
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null)
  const [isMobileSwipe, setIsMobileSwipe] = useState(true)
  // 用于触发剩余时间 UI 刷新
  const [, setNowTick] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化：从 localStorage 读取手机号
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PHONE_STORAGE_KEY)
      if (saved && PHONE_RE.test(saved)) {
        setUserPhone(saved)
        setRecordsLoadStatus('loading')
      }
      setAuthReady(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 639px)')
    const apply = () => setIsMobileSwipe(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // 阻止浏览器缩放（iOS Safari 和 macOS 忽略 viewport 的 maximum-scale，需要 JS 拦截）
  useEffect(() => {
    const preventGesture = (e: Event) => e.preventDefault()
    document.addEventListener('gesturestart', preventGesture, { passive: false })
    document.addEventListener('gesturechange', preventGesture, { passive: false })
    document.addEventListener('gestureend', preventGesture, { passive: false })

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    document.addEventListener('wheel', onWheel, { passive: false })

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
      document.removeEventListener('gestureend', preventGesture)
      document.removeEventListener('wheel', onWheel)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  // 媒体记录剩余时间每 30 秒重新计算一次，无需轮询服务端
  useEffect(() => {
    const hasMedia = records.some(r => r.expiresAt)
    if (!hasMedia) return
    const timer = setInterval(() => setNowTick(t => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [records])

  /** 可参与多选的记录（上传中占位不可批量删，也不参与全选） */
  const selectableRecordIds = useMemo(
    () => records.filter(r => !r.uploading).map(r => r.id),
    [records]
  )
  const selectableCount = selectableRecordIds.length

  useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set(
        Array.from(prev).filter(id => {
          const r = records.find(rec => rec.id === id)
          return r && !r.uploading
        })
      )
      if (next.size === prev.size && Array.from(prev).every(id => next.has(id))) return prev
      return next
    })
  }, [records])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleAuthSuccess = useCallback((phone: string) => {
    localStorage.setItem(PHONE_STORAGE_KEY, phone)
    setRecordsLoadStatus('loading')
    setLoadErrorMessage(undefined)
    setUserPhone(phone)
    setRecords([])
    setSelectedIds(new Set())
    setLastModified(0)
  }, [])

  const handleSwitchAccount = useCallback(() => {
    if (!confirm('切换账号将清除本设备保存的登录信息（服务端数据仍保留 7 天），是否继续？')) return
    localStorage.removeItem(PHONE_STORAGE_KEY)
    setUserPhone(null)
    setRecordsLoadStatus('idle')
    setLoadErrorMessage(undefined)
    setRecords([])
    setSelectedIds(new Set())
    setLastModified(0)
  }, [])

  const loadRecords = useCallback(async () => {
    if (!userPhone) return
    const reqId = ++loadRecordsRequestId.current
    setRecordsLoadStatus('loading')
    setLoadErrorMessage(undefined)
    try {
      const res = await fetch('/api/records', {
        headers: { 'x-user-phone': userPhone },
        cache: 'no-store',
      })
      if (reqId !== loadRecordsRequestId.current) return
      if (res.status === 401) {
        localStorage.removeItem(PHONE_STORAGE_KEY)
        setUserPhone(null)
        showToast('登录已失效，请重新输入', 'error')
        setRecordsLoadStatus('idle')
        return
      }
      if (!res.ok) {
        let msg = `加载失败（HTTP ${res.status}）`
        try {
          const errBody = await res.json()
          if (errBody?.error && typeof errBody.error === 'string') msg = errBody.error
        } catch {
          /* ignore */
        }
        setLoadErrorMessage(msg)
        setRecordsLoadStatus('error')
        return
      }
      const data = await res.json()
      if (reqId !== loadRecordsRequestId.current) return
      setRecords(prev => {
        // 保留当前正在上传的占位项，避免被服务端响应覆盖掉
        const uploading = prev.filter(r => r.uploading)
        const server: Record[] = data.records || []
        return [...uploading, ...server.filter(s => !uploading.some(u => u.id === s.id))]
      })
      setLastModified(data.lastModified || 0)
      setRecordsLoadStatus('idle')
      setLoadErrorMessage(undefined)
    } catch (error) {
      if (reqId !== loadRecordsRequestId.current) return
      console.error('加载记录失败:', error)
      setLoadErrorMessage(
        error instanceof Error ? error.message : '网络异常，请检查连接后重试'
      )
      setRecordsLoadStatus('error')
    }
  }, [userPhone, showToast])

  useEffect(() => {
    if (!userPhone) return
    loadRecords()
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRecords()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userPhone, loadRecords])

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 240)
      textarea.style.height = newHeight + 'px'
    }
  }, [])

  const handleInput = useCallback(
    (value: string) => {
      setContent(value)
      autoResize()
    },
    [autoResize]
  )

  const syncContent = async () => {
    if (!userPhone) return
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      showToast('请输入要同步的内容', 'error')
      textareaRef.current?.focus()
      return
    }

    setIsSyncing(true)

    try {
      const res = await fetch('/api/records/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': userPhone,
        },
        body: JSON.stringify({ content: trimmedContent }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '同步失败')
      }

      const data = await res.json()
      setRecords(prev => [data.record, ...prev].slice(0, 100))
      setLastModified(data.record.timestamp)
      setContent('')
      autoResize()
      showToast('已同步到所有设备', 'success')
    } catch (error) {
      console.error('同步失败:', error)
      showToast(error instanceof Error ? error.message : '同步失败，请重试', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  // 上传单个文件：客户端直传 Vercel Blob → 写 Redis 元数据
  const uploadSingle = useCallback(
    async (file: File) => {
      if (!userPhone) return
      const mime = file.type || 'application/octet-stream'
      const isImage = isImageMime(mime)
      const type: 'image' | 'file' = isImage ? 'image' : 'file'
      const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES

      if (file.size <= 0 || file.size > maxBytes) {
        showToast(
          `${file.name} 超过 ${isImage ? '10MB' : '50MB'} 上限`,
          'error'
        )
        return
      }

      const recordId = crypto.randomUUID()
      const safeName = sanitizeFileName(file.name)
      const pathname = `clipboard/${userPhone}/${recordId}/${safeName}`

      // 占位记录：先出现在列表顶部，给出上传反馈
      const placeholder: Record = {
        id: recordId,
        type,
        timestamp: Date.now(),
        preview: file.name,
        fileName: file.name,
        mimeType: mime,
        size: file.size,
        uploading: true,
        uploadProgress: 0,
      }
      setRecords(prev => [placeholder, ...prev])

      try {
        const { upload } = await import('@vercel/blob/client')
        const result = await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/records/upload',
          clientPayload: JSON.stringify({
            phone: userPhone,
            mimeType: mime,
            recordId,
          }),
          multipart: file.size > 4 * 1024 * 1024,
          contentType: mime,
          onUploadProgress: ({ percentage }) => {
            const p = Math.min(100, Math.round(percentage))
            setRecords(prev =>
              prev.map(r => (r.id === recordId ? { ...r, uploadProgress: p } : r))
            )
          },
        })

        const res = await fetch('/api/records/create-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-phone': userPhone,
          },
          body: JSON.stringify({
            id: recordId,
            type,
            fileName: file.name,
            mimeType: mime,
            size: file.size,
            blobUrl: result.url,
            blobPathname: result.pathname,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: '写入失败' }))
          throw new Error(err.error || '写入失败')
        }
        const data = await res.json()
        setRecords(prev => prev.map(r => (r.id === recordId ? data.record : r)))
      } catch (err) {
        console.error('上传失败:', err)
        setRecords(prev => prev.filter(r => r.id !== recordId))
        showToast(
          `上传失败：${err instanceof Error ? err.message : '未知错误'}`,
          'error'
        )
      }
    },
    [userPhone, showToast]
  )

  // 多文件串行上传，避免并发写 Redis 冲突
  const uploadFiles = useCallback(
    async (files: File[] | FileList) => {
      const list = Array.from(files)
      for (const f of list) {
        await uploadSingle(f)
      }
    },
    [uploadSingle]
  )

  const handleFilePick = () => fileInputRef.current?.click()

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
    // 允许同一文件连续选择
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 粘贴：若剪贴板含文件则走上传；否则交给浏览器默认粘贴文本
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      e.preventDefault()
      uploadFiles(files)
    }
  }

  const clearInput = () => {
    setContent('')
    autoResize()
    textareaRef.current?.focus()
  }

  const loadToInput = (record: Record) => {
    if (record.type && record.type !== 'text') return
    setContent(record.content ?? record.preview ?? '')
    autoResize()
    textareaRef.current?.focus()
  }

  const toggleSelect = (id: string, checked: boolean) => {
    const r = records.find(rec => rec.id === id)
    if (r?.uploading) return
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (checked) newSet.add(id)
      else newSet.delete(id)
      return newSet
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(selectableRecordIds))
    else setSelectedIds(new Set())
  }

  const copyRecord = useCallback(
    async (record: Record) => {
      if (record.uploading) {
        showToast('上传中，请稍候再复制', 'info')
        return
      }
      const recType = record.type ?? 'text'
      const text =
        recType === 'text'
          ? (record.content != null ? record.content : (record.preview ?? ''))
          : (record.blobUrl ?? '')
      if (!text) {
        showToast('暂无可复制内容', 'error')
        return
      }
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        showToast('当前环境不支持剪贴板', 'error')
        return
      }
      try {
        await navigator.clipboard.writeText(text)
        showToast(recType === 'text' ? '已复制' : '已复制链接', 'success')
      } catch (err) {
        const name = err instanceof Error ? err.name : ''
        const msg = err instanceof Error ? err.message : ''
        const denied =
          name === 'NotAllowedError' ||
          /denied|not allowed|permission/i.test(msg)
        showToast(
          denied ? '无法写入剪贴板，请检查权限或改用 HTTPS 访问' : '复制失败，请重试',
          'error'
        )
      }
    },
    [showToast]
  )

  const deleteRecordById = useCallback(
    async (id: string) => {
      if (!userPhone) return
      const rec = records.find(r => r.id === id)
      if (!rec) return
      if (rec.uploading) {
        showToast('上传中，无法删除', 'info')
        return
      }
      if (!confirm('确定删除这条记录？')) return
      try {
        const res = await fetch(`/api/records/delete?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'x-user-phone': userPhone },
        })
        if (res.status === 401) {
          localStorage.removeItem(PHONE_STORAGE_KEY)
          setUserPhone(null)
          showToast('登录已失效，请重新输入', 'error')
          return
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: '删除失败' }))
          throw new Error(err.error || '删除失败')
        }
        setRecords(prev => prev.filter(r => r.id !== id))
        setSelectedIds(prev => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        setSwipeOpenId(null)
        showToast('已删除', 'success')
      } catch (error) {
        console.error('删除失败:', error)
        showToast(error instanceof Error ? error.message : '删除失败，请重试', 'error')
      }
    },
    [userPhone, records, showToast]
  )

  const deleteSelected = async () => {
    if (!userPhone || selectedIds.size === 0) return
    const idsToDelete = Array.from(selectedIds).filter(id => {
      const r = records.find(rec => rec.id === id)
      return r && !r.uploading
    })
    if (idsToDelete.length === 0) {
      showToast('选中项均为上传中，无法批量删除', 'info')
      return
    }
    const n = idsToDelete.length
    if (!confirm(`确定要删除已选中的 ${n} 条记录吗？`)) return
    try {
      const res = await fetch('/api/records/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': userPhone,
        },
        body: JSON.stringify({ ids: idsToDelete }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '删除失败')
      }

      const removed = new Set(idsToDelete)
      setRecords(prev => prev.filter(r => !removed.has(r.id)))
      setSelectedIds(new Set())
      showToast('删除成功', 'success')
    } catch (error) {
      console.error('删除失败:', error)
      showToast(error instanceof Error ? error.message : '删除失败，请重试', 'error')
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 媒体剩余存活时间
  const formatRemaining = (expiresAt: number): { text: string; urgent: boolean } => {
    const diff = expiresAt - Date.now()
    if (diff <= 0) return { text: '已过期', urgent: true }
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return { text: `${mins} 分钟后删除`, urgent: mins < 10 }
    const hours = Math.floor(mins / 60)
    const rem = mins % 60
    return { text: `${hours} 小时${rem > 0 ? ' ' + rem + ' 分' : ''}后删除`, urgent: false }
  }

  const selectedSelectableCount = useMemo(() => {
    const selectable = new Set(selectableRecordIds)
    return Array.from(selectedIds).filter(id => selectable.has(id)).length
  }, [selectedIds, selectableRecordIds])

  const selectAllState =
    selectableCount === 0
      ? 'none'
      : selectedSelectableCount === 0
        ? 'none'
        : selectedSelectableCount === selectableCount
          ? 'all'
          : 'indeterminate'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      syncContent()
    }
  }

  if (!authReady) return null
  if (!userPhone) return <AuthModal onSuccess={handleAuthSuccess} />

  const maskedPhone = userPhone.slice(0, 3) + '****' + userPhone.slice(7)

  return (
    <div className="page-wrapper">
      <main className="main-content">
        <header className="header">
          <div className="header-content">
            <div className="brand">
              <div className="brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                </svg>
              </div>
              <div className="brand-text">
                <h1>剪贴板同步</h1>
                <p className="subtitle">跨设备即时同步</p>
              </div>
            </div>
            <div className="user-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="user-phone">{maskedPhone}</span>
              <button className="btn-link" onClick={handleSwitchAccount} title="切换账号">
                切换
              </button>
            </div>
          </div>
        </header>

        <section className="input-section">
          <div className="card input-card">
            <div className="textarea-wrapper">
              <textarea
                ref={textareaRef}
                className="textarea-input"
                placeholder="输入文字，或粘贴/附加图片、文件..."
                value={content}
                onChange={(e) => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
              />
            </div>

            <div className="input-footer">
              <div className="input-meta">
                <span className="char-count">{content.length} 字符</span>
              </div>
              <div className="input-actions">
                <button
                  className="btn btn-ghost"
                  onClick={handleFilePick}
                  title="上传图片或文件（保留 3 小时）"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.93 8.8l-8.57 8.57a2 2 0 1 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  附件
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={onFileInputChange}
                />
                <button className="btn btn-ghost" onClick={clearInput}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                  清空
                </button>
                <button className="btn btn-primary" onClick={syncContent} disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      同步中...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                      同步
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="hint">
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 快速同步 · 文字保留 7 天 · 文件保留 3 小时
            </div>
          </div>
        </section>

        <section className="history-section">
          <div className="section-header">
            <h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
              </svg>
              历史记录
              {recordsLoadStatus === 'loading' && records.length > 0 && (
                <span className="section-header-refresh" title="正在刷新列表">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                </span>
              )}
              <span className="badge" aria-live="polite">
                {recordsLoadStatus === 'loading' && records.length === 0 ? '…' : records.length}
              </span>
            </h2>
            {selectableCount > 0 && (
              <div className="select-actions">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectAllState === 'all'}
                    ref={(el) => {
                      if (el) el.indeterminate = selectAllState === 'indeterminate'
                    }}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  <span className={`checkbox ${selectAllState !== 'none' ? (selectAllState === 'indeterminate' ? 'indeterminate' : 'checked') : ''}`}></span>
                  全选
                </label>
              </div>
            )}
          </div>

          {recordsLoadStatus === 'error' && loadErrorMessage && (
            <div className="records-error-banner" role="alert">
              <p className="records-error-text">{loadErrorMessage}</p>
              <button
                type="button"
                className="btn btn-primary records-error-retry"
                data-testid="records-retry"
                onClick={() => loadRecords()}
              >
                重试
              </button>
            </div>
          )}

          <div className="records-list" aria-busy={recordsLoadStatus === 'loading'}>
            {records.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                selected={selectedIds.has(record.id)}
                onToggle={(checked) => toggleSelect(record.id, checked)}
                onClickText={() => loadToInput(record)}
                onClickImage={(url) => setLightboxUrl(url)}
                formatTime={formatTime}
                formatRemaining={formatRemaining}
                onDeleteRecord={deleteRecordById}
                onCopyRecord={copyRecord}
                swipeOpenId={swipeOpenId}
                onSwipeOpenExclusive={setSwipeOpenId}
                isMobileSwipe={isMobileSwipe}
              />
            ))}
            {recordsLoadStatus === 'loading' && records.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => <RecordsSkeletonRow key={i} />)}
            {recordsLoadStatus === 'loading' &&
              records.length > 0 &&
              records.every(r => r.uploading) &&
              Array.from({ length: 3 }).map((_, i) => <RecordsSkeletonRow key={`sk-${i}`} />)}
          </div>

          {recordsLoadStatus === 'idle' && records.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <path d="M9 14h6"/>
                </svg>
              </div>
              <p className="empty-title">暂无同步记录</p>
              <p className="empty-desc">在上方输入内容并点击同步按钮</p>
            </div>
          )}
        </section>

        {selectedIds.size > 0 && (
          <div className="batch-bar">
            <div className="batch-bar-content">
              <span className="batch-info">已选择 {selectedIds.size} 项</span>
              <button
                type="button"
                className="btn btn-destructive"
                data-testid="batch-delete"
                onClick={() => void deleteSelected()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                删除
              </button>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className={`toast show ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {lightboxUrl && (
        <div className="lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="preview" />
        </div>
      )}
    </div>
  )
}

function RecordsSkeletonRow() {
  return (
    <div className="record-item record-skeleton">
      <div className="skeleton-block skeleton-checkbox" aria-hidden />
      <div className="record-body">
        <div className="skeleton-block skeleton-line skeleton-line-title" aria-hidden />
        <div className="skeleton-block skeleton-line skeleton-line-meta" aria-hidden />
      </div>
    </div>
  )
}

const SWIPE_DELETE_PX = 72

// ============ 列表项 ============
function RecordRow({
  record,
  selected,
  onToggle,
  onClickText,
  onClickImage,
  formatTime,
  formatRemaining,
  onDeleteRecord,
  onCopyRecord,
  swipeOpenId,
  onSwipeOpenExclusive,
  isMobileSwipe,
}: {
  record: Record
  selected: boolean
  onToggle: (checked: boolean) => void
  onClickText: () => void
  onClickImage: (url: string) => void
  formatTime: (t: number) => string
  formatRemaining: (t: number) => { text: string; urgent: boolean }
  onDeleteRecord: (id: string) => void | Promise<void>
  onCopyRecord: (record: Record) => void | Promise<void>
  swipeOpenId: string | null
  onSwipeOpenExclusive: (id: string | null) => void
  isMobileSwipe: boolean
}) {
  const type = record.type ?? 'text'
  const remaining = record.expiresAt ? formatRemaining(record.expiresAt) : null
  /** 拖动中露出宽度（px），null 表示未在横向拖动，使用 swipeOpenId 推导 */
  const [liveReveal, setLiveReveal] = useState<number | null>(null)
  const lastRevealRef = useRef(0)
  const touchRef = useRef<{
    startX: number
    startY: number
    base: number
    locked?: 'h' | 'v'
  } | null>(null)

  const opened = isMobileSwipe && swipeOpenId === record.id
  const revealedPx =
    liveReveal !== null ? liveReveal : opened ? SWIPE_DELETE_PX : 0
  const translateX = isMobileSwipe ? -revealedPx : 0

  useEffect(() => {
    if (!isMobileSwipe || swipeOpenId === null || swipeOpenId === record.id) return
    setLiveReveal(null)
  }, [swipeOpenId, record.id, isMobileSwipe])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileSwipe || record.uploading) return
    const t = e.touches[0]
    const base = opened ? SWIPE_DELETE_PX : 0
    touchRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      base,
    }
    lastRevealRef.current = base
    if (swipeOpenId !== null && swipeOpenId !== record.id) {
      onSwipeOpenExclusive(null)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobileSwipe || record.uploading || !touchRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - touchRef.current.startX
    const dy = t.clientY - touchRef.current.startY
    if (!touchRef.current.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (touchRef.current.locked === 'v') return
    e.preventDefault()
    const newRevealed = Math.max(
      0,
      Math.min(SWIPE_DELETE_PX, touchRef.current.base - dx)
    )
    lastRevealRef.current = newRevealed
    setLiveReveal(newRevealed)
  }

  const handleTouchEnd = () => {
    if (!isMobileSwipe || record.uploading) {
      touchRef.current = null
      return
    }
    const ref = touchRef.current
    touchRef.current = null
    if (!ref) return
    if (ref.locked !== 'h') {
      setLiveReveal(null)
      return
    }
    const endReveal = lastRevealRef.current
    setLiveReveal(null)
    if (endReveal > SWIPE_DELETE_PX / 2) onSwipeOpenExclusive(record.id)
    else onSwipeOpenExclusive(null)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    void onDeleteRecord(record.id)
  }

  const handleDeleteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      void onDeleteRecord(record.id)
    }
  }

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    void onCopyRecord(record)
  }

  const handleCopyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      void onCopyRecord(record)
    }
  }

  const rowInner = (
    <>
      <input
        type="checkbox"
        className="record-checkbox"
        checked={selected}
        disabled={record.uploading}
        title={record.uploading ? '上传中不可多选删除' : undefined}
        aria-label={record.uploading ? '上传中，不可选择' : '选择此条记录'}
        onChange={(e) => onToggle(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
      />

      {type === 'image' && record.blobUrl ? (
        <div
          className="record-thumb"
          onClick={() => onClickImage(record.blobUrl as string)}
        >
          <img src={record.blobUrl} alt={record.fileName ?? ''} loading="lazy" />
        </div>
      ) : type === 'file' ? (
        <div className="record-file-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
          </svg>
        </div>
      ) : null}

      <div
        className="record-body"
        onClick={type === 'text' ? onClickText : undefined}
        style={type === 'text' ? undefined : { cursor: 'default' }}
      >
        <div className="record-content">{record.preview}</div>
        <div className="record-meta">
          <span className="record-time">{formatTime(record.timestamp)}</span>
          {typeof record.size === 'number' && (
            <>
              <span className="record-dot">·</span>
              <span>{formatSize(record.size)}</span>
            </>
          )}
          {record.uploading && (
            <>
              <span className="record-dot">·</span>
              <span className="record-uploading">
                上传中
                {typeof record.uploadProgress === 'number' ? ` ${record.uploadProgress}%` : '…'}
              </span>
            </>
          )}
          {remaining && !record.uploading && (
            <>
              <span className="record-dot">·</span>
              <span className={remaining.urgent ? 'record-expire urgent' : 'record-expire'}>
                {remaining.text}
              </span>
            </>
          )}
        </div>
        {record.uploading && (
          <div
            className="record-upload-progress-wrap"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={record.uploadProgress ?? 0}
            aria-label="上传进度"
          >
            <div className="record-upload-progress-track">
              <div
                className="record-upload-progress-fill"
                style={{ width: `${record.uploadProgress ?? 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="record-actions">
        <button
          type="button"
          className="btn btn-ghost record-copy"
          aria-label="复制到剪贴板"
          title={record.uploading ? '上传中' : '复制'}
          disabled={record.uploading}
          onClick={handleCopyClick}
          onKeyDown={handleCopyKeyDown}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
        {type === 'file' && record.blobUrl && !record.uploading && (
          <a
            href={record.blobUrl}
            download={record.fileName}
            className="btn btn-ghost record-download"
            onClick={(e) => e.stopPropagation()}
            title="下载"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </a>
        )}
      </div>
    </>
  )

  return (
    <div
      className={`record-swipe-outer ${selected ? 'selected' : ''}`}
      data-testid="record-row"
      data-record-id={record.id}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className={`record-swipe-track ${liveReveal !== null ? 'record-swipe-dragging' : ''}`}
        style={
          isMobileSwipe
            ? { transform: `translateX(${translateX}px)` }
            : undefined
        }
      >
        <div className={`record-item record-swipe-main ${selected ? 'selected' : ''}`}>{rowInner}</div>
        <button
          type="button"
          className="record-swipe-delete"
          aria-label="删除此条记录"
          title={record.uploading ? '上传中' : '删除'}
          disabled={record.uploading}
          onClick={handleDeleteClick}
          onKeyDown={handleDeleteKeyDown}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            focusable="false"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ============ 鉴权遮罩组件 ============
function AuthModal({ onSuccess }: { onSuccess: (phone: string) => void }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!PHONE_RE.test(phone)) {
      setError('请输入有效的 11 位中国大陆手机号')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '请求失败')
        return
      }
      onSuccess(phone)
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            </svg>
          </div>
          <h1>剪贴板同步</h1>
        </div>

        <p className="auth-desc">
          输入已授权的手机号进入，数据 7 天未使用自动清除。
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="auth-phone">手机号</label>
            <input
              id="auth-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              placeholder="请输入 11 位手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? '验证中...' : '进入'}
          </button>
        </form>
      </div>
    </div>
  )
}
