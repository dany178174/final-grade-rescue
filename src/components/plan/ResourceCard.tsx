import type { Resource, ResourceKind } from '../../data/subjects'
import { ExternalLinkIcon, SearchIcon } from '../icons'

const KIND_STYLES: Record<ResourceKind, string> = {
  Channel: 'border-pink-300/25 bg-pink-400/10 text-pink-200',
  Series: 'border-pink-300/25 bg-pink-400/10 text-pink-200',
  Course: 'border-sky-300/25 bg-sky-400/10 text-sky-200',
  'Free textbook': 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  Articles: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  'Study guide': 'border-violet-300/25 bg-violet-400/10 text-violet-200',
  Practice: 'border-orange-300/25 bg-orange-400/10 text-orange-200',
  Tool: 'border-white/20 bg-white/[0.08] text-white/75',
}

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:ring-4 focus-visible:ring-fuchsia-500/25 focus-visible:outline-none"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-xs text-white/50">{resource.source}</span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${KIND_STYLES[resource.kind]}`}
        >
          {resource.kind}
        </span>
      </span>
      <span className="mt-1.5 flex items-center gap-1.5 font-semibold text-white">
        {resource.title}
        <ExternalLinkIcon className="size-3.5 shrink-0 text-white/35 transition group-hover:text-white/80" />
      </span>
      <span className="mt-1 text-sm text-pretty text-white/65">{resource.note}</span>
    </a>
  )
}

export function ResourceGrid({ resources }: { resources: Resource[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {resources.map((resource) => (
        <li key={resource.url + resource.title}>
          <ResourceCard resource={resource} />
        </li>
      ))}
    </ul>
  )
}

export function SearchLink({ href, query, where }: { href: string; query: string; where: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex max-w-full items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2.5 text-sm transition hover:border-white/25 hover:bg-white/[0.09] focus-visible:ring-4 focus-visible:ring-fuchsia-500/25 focus-visible:outline-none"
    >
      <SearchIcon className="size-4 shrink-0 text-fuchsia-200/80" />
      <span className="truncate font-medium text-white">“{query}”</span>
      <span className="shrink-0 text-white/45">on {where}</span>
    </a>
  )
}
