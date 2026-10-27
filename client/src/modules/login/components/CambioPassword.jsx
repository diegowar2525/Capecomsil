import { useCambioPassword } from '../hooks/useCambioPassword.js';

import { LimiteIntentos } from './LimiteIntentos.jsx';

export function CambioPassword({ onSuccess }) {
    const form = useCambioPassword(onSuccess);
    if (form.failure?.status === 429) return <LimiteIntentos segundos={form.failure.retryAfter} onRetry={form.clearError} />;
    const errorField = form.failure?.field;
    return <div className="lock-screen"><div className="lock-card">
        <div className="lock-password-intro">
            <h1>Actualizar contraseña</h1>
            <p>Debes cambiar tu contraseña temporal para ingresar. Después inicia sesión con la nueva.</p>
        </div>
        <form className="lock-form" onSubmit={form.submit} aria-busy={form.saving} noValidate>
            {[
                ['password_actual', 'Contraseña actual'], ['password_nueva', 'Nueva contraseña'], ['confirmacion', 'Confirmar nueva contraseña']
            ].map(([name, label]) => <div className="lock-field" key={name}>
                <label className="lock-label" htmlFor={name}>{label}</label>
                <input className="lock-input" id={name} name={name} type="password" required
                    minLength={name === 'password_actual' ? 1 : 10} maxLength={128}
                    autoComplete={name === 'password_actual' ? 'current-password' : 'new-password'}
                    aria-invalid={errorField === name || undefined}
                    aria-describedby={errorField === name ? `${name}-error` : undefined}
                    value={form.values[name]} onChange={form.change} disabled={form.saving} />
                {errorField === name && <p id={`${name}-error`} className="lock-field-error" role="alert">{form.error}</p>}
            </div>)}
            {form.error && !errorField && <p className="lock-field-error" role="alert">{form.error}</p>}
            <button className="lock-submit-btn" disabled={form.saving}>{form.saving ? 'Guardando…' : 'Cambiar contraseña'}</button>
        </form>
    </div></div>;
}
