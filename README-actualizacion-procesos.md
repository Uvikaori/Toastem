# Actualización de Procesos en Toastem

## Cambios realizados en los procesos

Hemos realizado una actualización en el sistema para garantizar que todos los procesos del beneficio del café sigan una estructura coherente:

1. **Campos obligatorios** en todos los procesos:
   - Fechas de inicio/fin de cada proceso
   - Pesos (inicial/final) en cada proceso 
   - Métodos específicos de cada proceso

2. **Campos opcionales**:
   - Observaciones
   - Información adicional específica de cada proceso

3. **Actualización específica del proceso de secado**:
   - Nuevos métodos de secado:
     - Secado al sol
     - Secado mecánico
     - Secado por vía húmeda (con cereza)

## Detalle de los campos del proceso de secado

### Campos obligatorios (NOT NULL)
- **fecha_inicio**: Fecha y hora en que se inicia el proceso de secado
- **metodo_secado**: Uno de los tres métodos permitidos (Secado al sol, Secado mecánico, Secado por vía húmeda)
- **peso_inicial**: Peso del café al inicio del secado (proviene del proceso anterior)

### Campos para finalización (obligatorios al finalizar)
- **fecha_fin**: Fecha y hora en que termina el proceso de secado
- **peso_final**: Peso del café después del secado

### Campos opcionales
- **humedad_inicial**: Humedad del grano al iniciar el secado (%)
- **observaciones**: Comentarios adicionales
- **decision_venta**: Indicador de decisión de venta (true/false)
- **fecha_decision**: Fecha en que se tomó la decisión de venta

## Pasos para implementar los cambios

### 1. Actualizar la base de datos

Ejecute el siguiente script SQL para actualizar las tablas:

```sql
-- scripts/actualizar_tablas_procesos.sql
```

Este script actualizará todas las tablas de procesos para:
- Establecer como NOT NULL los campos obligatorios (fechas, pesos, métodos)
- Actualizar la estructura del campo `metodo_secado` en la tabla `secado`
- Migrar los datos existentes de secado a los nuevos valores (`Sol` → `Secado al sol`)

### 2. Reiniciar el sistema

Una vez actualizadas las tablas, reinicie el sistema:

```bash
# Detener el servidor actual
npm stop

# Iniciar el servidor nuevamente
npm start
```

### 3. Verificar los cambios

Inicie sesión en el sistema y verifique que:
- El formulario de secado muestre las nuevas opciones
- La validación de campos obligatorios funcione correctamente
- Los procesos existentes se visualicen correctamente con los nuevos valores

## Nota importante

Esta actualización garantiza que todos los procesos de beneficio del café:

1. Sigan una secuencia lógica y cronológica
2. Registren siempre la información esencial (fechas, pesos, métodos)
3. Permitan mantener la trazabilidad del producto a lo largo de toda la cadena 