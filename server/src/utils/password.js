const { scrypt, randomBytes, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");

const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };

const hashPassword = async (password) => {
    const salt = randomBytes(16).toString("hex");
    const key = await derive(password, salt, 64, options);
    return `scrypt$131072$8$1$${salt}$${key.toString("hex")}`;
};

const verifyPassword = async (password, stored) => {
    const match = typeof stored === "string"
        ? /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(stored) : null;
    // Mismo trabajo criptográfico para cuentas inexistentes o hashes no compatibles.
    const key = await derive(password, match ? match[1] : "0".repeat(32), 64, options);
    return match !== null && timingSafeEqual(key, Buffer.from(match[2], "hex"));
};

module.exports = {
    hashPassword,
    verifyPassword
};
