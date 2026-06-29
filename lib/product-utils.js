export function normalizeStringArrayInput(value) {
    if (Array.isArray(value)) {
        return value
            .map(item => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
            .filter(Boolean)
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return []

        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed
                    .map(item => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
                    .filter(Boolean)
            }
        } catch {
            // Keep raw string as a single item when it is not JSON.
        }

        return [trimmed]
    }

    return []
}

export function toImageSrc(value) {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
        if (typeof value.src === 'string') return value.src
        if (typeof value.url === 'string') return value.url
        if (typeof value.default === 'string') return value.default
        if (value.default && typeof value.default.src === 'string') return value.default.src
    }
    return null
}

export function sanitizeImageSrc(value) {
    const raw = toImageSrc(value)
    if (typeof raw !== 'string') return null

    const trimmed = raw.trim()
    if (!trimmed) return null

    if (/^[\[{]/.test(trimmed)) {
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) return sanitizeImageSrc(parsed[0])
            return sanitizeImageSrc(parsed)
        } catch {
            return null
        }
    }

    if (trimmed.startsWith('/')) return trimmed
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed
    if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(trimmed)) return trimmed

    return null
}

export function normalizeProductResponse(product) {
    if (!product) return null

    let images = product.images
    if (Array.isArray(images)) {
        images = images
            .flatMap(img => Array.isArray(img) ? img : [img])
            .map(sanitizeImageSrc)
            .filter(Boolean)
    } else if (typeof images === 'string') {
        images = normalizeStringArrayInput(images)
            .map(sanitizeImageSrc)
            .filter(Boolean)
    } else if (images && typeof images === 'object') {
        images = Object.values(images)
            .map(sanitizeImageSrc)
            .filter(Boolean)
    } else {
        images = []
    }

    let sizes = product.sizes
    if (Array.isArray(sizes)) {
        sizes = sizes
            .map(size => (typeof size === 'string' ? size.trim() : String(size || '').trim()))
            .filter(Boolean)
    } else if (typeof sizes === 'string') {
        sizes = normalizeStringArrayInput(sizes)
    } else if (sizes && typeof sizes === 'object') {
        sizes = Object.values(sizes)
            .map(size => (typeof size === 'string' ? size.trim() : String(size || '').trim()))
            .filter(Boolean)
    } else {
        sizes = []
    }

    const rating = Array.isArray(product.rating)
        ? product.rating.map(entry => ({
            ...entry,
            user: entry?.user
                ? {
                    ...entry.user,
                    image: sanitizeImageSrc(entry.user.image)
                }
                : null
        }))
        : []

    const store = product.store
        ? {
            ...product.store,
            storeName: product.store.name || product.store.storeName || null,
            logo: sanitizeImageSrc(product.store.logo),
            user: product.store.user
                ? {
                    ...product.store.user,
                    image: sanitizeImageSrc(product.store.user.image)
                }
                : null
        }
        : null

    return {
        ...product,
        images,
        sizes,
        rating,
        store,
        storeId: product.store?.id || product.storeId || null,
        id: product.id || null,
        name: product.name || 'Unknown Product',
        description: product.description || '',
        price: product.price ?? 0,
        mrp: product.mrp ?? product.price ?? 0,
        category: product.category || 'Uncategorized',
        inStock: product.inStock !== false,
    }
}
