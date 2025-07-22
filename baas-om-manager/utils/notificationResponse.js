export const notificationResponse = (data, error, errorMessage) => {

	return JSON.stringify(
		{
			data: data,
			notification: {
				error: error,
				message: errorMessage,
			}
		}
	)

}