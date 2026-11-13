import { smallButton } from '../lib/ui'
import { CopyButton } from './CopyButton'

export type LinkItem = { kind: 'link'; label: string; href: string } | { kind: 'copy'; label: string; text: string }

/** A row of resource buttons for one study session: links open in a new tab, prompts copy to the clipboard. */
export function SessionLinks({ links, copiedLabel }: { links: LinkItem[]; copiedLabel: string }) {
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {links.map((link) =>
        link.kind === 'link' ? (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('#') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className={smallButton}
          >
            {link.label}
          </a>
        ) : (
          <CopyButton key={link.label} text={link.text} label={link.label} copiedLabel={copiedLabel} />
        ),
      )}
    </span>
  )
}
