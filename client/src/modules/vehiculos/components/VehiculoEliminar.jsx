export function VehiculoEliminar({ vehiculo }) {
    return <p>¿Eliminar el vehículo <strong>{vehiculo.placa}</strong>? El servidor impedirá eliminarlo si tiene registros asociados.</p>;
}
