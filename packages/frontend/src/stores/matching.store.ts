import { create } from 'zustand'
import type { MatchRecommendation, MatchDetail, ExploreFilters } from '@matchlab/shared'
import { matchingService } from '../services'

interface MatchingState {
  recommendations: MatchRecommendation[]
  exploreResults: MatchRecommendation[]
  selectedMatch: MatchDetail | null
  isLoading: boolean
  isExploring: boolean
  error: string | null
  filters: ExploreFilters

  // Actions
  fetchRecommendations: () => Promise<void>
  fetchMatchDetail: (userId: string) => Promise<void>
  explore: (filters: ExploreFilters) => Promise<void>
  setFilters: (filters: Partial<ExploreFilters>) => void
  clearSelectedMatch: () => void
}

export const useMatchingStore = create<MatchingState>((set, get) => ({
  recommendations: [],
  exploreResults: [],
  selectedMatch: null,
  isLoading: false,
  isExploring: false,
  error: null,
  filters: {},

  fetchRecommendations: async () => {
    set({ isLoading: true, error: null })
    try {
      const recommendations = await matchingService.getRecommendations()
      set({ recommendations, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '추천을 불러오는데 실패했습니다.'
      set({ error: message, isLoading: false })
    }
  },

  fetchMatchDetail: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const matchDetail = await matchingService.getMatchDetail(userId)
      set({ selectedMatch: matchDetail, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '상세 정보를 불러오는데 실패했습니다.'
      set({ error: message, isLoading: false })
    }
  },

  explore: async (filters: ExploreFilters) => {
    set({ isExploring: true, error: null, filters })
    try {
      const results = await matchingService.explore(filters)
      set({ exploreResults: results, isExploring: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '탐색에 실패했습니다.'
      set({ error: message, isExploring: false })
    }
  },

  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } })
  },

  clearSelectedMatch: () => set({ selectedMatch: null }),
}))
