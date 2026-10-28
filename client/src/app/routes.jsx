import { TiposGastoPage } from '../modules/tipos-gasto/TiposGastoPage.jsx';
import { PerfilPage } from '../modules/perfil/PerfilPage.jsx';
import { TarifasCapacidadPage } from '../modules/tarifas-capacidad/TarifasCapacidadPage.jsx';
import { ModalidadesTarifaPage } from '../modules/modalidades-tarifa/ModalidadesTarifaPage.jsx';
import { InformesPage } from '../modules/informes/InformesPage.jsx';
import { InventarioPage } from '../modules/inventario/InventarioPage.jsx';
import { RecepcionesCompraPage } from '../modules/recepciones-compra/RecepcionesCompraPage.jsx';
import { RemuneracionesPage } from '../modules/remuneraciones-chofer/RemuneracionesPage.jsx';
import { AbastecimientosPage } from '../modules/abastecimientos-combustible/AbastecimientosPage.jsx';
import { PlanesMantenimientoPage } from '../modules/planes-mantenimiento/PlanesMantenimientoPage.jsx';
import { FeriadosPage } from '../modules/feriados/FeriadosPage.jsx';
import { ConfiguracionesPeajePage } from '../modules/configuraciones-peaje-trayecto/ConfiguracionesPeajePage.jsx';
import { ConfiguracionesCombustiblePage } from '../modules/configuraciones-combustible/ConfiguracionesCombustiblePage.jsx';
import { ConfiguracionesRemuneracionPage } from '../modules/configuraciones-remuneracion/ConfiguracionesRemuneracionPage.jsx';
import { ConfiguracionesViaticoPage } from '../modules/configuraciones-viatico/ConfiguracionesViaticoPage.jsx';
import { ProductosInventarioPage } from '../modules/productos-inventario/ProductosInventarioPage.jsx';
import { CategoriasProductoPage } from '../modules/categorias-producto/CategoriasProductoPage.jsx';
import { TrayectosPage } from '../modules/trayectos/TrayectosPage.jsx';
import { TarifasPage } from '../modules/tarifas/TarifasPage.jsx';
import { Dashboard } from '../modules/dashboard/DashboardPage.jsx';
import { Viajes } from '../modules/viajes/ViajesPage.jsx';
import { CostosViajePage } from '../modules/costos-viaje/CostosViajePage.jsx';
import { LiquidacionesPage } from '../modules/liquidaciones/LiquidacionesPage.jsx';
import { FacturacionPage } from '../modules/facturacion/FacturacionPage.jsx';
import { PagosPage } from '../modules/pagos/PagosPage.jsx';
import { FacturasProveedoresPage } from '../modules/facturas-proveedores/FacturasProveedoresPage.jsx';
import { PagosProveedoresPage } from '../modules/pagos-proveedores/PagosProveedoresPage.jsx';
import { GastosPage } from '../modules/gastos/GastosPage.jsx';
import { MantenimientoPage } from '../modules/mantenimiento/MantenimientoPage.jsx';
import { VehiculosPage } from '../modules/vehiculos/VehiculosPage.jsx';
import { ChoferesPage } from '../modules/choferes/ChoferesPage.jsx';
import { GasolinerasPage } from '../modules/gasolineras/GasolinerasPage.jsx';
import { TerminalesPage } from '../modules/terminales/TerminalesPage.jsx';
import { ProductosPage } from '../modules/productos/ProductosPage.jsx';
import { ProveedoresPage } from '../modules/proveedores/ProveedoresPage.jsx';

export const routes = [
    {path:'/tipos-gasto',label:'Tipos de gasto',section:'Catálogos',Component:TiposGastoPage},
    { path: '/perfil', label: 'Mi perfil', Component: PerfilPage },
    { path: '/dashboard', label: "Dashboard", Component: Dashboard },
    { path: '/viajes', label: "Viajes", section: "Operaciones", Component: Viajes },
    { path: '/costos-viaje', label: "Costos de Viaje", section: "Operaciones", Component: CostosViajePage },
    { path: '/liquidaciones', label: "Liquidaciones", section: "Operaciones", Component: LiquidacionesPage },
    { path: '/mantenimiento', label: "Mantenimiento", section: "Operaciones", Component: MantenimientoPage },
    { path: '/facturacion', label: "Facturación Clientes", section: "Finanzas y Facturación", Component: FacturacionPage },
    { path: '/pagos', label: "Cobros a clientes", section: "Finanzas y Facturación", Component: PagosPage },
    { path: '/facturas-proveedores', label: "Facturas Proveedores", section: "Finanzas y Facturación", Component: FacturasProveedoresPage },
    { path: '/pagos-proveedores', label: "Pagos Proveedores", section: "Finanzas y Facturación", Component: PagosProveedoresPage },
    { path: '/gastos', label: "Gastos Operativos", section: "Finanzas y Facturación", Component: GastosPage },
    { path: '/vehiculos', label: "Vehículos / Tanqueros", section: "Catálogos", Component: VehiculosPage },
    { path: '/choferes', label: "Choferes", section: "Catálogos", Component: ChoferesPage },
    { path: '/gasolineras', label: "Gasolineras / Clientes", section: "Catálogos", Component: GasolinerasPage },
    { path: '/terminales', label: "Terminales de Carga", section: "Catálogos", Component: TerminalesPage },
    { path: '/productos', label: "Productos transportados", section: "Catálogos", Component: ProductosPage },
    { path: '/proveedores', label: "Proveedores", section: "Catálogos", Component: ProveedoresPage },
    { path: '/tarifas', label: 'Tarifas por terminal', section: 'Configuración', Component: TarifasPage },
    { path: '/tarifas-capacidad', label: 'Tarifas por capacidad', section: 'Configuración', Component: TarifasCapacidadPage },
    { path: '/modalidades-tarifa', label: 'Modalidades de tarifa', section: 'Configuración', Component: ModalidadesTarifaPage },
    { path: '/trayectos', label: 'Trayectos', section: 'Catálogos', Component: TrayectosPage },
    { path: '/categorias-producto', label: 'Categorías de productos', section: 'Catálogos', Component: CategoriasProductoPage },
    { path: '/productos-inventario', label: 'Productos de inventario', section: 'Catálogos', Component: ProductosInventarioPage },
    { path: '/configuraciones-viatico', label: 'Viáticos', section: 'Configuración', Component: ConfiguracionesViaticoPage },
    { path: '/configuraciones-remuneracion', label: 'Configuración de remuneración', section: 'Configuración', Component: ConfiguracionesRemuneracionPage },
    { path: '/configuraciones-combustible', label: 'Configuración de combustible', section: 'Configuración', Component: ConfiguracionesCombustiblePage },
    { path: '/configuraciones-peaje-trayecto', label: 'Peajes por trayecto', section: 'Configuración', Component: ConfiguracionesPeajePage },
    { path: '/feriados', label: 'Feriados', section: 'Configuración', Component: FeriadosPage },
    { path: '/planes-mantenimiento', label: 'Planes de mantenimiento', section: 'Operaciones', Component: PlanesMantenimientoPage },
    { path: '/abastecimientos-combustible', label: 'Abastecimientos de combustible', section: 'Operaciones', Component: AbastecimientosPage },
    { path: '/remuneraciones-chofer', label: 'Remuneraciones de choferes', section: 'Finanzas y Facturación', Component: RemuneracionesPage },
    { path: '/recepciones-compra', label: 'Recepciones de compra', section: 'Inventario', Component: RecepcionesCompraPage },
    { path: '/inventario', label: 'Inventario', section: 'Inventario', Component: InventarioPage },
    { path: '/informes', label: 'Informes', section: 'Informes', Component: InformesPage },
];
