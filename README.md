# Gestor de Tareas

Aplicación web SPA para que los empleados de una pequeña empresa gestionen sus tareas diarias de forma organizada, persistente y accesible desde cualquier dispositivo.

**🔗 Producción:** https://gestor-de-tareas-sooty.vercel.app

> **Nota — resumen por email**
>
> La cuenta de AWS SES está en **modo sandbox** (lo habitual en cuentas nuevas): solo puede enviar correos a direcciones verificadas, y salir del sandbox exige un dominio propio. Para que el envío funcione con **cualquier cuenta**, la app verifica automáticamente el correo de cada usuario:
>
> 1. Al entrar por primera vez a **Mis tareas**, aparece un aviso y llega al correo un mensaje de **Amazon Web Services** (en inglés, _"Email Address Verification Request"_). Revisar también spam.
> 2. Abrir el enlace de ese correo para confirmar.
> 3. Volver a la app y presionar **"Ya confirmé"**: el botón **"Enviarme resumen por email"** queda habilitado y el resumen llega al correo.

---

## Funcionalidades

- **Autenticación:** registro e inicio de sesión con correo y contraseña o con Google, cierre de sesión y mensajes de error claros en español.
- **Rutas protegidas:** sin sesión no se puede acceder a `/tasks`; con sesión no se muestran login ni registro.
- **CRUD de tareas:** crear (título + descripción), listar, editar, eliminar (con confirmación) y marcar como completada.
- **Persistencia por usuario:** las tareas se guardan en Cloud Firestore y cada usuario solo ve las suyas.
- **Actualización en tiempo real:** la lista se actualiza sola después de cada operación.
- **Resumen por email:** un botón envía al correo del usuario el estado de todas sus tareas mediante AWS SES.
- **Verificación automática del correo:** la primera vez que el usuario entra, se le envía la verificación de SES y un aviso le indica qué hacer (con opción de reenviar).
- **Estados de carga y errores** en formularios, lista y envío de email.
- **Diseño responsive** con enfoque mobile first, **modo claro/oscuro** (recuerda la elección del usuario), animaciones suaves (respetando "reducir movimiento") y barra de progreso.

## Stack

| Capa          | Tecnología                                 |
| ------------- | ------------------------------------------ |
| Frontend      | React 19 + TypeScript + Vite               |
| Enrutamiento  | React Router                               |
| Autenticación | Firebase Authentication                    |
| Base de datos | Cloud Firestore                            |
| Email         | AWS SES (SDK v2) desde una Vercel Function |
| Deploy        | Vercel                                     |
| Testing       | Vitest + React Testing Library             |

## Estructura del proyecto

```
├─ api/                       # Vercel Functions (servidor)
│  ├─ send-summary.ts         # POST /api/send-summary → envía el resumen con SES
│  ├─ email-verification.ts   # POST /api/email-verification → estado/solicitud de verificación en SES
│  └─ _lib/                   # Código compartido: token de Firebase, cliente SES, utilidades HTTP
│                             # (el "_" evita que Vercel lo publique como endpoint)
├─ src/
│  ├─ pages/                  # Vistas: Login, Register, Tasks
│  ├─ components/             # UI: TodoForm, TodoList, TodoItem, LoadingScreen
│  ├─ routes/                 # ProtectedRoute y PublicOnlyRoute
│  ├─ hooks/                  # useAuth, useTasks
│  ├─ context/                # Contexto y proveedor de autenticación
│  ├─ services/               # Integraciones: Firebase, Auth, Firestore, email
│  ├─ types/                  # Tipos e interfaces compartidas
│  └─ utils/                  # Funciones puras: validación, orden, resumen
├─ tests/                     # Tests unitarios, de componentes y de servicios (con mocks)
├─ firestore.rules            # Reglas de seguridad de Firestore
├─ vercel.json                # Rewrites para la SPA
├─ .env.example               # Plantilla de variables de entorno (sin secretos)
└─ README.md
```

## Decisiones arquitectónicas

- **Separación por capas.** Los componentes no hablan directamente con Firebase: usan _hooks_ (`useAuth`, `useTasks`), que a su vez usan _services_. Si mañana cambia el proveedor (por ejemplo, otra base de datos), solo se modifica la capa de servicios.
- **Funciones puras en `utils/`.** La validación, el orden y el resumen de tareas no dependen de React ni de Firebase, así que son fáciles de probar y de reutilizar.
- **Sesión con Context API.** `AuthProvider` escucha `onAuthStateChanged` y comparte el usuario con toda la app. Las rutas reaccionan solas a los cambios de sesión, por lo que las páginas no necesitan redirigir manualmente.
- **Tiempo real con `onSnapshot`.** En lugar de volver a pedir los datos después de cada operación, la app se suscribe a la consulta de Firestore y la interfaz se actualiza automáticamente.
- **Seguridad en el servidor.** Las reglas de Firestore (`firestore.rules`) verifican que `userId` coincida con el usuario autenticado para leer, crear, editar o borrar, y validan la forma de cada tarea. El filtro por `userId` en el frontend no es la única protección.
- **Carpeta `api/` en lugar de `functions/`.** Vercel solo detecta funciones dentro de `api/`, por eso el endpoint de email vive ahí.
- **El endpoint de email no confía en el navegador.** El frontend envía el _ID token_ de Firebase; la función lo verifica con las llaves públicas de Google (librería `jose`) y envía el correo únicamente a la dirección que contiene el token. Así nadie puede usar el endpoint para enviar correos a terceros.
- **Verificación del correo bajo demanda (sandbox de SES).** En lugar de verificar solo en el formulario de registro, la app consulta el estado al entrar a "Mis tareas". Así funciona igual para registros con correo, para inicios de sesión con Google y para cuentas existentes. Toda la lógica de AWS vive en el servidor (`/api/email-verification`), y cada usuario solo puede verificar su propio correo (sale del token verificado).
- **Código compartido entre funciones** en `api/_lib/` (verificación del token, cliente SES, respuestas HTTP) para no duplicar lógica.
- **Imports con extensión `.js` en `api/`.** El proyecto usa `"type": "module"`, y Node.js en modo ES Modules exige la extensión en los imports locales.

## Flujo de envío de emails

```
[Navegador]                       [Vercel Function]                   [AWS]
 Botón "Enviarme resumen"
   │ 1. Obtiene el ID token de Firebase
   │ 2. POST /api/send-summary
   │    Authorization: Bearer <token>
   │    Body: { tasks: [{ title, completed }] }
   └──────────────────────────────▶ 3. Verifica el token (firma, emisor,
                                       audiencia y expiración)
                                    4. Valida los datos recibidos
                                    5. Arma el email (HTML + texto,
                                       con escape de HTML)
                                    6. SendEmail ───────────────────▶ SES envía el correo
   ◀────────────────────────────── 7. Responde éxito o error           al usuario
 Muestra el resultado en pantalla
```

Las credenciales de AWS solo existen como variables de entorno en Vercel; nunca llegan al navegador.

### Verificación del correo (sandbox de SES)

```
Usuario entra a "Mis tareas"
   │ POST /api/email-verification  (con el ID token)
   ▼
[Vercel Function] verifica el token y consulta el correo en SES
   ├─ ya verificado        → { status: "verified" } → botón de resumen habilitado
   ├─ nunca solicitado     → CreateEmailIdentity → AWS envía el correo de verificación → { status: "sent" }
   ├─ pendiente            → { status: "pending" } → aviso con opción "Reenviar correo"
   └─ expirado / reenviar  → se borra y se vuelve a crear la identidad → { status: "sent" }
```

Mientras el correo no esté verificado, el botón de resumen permanece deshabilitado con una explicación, y si SES igualmente rechaza un envío (`MessageRejected`) la función responde con un mensaje claro. En una cuenta fuera del sandbox (con dominio propio verificado) este paso deja de ser necesario.

## Instalación y ejecución local

Requisitos: Node.js 20.19+ y una cuenta de Firebase.

```bash
git clone https://github.com/secasospina/Gestor_De_Tareas.git
cd Gestor_De_Tareas
npm install
cp .env.example .env   # y completa los valores
npm run dev            # http://localhost:5173
```

Configuración en Firebase:

1. Crear un proyecto y registrar una app web.
2. En **Authentication**, habilitar los proveedores _Correo electrónico/contraseña_ y _Google_.
3. Crear la base de datos **Firestore** y publicar el contenido de `firestore.rules` en la pestaña _Reglas_.
4. Si se despliega, agregar el dominio de Vercel en **Authentication → Configuración → Dominios autorizados**.

> `npm run dev` levanta solo el frontend. La función `/api/send-summary` se ejecuta en Vercel (o localmente con `vercel dev`).

### Scripts

| Comando              | Descripción                            |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                 |
| `npm run build`      | Chequeo de tipos y build de producción |
| `npm test`           | Ejecuta todos los tests una vez        |
| `npm run test:watch` | Tests en modo observación              |
| `npm run lint`       | Linter (oxlint)                        |

## Variables de entorno

Plantilla en `.env.example`. El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

| Variable                            | Dónde se usa       | Descripción                                                 |
| ----------------------------------- | ------------------ | ----------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Frontend           | Configuración de la app web de Firebase                     |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Frontend           | Dominio de autenticación                                    |
| `VITE_FIREBASE_PROJECT_ID`          | Frontend y función | ID del proyecto (la función lo usa para verificar el token) |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Frontend           | Bucket del proyecto                                         |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend           | ID de remitente                                             |
| `VITE_FIREBASE_APP_ID`              | Frontend           | ID de la app                                                |
| `SES_REGION`                        | Función            | Región de AWS SES (ej. `us-east-2`)                         |
| `SES_ACCESS_KEY_ID`                 | Función            | Access key de un usuario IAM con permisos de SES            |
| `SES_SECRET_ACCESS_KEY`             | Función            | Clave secreta de ese usuario                                |
| `SES_FROM_EMAIL`                    | Función            | Remitente verificado en SES                                 |

- Solo las variables con prefijo `VITE_` llegan al navegador. Las de SES no lo llevan a propósito, para que nunca queden expuestas.
- Las variables de SES no se llaman `AWS_...` porque Vercel reserva esos nombres.
- La configuración web de Firebase no es secreta (termina en el código del navegador); lo que protege los datos son las reglas de Firestore. Aun así se maneja con variables de entorno.

## Testing

```bash
npm test
```

- **Unitarios:** validación, orden y resumen de tareas; armado del email y escape de HTML; traducción de errores de autenticación.
- **Componentes:** `TodoForm` (validación, envío, modo edición, error al guardar) y `TodoList` (lista vacía, completar, editar, eliminar con confirmación).
- **Servicios con mocks:** el servicio de email se prueba con Firebase y `fetch` simulados, sin llamadas reales a internet.

## Deploy

El proyecto está conectado a Vercel desde GitHub: cada push a `main` despliega automáticamente.

1. Importar el repositorio en Vercel (framework detectado: Vite).
2. Configurar todas las variables de entorno de la tabla anterior.
3. `vercel.json` redirige cualquier ruta (excepto `/api/*`) a `index.html`, para que React Router funcione al recargar o abrir un enlace directo.

## Uso de IA en el proceso de trabajo

<!-- Pendiente: sección por completar. -->

## Posibles mejoras

- Filtros por estado (todas, pendientes, completadas).
- Reordenar tareas con drag & drop (dnd-kit).
- Fechas de vencimiento y prioridad.
- Salir del sandbox de SES y usar un dominio propio como remitente.

## Autor

**Sebastián Castaño Ospina** — [GitHub](https://github.com/secasospina)
