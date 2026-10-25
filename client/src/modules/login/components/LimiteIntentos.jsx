import { useEffect, useState } from 'react';

export function LimiteIntentos({ segundos = 900, onRetry }) {
    const [deadline] = useState(() => Date.now() + segundos * 1000);
    const [remaining, setRemaining] = useState(segundos);
    useEffect(() => {
        const timer = setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 1000);
        return () => clearInterval(timer);
    }, [deadline]);
    return <div className="lock-screen"><div className="lock-card">
        <div className="lock-password-intro">
            <h1>Límite de intentos alcanzado</h1>
            <p>Se ha pausado temporalmente esta operación por demasiados intentos.</p>
        </div>
        <p className="lock-limit-countdown" aria-label="Tiempo restante">
            {Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}
        </p>
        <p role="status">{remaining > 0 ? 'Espera a que termine el contador para volver a intentar.' : 'Ya puedes volver al formulario e intentarlo de nuevo.'}</p>
        <button type="button" className="lock-submit-btn" disabled={remaining > 0} onClick={onRetry}>Volver a intentar</button>
    </div></div>;
}
