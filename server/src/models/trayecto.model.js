const findByIdForShare = async (client, id) => {
    return (await client.query("SELECT * FROM trayecto WHERE id_trayecto=$1 FOR SHARE", [id])).rows[0];
};

module.exports = { findByIdForShare };
