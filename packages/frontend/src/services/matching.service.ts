import api from '../lib/api'
import type { 
  MatchRecommendation, 
  MatchDetail, 
  ExploreFilters 
} from '@matchlab/shared'

interface RecommendationsResponse {
  recommendations: MatchRecommendation[]
  totalCandidates: number
  filteredCount: number
  relaxationSuggestions: string[]
}

interface ExploreResponse {
  items: MatchRecommendation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const matchingService = {
  async getRecommendations(): Promise<MatchRecommendation[]> {
    const response = await api.get<RecommendationsResponse>('/matches/recommendations')
    return response.data.recommendations || []
  },

  async getMatchDetail(targetUserId: string): Promise<MatchDetail> {
    const response = await api.get<MatchDetail>(`/matches/${targetUserId}`)
    return response.data
  },

  async explore(filters: ExploreFilters): Promise<MatchRecommendation[]> {
    const response = await api.get<ExploreResponse>('/explore', {
      params: filters,
    })
    return response.data.items || []
  },
}
