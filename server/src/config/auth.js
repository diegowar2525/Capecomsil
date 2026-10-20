require("dotenv").config();

const production = process.env.NODE_ENV === "production";
const origins = (process.env.AUTH_ORIGINS || (production ? "" : "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"))
    .split(",").map((value) => value.trim()).filter(Boolean);
if (!origins.length || origins.some((value) => {
    try {
        const url = new URL(value);
        return url.origin !== value || !["http:", "https:"].includes(url.protocol)
            || (production && url.protocol !== "https:");
    } catch {
        return true;
    }
})) {
    throw new Error("AUTH_ORIGINS debe contener orígenes explícitos válidos (HTTPS en producción)");
}
const hours = Number(process.env.AUTH_SESSION_HOURS || 12);
if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
    throw new Error("AUTH_SESSION_HOURS debe estar entre 1 y 168");
}

module.exports = {
    origins,
    sessionSeconds: hours * 3600,
    cookieName: production ? "__Host-capecomsil" : "capecomsil_session",
    cookieOptions: { httpOnly: true, secure: production, sameSite: "strict", path: "/" }
};
