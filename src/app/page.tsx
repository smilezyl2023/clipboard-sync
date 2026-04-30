'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import AuthModal from '@/app/components/AuthModal'
import RecordRow from '@/app/components/RecordRow'
import RecordsSkeleton from '@/app/components/RecordsSkeleton'
import SearchFilter, { type TypeFilter } from '@/app/components/SearchFilter'
import { PHONE_RE } from '@/lib/auth'
import { formatTime, formatRemaining } from '@/app/utils/format'
import { useSwipe } from '@/app/hooks/useSwipe'
import { useOnlineStatus } from '@/app/hooks/useOnlineStatus'
import { useTheme } from '@/app/hooks/useTheme'
import { useRecords, type Record } from '@/app/hooks/useRecords'
import { useToastQueue } from '@/app/hooks/useToastQueue'

const PHONE_STORAGE_KEY = 'clipboard_sync_user_phone'
const MAX_CONTENT_LENGTH = 10000

export default function Home() {
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [content, setContent] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [lightboxLoading, setLightboxLoading] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const { swipeOpenId, setSwipeOpenId } = useSwipe()
  const isOnline = useOnlineStatus()
  const { theme, toggleTheme } = useTheme()
  const { toasts, enqueue, dismiss } = useToastQueue()

  const {
    records,
    setRecords,
    recordsLoadStatus,
    loadErrorMessage,
    loadRecords,
    selectedIds,
    selectableRecordIds,
    selectableCount,
    selectAllState,
    toggleSelect,
    toggleSelectAll,
    uploadFiles,
    retryUpload,
    copyRecord,
    deleteRecordById,
    deleteSelected,
    resetRecords,
  } = useRecords(userPhone, setUserPhone, enqueue, dismiss)

  const filteredRecords = useMemo(() => {
    let result = records
    if (typeFilter !== 'all') {
      result = result.filter(r => r.type === typeFilter)
    }
    const q = searchQuery.trim().toLowerCase()
    if (!q) return result
    return result.filter(r =>
      r.uploading || r.uploadFailed ||
      r.preview?.toLowerCase().includes(q) ||
      r.content?.toLowerCase().includes(q) ||
      r.fileName?.toLowerCase().includes(q)
    )
  }, [records, searchQuery, typeFilter])

  // 初始化：从 localStorage 读取手机号
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PHONE_STORAGE_KEY)
      if (saved && PHONE_RE.test(saved)) {
        setUserPhone(saved)
      }
      setAuthReady(true)
    }
  }, [])

  const handleAuthSuccess = useCallback((phone: string) => {
    localStorage.setItem(PHONE_STORAGE_KEY, phone)
    setUserPhone(phone)
    resetRecords()
  }, [resetRecords])

  const handleSwitchAccount = useCallback(() => {
    if (!confirm('切换账号将清除本设备保存的登录信息（服务端数据仍保留 7 天），是否继续？')) return
    localStorage.removeItem(PHONE_STORAGE_KEY)
    setUserPhone(null)
  }, [])

  // ESC 关闭 lightbox
  useEffect(() => {
    if (!lightboxUrl) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [lightboxUrl])

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
    if (!isOnline) {
      enqueue('当前离线，无法同步', 'error')
      return
    }
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      enqueue('请输入要同步的内容', 'error')
      textareaRef.current?.focus()
      return
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      enqueue(`内容超过 ${MAX_CONTENT_LENGTH} 字符限制`, 'error')
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
      setContent('')
      autoResize()
      enqueue('已同步到所有设备', 'success')
    } catch (error) {
      console.error('同步失败:', error)
      enqueue(error instanceof Error ? error.message : '同步失败，请重试', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleFilePick = () => fileInputRef.current?.click()

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      e.preventDefault()
      uploadFiles(files)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragOver(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragOver(false)
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
  }

  const openLightbox = useCallback((url: string) => {
    setLightboxLoading(true)
    setLightboxUrl(url)
  }, [])

  const clearInput = () => {
    setContent('')
    autoResize()
    textareaRef.current?.focus()
  }

  const loadToInput = (record: Record) => {
    if (record.type && record.type !== 'text') return
    setContent(record.content != null ? record.content : record.preview ?? '')
    autoResize()
    textareaRef.current?.focus()
  }

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
      {!isOnline && (
        <div className="offline-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" x2="23" y1="1" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <circle cx="12" cy="20" r="1"/>
          </svg>
          <span>当前处于离线状态，部分功能不可用</span>
        </div>
      )}
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
            <div className="header-actions">
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
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
                aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            </div>
          </div>
        </header>

        <section className="input-section">
          <div
            className={`card input-card${isDragOver ? ' drag-over' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="textarea-wrapper">
              <textarea
                ref={textareaRef}
                className="textarea-input"
                placeholder="输入文字，或粘贴/拖拽/附加图片、文件..."
                value={content}
                onChange={(e) => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
              />
            </div>

            <div className="input-footer">
              <div className="input-meta">
                <span className={`char-count${content.length > MAX_CONTENT_LENGTH ? ' char-overlimit' : ''}`}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </span>
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

          <SearchFilter
            query={searchQuery}
            onQueryChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            resultCount={filteredRecords.length}
            totalCount={records.length}
          />

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
            {filteredRecords.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                selected={selectedIds.has(record.id)}
                onToggle={(checked) => toggleSelect(record.id, checked)}
                onClickText={() => loadToInput(record)}
                onClickImage={openLightbox}
                formatTime={formatTime}
                formatRemaining={formatRemaining}
                onDeleteRecord={deleteRecordById}
                onCopyRecord={copyRecord}
                onRetryUpload={retryUpload}
                swipeOpenId={swipeOpenId}
                onSwipeOpenExclusive={setSwipeOpenId}
              />
            ))}
            {recordsLoadStatus === 'loading' && records.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => <RecordsSkeleton key={i} />)}
            {recordsLoadStatus === 'loading' &&
              records.length > 0 &&
              records.every(r => r.uploading) &&
              Array.from({ length: 3 }).map((_, i) => <RecordsSkeleton key={`sk-${i}`} />)}
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

          {recordsLoadStatus === 'idle' && !searchQuery && typeFilter !== 'all' && filteredRecords.length === 0 && records.length > 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {typeFilter === 'image' ? (
                    <>
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-5-5L5 21"/>
                    </>
                  ) : typeFilter === 'file' ? (
                    <>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                    </>
                  ) : (
                    <>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </>
                  )}
                </svg>
              </div>
              <p className="empty-title">
                {typeFilter === 'image' ? '暂无图片记录' : typeFilter === 'file' ? '暂无文件记录' : '暂无文本记录'}
              </p>
              <p className="empty-desc">
                {typeFilter === 'image' ? '上传图片后在此查看' : typeFilter === 'file' ? '上传文件后在此查看' : '输入文字并同步后在此查看'}
              </p>
            </div>
          )}

          {recordsLoadStatus === 'idle' && searchQuery && filteredRecords.length === 0 && records.length > 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <p className="empty-title">未找到匹配的记录</p>
              <p className="empty-desc">尝试其他关键词</p>
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

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast-item ${t.type}`}>
              <span>{t.message}</span>
              {t.undoAction && (
                <button
                  type="button"
                  className="toast-undo"
                  onClick={() => t.undoAction!.onUndo()}
                >
                  {t.undoAction.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div className="lightbox" onClick={() => setLightboxUrl(null)}>
          {lightboxLoading && (
            <svg className="lightbox-spinner" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          )}
          <img
            src={lightboxUrl}
            alt="preview"
            style={{ display: lightboxLoading ? 'none' : 'block' }}
            onLoad={() => setLightboxLoading(false)}
          />
        </div>
      )}
    </div>
  )
}
