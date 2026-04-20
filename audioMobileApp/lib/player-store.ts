import { Store } from '@tanstack/react-store';
import { musicApi } from './api';
import { getImageUrl } from './image-utils';

export interface PlayerSong {
    id: string;
    title: string;
    artistName: string;
    songKey: string;
    imageKey: string;
    coverUrl: string | null;
}

type QueueSource = 'feed' | 'user' | 'empty';

interface PlayerState {
    currentSong: PlayerSong | null;
    isPlaying: boolean;
    queue: PlayerSong[];
    lastQueueIndex: number;
    isShuffle: boolean;
    repeatMode: 'none' | 'one' | 'all';
    queueSource: QueueSource;
}

export const playerStore = new Store<PlayerState>({
    currentSong: null,
    isPlaying: false,
    queue: [],
    lastQueueIndex: -1,
    isShuffle: false,
    repeatMode: 'none',
    queueSource: 'empty',
});

const mapToPlayerSong = (s: any): PlayerSong => ({
    id: s.id,
    title: s.title,
    artistName: s.artistName,
    songKey: s.songKey,
    imageKey: s.imageKey,
    coverUrl: getImageUrl(s.imageKey, { width: 600, height: 600, crop: 'at_max' }) || null,
});

export const playerActions = {
    setCurrentSong: (song: PlayerSong | null) => {
        playerStore.setState((state) => {
            let newLastQueueIndex = state.lastQueueIndex;
            if (song) {
                const idx = state.queue.findIndex((s) => s.id === song.id);
                if (idx !== -1) newLastQueueIndex = idx;
            }

            if (state.currentSong?.id === song?.id && song !== null) {
                return { ...state, lastQueueIndex: newLastQueueIndex };
            }

            return {
                ...state,
                currentSong: song,
                isPlaying: false,
                lastQueueIndex: newLastQueueIndex,
            };
        });
    },

    syncFeedToQueue: (songs: PlayerSong[]) => {
        playerStore.setState((state) => {
            if (state.queueSource === 'user') return state;

            let newIdx = -1;
            if (state.currentSong) {
                newIdx = songs.findIndex((s) => s.id === state.currentSong?.id);
            }
            return {
                ...state,
                queue: songs,
                lastQueueIndex: newIdx,
                queueSource: 'feed',
            };
        });
    },

    playSong: (song: PlayerSong) => {
        playerStore.setState((state) => {
            const existingIdx = state.queue.findIndex((s) => s.id === song.id);

            if (existingIdx !== -1) {
                return {
                    ...state,
                    currentSong: song,
                    isPlaying: false,
                    lastQueueIndex: existingIdx,
                };
            }

            const insertAt = state.lastQueueIndex + 1;
            const newQueue = [
                ...state.queue.slice(0, insertAt),
                song,
                ...state.queue.slice(insertAt),
            ];

            return {
                ...state,
                queue: newQueue,
                currentSong: song,
                isPlaying: false,
                lastQueueIndex: insertAt,
            };
        });
        musicApi.interactions.recordListen(song.id, 0).catch(() => {});
    },

    playAll: (songs: PlayerSong[]) => {
        if (songs.length === 0) return;
        playerStore.setState((state) => ({
            ...state,
            queue: songs,
            lastQueueIndex: 0,
            currentSong: songs[0],
            isPlaying: false,
            queueSource: 'user',
        }));
        musicApi.interactions.recordListen(songs[0].id, 0).catch(() => {});
    },

    addToQueue: (songs: PlayerSong[]) => {
        playerStore.setState((state) => {
            const existingIds = new Set(state.queue.map((s) => s.id));
            const filtered = songs.filter((s) => !existingIds.has(s.id));
            return { ...state, queue: [...state.queue, ...filtered] };
        });
    },

    restoreFromHistory: async () => {
        try {
            const res = await musicApi.users.getHistory(1, 1);
            if (res?.data?.data && res.data.data.length > 0) {
                const lastPlayed = res.data.data[0];
                const song = mapToPlayerSong(lastPlayed);
                playerStore.setState((state) => ({
                    ...state,
                    currentSong: song,
                    isPlaying: false,
                    queue: state.queue.length === 0 ? [song] : state.queue,
                    lastQueueIndex: state.queue.length === 0 ? 0 : state.lastQueueIndex,
                }));
            }
        } catch (e) {
            // Silently ignore history restore failures
        }
    },

    setIsPlaying: (isPlaying: boolean) => {
        playerStore.setState((state) => {
            if (state.isPlaying === isPlaying) return state;
            return { ...state, isPlaying };
        });
    },

    toggleShuffle: () => {
        playerStore.setState((state) => ({ ...state, isShuffle: !state.isShuffle }));
    },

    toggleRepeat: () => {
        playerStore.setState((state) => {
            const next: Record<string, 'none' | 'one' | 'all'> = {
                none: 'all',
                all: 'one',
                one: 'none',
            };
            return { ...state, repeatMode: next[state.repeatMode] };
        });
    },

    playPrevious: (currentPosition: number = 0): 'restart' | 'previous' => {
        const { queue, lastQueueIndex, repeatMode } = playerStore.state;

        if (currentPosition > 3) {
            return 'restart';
        }

        if (queue.length === 0) return 'restart';

        const prevIndex = lastQueueIndex - 1;

        if (prevIndex >= 0) {
            const prevSong = queue[prevIndex];
            playerActions.setCurrentSong(prevSong);
            musicApi.interactions.recordListen(prevSong.id, 0).catch(() => {});
        } else if (repeatMode === 'all' && queue.length > 0) {
            const lastSong = queue[queue.length - 1];
            playerActions.setCurrentSong(lastSong);
            musicApi.interactions.recordListen(lastSong.id, 0).catch(() => {});
        } else {
            return 'restart';
        }

        return 'previous';
    },

    playNext: async () => {
        const { queue, lastQueueIndex, isShuffle, repeatMode, currentSong } = playerStore.state;

        if (repeatMode === 'one' && currentSong) {
            playerStore.setState((s) => ({ ...s, isPlaying: false }));
            return;
        }

        let nextIndex = lastQueueIndex + 1;
        if (lastQueueIndex === -1 && queue.length > 0) {
            nextIndex = 0;
        }

        if (isShuffle && queue.length > 1) {
            do {
                nextIndex = Math.floor(Math.random() * queue.length);
            } while (nextIndex === lastQueueIndex);
        } else if (isShuffle && queue.length === 1) {
            nextIndex = 0;
        }

        if (nextIndex >= 0 && nextIndex < queue.length) {
            const nextSong = queue[nextIndex];
            playerActions.setCurrentSong(nextSong);
            musicApi.interactions.recordListen(nextSong.id, 0).catch(() => {});
        } else if (repeatMode === 'all' && queue.length > 0) {
            const nextSong = queue[0];
            playerActions.setCurrentSong(nextSong);
            musicApi.interactions.recordListen(nextSong.id, 0).catch(() => {});
        } else {
             await playerActions.playNextFromFallback();
        }

        const finalQueue = playerStore.state.queue;
        const finalIdx = playerStore.state.lastQueueIndex;
        const remaining = finalQueue.length - finalIdx - 1;
        if (finalQueue.length > 0 && remaining <= 2) {
            playerActions.fetchAndAddFeedToQueue();
        }
    },

    _fallbackPage: 1,
    _fallbackFetching: false,
    _fallbackQueue: 0,

    playNextFromFallback: async () => {
        const actions = playerActions as any;
        actions._fallbackQueue++;

        if (actions._fallbackFetching) return;

        actions._fallbackFetching = true;

        try {
            while (actions._fallbackQueue > 0) {
                const existingIds = new Set(playerStore.state.queue.map((s) => s.id));
                let nextSong: PlayerSong | undefined;
                
                for (let i = 0; i < 3; i++) {
                    const res = await musicApi.songs.getFeed(actions._fallbackPage, 5);
                    const data = res?.data?.data || res?.data || [];
                    
                    if (data.length > 0) {
                        const mapped: PlayerSong[] = data.map(mapToPlayerSong);
                        nextSong = mapped.find((s) => !existingIds.has(s.id));
                        if (nextSong) break;
                        else actions._fallbackPage++;
                    } else break;
                }

                if (nextSong) {
                    playerStore.setState((state) => ({
                        ...state,
                        queue: [...state.queue, nextSong!],
                        currentSong: nextSong!,
                        isPlaying: false,
                        lastQueueIndex: state.queue.length,
                        queueSource: 'feed',
                    }));
                    musicApi.interactions.recordListen(nextSong.id, 0).catch(() => {});
                    actions._fallbackPage++;
                }
                actions._fallbackQueue--;
            }
        } catch (err) {
            console.warn('Fallback fetch failed:', err);
            actions._fallbackQueue = 0;
        } finally {
            actions._fallbackFetching = false;
        }
    },

    fetchAndAddFeedToQueue: async () => {
        try {
            const { queue } = playerStore.state;
            const res = await musicApi.songs.getFeed(1, 10);
            const data = res?.data?.data || res?.data || [];
            
            if (data.length > 0) {
                const newSongs: PlayerSong[] = data.map(mapToPlayerSong);
                playerStore.setState((state) => {
                    const existingIds = new Set(state.queue.map((s) => s.id));
                    const freshFeedSongs = newSongs.filter((s) => !existingIds.has(s.id));
                    if (freshFeedSongs.length === 0) return state;

                    const played = state.queue.slice(0, state.lastQueueIndex + 1);
                    const keptAhead = state.queue.slice(state.lastQueueIndex + 1);
                    const merged = [...played, ...keptAhead, ...freshFeedSongs];

                    return { ...state, queue: merged };
                });
                return newSongs;
            }
        } catch (error) {
            // Silently ignore feed fetch failures
        }
        return [];
    },
};