import {
    MapPin, Map, Tags, Truck, ContactRound, Fuel, Warehouse, Droplets,
    Handshake, Route, Shapes, Package, Calculator, ClipboardCheck, Wrench,
    CalendarCheck, Receipt, Wallet, FileText, CreditCard, Banknote, Settings2,
    SlidersHorizontal, Gauge, Utensils, CircleDollarSign, CalendarDays,
    PackageCheck, Boxes, ChartNoAxesCombined, ChevronRight
} from 'lucide-react';

const icons = {
    '/resumen': ChartNoAxesCombined, '/consulta-viajes': Route, '/consulta-viaticos': Utensils, '/consulta-combustible': Gauge,
    '/ciudades': MapPin, '/provincias': Map, '/tipos-gasto': Tags,
    '/vehiculos': Truck, '/choferes': ContactRound, '/gasolineras': Fuel,
    '/terminales': Warehouse, '/productos': Droplets, '/proveedores': Handshake,
    '/trayectos': Route, '/categorias-producto': Shapes, '/productos-inventario': Package,
    '/viajes': Route, '/costos-viaje': Calculator, '/liquidaciones': ClipboardCheck,
    '/mantenimiento': Wrench, '/planes-mantenimiento': CalendarCheck,
    '/abastecimientos-combustible': Fuel, '/facturacion': Receipt, '/pagos': Wallet,
    '/facturas-proveedores': FileText, '/pagos-proveedores': CreditCard,
    '/gastos': Banknote, '/remuneraciones-chofer': CircleDollarSign,
    '/tarifas': Calculator, '/tarifas-capacidad': Gauge, '/modalidades-tarifa': SlidersHorizontal,
    '/configuraciones-viatico': Utensils, '/configuraciones-remuneracion': CircleDollarSign,
    '/configuraciones-combustible': Settings2, '/configuraciones-peaje-trayecto': Receipt,
    '/feriados': CalendarDays, '/recepciones-compra': PackageCheck,
    '/inventario': Boxes, '/informes': ChartNoAxesCombined
};

export function SidebarIcon({ path }) {
    const Icon = icons[path] ?? ChevronRight;
    return <Icon className="sidebar-link-icon" size={19} strokeWidth={1.8} aria-hidden="true" />;
}
