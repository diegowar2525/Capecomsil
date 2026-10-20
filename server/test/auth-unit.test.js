const { test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { validateLogin, validateCambioPassword, validatePrimerJefe } = require("../src/utils/validators/auth.validators");
const { hashPassword, verifyPassword } = require("../src/utils/password");
const { readToken } = require("../src/utils/session-cookie");
const config = require("../src/config/auth");

test("Auth: validación conserva contraseñas, normaliza usuario y rechaza cuerpos inválidos", () => {
    const password = "  Contraseña con espacios  ";
    assert.deepEqual(validateLogin({ nombre_usuario: " JEFE.Test ", password }), { nombre_usuario: "jefe.test", password });
    assert.equal(validatePrimerJefe({ nombre_usuario: "jefe", nombre: " Jefe ", password }).nombre, "Jefe");
    for (const value of [null, [], "texto"]) {
        assert.throws(() => validateLogin(value), { status: 400 });
    }
    for (const password_nueva of ["corta", "x".repeat(129), 123, password]) {
        assert.throws(() => validateCambioPassword({ password_actual: password, password_nueva }), { status: 400 });
    }
    assert.throws(() => validateLogin({ nombre_usuario: "<script>", password }), { status: 400 });
});

test("Auth: scrypt usa sal aleatoria y verifica sin aceptar hashes ajenos", async () => {
    const password = "Contraseña extensa de prueba";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    assert.notEqual(first, second);
    assert.equal(await verifyPassword(password, first), true);
    assert.equal(await verifyPassword(password + "x", first), false);
    assert.equal(await verifyPassword(password, "hash_no_valido"), false);
});

test("Auth: cookies ambiguas o malformadas no autentican", () => {
    const cookie = `${config.cookieName}=${"a".repeat(64)}`;
    assert.equal(readToken({ headers: { cookie } }), "a".repeat(64));
    for (const value of ["", `${config.cookieName}=x`, `${cookie}; ${cookie}`]) {
        assert.equal(readToken({ headers: { cookie: value } }), null);
    }
});

test("Auth: errores de JSON no filtran credenciales al registro", (t) => {
    const errorHandler = require("../src/middlewares/error.middleware");
    const log = t.mock.method(console, "error", () => {});
    const error = Object.assign(new SyntaxError("Fragmento sensible del cuerpo"), {
        status: 400, body: '{"password":"secreto"}'
    });
    const res = { status() { return this; }, json() {} };
    errorHandler(error, {}, res, assert.fail);
    assert.equal(log.mock.callCount(), 1);
    const recorded = JSON.stringify(log.mock.calls[0].arguments);
    assert.ok(!recorded.includes("secreto"));
    assert.ok(!recorded.includes("Fragmento"));
});

test("Auth: producción exige orígenes HTTPS y cookies Secure", () => {
    const configPath = require.resolve("../src/config/auth");
    const script = `const assert=require('node:assert/strict');const config=require(${JSON.stringify(configPath)});assert.equal(config.cookieOptions.secure,true);assert.equal(config.cookieName,'__Host-capecomsil');`;
    execFileSync(process.execPath, ["-e", script], {
        env: { ...process.env, NODE_ENV: "production", AUTH_ORIGINS: "https://app.example.com" }, stdio: "pipe"
    });
    assert.throws(() => execFileSync(process.execPath, ["-e", script], {
        env: { ...process.env, NODE_ENV: "production", AUTH_ORIGINS: "http://app.example.com" }, stdio: "pipe"
    }));
});
