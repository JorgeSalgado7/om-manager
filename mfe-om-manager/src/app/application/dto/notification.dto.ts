export interface INotificationResponse {
	data: any | null
	notification: {
		error: boolean
		message: string | null
	}
}