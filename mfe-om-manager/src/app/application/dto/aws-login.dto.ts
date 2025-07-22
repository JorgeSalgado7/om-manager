export interface IAWSLoginResponseDTO {
	data: any | null
	notification: {
		error: boolean
		message: string | null
	}
}


export const AWSLoginResponseDTO = (data: any, error: boolean, message: string | null ): IAWSLoginResponseDTO => {

	return {
		data,
		notification: {
			error,
			message,
		},
	}

}
