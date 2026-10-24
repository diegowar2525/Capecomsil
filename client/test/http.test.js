import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../src/services/http.js';

test('HTTP compartido: conserva abortos y distingue fallos de conexión', async (t) => {
    const abort = new DOMException('Cancelado', 'AbortError');
    const mock = t.mock.method(globalThis, 'fetch', async () => { throw abort; });
    await assert.rejects(requestJson('/api/vehiculos'), (error) => error === abort);
    mock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
    await assert.rejects(requestJson('/api/auth/me'), /conectar con el servidor/);
});
