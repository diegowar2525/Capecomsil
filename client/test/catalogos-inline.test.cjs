const assert = require('node:assert/strict');
(async () => {
    const { createServer } = await import('vite');
    const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
    try {
        const React = require('react');
        const { renderToStaticMarkup } = require('react-dom/server');
        const { AuthContext } = await server.ssrLoadModule('/src/modules/auth/context/auth.context.js');
        const { CatalogosInlineForm } = await server.ssrLoadModule('/src/components/CatalogoConectado/CatalogosInlineForm.jsx');
        const { UbicacionForm } = await server.ssrLoadModule('/src/components/UbicacionForm/UbicacionForm.jsx');
        const { fields } = await server.ssrLoadModule('/src/modules/pagos/pagos.fields.js');
        const render = (component, props) => renderToStaticMarkup(React.createElement(AuthContext.Provider,
            { value: { permisos: ['catalogos.consultar', 'catalogos.crear', 'catalogos.editar'] } }, React.createElement(component, props)));
        const option = (value, nombre, parent) => ({ value: String(value), label: nombre, registro: { nombre, estado: true, id_provincia: parent } });
        const html = render(CatalogosInlineForm, { fields, form: { values: { id_banco: '1' }, change() {} },
            catalogos: { id_banco: [option(1, 'Banco existente')] }, descriptors: [{ name: 'id_banco', label: 'Banco', api: {} }] });
        assert.ok(html.includes('Banco existente'));
        assert.ok(html.includes('Administrar banco'));
        assert.ok(html.includes('name="monto"'));
        assert.ok(!html.includes('name="banco"'));
        const geo = render(UbicacionForm, { fields: [{ name: 'id_provincia', label: 'Provincia' }, { name: 'id_ciudad', label: 'Ciudad' }],
            form: { values: { id_provincia: '1' }, change() {} }, catalogos: { id_provincia: [option(1, 'Provincia A')],
                id_ciudad: [option(1, 'Ciudad correcta', 1), option(2, 'Ciudad de otra provincia', 2)] } });
        assert.ok(geo.includes('Ciudad correcta'));
        assert.ok(!geo.includes('Ciudad de otra provincia'));
        console.log('Formularios: banco integrado y ciudades filtradas por provincia.');
    } finally { await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
