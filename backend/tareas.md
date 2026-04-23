# 📋 Lista de Tareas - Módulos Auth y Usuarios

---

## 🧭 ORDEN RECOMENDADO DE EJECUCIÓN

### Fase 1 — Base de autenticación (MVP)

1. `10` Configurar variables de entorno para JWT
2. `5` Inyectar UsuariosService en AuthService
3. `1` Implementar `validatePassword` en AuthService
4. `2` Implementar `generateToken` en AuthService
5. `11` Crear método `createUsuario` en UsuariosService
6. `12` Crear método `findByEmail` (incluyendo contraseña para login)
7. `3` Implementar método `login` en AuthService
8. `4` Implementar método `register` en AuthService
9. `6` Implementar endpoint `POST /auth/inicio-sesion`
10. `7` Implementar endpoint `POST /auth/registro`

---

### Fase 2 — JWT y protección de rutas

11.`8` Configurar estrategia JWT (`JwtStrategy`)
12.`9` Configurar `PassportModule` + `JwtModule` en `AuthModule`
13.`13` Crear método `findById` en UsuariosService
14.`16` Implementar `POST /usuarios` (público)
15.`17` Implementar `GET /usuarios/:id`
16.`18` Implementar `PATCH /usuarios/:id`
17.`19` Implementar `DELETE /usuarios/:id`
18.`22` Proteger endpoints con `JwtAuthGuard`

---

### Fase 3 — Integridad de datos y validaciones

19.`21` Agregar validación de DTOs
20.`23` Validar que no se cambie correo/fechaNacimiento en update
21.`14` Fortalecer método `updateUsuario`
22.`15` Fortalecer método `deleteUsuario`
23.`20` Verificar hash de contraseñas en todo flujo

---

### Fase 4 — Funcionalidades con mail (confirmación/recuperación)

24.`24` Configurar servicio de correo reutilizable
25.`25` Agregar campos de verificación de cuenta en Usuario
26.`26` Crear entidad de tokens de seguridad por email
27.`27` Enviar mail de confirmación al registrarse
28.`28` Endpoint `POST /auth/confirmar-cuenta`
29.`29` Bloquear login si email no está verificado
30.`30` Endpoint `POST /auth/reenviar-confirmacion`
31.`31` Flujo `POST /auth/solicitar-recuperacion`
32.`32` Flujo `POST /auth/restablecer-contrasena`
33.`33` Limpieza de tokens expirados y auditoría

---

## 📧 FUNCIONALIDADES CON MAIL (CONFIRMACIÓN Y RECUPERACIÓN)

### 24. Configurar servicio de correo reutilizable

**Descripción:**
Crea un servicio centralizado para envío de correos transaccionales (confirmación de cuenta, recuperación de contraseña, cambio de email). Debe aceptar destinatario, asunto, template y variables dinámicas.

**Dónde:** `src/mail/mail.service.ts` **(NUEVO)**

**Qué usar:**
- `nodemailer` (ya instalado)
- Variables de entorno SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`)
- Método base:

```typescript
async sendMail(to: string, subject: string, template: string, context: Record<string, any>): Promise<void>
```

---

### 25. Agregar campos de verificación de cuenta en Usuario

**Descripción:**
Extiende la entidad `Usuario` para soportar confirmación por email y control de estado. Esto permitirá bloquear login hasta confirmar cuenta.

**Dónde:** `src/usuarios/entitys/usuarios.entity.ts`

**Qué agregar:**
- `emailVerificado: boolean` (default `false`)
- `emailVerificadoAt?: Date`
- `estadoCuenta: 'pendiente' | 'activa' | 'bloqueada'`

---

### 26. Crear entidad para tokens de seguridad por email

**Descripción:**
Crea una tabla dedicada para tokens de confirmación y recuperación. Debe guardar hash del token (no token plano), usuario, tipo, expiración y uso.

**Dónde:** `src/auth/entitys/auth-token.entity.ts` **(NUEVO)**

**Qué usar:**
- Campos: `id`, `usuarioId`, `tipo`, `tokenHash`, `expiraEn`, `usadoEn`, `creadoEn`
- Tipos: `confirmacion_email`, `recuperacion_password`

---

### 27. Implementar envío de mail de confirmación al registrarse

**Descripción:**
Al crear un usuario nuevo, genera token de confirmación, guarda hash en BD y envía enlace de activación por correo.

**Dónde:** `src/auth/auth.service.ts` (flujo `register`)

**Qué usar:**
- `crypto.randomBytes()` para token
- hash del token antes de guardar (`sha256` o bcrypt)
- URL de frontend: `${FRONTEND_URL}/confirmar-cuenta?token=...`

```typescript
private async sendEmailConfirmation(usuario: Usuario): Promise<void>
```

---

### 28. Crear endpoint de confirmación de cuenta

**Descripción:**
Endpoint público para confirmar cuenta con token. Valida token, revisa expiración, marca usuario como verificado y token como usado.

**Dónde:** `src/auth/auth.controller.ts` y `src/auth/auth.service.ts`

**Qué usar:**
- `POST /auth/confirmar-cuenta`
- Body DTO con `token`
- Excepciones para token inválido/expirado/usado

```typescript
async confirmarCuenta(token: string): Promise<{ mensaje: string }>
```

---

### 29. Bloquear login si el email no está verificado

**Descripción:**
Antes de generar JWT en login, valida que el usuario tenga `emailVerificado = true`. Si no, retorna error indicando que debe confirmar su cuenta.

**Dónde:** `src/auth/auth.service.ts` (método `login`)

**Qué usar:**
- `UnauthorizedException('Debes confirmar tu cuenta antes de iniciar sesión')`

---

### 30. Crear endpoint para reenviar confirmación

**Descripción:**
Permite solicitar un nuevo correo de confirmación cuando el anterior expiró o no llegó.

**Dónde:** `src/auth/auth.controller.ts` y `src/auth/auth.service.ts`

**Qué usar:**
- `POST /auth/reenviar-confirmacion`
- DTO con `correo`
- Límite de frecuencia (ej. 1 solicitud cada 60 segundos)

---

### 31. Crear flujo “olvidé mi contraseña”

**Descripción:**
Endpoint que recibe email, genera token de recuperación y envía mail con enlace para restablecer contraseña. Debe responder mensaje genérico para no filtrar si el correo existe o no.

**Dónde:** `src/auth/auth.controller.ts` y `src/auth/auth.service.ts`

**Qué usar:**
- `POST /auth/solicitar-recuperacion`
- DTO con `correo`
- Respuesta segura: `Si el correo existe, se enviaron instrucciones`

```typescript
async solicitarRecuperacion(correo: string): Promise<{ mensaje: string }>
```

---

### 32. Crear endpoint para restablecer contraseña

**Descripción:**
Valida token de recuperación y cambia contraseña por una nueva hasheada. Invalida token usado y opcionalmente revoca sesiones activas.

**Dónde:** `src/auth/auth.controller.ts` y `src/auth/auth.service.ts`

**Qué usar:**
- `POST /auth/restablecer-contrasena`
- DTO con `token` y `nuevaContrasena`
- `bcrypt.hash(nuevaContrasena, 10)`

```typescript
async restablecerContrasena(token: string, nuevaContrasena: string): Promise<{ mensaje: string }>
```

---

### 33. Agregar limpieza de tokens expirados y auditoría

**Descripción:**
Implementa limpieza periódica de tokens expirados y logs mínimos de eventos críticos (confirmación enviada, recuperación solicitada, contraseña restablecida).

**Dónde:** `src/auth/auth.service.ts` o job dedicado en `src/common/jobs/`

**Qué usar:**
- Cron diario para limpieza
- Logs sin exponer token ni contraseña
- Métricas básicas (cantidad de correos enviados/fallidos)

---

## 🔐 MÓDULO AUTH

### 1. Implementar método validatePassword en AuthService

**Descripción:**
Crea un método privado que valide una contraseña en texto plano contra una contraseña hasheada. Este método será utilizado en el login para verificar que la contraseña ingresada por el usuario es correcta. Usa bcrypt para hacer la comparación de forma segura.

**Dónde:** `src/auth/auth.service.ts`

**Qué usar:**
- Librería: `bcrypt` (`npm install bcrypt`)
- Método: `bcrypt.compare(password, hashedPassword)`
- Retorna: `Promise<boolean>`

```typescript
private async validatePassword(password: string, hashedPassword: string): Promise<boolean>
```

---

### 2. Implementar método generateToken en AuthService

**Descripción:**
Crea un método privado que genere un JWT (JSON Web Token) con la información del usuario. El token debe incluir el ID y email del usuario en el payload, usar una clave secreta almacenada en variables de entorno, y establecer un tiempo de expiración (24 horas recomendadas). El token será enviado al cliente en cada login exitoso.

**Dónde:** `src/auth/auth.service.ts`

**Qué usar:**
- `JwtModule` de `@nestjs/jwt`
- Inyectar `JwtService` en el constructor
- Método: `this.jwtService.sign({ userId, email })`
- Opciones: `{ secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN }`

```typescript
private generateToken(userId: number, email: string): string
```

---

### 3. Implementar método login en AuthService

**Descripción:**
Implementa la lógica de autenticación. El método debe: buscar el usuario por email usando UsuariosService, validar que la contraseña coincida usando validatePassword(), y si todo es correcto, generar un JWT con generateToken(). Lanza UnauthorizedException si el usuario no existe o la contraseña es incorrecta. Retorna el token y datos del usuario (sin contraseña).

**Dónde:** `src/auth/auth.service.ts`

**Qué usar:**
- Métodos previos: `validatePassword()` y `generateToken()`
- `UsuariosService`: `this.usuariosService.findByEmail(email)`
- Excepciones: `UnauthorizedException` de `@nestjs/common`

```typescript
async login(correo: string, contrasena: string): Promise<{ token: string; usuario: any }>
```

---

### 4. Implementar método register en AuthService

**Descripción:**
Implementa la lógica de registro de nuevos usuarios. Verifica que el usuario no exista previamente (con findByEmail), hashea la contraseña con bcrypt, crea el nuevo usuario en la BD con createUsuario(), y retorna los datos del usuario creado. Lanza BadRequestException si el usuario ya existe. Opcionalmente puede hashear la contraseña aquí o delegarlo a createUsuario().

**Dónde:** `src/auth/auth.service.ts`

**Qué usar:**
- `bcrypt`: `bcrypt.hash(password, 10)` para hashear
- `UsuariosService`: `findByEmail()` y `createUsuario()`
- Excepciones: `BadRequestException` de `@nestjs/common`

```typescript
async register(nombre: string, correo: string, contrasena: string, ciudad?: string, fechaNacimiento?: Date): Promise<{ usuario: any }>
```

---

### 5. Inyectar UsuariosService en AuthService

**Descripción:**
Configura la inyección de dependencias en el AuthService. El UsuariosService es necesario para crear usuarios durante el registro, buscar usuarios por email en el login, y buscar usuarios por ID en la estrategia JWT. Agrega también la inyección del JwtService necesario para generar tokens.

**Dónde:** `src/auth/auth.service.ts` (constructor)

**Qué usar:**
- Importar: `import { UsuariosService } from '../usuarios/usuarios.service';`
- Constructor:

```typescript
constructor(
  private usuariosService: UsuariosService,
  private jwtService: JwtService
) {}
```

---

### 6. Implementar login endpoint en AuthController

**Descripción:**
Implementa el endpoint POST `/auth/inicio-sesion` que recibe credenciales (correo y contraseña) en el body. Valida los datos usando LoginDto, llama al método login del AuthService, y retorna el JWT y datos del usuario. Maneja excepciones para usuario no encontrado o contraseña incorrecta. Este endpoint NO debe estar protegido con JwtAuthGuard.

**Dónde:** `src/auth/auth.controller.ts` - método `login()`

**Qué usar:**
- Decorador: `@Body()` para recibir `LoginDto`
- Método: `this.authService.login()`
- Excepciones: manejo de errores
- **NO** agregar `@UseGuards(JwtAuthGuard)`

---

### 7. Implementar registro endpoint en AuthController

**Descripción:**
Implementa el endpoint POST `/auth/registro` que recibe datos del nuevo usuario (nombre, correo, contraseña, y opcionalmente ciudad y fecha de nacimiento). Valida los datos usando CreateUsuarioDto, llama al método register del AuthService, y retorna los datos del usuario creado. Maneja excepciones para usuario ya existente o datos inválidos. Este endpoint NO debe estar protegido con JwtAuthGuard.

**Dónde:** `src/auth/auth.controller.ts` - método `register()`

**Qué usar:**
- Decorador: `@Body()` para recibir `CreateUsuarioDto`
- Método: `this.authService.register()`
- Excepciones: manejo de errores
- **NO** agregar `@UseGuards(JwtAuthGuard)`

---

### 8. Configurar estrategia JWT (JwtStrategy)

**Descripción:**
Crea un nuevo archivo que implemente la estrategia Passport para validar JWTs. Esta estrategia extrae el token de los headers de autorización, verifica su validez usando la clave secreta, decodifica el payload, busca el usuario en la BD usando el ID del token, y lo proporciona al request como `req.user`. Es llamada automáticamente cuando se usa `@UseGuards(JwtAuthGuard)`.

**Dónde:** Crear archivo `src/auth/jwt.strategy.ts` **(NUEVO ARCHIVO)**

**Qué usar:**
- Importar: `PassportStrategy` de `@nestjs/passport`
- Importar: `Strategy` de `passport-jwt`
- Constructor: configurar con `new Strategy({ secretOrKey: process.env.JWT_SECRET })`
- Método: `validate(payload: any)` que retorna el usuario
- Inyectar: `UsuariosService` para buscar el usuario por ID

---

### 9. Configurar PassportModule en AuthModule

**Descripción:**
Configura el módulo de autenticación importando PassportModule con la estrategia JWT como default, JwtModule con la clave secreta y expiración, UsuariosModule para acceder a los métodos de usuario, y agregando JwtAuthGuard en providers. Exporta JwtModule para que otros módulos puedan usarlo. Esta configuración habilita toda la autenticación JWT en la aplicación.

**Dónde:** `src/auth/auth.module.ts`

**Qué usar:**
- Importar: `PassportModule` de `@nestjs/passport`
- Importar: `JwtModule` de `@nestjs/jwt`
- Importar: `UsuariosModule`
- En `imports`:
  - `PassportModule.register({ defaultStrategy: 'jwt' })`
  - `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: process.env.JWT_EXPIRES_IN } })`
- En `providers`: `JwtAuthGuard`
- En `exports`: `JwtModule`

---

### 10. Configurar variables de entorno para JWT

**Descripción:**
Crea o actualiza el archivo `.env` en la raíz del backend con las variables necesarias para JWT y base de datos. JWT_SECRET debe ser una clave de al menos 32 caracteres muy segura. JWT_EXPIRES_IN define cuánto tiempo es válido el token (24h recomendado). Database variables configuran la conexión a PostgreSQL. Nunca commits `.env` al repositorio.

**Dónde:** Raíz del backend (crear `.env` si no existe)

**Contenido:**

```env
APP_NAME=NomahudAPI
APP_PORT=3000
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=24h
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=usuario
DATABASE_PASSWORD=contraseña
DATABASE_NAME=nomahud
```

---

## 👥 MÓDULO USUARIOS

### 11. Crear método createUsuario en UsuariosService

**Descripción:**
Implementa el método que crea un nuevo usuario en la BD. Recibe nombre, correo, contraseña hasheada, y opcionalmente ciudad y fecha de nacimiento. Guarda el usuario en la BD usando el repositorio de TypeORM y retorna el usuario creado sin la contraseña. Este método es llamado tanto durante el registro como potencialmente desde otros endpoints de creación.

**Dónde:** `src/usuarios/usuarios.service.ts`

**Qué usar:**
- Inyectar: `TypeOrmRepository<Usuario>`
- Decorador: `@InjectRepository(Usuario)`
- Método: `this.usuariosRepository.save(usuario)`
- Retornar: Usuario creado sin contraseña

```typescript
async createUsuario(nombre: string, correo: string, contrasena: string, ciudad?: string, fechaNacimiento?: Date): Promise<Usuario>
```

---

### 12. Crear método findByEmail en UsuariosService

**Descripción:**
Implementa búsqueda de usuario por email. **IMPORTANTE:** Este método DEBE incluir la contraseña en el select (select: ['contrasena', ...]) porque se usa en el login para comparar contraseñas. Retorna el usuario completo si existe o null si no existe. Sin incluir la contraseña, el login fallará.

**Dónde:** `src/usuarios/usuarios.service.ts`

**Qué usar:**
- Método: `findOne()` con select incluyendo `contrasena`
- **IMPORTANTE:** incluir `'contrasena'` en select para comparar en login
- Retornar: Usuario encontrado o `null`

```typescript
async findByEmail(correo: string): Promise<Usuario | null>
```

---

### 13. Crear método findById en UsuariosService

**Descripción:**
Implementa búsqueda de usuario por ID. Retorna el usuario encontrado sin la contraseña (por defecto TypeORM no incluye campos con `select: false`). Lanza NotFoundException si el usuario no existe. Este método se usa en los endpoints GET (obtener perfil), PATCH (actualizar), DELETE (eliminar), y en la estrategia JWT para cargar el usuario.

**Dónde:** `src/usuarios/usuarios.service.ts`

**Qué usar:**
- Método: `findOne({ where: { id } })`
- Excepción: `NotFoundException` de `@nestjs/common` si no existe
- Retornar: Usuario sin contraseña

```typescript
async findById(id: number): Promise<Usuario>
```

---

### 14. Crear método updateUsuario en UsuariosService

**Descripción:**
Implementa la actualización de datos de un usuario. Solo permite cambios en nombre y ciudad, RECHAZA cambios en correo y fechaNacimiento lanzando BadRequestException si se intenta. Verifica que el usuario existe antes de actualizar, lanza NotFoundException si no existe. Retorna el usuario actualizado sin contraseña.

**Dónde:** `src/usuarios/usuarios.service.ts`

**Qué usar:**
- Método: `update()` o `save()`
- Validar que **NO** incluya cambios a: `correo` y `fechaNacimiento`
- Excepciones: `NotFoundException` y `BadRequestException`
- Retornar: Usuario actualizado

```typescript
async updateUsuario(id: number, nombre?: string, ciudad?: string): Promise<Usuario>
```

---

### 15. Crear método deleteUsuario en UsuariosService

**Descripción:**
Implementa la eliminación de un usuario de la BD. Primero verifica que el usuario existe, si no lanza NotFoundException. Luego elimina el usuario usando el repositorio y retorna un mensaje de confirmación (ej: "Usuario eliminado correctamente"). Este método es usado por el endpoint DELETE /usuarios/:id.

**Dónde:** `src/usuarios/usuarios.service.ts`

**Qué usar:**
- Método: `delete({ id })`
- Validar que el usuario existe antes de eliminar
- Excepción: `NotFoundException` si no existe
- Retornar: Mensaje de confirmación

```typescript
async deleteUsuario(id: number): Promise<{ mensaje: string }>
```

---

### 16. Implementar POST /usuarios endpoint

**Descripción:**
Implementa el endpoint POST `/usuarios` para crear nuevos usuarios. Recibe CreateUsuarioDto con los datos del usuario. Hashea la contraseña con bcrypt.hash(contrasena, 10) ANTES de pasarla a createUsuario(). Llamar a createUsuario() del service y retornar el nuevo usuario. **Importante:** Este endpoint NO debe estar protegido con JwtAuthGuard - es el endpoint público de registro (alternativa a /auth/registro).

**Dónde:** `src/usuarios/usuarios.controller.ts` **(NUEVO método POST)**

**Qué usar:**
- Decorador: `@Post()` y `@Body()` con `CreateUsuarioDto`
- `bcrypt.hash(contrasena, 10)` para hashear antes de guardar
- `UsuariosService.createUsuario()`
- **NO** proteger con `@UseGuards(JwtAuthGuard)` - registro público

```typescript
@Post()
async createUser(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario>
```

---

### 17. Implementar GET /usuarios/:id endpoint

**Descripción:**
Implementa el endpoint GET `/usuarios/:id` para obtener los datos de un usuario por su ID. Recibe el ID por URL, llama a findById() del service y retorna los datos del usuario. **PROTEGER CON JwtAuthGuard** - solo usuarios autenticados pueden acceder. Un usuario puede ver su propio perfil o el de otros (puedes agregar validación adicional si lo deseas).

**Dónde:** `src/usuarios/usuarios.controller.ts` **(NUEVO método GET)**

**Qué usar:**
- Decorador: `@Get(':id')`, `@Param('id')`
- `UsuariosService.findById(id)`
- Proteger con: `@UseGuards(JwtAuthGuard)`

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard)
async getUser(@Param('id') id: number): Promise<Usuario>
```

---

### 18. Implementar PATCH /usuarios/:id endpoint

**Descripción:**
Implementa el endpoint PATCH `/usuarios/:id` para actualizar datos de un usuario. Recibe UpdateUsuarioDto (solo nombre y ciudad, sin correo ni fecha). Valida que el DTO no incluya correo o fechaNacimiento, lanzando BadRequestException si lo intenta. Llama a updateUsuario() del service y retorna el usuario actualizado. **PROTEGER CON JwtAuthGuard** - solo el propietario de la cuenta debe poder actualizar.

**Dónde:** `src/usuarios/usuarios.controller.ts` (ya existe `updateUser`)

**Qué usar:**
- Decorador: `@Patch(':id')`, `@Param('id')`, `@Body()` con `UpdateUsuarioDto`
- Validar que **NO** incluya `correo` ni `fechaNacimiento`
- `UsuariosService.updateUsuario()`
- Excepciones: `BadRequestException` si intenta cambiar email o fecha
- Proteger con: `@UseGuards(JwtAuthGuard)`

```typescript
@Patch(':id')
@UseGuards(JwtAuthGuard)
async updateUser(@Param('id') id: number, @Body() updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario>
```

---

### 19. Implementar DELETE /usuarios/:id endpoint

**Descripción:**
Implementa el endpoint DELETE `/usuarios/:id` para eliminar una cuenta de usuario. Recibe el ID por URL, llama a deleteUsuario() del service que verifica que existe y lo elimina, retorna mensaje de confirmación. **PROTEGER CON JwtAuthGuard** - solo el propietario de la cuenta debe poder eliminarla (puedes agregar validación).

**Dónde:** `src/usuarios/usuarios.controller.ts` (ya existe `deleteUser`)

**Qué usar:**
- Decorador: `@Delete(':id')`, `@Param('id')`
- `UsuariosService.deleteUsuario(id)`
- Proteger con: `@UseGuards(JwtAuthGuard)`

```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard)
async deleteUser(@Param('id') id: number): Promise<{ mensaje: string }>
```

---

### 20. Hashear contraseñas antes de guardar

**Descripción:**
Asegura que las contraseñas siempre se hashean ANTES de guardarse en la BD. Durante el registro, después de recibir la contraseña en texto plano, llama a `bcrypt.hash(contrasena, 10)` donde 10 es el número de salt rounds (mayor = más seguro pero más lento). Pasa el hash a createUsuario(), NUNCA la contraseña en texto plano. Esto garantiza que nadie, ni siquiera los administradores, puedan ver contraseñas.

**Dónde:** `src/auth/auth.service.ts` (método `register`)

**Qué usar:**
- Librería: `bcrypt`
- Método: `bcrypt.hash(contrasena, 10)` - 10 es el salt rounds
- **IMPORTANTE:** Hashear **ANTES** de pasar a `createUsuario()`
- **Nunca** guardar textos plano

```typescript
const hashedPassword = await bcrypt.hash(contrasena, 10);
```

---

### 21. Agregar validación de DTOs

**Descripción:**
Crea los archivos DTO (Data Transfer Objects) con validaciones usando `class-validator`. LoginDto valida correo y contraseña. CreateUsuarioDto valida nombre, correo, contraseña, y opcionales ciudad/fecha. UpdateUsuarioDto valida nombre y ciudad (sin correo ni fecha). Los DTOs garantizan que los datos recibidos son válidos antes de procesarlos. Agrega `@UseGlobalPipes(new ValidationPipe())` en main.ts para aplicar automáticamente.

**Dónde:** Crear 3 archivos nuevos

**Archivos a crear:**
- `src/auth/dtos/login.dto.ts`
- `src/auth/dtos/create-usuario.dto.ts`
- `src/usuarios/dtos/update-usuario.dto.ts`

**Qué usar:**
- Librería: `class-validator` y `class-transformer`
  ```bash
  npm install class-validator class-transformer
  ```
- Decoradores: `@IsEmail`, `@IsNotEmpty`, `@IsOptional`, `@MinLength`, `@IsString`, `@IsDate`
- Aplicar en controladores con `ValidationPipe`

---

### 22. Proteger endpoints con JwtAuthGuard

**Descripción:**
Añade `@UseGuards(JwtAuthGuard)` a los métodos del controller que requieren autenticación. En POST /usuarios NO agregar (registro público). En GET, PATCH, DELETE sí agregar para que solo usuarios autenticados puedan acceder. El guard valida que el JWT sea válido y carga el usuario en `req.user`. Puedes usar `@Req() req: Request` para acceder al usuario autenticado.

**Dónde:** `src/usuarios/usuarios.controller.ts`

**Qué usar:**
- Importar: `import { JwtAuthGuard } from '../auth/jwt-auth.guard';`
- Decorador: `@UseGuards(JwtAuthGuard)` en cada método protegido
- Aplicar en: `GET /:id`, `PATCH /:id`, `DELETE /:id`
- **NO** aplicar en: `POST /usuarios` (registro público)

```typescript
@UseGuards(JwtAuthGuard)
```

---

### 23. Validar que actualización de usuario no cambie email ni fecha de nacimiento

**Descripción:**
Garantiza que los usuarios no puedan cambiar su email o fecha de nacimiento durante una actualización. La forma más simple es crear UpdateUsuarioDto con SOLO los campos nombre y ciudad (sin correo ni fechaNacimiento). Como fallback, en el servicio/controller puedes validar: si el DTO contiene correo o fechaNacimiento, lanzar BadRequestException. Esto protege la integridad de datos críticos.

**Dónde:** `UpdateUsuarioDto` o en el método `updateUser` del controller

**Qué usar:**
- **Opción 1 (DTO):** Solo incluir `nombre` y `ciudad` en `UpdateUsuarioDto`
- **Opción 2 (controller/service):** Validar que no incluya `correo` ni `fechaNacimiento`

```typescript
if (updateUsuarioDto.correo || updateUsuarioDto.fechaNacimiento) {
  throw new BadRequestException('No puedes actualizar el correo o fecha de nacimiento');
}
```

---
