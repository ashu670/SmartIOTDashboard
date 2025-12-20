import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function MediaControl({ user }) {
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
                if (res.data) {
                    setSpotifyState({
                        isConnected: res.data.isConnected,
                        isPlaying: res.data.isPlaying,
                        track: res.data.track
                    });
                }
            } catch (err) {
                // Silent fail
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

    // State 1: Not Connected
    if (!spotifyState.isConnected) {
        return (
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 h-full min-h-[250px]">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-card-inner)] flex items-center justify-center text-[#1DB954]">
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-[var(--text-primary)]">Spotify</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Not Connected</p>
                </div>
                <button
                    onClick={handleSpotifyConnect}
                    className="px-6 py-2 rounded-full bg-[#1DB954] text-white text-sm font-bold hover:brightness-110 transition shadow-lg shadow-green-900/20"
                >
                    Link Spotify Account
                </button>
            </div>
        );
    }

    // State 2: Connected but Idle or Playing
    const track = spotifyState.track;

    return (
        <div className="glass-card rounded-2xl p-5 flex flex-col h-full min-h-[250px] relative overflow-hidden group">

            {/* [ DIV 1 ] Header */}
            <div className="flex justify-between items-center w-full mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
                    Media Control
                </h3>
                <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)] flex items-center gap-1 opacity-80">
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Spotify
                </span>
            </div>

            {/* [ DIV 2 ] Image Area (Background) + [ DIV 3 ] Playback Area */}
            <div className="relative w-full flex-1 rounded-xl overflow-hidden shadow-inner bg-[var(--bg-card-inner)]">
                {track?.image ? (
                    <>
                        {/* Background Image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
                            style={{
                                backgroundImage: `url(${track.image})`,
                                borderRadius: 'inherit' // Ensures rounding matches parent
                            }}
                        />

                        {/* Overlay #1 (Image Fade - 30%) */}
                        <div
                            className="absolute inset-0 transition-colors duration-500 bg-[var(--bg-base)]"
                            style={{
                                opacity: 0.3,
                                borderRadius: 'inherit' // Ensures rounding matches parent
                            }}
                        />

                        {/* [ DIV 3 ] Playback Area (Overlayed on bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end p-3 gap-2">
                            {/* Overlay #2 (Playback Contrast - 70%) */}
                            <div
                                className="absolute inset-0 transition-colors duration-500 bg-[var(--bg-base)]"
                                style={{
                                    opacity: 0.7,
                                    // Manually matched rounding to bottom of parent container
                                    borderBottomLeftRadius: '0.75rem',
                                    borderBottomRightRadius: '0.75rem'
                                }}
                            />

                            {/* Content */}
                            <div className="relative z-10 w-full text-center">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate leading-tight mb-0.5" title={track.name}>
                                    {track.name}
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] truncate" title={track.artist}>
                                    {track.artist}
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center gap-6">
                                <button
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition disabled:opacity-30"
                                    disabled={!track}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                                    </svg>
                                </button>

                                <button
                                    onClick={handleSpotifyToggle}
                                    disabled={!track}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-50 ${'bg-[var(--accent-blue)] text-white shadow-lg'
                                        }`}
                                >
                                    {spotifyState.isPlaying ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition disabled:opacity-30"
                                    disabled={!track}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <svg className="w-12 h-12 text-[var(--text-muted)] opacity-20 mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">No playback</h4>
                        <p className="text-xs text-[var(--text-secondary)]">Open Spotify to start</p>
                    </div>
                )}
            </div>
        </div>
    );
}
