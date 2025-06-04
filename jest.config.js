module.exports = {
  // Directorio raíz donde Jest buscará los archivos
  rootDir: '.',

  // Archivos de prueba a incluir
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],

  // Archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/config/',
    '/public/'
  ],

  // Archivo de configuración global
  setupFilesAfterEnv: ['./jest.setup.js'],

  // Ambiente de pruebas
  testEnvironment: 'node',

  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/setup/'
  ],

  // Mostrar un resumen detallado después de las pruebas
  verbose: true,

  // Tiempo máximo de ejecución para cada prueba
  testTimeout: 10000
}; 