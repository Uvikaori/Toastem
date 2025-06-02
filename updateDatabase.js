const db = require('./config/database');

async function updateDb() {
    try {
        console.log('Iniciando actualización de la base de datos...');
        
        // Verificar si la columna tipo_cafe ya existe
        const [checkColumn] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'molienda' 
            AND COLUMN_NAME = 'tipo_cafe'
        `);
        
        if (checkColumn.length === 0) {
            console.log('Añadiendo columna tipo_cafe...');
            await db.query(`
                ALTER TABLE molienda 
                ADD COLUMN tipo_cafe ENUM('Pergamino', 'Pasilla') DEFAULT NULL 
                AFTER id_tueste
            `);
            console.log('Columna tipo_cafe añadida correctamente.');
        } else {
            console.log('La columna tipo_cafe ya existe.');
        }
        
        // Modificar la columna tipo_molienda
        console.log('Modificando columna tipo_molienda...');
        await db.query(`
            ALTER TABLE molienda 
            MODIFY COLUMN tipo_molienda ENUM('Granulado','Fino') NOT NULL
        `);
        console.log('Columna tipo_molienda modificada correctamente.');
        
        console.log('Base de datos actualizada correctamente.');
    } catch (error) {
        console.error('Error al actualizar la base de datos:', error);
    } finally {
        process.exit();
    }
}

updateDb(); 