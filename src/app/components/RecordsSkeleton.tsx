'use client'

export default function RecordsSkeleton() {
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
