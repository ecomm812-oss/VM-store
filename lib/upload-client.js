const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function validateImageFile(file) {
    if (!file) {
        return 'No file selected.'
    }

    if (!file.type?.startsWith('image/')) {
        return 'Please select an image file.'
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return 'File size must be less than 5MB.'
    }

    return null
}

export async function uploadImageFile(file) {
    const validationError = validateImageFile(file)
    if (validationError) {
        throw new Error(validationError)
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })

    const responseData = await response.json().catch(() => ({}))
    if (!response.ok) {
        let errorMessage = responseData.error || responseData.details || `Upload failed with status ${response.status}`

        if (response.status === 401) {
            errorMessage = responseData.error || 'Please sign in again to upload images.'
        } else if (response.status === 413) {
            errorMessage = responseData.error || 'File is too large. Maximum file size is 5MB.'
        } else if (response.status === 400) {
            errorMessage = responseData.error || 'Invalid image. Please use JPG, PNG, GIF, or WebP.'
        }

        throw new Error(errorMessage)
    }

    return responseData
}