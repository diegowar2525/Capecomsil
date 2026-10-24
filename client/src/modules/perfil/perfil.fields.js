export const fields = [
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 150, autoComplete: 'name' },
    { name: 'correo', label: 'Correo electrónico', type: 'email', maxLength: 254, autoComplete: 'email' },
    { name: 'imagen_url', label: 'URL de la foto de perfil', type: 'url', maxLength: 2048 }
];
