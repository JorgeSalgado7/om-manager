export interface CreateMemberResponse {
  message: string
  member: {
    id: string
    email: string
    status: string
    created_at: string
    updated_at: string
  }
}