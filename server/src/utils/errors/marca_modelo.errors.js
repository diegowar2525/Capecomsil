const translateMarcaModeloError = error => {
    if (['uq_marca_ambito_nombre','uq_modelo_marca_nombre'].includes(error.constraint)) return {status:409,message:'Ya existe una marca o modelo con ese nombre. Selecciónalo en la lista.'};
    if (error.constraint === 'marca_modelo_referencia') return {status:409,message:error.message};
    if (['modelo_id_marca_fkey','vehiculo_id_marca_fkey','vehiculo_id_modelo_fkey','producto_id_marca_fkey','producto_id_modelo_fkey','vehiculo_modelo_marca_fk','producto_modelo_marca_fk'].includes(error.constraint)) return {status:409,message:'La referencia no existe o el registro está en uso. Si está en uso, desactívalo en lugar de eliminarlo.'};
    if (['vehiculo_modelo_requiere_marca','producto_modelo_requiere_marca'].includes(error.constraint)) return {status:400,message:'Selecciona la marca del modelo.'};
    return null;
};
module.exports = {translateMarcaModeloError};
