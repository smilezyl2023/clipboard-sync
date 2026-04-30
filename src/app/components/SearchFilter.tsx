'use client'

export type TypeFilter = 'all' | 'text' | 'image' | 'file'

const FILTER_TABS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'file', label: '文件' },
]

interface SearchFilterProps {
  query: string
  onQueryChange: (query: string) => void
  typeFilter: TypeFilter
  onTypeFilterChange: (filter: TypeFilter) => void
  resultCount: number
  totalCount: number
}

export default function SearchFilter({ query, onQueryChange, typeFilter, onTypeFilterChange, resultCount, totalCount }: SearchFilterProps) {
  return (
    <div className="search-filter">
      <div className="search-filter-input-wrap">
        <svg className="search-filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          className="search-filter-input"
          type="text"
          inputMode="search"
          placeholder="搜索历史记录..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="搜索历史记录"
        />
        {query && (
          <button
            className="search-filter-clear"
            onClick={() => onQueryChange('')}
            aria-label="清除搜索"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        )}
      </div>
      <div className="search-filter-tabs" role="tablist" aria-label="按类型筛选">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            className={`search-filter-tab${typeFilter === tab.value ? ' active' : ''}`}
            role="tab"
            aria-selected={typeFilter === tab.value}
            onClick={() => onTypeFilterChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {query && (
        <span className="search-filter-count" aria-live="polite">
          {resultCount}/{totalCount} 条匹配
        </span>
      )}
    </div>
  )
}
