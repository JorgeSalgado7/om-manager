export const API_CONFIG = {
  BASE_URL: 'https://5o10dfnuc2.execute-api.us-east-2.amazonaws.com/prod/baas-om-manager',
  ENDPOINTS: {
		
    CREATE_MEMBER: '/members/create',
    
		GET_ORG_BY_MEMBER_EMAIL: '/organizations/get-by-member-email',
		CREATE_ORG: '/organizations/create',
		UPDATE_ORG: '/organizations/update',
		DELETE_ORG: '/organizations/delete',

  }
}
