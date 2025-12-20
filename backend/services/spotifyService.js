const axios = require('axios');
const User = require('../models/User');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5000/api/spotify/callback';

const SCOPES = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-email',
    'user-read-private'
].join(' ');

// Helper: Basic Auth Header
const getAuthHeader = () => {
    return 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'));
};

exports.getLoginUrl = (userId) => {
    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${userId}`;
};

exports.handleCallback = async (code, userId) => {
    try {
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('grant_type', 'authorization_code');

        const response = await axios.post('https://accounts.spotify.com/api/token', params, {
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;
        const expiresAt = Date.now() + expires_in * 1000;

        await User.findByIdAndUpdate(userId, {
            spotify: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt
            }
        });

        return true;
    } catch (error) {
        console.error('Spotify Callback Error:', error.response?.data || error.message);
        throw new Error('Failed to connect Spotify');
    }
};

const refreshAccessToken = async (user) => {
    try {
        if (!user.spotify.refreshToken) throw new Error('No refresh token');

        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', user.spotify.refreshToken);

        const response = await axios.post('https://accounts.spotify.com/api/token', params, {
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, expires_in } = response.data;
        const expiresAt = Date.now() + expires_in * 1000;

        // Update DB
        user.spotify.accessToken = access_token;
        user.spotify.expiresAt = expiresAt;

        // If a new refresh token is returned, update it too (Spotify sometimes rotates them)
        if (response.data.refresh_token) {
            user.spotify.refreshToken = response.data.refresh_token;
        }

        await user.save();
        return access_token;
    } catch (error) {
        console.error('Token Refresh Error:', error.response?.data || error.message);
        // If refresh fails (e.g. revoked), clear data so UI shows "Link Account"
        user.spotify = { accessToken: null, refreshToken: null, expiresAt: null };
        await user.save();
        return null;
    }
};

const getValidToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.spotify?.accessToken) return null;

    // Buffer of 60 seconds
    if (Date.now() > user.spotify.expiresAt - 60000) {
        return await refreshAccessToken(user);
    }

    return user.spotify.accessToken;
};

exports.getPlaybackState = async (userId) => {
    const token = await getValidToken(userId);
    if (!token) return { isConnected: false, isPlaying: false };

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.data || response.status === 204) {
            return { isConnected: true, isPlaying: false };
        }

        const { item, is_playing } = response.data;
        if (!item) return { isConnected: true, isPlaying: false };

        return {
            isConnected: true,
            isPlaying: is_playing,
            track: {
                name: item.name,
                artist: item.artists.map(a => a.name).join(', '),
                image: item.album.images[0]?.url || null,
                uri: item.uri
            }
        };
    } catch (error) {
        // If 401, token might be bad even after refresh logic (e.g. manual revoke),
        // but getValidToken handles refresh. 
        console.error('Spotify Status Error:', error.response?.data || error.message);
        return { isConnected: false, isPlaying: false };
    }
};

exports.togglePlay = async (userId, action) => {
    const token = await getValidToken(userId);
    if (!token) return false;

    try {
        const endpoint = action === 'pause'
            ? 'https://api.spotify.com/v1/me/player/pause'
            : 'https://api.spotify.com/v1/me/player/play';

        await axios.put(endpoint, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return true;
    } catch (error) {
        console.error(`Spotify ${action} Error:`, error.response?.data || error.message);
        return false;
    }
};
