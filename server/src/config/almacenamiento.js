require("./env");
const { createHttpError } = require("../utils/errors/http.error");

const getConfig = () => {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, API_PUBLIC_URL } = process.env;
    if (![R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, API_PUBLIC_URL].every(Boolean)) {
        throw createHttpError("El almacenamiento de fotos no está configurado", 503);
    }
    let url;
    try {
        url = new URL(API_PUBLIC_URL);
    } catch {
        throw createHttpError("La configuración del almacenamiento no es válida", 503);
    }
    if (!/^[a-f0-9]{32}$/i.test(R2_ACCOUNT_ID) || url.username || url.password
        || url.search || url.hash || url.pathname !== "/"
        || !["http:", "https:"].includes(url.protocol)
        || (process.env.NODE_ENV === "production" && url.protocol !== "https:")) {
        throw createHttpError("La configuración del almacenamiento no es válida", 503);
    }
    return {
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY,
        bucket: R2_BUCKET, apiUrl: url.origin
    };
};

module.exports = { getConfig };
