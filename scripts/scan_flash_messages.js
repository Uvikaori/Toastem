/**
 * Script para escanear el código en busca de flash messages y generar un informe
 * Este script ayudará en la migración del sistema de flash messages al sistema basado en sesiones
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Patrones a buscar
const PATTERNS = [
    { regex: /req\.flash\(['"]error['"],/g, type: 'error_set' },
    { regex: /req\.flash\(['"]mensaje['"],/g, type: 'mensaje_set' },
    { regex: /req\.flash\(['"]exito['"],/g, type: 'exito_set' },
    { regex: /req\.flash\(['"]error['"]\)/g, type: 'error_get' },
    { regex: /req\.flash\(['"]mensaje['"]\)/g, type: 'mensaje_get' },
    { regex: /req\.flash\(['"]exito['"]\)/g, type: 'exito_get' }
];

// Directorios a escanear
const DIRS_TO_SCAN = [
    'controllers',
    'routes',
    'views',
    'middlewares'
];

// Extensiones de archivo a escanear
const FILE_EXTENSIONS = ['.js', '.ejs'];

// Función para escanear archivos recursivamente
async function scanDirectory(dir, results = {}) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            await scanDirectory(fullPath, results);
        } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
            await scanFile(fullPath, results);
        }
    }
    
    return results;
}

// Función para escanear un archivo
async function scanFile(filePath, results) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    let lineNumber = 0;
    
    for await (const line of rl) {
        lineNumber++;
        
        for (const pattern of PATTERNS) {
            const matches = line.match(pattern.regex);
            
            if (matches) {
                if (!results[filePath]) {
                    results[filePath] = [];
                }
                
                results[filePath].push({
                    lineNumber,
                    type: pattern.type,
                    line: line.trim()
                });
            }
        }
    }
}

// Función principal
async function main() {
    console.log('Escaneando código en busca de flash messages...');
    
    const results = {};
    
    for (const dir of DIRS_TO_SCAN) {
        try {
            if (fs.existsSync(dir)) {
                await scanDirectory(dir, results);
            }
        } catch (error) {
            console.error(`Error al escanear directorio ${dir}:`, error);
        }
    }
    
    // Analizar resultados
    const totalFiles = Object.keys(results).length;
    let totalOccurrences = 0;
    let errorSetCount = 0;
    let mensajeSetCount = 0;
    let exitoSetCount = 0;
    let errorGetCount = 0;
    let mensajeGetCount = 0;
    let exitoGetCount = 0;
    
    Object.values(results).forEach(fileResults => {
        totalOccurrences += fileResults.length;
        
        fileResults.forEach(result => {
            switch (result.type) {
                case 'error_set': errorSetCount++; break;
                case 'mensaje_set': mensajeSetCount++; break;
                case 'exito_set': exitoSetCount++; break;
                case 'error_get': errorGetCount++; break;
                case 'mensaje_get': mensajeGetCount++; break;
                case 'exito_get': exitoGetCount++; break;
            }
        });
    });
    
    // Generar informe
    const report = {
        summary: {
            totalFiles,
            totalOccurrences,
            breakdown: {
                errorSet: errorSetCount,
                mensajeSet: mensajeSetCount,
                exitoSet: exitoSetCount,
                errorGet: errorGetCount,
                mensajeGet: mensajeGetCount,
                exitoGet: exitoGetCount
            }
        },
        details: results
    };
    
    // Guardar informe
    fs.writeFileSync(
        'informe_flash_messages.json',
        JSON.stringify(report, null, 2)
    );
    
    // Imprimir resumen
    console.log('\nResumen del escaneo:');
    console.log(`- Archivos escaneados: ${totalFiles}`);
    console.log(`- Ocurrencias totales: ${totalOccurrences}`);
    console.log('\nDesglose por tipo:');
    console.log(`- req.flash('error', ...) (establecer): ${errorSetCount}`);
    console.log(`- req.flash('mensaje', ...) (establecer): ${mensajeSetCount}`);
    console.log(`- req.flash('exito', ...) (establecer): ${exitoSetCount}`);
    console.log(`- req.flash('error') (obtener): ${errorGetCount}`);
    console.log(`- req.flash('mensaje') (obtener): ${mensajeGetCount}`);
    console.log(`- req.flash('exito') (obtener): ${exitoGetCount}`);
    
    console.log('\nSe ha generado un informe detallado en "informe_flash_messages.json"');
    console.log('Para iniciar la migración, consulta el archivo "scripts/migracion_flash_a_sesion.md"');
}

main().catch(console.error); 