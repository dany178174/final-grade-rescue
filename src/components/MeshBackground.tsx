export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05061a]">
      <div className="mesh-blob mesh-blob--blue" />
      <div className="mesh-blob mesh-blob--purple" />
      <div className="mesh-blob mesh-blob--pink" />
      <div className="mesh-blob mesh-blob--indigo" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(5_6_26/0.7)_100%)]" />
      <div className="mesh-grain" />
    </div>
  )
}
