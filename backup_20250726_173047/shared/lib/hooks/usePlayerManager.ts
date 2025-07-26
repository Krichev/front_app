// src/shared/lib/hooks/usePlayerManager.ts
import {useCallback, useState} from 'react'

export const usePlayerManager = (initialPlayers: string[] = []) => {
    const [players, setPlayers] = useState<string[]>(initialPlayers)
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')

    const addPlayer = useCallback((playerName: string) => {
        const trimmedName = playerName.trim()
        if (trimmedName && !players.includes(trimmedName)) {
            setPlayers(prev => [...prev, trimmedName])
            return true
        }
        return false
    }, [players])

    const removePlayer = useCallback((index: number) => {
        if (players.length > 1 && index >= 0 && index < players.length) {
            const playerToRemove = players[index]
            setPlayers(prev => prev.filter((_, i) => i !== index))

            // If the removed player was selected, clear selection
            if (selectedPlayer === playerToRemove) {
                setSelectedPlayer('')
            }
            return true
        }
        return false
    }, [players, selectedPlayer])

    const selectPlayer = useCallback((playerName: string) => {
        if (players.includes(playerName)) {
            setSelectedPlayer(playerName)
            return true
        }
        return false
    }, [players])

    const clearSelection = useCallback(() => {
        setSelectedPlayer('')
    }, [])

    return {
        players,
        selectedPlayer,
        addPlayer,
        removePlayer,
        selectPlayer,
        clearSelection,
        setPlayers
    }
}