import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAllowedPhone } from '@/lib/auth'

// 单次上传大小上限
const IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10MB
const FILE_MAX_BYTES = 50 * 1024 * 1024 // 50MB

// 允许的 MIME 顶层分类（走白名单，避免上传可执行文件）
const ALLOWED_CONTENT_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'text/*',
  'application/pdf',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-rar-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/octet-stream',
]

interface ClientPayload {
  phone?: string
  mimeType?: string
  recordId?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        let payload: ClientPayload = {}
        try {
          payload = clientPayloadRaw ? (JSON.parse(clientPayloadRaw) as ClientPayload) : {}
        } catch {
          throw new Error('无效的上传参数')
        }

        if (!isAllowedPhone(payload.phone)) {
          throw new Error('无访问权限')
        }

        if (!payload.recordId || !/^[a-f0-9-]{10,}$/i.test(payload.recordId)) {
          throw new Error('无效的 recordId')
        }

        // pathname 必须落在当前用户目录内，防止伪造覆盖他人 blob
        const expectedPrefix = `clipboard/${payload.phone}/${payload.recordId}/`
        if (!pathname.startsWith(expectedPrefix)) {
          throw new Error('非法的上传路径')
        }

        const isImage = (payload.mimeType ?? '').startsWith('image/')
        const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: maxBytes,
          // 媒体 3 小时后即可被 blob store 主动清理（双保险）
          validUntil: Date.now() + 30 * 60 * 1000,
          tokenPayload: JSON.stringify({ phone: payload.phone, recordId: payload.recordId }),
        }
      },
      // 本地开发无法收到回调（需要公网 URL），此处留空由客户端显式调用 create-media
      onUploadCompleted: async () => {
        // no-op
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '上传授权失败' },
      { status: 400 }
    )
  }
}
