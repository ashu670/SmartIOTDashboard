import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Ambience({ user }) {
    const [spotifyState, setSpotifyState] = useState({
        isConnected: false,
        isPlaying: false,
        track: null
    });

    useEffect(() => {
        if (!user) return;

        const fetchSpotify = async () => {
            try {
                const res = await api.get('/spotify/current');
                // Backend returns: { isConnected: bool, isPlaying: bool, track: obj|null }
                if (res.data) {
                    setSpotifyState({
                        isConnected: res.data.isConnected,
                        isPlaying: res.data.isPlaying,
                        track: res.data.track
                    });
                }
            } catch (err) {
                // Silent fail as requested
            }
        };

        fetchSpotify();
        const interval = setInterval(fetchSpotify, 5000);
        return () => clearInterval(interval);
    }, [user]);

    const handleSpotifyConnect = async () => {
        try {
            const res = await api.get('/spotify/login');
            if (res.data.url) window.location.href = res.data.url;
        } catch (err) {
            console.error('Login failed', err);
        }
    };

    const handleSpotifyToggle = async () => {
        if (!spotifyState.isConnected) return;

        // Optimistic UI update
        setSpotifyState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));

        try {
            await api.post('/spotify/toggle-play', {
                action: spotifyState.isPlaying ? 'pause' : 'play'
            });
        } catch (err) {
            // Revert if failed
            setSpotifyState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
        }
    };

    return (
        <div className="glass-card rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Ambience</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-subtle)]">

                {/* Album Art / Icon */}
                <div className="w-12 h-12 rounded-lg bg-[var(--bg-card-hover)] flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {spotifyState.track?.image ? (
                        <img src={spotifyState.track.image} alt="Art" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-[var(--accent-blue)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                    {spotifyState.isConnected ? (
                        spotifyState.track ? (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <p className="font-medium text-[var(--text-primary)] truncate text-sm">{spotifyState.track.name}</p>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] truncate">{spotifyState.track.artist}</p>
                            </>
                        ) : (
                            <>
                                <p className="font-medium text-[var(--text-primary)] text-sm">No music playing</p>
                                <p className="text-xs text-[var(--text-secondary)]">Open Spotify to start playback</p>
                            </>
                        )
                    ) : (
                        <>
                            <p className="font-medium text-[var(--text-primary)] text-sm">Not Connected</p>
                            <button onClick={handleSpotifyConnect} className="text-xs text-[var(--accent-blue)] font-bold hover:underline">
                                [ Link Spotify Account ]
                            </button>
                        </>
                    )}
                </div>

                {/* Controls */}
                {spotifyState.isConnected && (
                    <button
                        onClick={handleSpotifyToggle}
                        // Allow play logic even if no track if we want to "Resume" last session, 
                        // but for now, disable if no track is active or unknown
                        disabled={!spotifyState.track}
                        className={`w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition shadow-[var(--shadow-btn)] shrink-0 ${!spotifyState.track ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-[var(--accent-blue)] text-white'
                            }`}
                    >
                        {spotifyState.isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
