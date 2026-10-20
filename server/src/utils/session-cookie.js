const config = require("../config/auth");

const readToken = (req) => {
    const values = (req.headers.cookie || "").split(";")
        .map((part) => part.trim()).filter((part) => part.startsWith(`${config.cookieName}=`));
    if (values.length !== 1) {
        return null;
    }
    const token = values[0].slice(config.cookieName.length + 1);
    return /^[a-f0-9]{64}$/.test(token) ? token : null;
};

module.exports = {
    readToken
};
