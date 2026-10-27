import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { LoginPage } from '../LoginPage.jsx';
import { CambioPassword } from './CambioPassword.jsx';

export function SesionGate({ children }) {
    const { usuario, loading, error, recargar, establecerSesion } = useAuth();
    const [message, setMessage] = useState('');
    if (loading || error) return <div className="lock-screen"><div className="lock-card">
        <h1 className="lock-company-name">CAPECOMSIL S.A.</h1>
        {loading ? <p role="status">Comprobando sesión…</p> : <>
            <p role="alert">{error}</p>
            <button className="lock-submit-btn" onClick={recargar}>Reintentar</button>
        </>}
    </div></div>;
    if (!usuario) return <LoginPage message={message} onLoginSuccess={() => { setMessage(''); recargar(); }} />;
    if (usuario.requiere_cambio_password) return <CambioPassword onSuccess={() => {
        setMessage('Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.');
        establecerSesion(null);
    }} />;
    return children;
}
