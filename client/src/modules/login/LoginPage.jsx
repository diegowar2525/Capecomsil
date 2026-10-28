import { useLogin } from './hooks/useLogin.js';
import { LimiteIntentos } from './components/LimiteIntentos.jsx';

export function LoginPage({ onLoginSuccess, message = '' }) {
    const form = useLogin(onLoginSuccess);
    const isLoading = form.saving;
    if (form.failure?.status === 429) return <LimiteIntentos segundos={form.failure.retryAfter} onRetry={form.clearError} />;
    const invalidCredentials = form.failure?.code === 'INVALID_CREDENTIALS';
    const userError = form.failure?.field === 'nombre_usuario' ? form.error : '';
    const passwordError = form.failure?.field === 'password' ? form.error : '';
    return (
        <div className="lock-screen">
            <div className="lock-card">
                {message && <p role="status">{message}</p>}
                <div className="lock-card-top-bar" />

                {/* Logo e Identidad CAPECOMSIL S.A. */}
                <div className="lock-brand">
                    <div className="lock-logo-badge" aria-hidden="true">
                        <svg
                            className="lock-logo-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                        </svg>
                    </div>

                    <h1 className="lock-company-name">
                        CAPECOMSIL <span className="lock-company-suffix">S.A.</span>
                    </h1>
                    <p className="lock-subtitle">
                        Sistema de Gestión y Transporte de Combustible
                    </p>

                    <span className="lock-status-pill">
                        Acceso Bloqueado
                    </span>
                </div>

                {/* Formulario de Desbloqueo / Login */}
                <form className="lock-form" onSubmit={form.submit} aria-busy={isLoading} noValidate>
                    <div className="lock-field">
                        <label htmlFor="usuario" className="lock-label">
                            Nombre de usuario
                        </label>
                        <input
                            id="usuario"
                            name="nombre_usuario" autoComplete="username"
                            type="text"
                            className="lock-input"
                            placeholder="Ingrese su usuario"
                            value={form.values.nombre_usuario}
                            onChange={form.change}
                            disabled={isLoading}
                            aria-invalid={Boolean(userError || invalidCredentials) || undefined}
                            aria-describedby={userError ? 'usuario-error' : invalidCredentials ? 'password-error' : undefined}
                            required
                        />
                        {userError && <p id="usuario-error" className="lock-field-error" role="alert">{userError}</p>}
                    </div>

                    <div className="lock-field">
                        <label htmlFor="password" className="lock-label">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password" autoComplete="current-password"
                            className="lock-input"
                            placeholder="••••••••"
                            value={form.values.password}
                            onChange={form.change}
                            disabled={isLoading}
                            aria-invalid={Boolean(passwordError) || undefined}
                            aria-describedby={passwordError ? 'password-error' : undefined}
                            required
                        />
                        {passwordError && <p id="password-error" className="lock-field-error" role="alert">{passwordError}</p>}
                    </div>

                    {form.error && !userError && !passwordError && <p className="lock-field-error" role="alert">{form.error}</p>}
                    <button
                        type="submit"
                        className="lock-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verificando acceso...' : 'Desbloquear'}
                    </button>
                </form>

                {/* Visualizador de Carga Sencillo */}
                {isLoading && (
                    <div className="lock-loader-box" role="status" aria-live="polite">
                        <div className="lock-loader-row">
                            <span className="lock-spinner" />
                            <span>Validando credenciales y cargando módulos...</span>
                        </div>
                        <div className="lock-progress-track">
                            <div className="lock-progress-bar" />
                        </div>
                    </div>
                )}

                <footer className="lock-footer">
                    CAPECOMSIL S.A. · Panel Administrativo y Operativo
                </footer>
            </div>
        </div>
    );
}

export default LoginPage;
