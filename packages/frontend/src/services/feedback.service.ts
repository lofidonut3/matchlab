import api from '../lib/api'
import type { 
  FeedbackRequest, 
  Feedback 
} from '@matchlab/shared'

export const feedbackService = {
  async submitFeedback(teamId: string, data: FeedbackRequest): Promise<Feedback> {
    const response = await api.post<Feedback>(`/teams/${teamId}/feedback`, data)
    return response.data
  },

  async getMyFeedbacks(): Promise<Feedback[]> {
    const response = await api.get<Feedback[]>('/profile/me/feedbacks')
    return response.data
  },
}
