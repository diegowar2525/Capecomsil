const sharp = require("sharp");
const { validateFoto } = require("../utils/validators/foto.validators");
const { createHttpError } = require("../utils/errors/http.error");

const prepararFoto = async (data, { lado = 512, ajuste = "cover" } = {}) => {
    const buffer = validateFoto(data);
    try {
        const image = sharp(buffer, { limitInputPixels: 20000000, failOn: "warning" });
        const metadata = await image.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
            throw new Error("Formato no permitido");
        }
        return await image.rotate().resize(lado, lado, { fit: ajuste, withoutEnlargement: true })
            .webp({ quality: 82 }).toBuffer();
    } catch {
        throw createHttpError("Seleccione una imagen JPEG, PNG o WebP válida, sin animación y de hasta 20 megapíxeles", 400);
    }
};

module.exports = { prepararFoto };
