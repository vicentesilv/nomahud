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
              <Route path="/clientes" element={<ListaClientes />} />
              <Route path="/clientes/nuevo" element={<NuevoCliente />} />
              <Route path="/clientes/:id" element={<DetalleCliente />} />
            </Route>
          </Route>
          <Route path="*" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
