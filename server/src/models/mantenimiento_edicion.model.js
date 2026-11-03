const pool = require('../config/database');

const update = async (client, id, data) => {
    const result = await client.query(`UPDATE mantenimiento SET id_vehiculo=$2,id_proveedor=$3,
        fecha_inicio=$4,fecha_fin=$5,tipo=$6,monto=$7,descripcion=$8,observacion=$9,clase=$10
        WHERE id_mantenimiento=$1 RETURNING *`, [id,data.id_vehiculo,data.id_proveedor,data.fecha_inicio,
        data.fecha_fin,data.tipo,data.monto,data.descripcion,data.observacion,data.clase]);
    return result.rows[0] ?? null;
};
const marcarPagoAutomatico = async (client,id) => {
    await client.query('UPDATE mantenimiento SET pago_directo_automatico=true WHERE id_mantenimiento=$1',[id]);
};
const recalcularCumplimientos = async (client,id) => {
    await client.query(`UPDATE cumplimiento_plan_mantenimiento c SET kilometraje_aplicado=kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio)
        FROM mantenimiento m WHERE c.id_mantenimiento=m.id_mantenimiento AND m.id_mantenimiento=$1`,[id]);
};
const registrarHistorial = async (client,id,actor,anterior,posterior) => {
    await client.query(`INSERT INTO mantenimiento_historial(id_mantenimiento,id_actor,version_anterior,version_nueva,anterior,posterior)
        VALUES($1,$2,$3,$4,$5,$6)`,[id,actor,anterior.version,posterior.version,anterior,posterior]);
};
const historial = async (id,client=pool) => {
    const result=await client.query(`SELECT h.*,u.nombre AS nombre_actor FROM mantenimiento_historial h
        JOIN usuario u ON u.id_usuario=h.id_actor WHERE id_mantenimiento=$1 ORDER BY id_historial DESC`,[id]);
    return result.rows;
};
module.exports={update,marcarPagoAutomatico,recalcularCumplimientos,registrarHistorial,historial};
