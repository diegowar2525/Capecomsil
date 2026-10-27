import { listarPaginas } from '../../../services/consultas.api.js';
export async function consultarDashboard({ viajes, liquidaciones }, signal) {
 const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
 const fecha_desde = `${today.slice(0,7)}-01`;
 const [trips, drafts] = await Promise.all([
  viajes ? listarPaginas('/api/viajes', { fecha_desde, fecha_hasta: today, estado:'REGISTRADO' }, signal) : [],
  liquidaciones ? listarPaginas('/api/liquidaciones', { estado:'BORRADOR' }, signal) : []
 ]);
 return { stats: { viajesRegistrados: viajes ? trips.length : null, volumenTotal: viajes ? trips.reduce((total,row)=>total+Number(row.total_galones),0).toLocaleString('es-EC',{maximumFractionDigits:2}) : null, liquidacionesBorrador: liquidaciones ? drafts.length : null }, recentTrips: trips.slice(0,10) };
}
