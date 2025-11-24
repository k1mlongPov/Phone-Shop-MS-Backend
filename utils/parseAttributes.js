function parseAttributes(payload = {}) {
    const out = {};

    if (!payload) return out;

    // Case A: full object
    if (payload.attributes && typeof payload.attributes === "object" && !Array.isArray(payload.attributes)) {
        return { ...payload.attributes };
    }

    // Case B: JSON string
    if (typeof payload.attributes === "string") {
        try {
            const parsed = JSON.parse(payload.attributes);
            if (parsed && typeof parsed === "object") return parsed;
        } catch (_) { }
    }

    // Case C: flattened FormData (attributes[key]=value)
    for (const key in payload) {
        const match = key.match(/^attributes\[(.+?)\]$/);
        if (match) {
            const attrName = match[1];
            out[attrName] = payload[key];
        }
    }

    return out;
}

module.exports = parseAttributes;
