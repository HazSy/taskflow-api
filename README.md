# TaskFlow API

> API REST para gestionar proyectos y tareas, con autenticación JWT, validación de datos y tests de integración.

![Node](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests-13%20passing-6E9F18?logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

Backend pensado como base real de producto: cada usuario solo ve **sus** proyectos,
las contraseñas se guardan con bcrypt, las rutas se validan con Zod y el código está
cubierto por tests que se ejecutan en CI en cada push.

---

## ✨ Qué incluye

| Área | Detalle |
|---|---|
| 🔐 **Autenticación** | Registro, login y `/me` con JWT firmado (HS256) y expiración configurable |
| 🛡️ **Contraseñas** | Hash con bcrypt (10 rondas), nunca se devuelve el hash en las respuestas |
| ✅ **Validación** | Esquemas Zod en todas las entradas; errores 422 con el campo exacto que falla |
| 👤 **Multi-tenant** | Cada consulta filtra por `ownerId`; acceder a datos ajenos devuelve 403 |
| 📊 **Métricas** | Endpoint `summary` con tareas por estado/prioridad y % de completado |
| 🧪 **Tests** | 13 tests de integración con Vitest + Supertest sobre una BD SQLite aislada |
| 🧱 **Arquitectura** | Separación `routes → schemas → service → Prisma`, sin lógica en los controladores |
| 🐳 **Docker** | Imagen multi-stage lista para desplegar |
| ⚙️ **CI** | GitHub Actions: `npm ci` → `prisma generate` → typecheck → tests |

---

## 🧰 Stack

- **Node.js 22** + **TypeScript** en modo `strict`
- **Express 5** (manejo nativo de errores en handlers `async`)
- **Prisma ORM** con SQLite en desarrollo (cambiar `provider` a `postgresql` para producción)
- **Zod** para validación y tipado de la entrada
- **JWT** (`jsonwebtoken`) + **bcryptjs**
- **Helmet**, **CORS** y **pino** para seguridad y logs estructurados
- **Vitest** + **Supertest** para tests de integración

---

## 🚀 Puesta en marcha

```bash
git clone https://github.com/HazSy/taskflow-api.git
cd taskflow-api
npm install

cp .env.example .env          # ajusta JWT_SECRET
npx prisma db push            # crea la base de datos
npm run db:seed               # datos de ejemplo

npm run dev                   # http://localhost:3000/api/health
```

Usuario de prueba del seed: **demo@taskflow.dev** / **demo1234**

```bash
npm test          # 13 tests de integración
npm run build     # compila a dist/
npm run typecheck # TypeScript sin emitir
```

---

## 📡 Endpoints

Todas las rutas (excepto registro y login) requieren `Authorization: Bearer <token>`.

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Crea la cuenta y devuelve el token |
| `POST` | `/api/auth/login` | Login con email y contraseña |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado |

### Proyectos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/projects` | Lista con filtros `?archived=true&q=texto` |
| `GET` | `/api/projects/summary` | Métricas agregadas para el dashboard |
| `GET` | `/api/projects/:id` | Detalle con sus tareas |
| `POST` | `/api/projects` | Crear proyecto |
| `PATCH` | `/api/projects/:id` | Actualización parcial (incluye `archived`) |
| `DELETE` | `/api/projects/:id` | Borra el proyecto y sus tareas en cascada |

### Tareas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/tasks` | Filtros `?status=&priority=&projectId=&take=&skip=` |
| `POST` | `/api/tasks` | Crear tarea |
| `PATCH` | `/api/tasks/:id` | Cambiar título, estado, prioridad o fecha |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea |

### Ejemplo

```bash
# 1. Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Oscar","email":"oscar@example.com","password":"secreto123"}'

# 2. Crear un proyecto
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi portfolio","color":"#6366f1"}'
```

Respuesta de error uniforme:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": [{ "path": "email", "message": "Email no válido" }]
  }
}
```

---

## 🗂️ Estructura

```
taskflow-api/
├── prisma/
│   ├── schema.prisma        # Modelo de datos (User, Project, Task)
│   └── seed.ts              # Datos de ejemplo
├── src/
│   ├── config/env.ts        # Validación de variables de entorno
│   ├── lib/                 # prisma, jwt, bcrypt, errores de dominio
│   ├── middlewares/         # auth, validación, manejador de errores
│   ├── modules/
│   │   ├── auth/            # rutas + esquemas + servicio
│   │   ├── projects/
│   │   └── tasks/
│   ├── app.ts               # Composición de Express (testeable)
│   └── server.ts            # Arranque y cierre ordenado
├── tests/                   # Tests de integración
└── .github/workflows/ci.yml
```

Cada módulo sigue el mismo patrón: `*.schemas.ts` valida, `*.service.ts` contiene la
lógica y acceso a datos, `*.routes.ts` solo conecta HTTP con el servicio.

---

## 🔒 Decisiones de seguridad

- **No se filtra la existencia de cuentas**: login devuelve el mismo error para email
  inexistente y contraseña incorrecta.
- **Autorización en el servicio, no en el cliente**: `assertProjectOwner` se ejecuta en
  cada operación sobre proyectos y tareas.
- **Validación de entrada por lista blanca**: Zod elimina las claves desconocidas, así que
  no se puede inyectar `ownerId` o `role` desde el body.
- **Límite de tamaño de payload** (100 kb) y cabeceras de seguridad de Helmet.
- **Cierre ordenado**: al recibir `SIGTERM` deja de aceptar peticiones y desconecta Prisma.

---

## 🗺️ Roadmap

- [ ] Refresh tokens y revocación por dispositivo
- [ ] Paginación con cursores en `/api/projects`
- [ ] Documento OpenAPI generado desde los esquemas Zod
- [ ] Migrar a PostgreSQL + Docker Compose con servicios de app y BD
- [ ] Rate limiting por IP en `/api/auth/*`

---

## 👤 Autor

**Oscar López Pellicer** — Estudiante de Desarrollo de Aplicaciones Web (Murcia, España)

[![GitHub](https://img.shields.io/badge/GitHub-HazSy-181717?logo=github)](https://github.com/HazSy)

Proyecto bajo licencia [MIT](./LICENSE).
