"use client"
import * as React from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react"

export function VideoPlayer({ src, onEnd }: { src: string; onEnd?: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [playing, setPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [currentTime, setCurrent] = React.useState("0:00")
  const [duration, setDuration] = React.useState("0:00")
  const [muted, setMuted] = React.useState(false)
  const [volume, setVolume] = React.useState(1)
  const [speed, setSpeed] = React.useState(1)
  const [showControls, setShowControls] = React.useState(true)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    let cancelled = false
    let url: string | null = null
    fetch(src)
      .then(r => r.blob())
      .then(blob => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [src])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }

  const cycleSpeed = () => {
    const v = videoRef.current
    if (!v) return
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1
    v.playbackRate = next
    setSpeed(next)
  }

  React.useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => {
      if (v.duration) {
        setProgress((v.currentTime / v.duration) * 100)
        setCurrent(fmt(v.currentTime))
        setDuration(fmt(v.duration))
      }
    }
    const onEnded = () => { setPlaying(false); onEnd?.() }
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("ended", onEnded)
    return () => {
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("ended", onEnded)
    }
  }, [blobUrl, onEnd])

  const resetHide = () => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  const toggleFullscreen = () => {
    const c = containerRef.current
    if (!c) return
    document.fullscreenElement ? document.exitFullscreen() : c.requestFullscreen()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (["ArrowLeft", "ArrowRight", "f", "F", " "].includes(e.key)) {
      if (e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault()
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-[12px] overflow-hidden bg-black select-none"
      onMouseMove={resetHide}
      onMouseLeave={() => playing && setShowControls(false)}
      onContextMenu={e => e.preventDefault()}
      onKeyDown={handleKey}
      tabIndex={0}
    >
      <style>{`
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
      `}</style>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {blobUrl && (
        <video
          ref={videoRef}
          src={blobUrl}
          preload="metadata"
          playsInline
          onClick={togglePlay}
          className="w-full aspect-video cursor-pointer"
        />
      )}

      {blobUrl && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
          <div className="px-4 pt-2 pb-3">
            <div className="h-1 w-full rounded-full bg-white/20 cursor-pointer group" onClick={seek}>
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-white/80">
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted }} className="text-white hover:text-white/80">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={e => { const v = parseFloat(e.target.value); setVolume(v); setMuted(false); if (videoRef.current) videoRef.current.volume = v }}
                  className="w-16 h-1 accent-white cursor-pointer"
                />
                <span className="text-[11px] text-white/70 font-mono">{currentTime} / {duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={cycleSpeed} className="text-[11px] font-bold text-white/80 hover:text-white px-1.5 py-0.5 rounded border border-white/20 hover:border-white/40 min-w-[32px] text-center transition-colors">
                  {speed}x
                </button>
                <button onClick={toggleFullscreen} className="text-white hover:text-white/80">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
