import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { consultarDashboard } from '../services/dashboard.api.js';
export function useDashboard() {
 const { permisos } = useAuth();
 const viajes = permisos.includes('viajes.consultar');
 const liquidaciones = permisos.includes('liquidaciones.consultar');
 const [state,setState] = useState({ stats:{},recentTrips:[],loading:true,error:'' });
 useEffect(()=>{
  const abort = new AbortController();
  consultarDashboard({ viajes, liquidaciones },abort.signal).then(data=>{if(!abort.signal.aborted)setState({...data,loading:false,error:''});}).catch(error=>{if(!abort.signal.aborted)setState({stats:{},recentTrips:[],loading:false,error:error.message});});
  return ()=>abort.abort();
 },[viajes,liquidaciones]);
 return state;
}
