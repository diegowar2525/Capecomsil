const groups = {
    catalogos: ['vehiculos', 'choferes', 'gasolineras', 'terminales', 'productos', 'proveedores', 'trayectos', 'categorias-producto', 'productos-inventario'],
    tarifas: ['tarifas', 'tarifas-capacidad', 'modalidades-tarifa'],
    configuraciones: ['configuraciones-viatico', 'configuraciones-remuneracion', 'configuraciones-combustible', 'configuraciones-peaje-trayecto', 'feriados'],
    viajes: ['viajes', 'costos-viaje'], inventario: ['inventario'], informes: ['informes'],
    recepciones: ['recepciones-compra'], liquidaciones: ['liquidaciones'], mantenimientos: ['mantenimiento'],
    compras: ['facturas-proveedores'], pagos_proveedor: ['pagos-proveedores'], gastos: ['gastos'],
    planes_mantenimiento: ['planes-mantenimiento'], abastecimientos: ['abastecimientos-combustible'],
    remuneraciones: ['remuneraciones-chofer']
};
export const routePermissions = Object.fromEntries(Object.entries(groups).flatMap(([resource, paths]) =>
    paths.map(path => [`/${path}`, `${resource}.consultar`])));
export const puedeVerRuta = (route, permisos) => !routePermissions[route.path] || permisos.includes(routePermissions[route.path]);
