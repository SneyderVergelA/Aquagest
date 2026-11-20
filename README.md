# AquaGest

Sistema AquaGest. Este repositorio contiene el backend y la aplicación web y móvil(android)  del proyecto.

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalados:

- Node.js
- XAMPP 




## 1. Instalar dependencias

El proyecto está dividido en dos carpetas principales:

- `backend`
- `aquagest`

**IMPORTANTE:** Es necesario ejecutar `npm install` dentro de cada carpeta para instalar las dependencias y generar la carpeta `node_modules`, Si vas a ejecutar la aplicación en un dispositivo móvil, asegúrate de que el celular y la computadora donde se está ejecutando el backend estén conectados a la misma red Wi-Fi.

### Instalar dependencias del backend

Abre una terminal y ejecuta:

```bash
cd backend
npm install
```

### Instalar dependencias de AquaGest

Abre otra terminal o regresa a la carpeta principal y ejecuta:

```bash
cd aquagest
npm install
```

Esto generará automáticamente la carpeta `node_modules` en cada proyecto.

## 2. Configurar la base de datos

El proyecto incluye una base de datos llamada `mysql`.

Para configurarla, sigue estos pasos:

1. Abre XAMPP e inicia el servicio MySQL, o abre MySQL Workbench.
2. Ingresa a phpMyAdmin o a MySQL Workbench.
3. Importa el archivo de la base de datos llamado `mysql`.
4. Verifica que la base de datos se haya creado correctamente.
5. Comprueba que las credenciales de conexión del backend coincidan con las de tu servidor MySQL.

**Nota:** Si utilizas XAMPP, asegúrate de que MySQL esté iniciado antes de ejecutar el backend.

## 3. Ejecutar el backend

Abre una terminal y ejecuta los siguientes comandos:

```bash
cd backend
npm run dev
```

El backend se iniciará en modo desarrollo.

Mantén esta terminal abierta mientras utilizas la aplicación.

## 4. Ejecutar AquaGest

Abre una segunda terminal y ejecuta:

```bash
cd aquagest
npx expo start -c
```

Este comando iniciará Expo y limpiará la caché del proyecto.

Desde allí podrás ejecutar la aplicación utilizando el navegador o un dispositivo móvil compatible.

## 5. Orden recomendado de ejecución

Para que el proyecto funcione correctamente, sigue este orden:

1. Iniciar MySQL desde XAMPP o MySQL Workbench.
2. Ejecutar el backend con `npm run dev`.
3. Ejecutar AquaGest con `npx expo start -c`.



---

**Proyecto: AquaGest**