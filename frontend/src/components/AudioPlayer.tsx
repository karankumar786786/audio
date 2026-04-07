import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore
import shaka from 'shaka-player/dist/shaka-player.compiled.js';

interface TranscriptionEntry {
  transcript: string;
  start_time_seconds: number;
  end_time_seconds: number;
  speaker_id?: string;
}

interface QualityTrack {
  id: number;
  bandwidth: number;
  label: string;
  active: boolean;
}

interface AudioPlayerProps {
  src: string;
  poster?: string;
  captionUri?: string;
  title?: string;
  artist?: string;
}



function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  poster,
  captionUri,
  title = 'Unknown Track',
  artist = '',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<any>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuality, setShowQuality] = useState(false);
  const [qualityTracks, setQualityTracks] = useState<QualityTrack[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<'auto' | number>('auto');
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [currentCaption, setCurrentCaption] = useState<TranscriptionEntry | null>(null);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [scrubPreview, setScrubPreview] = useState<number | null>(null);
  const [buffered, setBuffered] = useState(0);

  // Load captions
  useEffect(() => {
    if (!captionUri) return;
    fetch(captionUri)
      .then(r => r.json())
      .then(data => {
        const entries = data?.diarized_transcript?.entries;
        if (Array.isArray(entries)) setTranscriptions(entries);
      })
      .catch(console.error);
  }, [captionUri]);

  // Init Shaka
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    shaka.polyfill.installAll();
    const player = new shaka.Player(audio);
    playerRef.current = player;

    player.addEventListener('error', (e: any) => console.error('Shaka:', e.detail));

    player.addEventListener('trackschanged', () => {
      const tracks: any[] = player.getVariantTracks();
      const mapped: QualityTrack[] = tracks.map((t: any, i: number) => ({
        id: t.id,
        bandwidth: t.bandwidth,
        label: t.bandwidth >= 1000000
          ? `${Math.round(t.bandwidth / 1000000 * 10) / 10} Mbps`
          : `${Math.round(t.bandwidth / 1000)} kbps`,
        active: t.active,
      }));
      // dedupe by bandwidth, sort ascending
      const seen = new Set<number>();
      const unique = mapped.filter(t => {
        if (seen.has(t.bandwidth)) return false;
        seen.add(t.bandwidth);
        return true;
      }).sort((a, b) => a.bandwidth - b.bandwidth);
      setQualityTracks(unique);
    });

    setIsLoading(true);
    player.load(src)
      .then(() => setIsLoading(false))
      .catch((e: any) => { console.error('Load error:', e); setIsLoading(false); });

    return () => { player.destroy(); };
  }, [src]);

  // RAF-based time sync
  const syncTime = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDraggingScrubber) {
      animFrameRef.current = requestAnimationFrame(syncTime);
      return;
    }
    setCurrentTime(audio.currentTime);
    if (audio.buffered.length > 0) {
      setBuffered(audio.buffered.end(audio.buffered.length - 1));
    }
    // update caption
    const t = audio.currentTime;
    const active = transcriptions.find(
      e => t >= e.start_time_seconds && t <= e.end_time_seconds
    ) ?? null;
    setCurrentCaption(active);
    animFrameRef.current = requestAnimationFrame(syncTime);
  }, [isDraggingScrubber, transcriptions]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(syncTime);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [syncTime]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(console.error);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setScrubPreview(ratio * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = volumeRef.current;
    const audio = audioRef.current;
    if (!bar || !audio) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.volume = ratio;
    setVolume(ratio);
    setIsMuted(ratio === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const selectQuality = (quality: 'auto' | number) => {
    const player = playerRef.current;
    if (!player) return;
    setSelectedQuality(quality);
    setShowQuality(false);
    if (quality === 'auto') {
      player.configure({ abr: { enabled: true } });
    } else {
      const tracks: any[] = player.getVariantTracks();
      const track = tracks.find((t: any) => t.id === quality);
      if (track) {
        player.configure({ abr: { enabled: false } });
        player.selectVariantTrack(track, true);
      }
    }
  };

  const seekPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const volumePct = isMuted ? 0 : volume * 100;


  return (
    <div style={{
      fontFamily: "'Outfit', 'Helvetica Neue', sans-serif",
      background: 'linear-gradient(160deg, #0f0f14 0%, #1a1020 100%)',
      borderRadius: '24px',
      overflow: 'hidden',
      position: 'relative',
      userSelect: 'none',
      maxWidth: '480px',
      margin: '0 auto',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    }}>

      {/* Hidden native audio */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Ambient glow from poster */}
      {poster && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px) saturate(1.5)',
          opacity: 0.2,
          zIndex: 0,
          transform: 'scale(1.1)',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Album Art */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '36px 36px 24px',
        }}>
          <div style={{ position: 'relative' }}>
            <img
              src={poster ?? '/placeholder.jpg'}
              alt="Album Art"
              style={{
                width: '220px', height: '220px', objectFit: 'cover',
                borderRadius: '20px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                display: 'block',
                transition: 'transform 0.3s ease',
                transform: isPlaying ? 'scale(1.02)' : 'scale(1)',
              }}
            />
            {isLoading && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '20px',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.2)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* Track info + quality */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '0 28px 8px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#fff', fontSize: '20px', fontWeight: 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.3px',
            }}>{title}</div>
            {artist && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '2px' }}>
                {artist}
              </div>
            )}
          </div>

          {/* Quality switcher */}
          {qualityTracks.length > 0 && (
            <div style={{ position: 'relative', marginLeft: '12px', flexShrink: 0 }}>
              <button
                onClick={() => setShowQuality(p => !p)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 600,
                  padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.5px',
                  fontFamily: 'inherit',
                }}
              >
                {selectedQuality === 'auto'
                  ? 'AUTO'
                  : qualityTracks.find(t => t.id === selectedQuality)?.label ?? 'AUTO'}
                {' ▾'}
              </button>
              {showQuality && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px', overflow: 'hidden',
                  minWidth: '120px', zIndex: 99,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                }}>
                  {[{ id: 'auto' as const, label: 'Auto (ABR)' }, ...qualityTracks.map(t => ({ id: t.id as number, label: t.label }))].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => selectQuality(opt.id)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: selectedQuality === opt.id
                          ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: 'none', color: selectedQuality === opt.id ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                        fontWeight: selectedQuality === opt.id ? 600 : 400,
                      }}
                    >
                      {selectedQuality === opt.id ? '✓ ' : '  '}{opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption */}
        <div style={{
          minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px 28px 12px', textAlign: 'center',
        }}>
          {currentCaption && (
            <p style={{
              margin: 0, fontSize: '15px', fontWeight: 500, lineHeight: 1.5,
              color: 'rgba(255,255,255,0.85)',
            }}>
              {currentCaption.transcript}
            </p>
          )}
        </div>

        {/* Seek bar */}
        <div style={{ padding: '0 28px' }}>
          <div
            ref={seekRef}
            onClick={handleSeekClick}
            onMouseMove={handleSeekMouseMove}
            onMouseLeave={() => setScrubPreview(null)}
            style={{
              height: '36px', display: 'flex', alignItems: 'center', cursor: 'pointer',
            }}
          >
            <div style={{
              flex: 1, height: '4px', background: 'rgba(255,255,255,0.12)',
              borderRadius: '4px', position: 'relative', overflow: 'hidden',
            }}>
              {/* Buffered */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${bufferedPct}%`,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '4px',
                transition: 'width 0.3s linear',
              }} />
              {/* Played */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${seekPct}%`,
                background: 'linear-gradient(90deg, #c084fc, #818cf8)',
                borderRadius: '4px',
              }} />
              {/* Scrub thumb */}
              <div style={{
                position: 'absolute', top: '50%',
                left: `${seekPct}%`,
                transform: 'translate(-50%, -50%)',
                width: '14px', height: '14px',
                background: '#fff', borderRadius: '50%',
                boxShadow: '0 0 0 3px rgba(192,132,252,0.4)',
                transition: 'transform 0.1s',
              }} />
            </div>
          </div>

          {/* Times */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '-4px',
          }}>
            <span>{formatTime(scrubPreview ?? currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 28px', gap: '8px',
        }}>
          {/* Seek back 10s */}
          <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
            style={iconBtnStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5V3l-4 4 4 4V9a7 7 0 1 1-7 7" />
              <text x="8" y="19" fontSize="7" fill="currentColor" stroke="none" fontWeight="700" fontFamily="sans-serif">10</text>
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #c084fc, #818cf8)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(192,132,252,0.4)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              color: '#fff',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.94)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading
              ? <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : isPlaying
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><polygon points="5,3 19,12 5,21"/></svg>
            }
          </button>

          {/* Seek forward 10s */}
          <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}
            style={iconBtnStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5V3l4 4-4 4V9a7 7 0 1 0 7 7" />
              <text x="8" y="19" fontSize="7" fill="currentColor" stroke="none" fontWeight="700" fontFamily="sans-serif">10</text>
            </svg>
          </button>
        </div>

        {/* Volume */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 28px 28px',
        }}>
          <button onClick={toggleMute} style={{ ...iconBtnStyle, flexShrink: 0 }}>
            {volumePct === 0
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : volumePct < 50
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            }
          </button>

          <div
            ref={volumeRef}
            onClick={handleVolumeClick}
            style={{
              flex: 1, height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer',
            }}
          >
            <div style={{
              flex: 1, height: '3px', background: 'rgba(255,255,255,0.12)',
              borderRadius: '3px', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${volumePct}%`,
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '3px',
              }} />
              <div style={{
                position: 'absolute', top: '50%',
                left: `${volumePct}%`,
                transform: 'translate(-50%, -50%)',
                width: '12px', height: '12px',
                background: '#fff', borderRadius: '50%',
              }} />
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '50%',
  width: '42px', height: '42px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
  transition: 'background 0.15s, color 0.15s',
  flexShrink: 0,
};

export default AudioPlayer;