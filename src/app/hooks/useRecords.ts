'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { isImageMime, sanitizeFileName } from '@/app/utils/format'
import { type Record as BaseRecord } from '@/lib/store'

export interface Record extends BaseRecord {
  uploading?: boolean
  uploadProgress?: number
  uploadFailed?: boolean
  pendingDelete?: boolean
}

const PHONE_STORAGE_KEY = 'clipboard_sync_user_phone'
const IMAGE_MAX_BYTES = 10 * 1024 * 1024
const FILE_MAX_BYTES = 50 * 1024 * 1024

export function useRecords(
  userPhone: string | null,
  setUserPhone: (phone: string | null) => void,
  enqueue: (message: string, type: 'success' | 'error' | 'info', opts?: { durationMs?: number; undoAction?: { label: string; onUndo: () => void } }) => string,
  dismiss: (id: string) => void
) {
  const [records, setRecords] = useState<Record[]>([])
  const [recordsLoadStatus, setRecordsLoadStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | undefined>(undefined)
  const loadRecordsRequestId = useRef(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [, setLastModified] = useState(0)
  const [, setNowTick] = useState(0)
  const pendingDeleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const filesRef = useRef<Map<string, File>>(new Map())

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
        enqueue('登录已失效，请重新输入', 'error')
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
        const uploading = prev.filter(r => r.uploading || r.uploadFailed)
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
  }, [userPhone, setUserPhone, enqueue])

  // 页面可见时刷新
  useEffect(() => {
    if (!userPhone) return
    loadRecords()
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRecords()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userPhone, loadRecords])

  // 媒体记录剩余时间每 30 秒刷新一次
  useEffect(() => {
    const hasMedia = records.some(r => r.expiresAt)
    if (!hasMedia) return
    const timer = setInterval(() => setNowTick(t => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [records])

  // 选择相关
  const selectableRecordIds = useMemo(
    () => records.filter(r => !r.uploading && !r.uploadFailed).map(r => r.id),
    [records]
  )
  const selectableCount = selectableRecordIds.length

  useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set(
        Array.from(prev).filter(id => {
          const r = records.find(rec => rec.id === id)
          return r && !r.uploading && !r.uploadFailed
        })
      )
      if (next.size === prev.size && Array.from(prev).every(id => next.has(id))) return prev
      return next
    })
  }, [records])

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    const r = records.find(rec => rec.id === id)
    if (r?.uploading || r?.uploadFailed) return
    setSelectedIds(prev => {
      const s = new Set(prev)
      if (checked) s.add(id)
      else s.delete(id)
      return s
    })
  }, [records])

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (checked) setSelectedIds(new Set(selectableRecordIds))
    else setSelectedIds(new Set())
  }, [selectableRecordIds])

  const selectedSelectableCount = useMemo(() => {
    const selectable = new Set(selectableRecordIds)
    return Array.from(selectedIds).filter(id => selectable.has(id)).length
  }, [selectedIds, selectableRecordIds])

  const selectAllState: 'none' | 'all' | 'indeterminate' =
    selectableCount === 0
      ? 'none'
      : selectedSelectableCount === 0
        ? 'none'
        : selectedSelectableCount === selectableCount
          ? 'all'
          : 'indeterminate'

  // 上传单个文件
  const uploadSingle = useCallback(
    async (file: File) => {
      if (!userPhone) return
      const mime = file.type || 'application/octet-stream'
      const isImage = isImageMime(mime)
      const type: 'image' | 'file' = isImage ? 'image' : 'file'
      const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES

      if (file.size <= 0 || file.size > maxBytes) {
        enqueue(
          `${file.name} 超过 ${isImage ? '10MB' : '50MB'} 上限`,
          'error'
        )
        return
      }

      const recordId = crypto.randomUUID()
      const safeName = sanitizeFileName(file.name)
      const pathname = `clipboard/${userPhone}/${recordId}/${safeName}`

      filesRef.current.set(recordId, file)

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
        filesRef.current.delete(recordId)
        setRecords(prev => prev.map(r => (r.id === recordId ? data.record : r)))
      } catch (err) {
        console.error('上传失败:', err)
        setRecords(prev =>
          prev.map(r =>
            r.id === recordId
              ? { ...r, uploading: false, uploadProgress: undefined, uploadFailed: true }
              : r
          )
        )
        enqueue(
          `上传失败：${err instanceof Error ? err.message : '未知错误'}`,
          'error'
        )
      }
    },
    [userPhone, enqueue]
  )

  const uploadFiles = useCallback(
    async (files: File[] | FileList) => {
      const list = Array.from(files)
      for (const f of list) {
        await uploadSingle(f)
      }
    },
    [uploadSingle]
  )

  const retryUpload = useCallback(
    async (id: string) => {
      if (!userPhone) return
      const file = filesRef.current.get(id)
      if (!file) {
        enqueue('文件已失效，请重新选择', 'error')
        return
      }
      const mime = file.type || 'application/octet-stream'
      const pathname = `clipboard/${userPhone}/${id}/${sanitizeFileName(file.name)}`

      setRecords(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, uploading: true, uploadProgress: 0, uploadFailed: false }
            : r
        )
      )

      try {
        const { upload } = await import('@vercel/blob/client')
        const result = await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/records/upload',
          clientPayload: JSON.stringify({
            phone: userPhone,
            mimeType: mime,
            recordId: id,
          }),
          multipart: file.size > 4 * 1024 * 1024,
          contentType: mime,
          onUploadProgress: ({ percentage }) => {
            const p = Math.min(100, Math.round(percentage))
            setRecords(prev =>
              prev.map(r => (r.id === id ? { ...r, uploadProgress: p } : r))
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
            id,
            type: mime.startsWith('image/') ? 'image' : 'file',
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
        filesRef.current.delete(id)
        setRecords(prev => prev.map(r => (r.id === id ? data.record : r)))
      } catch (err) {
        console.error('重试上传失败:', err)
        setRecords(prev =>
          prev.map(r =>
            r.id === id
              ? { ...r, uploading: false, uploadProgress: undefined, uploadFailed: true }
              : r
          )
        )
        enqueue(
          `上传失败：${err instanceof Error ? err.message : '未知错误'}`,
          'error'
        )
      }
    },
    [userPhone, enqueue]
  )

  // 清理所有待删除 timer（组件卸载时）
  useEffect(() => {
    const timers = pendingDeleteTimers.current
    return () => {
      timers.forEach(t => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const deleteRecordById = useCallback(
    (id: string) => {
      if (!userPhone) return
      const rec = records.find(r => r.id === id)
      if (!rec) return
      if (rec.uploading) {
        enqueue('上传中，无法删除', 'info')
        return
      }
      if (rec.pendingDelete) return

      // 标记为待删除（视觉半透明）
      setRecords(prev => prev.map(r => (r.id === id ? { ...r, pendingDelete: true } : r)))

      const runDelete = async () => {
        pendingDeleteTimers.current.delete(id)
        try {
          const res = await fetch(`/api/records/delete?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'x-user-phone': userPhone },
          })
          if (res.status === 401) {
            localStorage.removeItem(PHONE_STORAGE_KEY)
            setUserPhone(null)
            enqueue('登录已失效，请重新输入', 'error')
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
        } catch (error) {
          console.error('删除失败:', error)
          // 恢复记录状态
          setRecords(prev => prev.map(r => (r.id === id ? { ...r, pendingDelete: false } : r)))
          enqueue(error instanceof Error ? error.message : '删除失败，请重试', 'error')
        }
      }

      const timer = setTimeout(runDelete, 5000)
      pendingDeleteTimers.current.set(id, timer)

      const toastId = enqueue('已删除', 'success', {
        durationMs: 5000,
        undoAction: {
          label: '撤销',
          onUndo: () => {
            const t = pendingDeleteTimers.current.get(id)
            if (t) {
              clearTimeout(t)
              pendingDeleteTimers.current.delete(id)
            }
            setRecords(prev => prev.map(r => (r.id === id ? { ...r, pendingDelete: false } : r)))
            dismiss(toastId)
            enqueue('已恢复', 'success')
          },
        },
      })
    },
    [userPhone, setUserPhone, records, enqueue, dismiss]
  )

  const deleteSelected = useCallback(async () => {
    if (!userPhone || selectedIds.size === 0) return
    const idsToDelete = Array.from(selectedIds).filter(id => {
      const r = records.find(rec => rec.id === id)
      return r && !r.uploading && !r.uploadFailed
    })
    if (idsToDelete.length === 0) {
      enqueue('选中项均为上传中或失败，无法批量删除', 'info')
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
      enqueue('删除成功', 'success')
    } catch (error) {
      console.error('删除失败:', error)
      enqueue(error instanceof Error ? error.message : '删除失败，请重试', 'error')
    }
  }, [userPhone, records, selectedIds, enqueue])

  const copyRecord = useCallback(
    async (record: Record) => {
      if (record.uploading) {
        enqueue('上传中，请稍候再复制', 'info')
        return
      }
      const recType = record.type ?? 'text'
      const text =
        recType === 'text'
          ? (record.content != null ? record.content : (record.preview ?? ''))
          : (record.blobUrl ?? '')
      if (!text) {
        enqueue('暂无可复制内容', 'error')
        return
      }
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        enqueue('当前环境不支持剪贴板', 'error')
        return
      }
      try {
        await navigator.clipboard.writeText(text)
        enqueue(recType === 'text' ? '已复制' : '已复制链接', 'success')
      } catch (err) {
        const name = err instanceof Error ? err.name : ''
        const msg = err instanceof Error ? err.message : ''
        const denied =
          name === 'NotAllowedError' ||
          /denied|not allowed|permission/i.test(msg)
        enqueue(
          denied ? '无法写入剪贴板，请检查权限或改用 HTTPS 访问' : '复制失败，请重试',
          'error'
        )
      }
    },
    [enqueue]
  )

  const resetRecords = useCallback(() => {
    setRecords([])
    setSelectedIds(new Set())
    setLastModified(0)
    setRecordsLoadStatus('loading')
    setLoadErrorMessage(undefined)
  }, [])

  return {
    records,
    setRecords,
    recordsLoadStatus,
    loadErrorMessage,
    loadRecords,
    selectedIds,
    setSelectedIds,
    selectableRecordIds,
    selectableCount,
    selectAllState,
    toggleSelect,
    toggleSelectAll,
    uploadSingle,
    uploadFiles,
    retryUpload,
    copyRecord,
    deleteRecordById,
    deleteSelected,
    resetRecords,
  }
}
