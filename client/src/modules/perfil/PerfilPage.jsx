import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { usePerfil } from './hooks/usePerfil.js';
import { PerfilFicha } from './components/PerfilFicha.jsx';
import { fields } from './perfil.fields.js';
import { prepararPerfil } from './domain/perfil.js';
import { consultarPerfil } from './services/perfil.api.js';
import { fotoPerfilApi } from '../../services/fotos.api.js';
import { PerfilFormulario } from './components/PerfilFormulario.jsx';

const definition = {
    mode: 'single', rowKey: 'id_usuario', Card: PerfilFicha,
    page: { title: 'Mi perfil', subtitle: 'Tus datos personales y tu foto de perfil', actionLabel: 'Editar perfil' },
    fields, prepare: prepararPerfil, foto: fotoPerfilApi, fotoVariant: 'perfil',
    renderForm: props => <PerfilFormulario {...props} />, modalClassName: 'perfil-modal', editInCard: true,
    api: { consultar: (_id, signal) => consultarPerfil(signal) },
    canEdit: (usuario) => !usuario.requiere_cambio_password
};

export function PerfilPage() {
    const { usuario, loading, error, recargar, guardar, actualizarRegistro } = usePerfil();
    const controller = { registro: usuario, loading, error, recargar, actualizarRegistro, guardar: (_id, data) => guardar(data) };
    return <CatalogoConectado definition={definition} controller={controller} />;
}
