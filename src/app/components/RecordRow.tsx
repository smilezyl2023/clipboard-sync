'use client'

import { useState, useRef, useEffect } from 'react'
import { type Record } from '@/app/hooks/useRecords'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const SWIPE_DELETE_PX = 72

export default function RecordRow({
  record,
  selected,
  onToggle,
  onClickText,
  onClickImage,
  formatTime,
  formatRemaining,
  onDeleteRecord,
  onCopyRecord,
  onRetryUpload,
  swipeOpenId,
  onSwipeOpenExclusive,
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
  onRetryUpload?: (id: string) => void
  swipeOpenId: string | null
  onSwipeOpenExclusive: (id: string | null) => void
}) {
  const type = record.type ?? 'text'
  const remaining = record.expiresAt ? formatRemaining(record.expiresAt) : null
  const [liveReveal, setLiveReveal] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const lastRevealRef = useRef(0)
  const touchRef = useRef<{
    startX: number
    startY: number
    base: number
    locked?: 'h' | 'v'
  } | null>(null)

  const opened = swipeOpenId === record.id
  const revealedPx =
    liveReveal !== null ? liveReveal : opened ? SWIPE_DELETE_PX : 0
  const translateX = -revealedPx

  useEffect(() => {
    if (swipeOpenId === null || swipeOpenId === record.id) return
    setLiveReveal(null)
  }, [swipeOpenId, record.id])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (record.uploading || record.uploadFailed || record.pendingDelete) return
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
    if (record.uploading || record.uploadFailed || record.pendingDelete || !touchRef.current) return
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
    if (record.uploading || record.uploadFailed || record.pendingDelete) {
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!record.blobUrl || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(record.blobUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = record.fileName || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.error('下载失败', err)
    } finally {
      setDownloading(false)
    }
  }

  const rowInner = (
    <>
      <input
        type="checkbox"
        className="record-checkbox"
        checked={selected}
        disabled={record.uploading || record.uploadFailed}
        title={record.uploading ? '上传中不可多选删除' : record.uploadFailed ? '上传失败，无法选择' : undefined}
        aria-label={record.uploading ? '上传中，不可选择' : record.uploadFailed ? '上传失败，不可选择' : '选择此条记录'}
        onChange={(e) => onToggle(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
      />

      {type === 'image' && record.blobUrl ? (
        <div
          className="record-thumb"
          onClick={() => onClickImage(record.blobUrl as string)}
        >
          <img
            src={`${record.blobUrl}${record.blobUrl.includes('?') ? '&' : '?'}w=200`}
            alt={record.fileName ?? ''}
            loading="lazy"
          />
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
          {record.uploading && !record.uploadFailed && (
            <>
              <span className="record-dot">·</span>
              <span className="record-uploading">
                上传中
                {typeof record.uploadProgress === 'number' ? ` ${record.uploadProgress}%` : '…'}
              </span>
            </>
          )}
          {record.uploadFailed && (
            <>
              <span className="record-dot">·</span>
              <span className="record-upload-failed">上传失败</span>
              <button
                type="button"
                className="record-retry-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onRetryUpload?.(record.id)
                }}
              >
                重试
              </button>
            </>
          )}
          {remaining && !record.uploading && !record.uploadFailed && (
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
          title={record.uploading ? '上传中' : record.uploadFailed ? '上传失败' : '复制'}
          disabled={record.uploading || record.uploadFailed}
          onClick={handleCopyClick}
          onKeyDown={handleCopyKeyDown}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
        {type === 'file' && record.blobUrl && !record.uploading && (
          <button
            type="button"
            className="btn btn-ghost record-download"
            onClick={handleDownload}
            disabled={downloading}
            title={downloading ? '下载中…' : '下载'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </button>
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
        style={{ transform: `translateX(${translateX}px)` }}
      >
        <div className={`record-item record-swipe-main ${selected ? 'selected' : ''} ${record.pendingDelete ? 'pending-delete' : ''} ${record.uploadFailed ? 'upload-failed' : ''}`}>{rowInner}</div>
        <button
          type="button"
          className="record-swipe-delete"
          aria-label="删除此条记录"
          title={record.uploading ? '上传中' : record.uploadFailed ? '上传失败' : record.pendingDelete ? '删除中…' : '删除'}
          disabled={record.uploading || record.uploadFailed || record.pendingDelete}
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
