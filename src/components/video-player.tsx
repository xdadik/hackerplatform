"use client"
import * as React from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react"

export function VideoPlayer({ src, onEnd }: { src: string; onEnd?: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [currentTime, setCurrent] = React.useState("0:00")
  const [duration, setDuration] = React.useState("0:00")
  const [muted, setMuted] = React.useState(false)
  const [volume, setVolume] = React.useState(1)
  const [speed, setSpeed] = React.useState(1)
  const [showControls, setShowControls] = React.useState(true)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up hideTimer on unmount
  React.useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const togglePlay = React.useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      const p = v.play()
      if (p && typeof (p as Promise<void>).catch === "function") {
        ;(p as Promise<void>).catch(() => {})
      }
    } else {
      v.pause()
    }
  }, [])

  const cycleSpeed = () => {
    const v = videoRef.current
    if (!v) return
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1
    v.playbackRate = next
    setSpeed(next)
  }

  const seekBy = React.useCallback((delta: number) => {
    const v = videoRef.current
    if (!v) return
    const d = v.duration || 0
    v.currentTime = Math.max(0, Math.min(d, v.currentTime + delta))
  }, [])

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
    const onLoadedMetadata = () => {
      if (v.duration) setDuration(fmt(v.duration))
      setLoading(false)
      setError(null)
    }
    // also handle durationchange
    v.addEventListener("play", onPlay)
    v.addEventListener("pause", onPause)
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("ended", onEnded)
    v.addEventListener("loadedmetadata", onLoadedMetadata)
    return () => {
      v.removeEventListener("play", onPlay)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("ended", onEnded)
      v.removeEventListener("loadedmetadata", onLoadedMetadata)
    }
  }, [onEnd])

  const resetHide = React.useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [playing])

  const seek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    v.currentTime = ((clientX - rect.left) / rect.width) * v.duration
  }

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seek(e)
  }

  const handleSeekTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    seek(e)
  }

  const toggleFullscreen = () => {
    const c = containerRef.current
    if (!c) return
    document.fullscreenElement ? document.exitFullscreen().catch(()=>{}) : c.requestFullscreen().catch(()=>{})
  }

  const handleKey = (e: React.KeyboardEvent) => {
    // Space -> toggle, ArrowLeft -5s, ArrowRight +5s, f -> fullscreen, m -> mute
    if (e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "f" || e.key === "F" || e.key === "m" || e.key === "M") {
      if (e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault()
      if (e.key === " ") togglePlay()
      else if (e.key === "ArrowLeft") seekBy(-5)
      else if (e.key === "ArrowRight") seekBy(5)
      else if (e.key === "f" || e.key === "F") toggleFullscreen()
      else if (e.key === "m" || e.key === "M") {
        setMuted(m => {
          const next = !m
          if (videoRef.current) videoRef.current.muted = next
          return next
        })
      }
    }
  }

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); seekBy(-5) }
    else if (e.key === "ArrowRight") { e.preventDefault(); seekBy(5) }
    else if (e.key === "Home") { e.preventDefault(); if(videoRef.current) videoRef.current.currentTime = 0 }
    else if (e.key === "End") { e.preventDefault(); if(videoRef.current && videoRef.current.duration) videoRef.current.currentTime = videoRef.current.duration }
    else if (e.key === " ") { e.preventDefault(); togglePlay() }
  }

  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (v && v.duration && !isNaN(v.duration)) setDuration(fmt(v.duration))
    setLoading(false)
    setError(null)
  }

  const handleError = () => {
    setLoading(false)
    setError("Failed to load video. Please try again or check your connection.")
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    setMuted(v === 0 ? true : false)
    if (videoRef.current) {
      videoRef.current.volume = v
      videoRef.current.muted = v === 0 ? true : false
    }
  }

  const handleMuteToggle = () => {
    setMuted(m => {
      const next = !m
      if (videoRef.current) videoRef.current.muted = next
      return next
    })
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-[12px] overflow-hidden bg-black select-none"
      onMouseMove={resetHide}
      onMouseLeave={() => playing && setShowControls(false)}
      onTouchStart={resetHide}
      onTouchMove={resetHide}
      onContextMenu={e => e.preventDefault()}
      onKeyDown={handleKey}
      tabIndex={0}
      role="region"
      aria-label="Video player"
    >
      <style>{`
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
      `}</style>

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="w-8 h-8 text-white animate-spin" aria-label="Loading video" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 p-4 text-center">
          <p className="text-sm text-white/90">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); videoRef.current?.load() }} className="mt-3 text-xs px-3 py-1 rounded bg-white text-black hover:bg-white/90">Retry</button>
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        className="w-full aspect-video cursor-pointer"
        aria-label="Video content"
      />

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"} ${showControls ? "pointer-events-auto" : ""}`}>
        <div className="px-4 pt-2 pb-3">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${currentTime} of ${duration}`}
            className="h-1 w-full rounded-full bg-white/20 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full"
            onClick={handleSeekClick}
            onTouchStart={handleSeekTouch}
            onKeyDown={handleProgressKeyDown}
          >
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="text-white hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/50 rounded">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={handleMuteToggle} aria-label={muted ? "Unmute" : "Mute"} className="text-white hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/50 rounded">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min="0" max="1" step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 accent-white cursor-pointer"
                aria-label="Volume"
              />
              <span className="text-[11px] text-white/70 font-mono" aria-live="polite">{currentTime} / {duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={cycleSpeed} aria-label={`Playback speed ${speed}x, click to change`} className="text-[11px] font-bold text-white/80 hover:text-white px-1.5 py-0.5 rounded border border-white/20 hover:border-white/40 min-w-[32px] text-center transition-colors focus-visible:ring-2 focus-visible:ring-white/50">
                {speed}x
              </button>
              <button onClick={toggleFullscreen} aria-label="Fullscreen" className="text-white hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/50 rounded">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
