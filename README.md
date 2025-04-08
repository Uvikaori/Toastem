# Toastem - Sistema de Gestión de Café

## Requisitos Previos
- Node.js (versión 14 o superior)
- MySQL (XAMPP)
- npm (Node Package Manager)

## Configuración Inicial

### 1. Configuración de la Base de Datos
1. Iniciar XAMPP y asegurarsee de que Apache y MySQL estén en ejecución
2. Abrir phpMyAdmin (http://localhost/phpmyadmin)
3. Crear una nueva base de datos llamada `toastem_db`
4. Importar el archivo `toastem_db.sql` en la base de datos creada

### 2. Configuración del Proyecto
1. Clonar el repositorio o descargar los archivos del proyecto
2. Abrir una terminal en la carpeta raíz del proyecto
3. Instalar las dependencias:
```bash
npm install
```

### 3. Configuración del Archivo .env
Asegurarse de que el archivo `.env` tenga la siguiente configuración:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mysql
DB_NAME=toastem_db
PORT=3000
SESSION_SECRET=toastemSecretKey
NODE_ENV=development
```

## Iniciar la Aplicación

### Modo Desarrollo
Para iniciar la aplicación en modo desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en: http://localhost:3000

### Modo Producción
Para iniciar la aplicación en modo producción:
```bash
npm start
```

## Estructura del Proyecto
```
toastem/
├── config/             # Configuraciones
├── controllers/        # Controladores
├── middleware/         # Middleware
├── models/            # Modelos
├── public/            # Archivos estáticos
│   ├── css/          # Estilos CSS
│   ├── js/           # Scripts JavaScript
│   └── data/         # Datos estáticos
│       ├── images/   # Imágenes del sistema
│       ├── documents/# Documentos PDF y otros
│       └── uploads/  # Archivos subidos por usuarios
├── routes/            # Rutas
├── views/             # Vistas EJS
├── .env              # Variables de entorno
├── app.js            # Archivo principal
└── package.json      # Dependencias y scripts
```

## Características Principales
- Gestión de usuarios
- Gestión de lotes y despulpado
- Control de fermentación y lavado
- Seguimiento del proceso de secado
- Clasificación y trilla
- Proceso de tueste y molienda
- Informes y precios

## Solución de Problemas Comunes

### Error de Conexión a la Base de Datos
1. Verificar que XAMPP esté en ejecución
2. Confirmar que las credenciales en el archivo `.env` sean correctas
3. Asegyrase de que la base de datos `toastem_db` existe

### Error al Iniciar la Aplicación
1. Verificar que todas las dependencias estén instaladas:
```bash
npm install
```
2. Asegurarse de que el puerto 3000 no esté en uso
3. Verifica que Node.js esté instalado correctamente:
```bash
node --version
```

## Soporte
Para reportar problemas o solicitar ayuda, por favor crea un issue en el repositorio del proyecto. 