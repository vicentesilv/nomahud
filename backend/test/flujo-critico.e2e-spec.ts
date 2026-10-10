import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from './../src/app.module';
import { Usuario } from '../src/usuarios/entitys/usuarios.entity';
import { MailService } from '../src/mail/mail.service';

process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3308';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_NAME = 'nomadhud_e2e';
process.env.JWT_SECRET = 'e2e-secret-min-32-chars-para-tests';
process.env.JWT_EXPIRES_IN = '24h';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.SMTP_HOST = '';
process.env.BREVO_API_KEY = '';

describe('Flujo crítico (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let usuarios: Repository<Usuario>;
  let ultimoEnlaceInvitacion = '';

  const mails: Array<{ to: string; context: Record<string, unknown> }> = [];
  const mailFake = {
    sendMail: jest.fn(async (to: string, _s: string, _t: string, context: Record<string, unknown>) => {
      mails.push({ to, context });
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mailFake)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    usuarios = app.get(getRepositoryToken(Usuario));
  }, 120000);

  afterAll(async () => {
    await app.close();
  });

  const password = 'E2e123456';
  let token = '';
  let refreshToken = '';
  let proyectoId = 0;
  let tareaId = 0;

  it('registra usuario', async () => {
    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'E2E', correo: 'e2e@test.com', contrasena: password })
      .expect(201);
  });

  it('verifica email vía repositorio e inicia sesión con refresh', async () => {
    const user = await usuarios.findOneByOrFail({ correo: 'e2e@test.com' });
    user.emailVerificado = true;
    user.estadoCuenta = 'activa';
    await usuarios.save(user);

    const res = await request(app.getHttpServer())
      .post('/auth/inicio-sesion')
      .send({ correo: 'e2e@test.com', contrasena: password })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    token = res.body.token;
    refreshToken = res.body.refreshToken;
  });

  it('renueva la sesión y revoca el refresh anterior', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/renovar')
      .send({ refreshToken })
      .expect(201);

    expect(res.body.token).toBeDefined();
    token = res.body.token;
    refreshToken = res.body.refreshToken;

    await request(app.getHttpServer()).post('/auth/renovar').send({ refreshToken: 'token-invalido-123' }).expect(401);
  });

  it('crea proyecto, tarea, la completa y genera tiempo automático', async () => {
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

    const p = await auth(request(app.getHttpServer()).post('/proyectos'))
      .send({ nombre: 'Proyecto E2E' })
      .expect(201);
    proyectoId = p.body.id;

    const t = await auth(request(app.getHttpServer()).post('/tareas'))
      .send({ titulo: 'Tarea E2E', proyectoId, estimacionHoras: 2 })
      .expect(201);
    tareaId = t.body.id;

    await auth(request(app.getHttpServer()).patch(`/tareas/${tareaId}`))
      .send({ estado: 'completada' })
      .expect(200);

    const tiempos = await auth(request(app.getHttpServer()).get('/tiempo')).expect(200);
    expect(tiempos.body.datos.length).toBeGreaterThanOrEqual(1);
  });

  it('registra transacción y ve resumen', async () => {
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

    await auth(request(app.getHttpServer()).post('/finanzas'))
      .send({ tipo: 'ingreso', categoria: 'Test', monto: 500, fecha: '2026-01-01', proyectoId })
      .expect(201);

    const resumen = await auth(request(app.getHttpServer()).get('/finanzas/resumen')).expect(200);
    expect(Number(resumen.body.totalIngresos)).toBeGreaterThanOrEqual(500);

    const pagina = await auth(request(app.getHttpServer()).get('/finanzas?page=1&limit=1')).expect(200);
    expect(pagina.body.datos.length).toBeLessThanOrEqual(1);
    expect(pagina.body.total).toBeGreaterThanOrEqual(1);
  });

  it('invita a un segundo usuario y este acepta', async () => {
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'E2E Dos', correo: 'e2e2@test.com', contrasena: password })
      .expect(201);
    const user2 = await usuarios.findOneByOrFail({ correo: 'e2e2@test.com' });
    user2.emailVerificado = true;
    user2.estadoCuenta = 'activa';
    await usuarios.save(user2);

    await auth(request(app.getHttpServer()).post(`/proyectos/${proyectoId}/invitar`))
      .send({ email: 'e2e2@test.com', rol: 'editor' })
      .expect(201);

    const invitacion = mails.find((m) => m.to === 'e2e2@test.com' && typeof m.context.enlace === 'string');
    expect(invitacion).toBeDefined();
    ultimoEnlaceInvitacion = String((invitacion as { context: Record<string, string> }).context.enlace);
    const invToken = new URL(ultimoEnlaceInvitacion).searchParams.get('token');
    expect(invToken).toBeTruthy();

    const login2 = await request(app.getHttpServer())
      .post('/auth/inicio-sesion')
      .send({ correo: 'e2e2@test.com', contrasena: password })
      .expect(201);

    const aceptada = await request(app.getHttpServer())
      .post('/proyectos/invitaciones/aceptar')
      .set('Authorization', `Bearer ${login2.body.token}`)
      .send({ token: invToken })
      .expect(201);
    expect(aceptada.body.id).toBe(proyectoId);

    const miembros = await auth(request(app.getHttpServer()).get(`/proyectos/${proyectoId}/miembros`)).expect(200);
    expect(miembros.body.miembros.length).toBe(1);
    const miembroId = miembros.body.miembros[0].usuarioId;

    await auth(request(app.getHttpServer()).patch(`/proyectos/${proyectoId}/miembros/${miembroId}`))
      .send({ rol: 'lector' })
      .expect(200);
    const trasCambio = await auth(request(app.getHttpServer()).get(`/proyectos/${proyectoId}/miembros`)).expect(200);
    expect(trasCambio.body.miembros[0].rol).toBe('lector');

    const authMiembro = (r: request.Test) => r.set('Authorization', `Bearer ${login2.body.token}`);
    await authMiembro(request(app.getHttpServer()).post(`/proyectos/${proyectoId}/invitar`))
      .send({ email: 'otro@test.com', rol: 'lector' })
      .expect(404);
    await authMiembro(request(app.getHttpServer()).patch(`/proyectos/${proyectoId}/miembros/${miembroId}`))
      .send({ rol: 'editor' })
      .expect(404);
  });

  it('invitado: se registra por link, queda limitado y luego sube a normal', async () => {
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

    await auth(request(app.getHttpServer()).post(`/proyectos/${proyectoId}/invitar`))
      .send({ email: 'invitado3@test.com', rol: 'lector' })
      .expect(201);

    const invitacion = mails.find((m) => m.to === 'invitado3@test.com' && typeof m.context.enlace === 'string');
    expect(invitacion).toBeDefined();
    const invToken = new URL(String((invitacion as { context: Record<string, string> }).context.enlace)).searchParams.get('token');
    expect(invToken).toBeTruthy();

    const reg = await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Invitado Tres', correo: 'invitado3@test.com', contrasena: password, invitacionToken: invToken })
      .expect(201);
    expect(reg.body.usuario.rol).toBe('invitado');
    expect(reg.body.token).toBeDefined();
    const tokenInvitado = reg.body.token as string;

    const authInv = (r: request.Test) => r.set('Authorization', `Bearer ${tokenInvitado}`);
    await authInv(request(app.getHttpServer()).get('/proyectos')).expect(200);
    await authInv(request(app.getHttpServer()).post('/proyectos')).send({ nombre: 'No permitido' }).expect(403);
    await authInv(request(app.getHttpServer()).get('/finanzas')).expect(403);
    await authInv(request(app.getHttpServer()).get('/dashboard')).expect(403);

    const upgrade = await authInv(request(app.getHttpServer()).post('/auth/completar-registro')).expect(201);
    expect(upgrade.body.usuario.rol).toBe('normal');

    const relogin = await request(app.getHttpServer())
      .post('/auth/inicio-sesion')
      .send({ correo: 'invitado3@test.com', contrasena: password })
      .expect(201);
    expect(relogin.body.usuario.rol).toBe('normal');
    await request(app.getHttpServer())
      .post('/proyectos')
      .set('Authorization', `Bearer ${relogin.body.token}`)
      .send({ nombre: 'Proyecto propio del ex-invitado' })
      .expect(201);
  });

  it('cierra sesión y el refresh queda revocado', async () => {
    await request(app.getHttpServer())
      .post('/auth/cerrar-sesion')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken })
      .expect(201);

    await request(app.getHttpServer()).post('/auth/renovar').send({ refreshToken }).expect(401);
  });

  it('/salud responde ok', async () => {
    const res = await request(app.getHttpServer()).get('/salud').expect(200);
    expect(res.body.db).toBe(true);
  });
});
