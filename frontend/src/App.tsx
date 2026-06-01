import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import OlvideContrasena from './pages/OlvideContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';
import MiPerfil from './pages/perfiles/MiPerfil';
import PerfilPublico from './pages/perfiles/PerfilPublico';
import ListaProyectos from './pages/proyectos/ListaProyectos';
import NuevoProyecto from './pages/proyectos/NuevoProyecto';
import DetalleProyecto from './pages/proyectos/DetalleProyecto';
import ListaClientes from './pages/clientes/ListaClientes';
import NuevoCliente from './pages/clientes/NuevoCliente';
import DetalleCliente from './pages/clientes/DetalleCliente';
import ListaFinanzas from './pages/finanzas/ListaFinanzas';
import NuevaTransaccion from './pages/finanzas/NuevaTransaccion';
import ListaTiempo from './pages/tiempo/ListaTiempo';
import NuevoRegistroTiempo from './pages/tiempo/NuevoRegistroTiempo';
import ListaViajes from './pages/viajes/ListaViajes';
import NuevoViaje from './pages/viajes/NuevoViaje';
import DetalleViaje from './pages/viajes/DetalleViaje';
import ListaDocumentos from './pages/documentos/ListaDocumentos';
import ListaTareas from './pages/tareas/ListaTareas';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/inicio-sesion" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
          <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/mi-perfil" element={<MiPerfil />} />
              <Route path="/perfiles/:id" element={<PerfilPublico />} />
              <Route path="/proyectos" element={<ListaProyectos />} />
              <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
              <Route path="/proyectos/:id" element={<DetalleProyecto />} />
              <Route path="/tareas" element={<ListaTareas />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
