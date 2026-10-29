export function FormItemCard({ title, actions, children }) {
    return <div className="form-item-card">
        <div className="form-item-header"><span>{title}</span>{actions}</div>
        {children}
    </div>;
}
