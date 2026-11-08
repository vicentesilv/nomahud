import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const OlvideContrasena = lazy(() => import('./pages/OlvideContrasena'));
const RestablecerContrasena = lazy(() => import('./pages/RestablecerContrasena'));
const ConfirmarCuenta = lazy(() => import('./pages/ConfirmarCuenta'));
const MiPerfil = lazy(() => import('./pages/perfiles/MiPerfil'));
const PerfilPublico = lazy(() => import('./pages/perfiles/PerfilPublico'));
const ListaProyectos = lazy(() => import('./pages/proyectos/ListaProyectos'));
const NuevoProyecto = lazy(() => import('./pages/proyectos/NuevoProyecto'));
const DetalleProyecto = lazy(() => import('./pages/proyectos/DetalleProyecto'));
const AceptarInvitacion = lazy(() => import('./pages/proyectos/AceptarInvitacion'));
const ProyectoPublico = lazy(() => import('./pages/proyectos/ProyectoPublico'));
const ListaClientes = lazy(() => import('./pages/clientes/ListaClientes'));
const NuevoCliente = lazy(() => import('./pages/clientes/NuevoCliente'));
const DetalleCliente = lazy(() => import('./pages/clientes/DetalleCliente'));
const ListaFinanzas = lazy(() => import('./pages/finanzas/ListaFinanzas'));
const NuevaTransaccion = lazy(() => import('./pages/finanzas/NuevaTransaccion'));
const ListaTiempo = lazy(() => import('./pages/tiempo/ListaTiempo'));
const NuevoRegistroTiempo = lazy(() => import('./pages/tiempo/NuevoRegistroTiempo'));
const ListaViajes = lazy(() => import('./pages/viajes/ListaViajes'));
const NuevoViaje = lazy(() => import('./pages/viajes/NuevoViaje'));
const DetalleViaje = lazy(() => import('./pages/viajes/DetalleViaje'));
const ListaDocumentos = lazy(() => import('./pages/documentos/ListaDocumentos'));
const ListaTareas = lazy(() => import('./pages/tareas/ListaTareas'));
const Calendario = lazy(() => import('./pages/Calendario'));
const ListaDashboard = lazy(() => import('./pages/ListaDashboard'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>}>
          <Routes>
          <Route path="/inicio-sesion" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
          <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
          <Route path="/confirmar-cuenta" element={<ConfirmarCuenta />} />
          <Route path="/proyectos/invitacion" element={<AceptarInvitacion />} />
          <Route path="/proyecto-publico" element={<ProyectoPublico />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<ListaDashboard />} />
              <Route path="/mi-perfil" element={<MiPerfil />} />
              <Route path="/perfiles/:id" element={<PerfilPublico />} />
              <Route path="/proyectos" element={<ListaProyectos />} />
              <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
              <Route path="/proyectos/:id" element={<DetalleProyecto />} />
              <Route path="/tareas" element={<ListaTareas />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/clientes" element={<ListaClientes />} />
              <Route path="/clientes/nuevo" element={<NuevoCliente />} />
              <Route path="/clientes/:id" element={<DetalleCliente />} />
              <Route path="/finanzas" element={<ListaFinanzas />} />
              <Route path="/finanzas/nuevo" element={<NuevaTransaccion />} />
              <Route path="/tiempo" element={<ListaTiempo />} />
              <Route path="/tiempo/nuevo" element={<NuevoRegistroTiempo />} />
              <Route path="/viajes" element={<ListaViajes />} />
              <Route path="/viajes/nuevo" element={<NuevoViaje />} />
              <Route path="/viajes/:id" element={<DetalleViaje />} />
              <Route path="/documentos" element={<ListaDocumentos />} />
            </Route>
          </Route>
          <Route path="*" element={<Login />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
