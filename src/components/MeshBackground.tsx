export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink-950">
      <div className="mesh-blob mesh-blob--blue" />
      <div className="mesh-blob mesh-blob--purple" />
      <div className="mesh-blob mesh-blob--pink" />
      <div className="mesh-blob mesh-blob--indigo" />
      <div className="mesh-dots" />
      <div className="mesh-grain" />
    </div>
  )
}
