# Resumen Técnico del Backend — Nomahud

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Framework | **NestJS 11.x** (TypeScript) |
| Base de datos | **MySQL 8.0** con **TypeORM 0.3.x** |
| Autenticación | JWT (`@nestjs/jwt` + `passport-jwt`) |
| Validación | `class-validator` + `class-transformer` |
| Envío de emails | `nodemailer` |
| Tareas programadas | `@nestjs/schedule` |
| Testing | **Jest 30.x** + `supertest` |
| Contenedores | Docker + docker-compose |

---

## Estructura del Proyecto

```
backend/
├── src/
│   ├── main.ts                    # Punto de entrada
│   ├── app.module.ts              # Módulo raíz
│   ├── auth/                      # Autenticación (registro, login, confirmación, recuperación)
│   ├── usuarios/                  # CRUD de usuarios
│   ├── perfiles/                  # Perfiles de usuario
│   ├── proyectos/                 # CRUD de proyectos
│   ├── tareas/                    # CRUD de tareas
│   ├── clientes/                  # CRUD de clientes
│   ├── finanzas/                  # Transacciones financieras
│   ├── tiempo/                    # Registro de tiempo
│   ├── viajes/                    # Gestión de viajes + itinerario
│   ├── documentos/                # Subida/gestión de documentos
│   ├── dashboard/                 # Estadísticas del dashboard
│   ├── mail/                      # Servicio de correo
│   └── common/                    # Decoradores compartidos, jobs programados
├── test/
│   └── app.e2e-spec.ts           # Test E2E
├── uploads/                       # Archivos subidos
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── Dockerfile
├── docker-compose.yml
└── .env
```

---

## Configuración de Base de Datos

Definida en `app.module.ts` mediante `TypeOrmModule.forRootAsync()`:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_HOST` | Host de MySQL | `mysql` |
| `DB_PORT` | Puerto | `3306` |
| `DB_USERNAME` | Usuario | `root` |
| `DB_PASSWORD` | Contraseña | `root` |
| `DB_NAME` | Nombre BD | `nomadhud` |

> `synchronize: true` en desarrollo (genera tablas automáticamente).

---

## Variables de Entorno (`.env`)

```
DB_HOST="mysql"
DB_PORT="3306"
DB_USERNAME="root"
DB_PASSWORD="root"
DB_NAME="nomadhud"
JWT_SECRET="nomahud-secret-dev-2026"
JWT_EXPIRES_IN="24h"
FRONTEND_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="correo@gmail.com"
SMTP_PASS="contraseña_app"
MAIL_FROM="correo@gmail.com"
```

---

## API — Endpoints

### Auth (`/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/registro` | — | Registrar usuario |
| POST | `/auth/inicio-sesion` | — | Login (devuelve JWT) |
| POST | `/auth/confirmar-cuenta` | — | Confirmar email |
| POST | `/auth/reenviar-confirmacion` | — | Reenviar token |
| POST | `/auth/solicitar-recuperacion` | — | Solicitar recuperación |
| POST | `/auth/restablecer-contrasena` | — | Restablecer contraseña |

### Usuarios (`/usuarios`)
| Método | Ruta | Auth |
|---|---|---|
| POST | `/usuarios` | — |
| GET | `/usuarios/:id` | — (por implementar) |
| PATCH | `/usuarios/:id` | — (por implementar) |
| DELETE | `/usuarios/:id` | — (por implementar) |

### Perfiles (`/perfiles`) — `JwtAuthGuard`
| GET | `/perfiles/mi-perfil` |
|---|---|
| PATCH | `/perfiles/mi-perfil` |
| GET | `/perfiles/:id` |

### Proyectos (`/proyectos`) — `JwtAuthGuard`
CRUD completo (POST, GET, GET/:id, PATCH/:id, DELETE/:id)

### Tareas (`/tareas`) — `JwtAuthGuard`
CRUD completo + `GET /tareas/proyecto/:proyectoId`

### Clientes (`/clientes`) — `JwtAuthGuard`
CRUD completo

### Finanzas (`/finanzas`) — `JwtAuthGuard`
CRUD completo + `GET /finanzas/resumen`

### Tiempo (`/tiempo`) — `JwtAuthGuard`
CRUD completo + `GET /tiempo/resumen`

### Viajes (`/viajes`) — `JwtAuthGuard`
CRUD viajes + CRUD itinerario (anidado en `/viajes/:viajeId/itinerario`)

### Documentos (`/documentos`) — `JwtAuthGuard`
CRUD + subida multipart + `/documentos/:id/download`

### Dashboard (`/dashboard`) — `JwtAuthGuard`
| GET | `/dashboard` | Estadísticas generales |

---

## Entidades (Modelos)

1. **Usuario** — `nombre`, `correo` (único), `contrasena` (select:false), `ciudad`, `fechaNacimiento`, `emailVerificado`, `estadoCuenta` (pendiente/activa/bloqueada)
2. **AuthToken** — `usuarioId` (FK), `tipo` (confirmacion_email/recuperacion_password), `tokenHash` (SHA-256), `expiraEn`
3. **Perfil** — `usuarioId` (FK unique), `bio`, `avatarUrl`, `skills` (JSON), `idiomas` (JSON), `estadoLaboral`, etc.
4. **Proyecto** — `nombre`, `descripcion`, `estado`, `prioridad`, `clienteId` (FK), `creadorId` (FK)
5. **Tarea** — `titulo`, `estado`, `prioridad`, `proyectoId` (FK), `asignadoAId` (FK), `autoTiempoRegistrado`
6. **Cliente** — `nombre`, `empresa`, `correo`, `telefono`, `creadorId` (FK)
7. **Transaccion** — `tipo` (ingreso/gasto), `categoria`, `monto`, `moneda`, `proyectoId` (FK), `creadorId` (FK)
8. **RegistroTiempo** — `proyectoId` (FK), `tareaId` (FK), `horas`, `fecha`
9. **Viaje** — `destino`, `fechas`, `presupuesto`, `autoGastoRegistrado`, `itinerario` (OneToMany)
10. **ItinerarioItem** — `viajeId` (FK), `lugar`, `fecha`, `descripcion`, `costo`, `orden`
11. **Documento** — `nombre`, `archivo` (ruta), `tipo` (proyecto/viaje), `mimeType`, `size`

---

## Pruebas

### Configuración de Jest

Las pruebas unitarias están definidas en `package.json`:

```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

Pruebas E2E (`test/jest-e2e.json`):

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

### Tests Disponibles

| Archivo | Tipo |
|---|---|
| `src/auth/test/auth.service.spec.ts` | Unitario |
| `src/auth/test/auth.controller.spec.ts` | Unitario |
| `src/usuarios/tests/usuarios.service.spec.ts` | Unitario |
| `src/usuarios/tests/usuarios.controller.spec.ts` | Unitario |
| `src/mail/test/mail.service.spec.ts` | Unitario |
| `src/common/jobs/test/auth-tokens-cleanup.job.spec.ts` | Unitario |
| `test/app.e2e-spec.ts` | E2E |

### Comandos

```bash
# Ejecutar todos los tests unitarios
npm run test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e

# Modo debug
npm run test:debug
```

---

## Linter y Formateo

```bash
# ESLint
npm run lint

# Prettier
npm run format
```

**ESLint** usa config flat (`eslint.config.mjs`) con:
- `@typescript-eslint` con type-checking
- `prettier` integrado
- Reglas destacadas: `no-explicit-any: off`, `no-floating-promises: warn`

**Prettier**: `singleQuote: true`, `trailingComma: all`

---

## Docker

### Inicio rápido con docker-compose (raíz del proyecto)

```bash
docker compose up -d
```

Esto levanta 4 servicios:
- **frontend** → `localhost:3000`
- **app** (backend) → `localhost:3001`
- **mysql** (8.0) → `localhost:3308`
- **maildev** → `localhost:1080` (Web UI) / `localhost:1025` (SMTP)

### Backend standalone

```bash
cd backend
docker compose up -d
```

### Dockerfile (multi-stage)

- Stage `development` — `npm install` + `npm run start:dev`
- Stage `builder` — compila TypeScript
- Stage `production` — solo `dist/` + `node_modules` (producción)

---

## Punto de Entrada (`src/main.ts`)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:3000", credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  await app.listen(process.env.PORT ?? 3000);
}
```

---

## Módulos y Dependencias

```
AppModule
├── ConfigModule (global)
├── ScheduleModule (cron jobs)
├── TypeOrmModule (MySQL)
├── AuthModule → PassportModule, JwtModule, UsuariosModule, MailModule
├── UsuariosModule
├── MailModule
├── PerfilesModule
├── ProyectosModule ←→ FinanzasModule (forwardRef)
├── TareasModule ←→ TiempoModule (forwardRef)
├── ClientesModule
├── FinanzasModule
├── TiempoModule
├── ViajesModule ←→ FinanzasModule (forwardRef)
├── DocumentosModule + MulterModule
└── DashboardModule
```
