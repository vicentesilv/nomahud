import { useState, useEffect, useRef, type FormEvent } from 'react';
import api from '../../services/api';
import VisorDocumentos from './VisorDocumentos';
import mammoth from 'mammoth/mammoth.browser.js';
import * as XLSX from 'xlsx';

interface Documento {
  id: number;
  nombre: string;
  tipo: 'proyecto' | 'viaje';
  entidadId: number | null;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Proyecto { id: number; nombre: string }
interface Viaje { id: number; destino: string }

export default function ListaDocumentos() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTipo, setUploadTipo] = useState<'proyecto' | 'viaje'>('proyecto');
  const [uploadEntidad, setUploadEntidad] = useState('');
  const [uploadNombre, setUploadNombre] = useState('');
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [entidadesLoading, setEntidadesLoading] = useState(false);

  useEffect(() => {
    setEntidadesLoading(true);
    Promise.all([
      api.get('/proyectos').then(({ data }) => setProyectos(data)).catch(() => {}),
      api.get('/viajes').then(({ data }) => setViajes(data)).catch(() => {}),
    ]).then(() => setEntidadesLoading(false));
  }, []);

  const cargar = () => {
    setLoading(true);
    const params = filtro ? `?tipo=${filtro}` : '';
    api.get(`/documentos${params}`).then(({ data }) => {
      setDocs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtro]);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', uploadTipo);
    if (uploadEntidad) formData.append('entidadId', uploadEntidad);
    if (uploadNombre) formData.append('nombre', uploadNombre);
    try {
      await api.post('/documentos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadEntidad('');
      setUploadNombre('');
      if (fileRef.current) fileRef.current.value = '';
      cargar();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Error al subir archivo');
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.delete(`/documentos/${id}`);
      cargar();
    } catch {}
  };

  const descargar = async (doc: Documento) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/documentos/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al descargar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setMsg('Error al descargar el archivo');
    }
  };

  type VisorMode = 'cerrado' | 'modal' | 'pagina';

  const [visorDoc, setVisorDoc] = useState<Documento | null>(null);
  const [visorUrl, setVisorUrl] = useState<string | null>(null);
  const [visorHtml, setVisorHtml] = useState<string | null>(null);
  const [visorLoading, setVisorLoading] = useState(false);
  const [visorError, setVisorError] = useState('');
  const [visorMode, setVisorMode] = useState<VisorMode>('cerrado');
  const [visorKey, setVisorKey] = useState(0);

  const verDocumento = async (doc: Documento) => {
    setVisorHtml(null);
    setVisorError('');
    const mime = doc.mimeType || '';
    const esImagen = mime.startsWith('image/');
    const ext = doc.nombre.split('.').pop()?.toLowerCase();
    const esOffice = ext === 'docx' || ext === 'xlsx' || ext === 'pptx';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/documentos/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al descargar el archivo');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVisorUrl(url);
      setVisorDoc(doc);

      if (esOffice) {
        setVisorMode('pagina');
        setVisorLoading(true);
        try {
          const ext = doc.nombre.split('.').pop()?.toLowerCase();
          if (ext === 'docx') {
            const buf = await blob.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: buf });
            setVisorHtml(result.value);
          } else if (ext === 'xlsx') {
            const buf = await blob.arrayBuffer();
            const workbook = XLSX.read(buf, { type: 'array' });
            let html = '';
            workbook.SheetNames.forEach((name) => {
              const sheet = workbook.Sheets[name];
              html += `<h4 style="color:var(--accent);margin:0.5rem 0">${name}</h4>`;
              html += XLSX.utils.sheet_to_html(sheet, { id: `sheet-${name}` });
            });
            setVisorHtml(html);
          } else if (ext === 'pptx') {
            const buf = await blob.arrayBuffer();
            const { default: JSZip } = await import('jszip');
            const zip = await JSZip.loadAsync(buf);
            const slideFiles = Object.keys(zip.files)
              .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
              .sort();
            let html = '';
            for (const f of slideFiles) {
              const slideXml = await zip.file(f)!.async('string');
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(slideXml, 'text/xml');
              const tNodes = xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't');
              const slideNum = f.match(/\d+/)?.[0] || '0';
              html += `<h4 style="color:var(--accent);margin:0.5rem 0">Diapositiva ${slideNum}</h4>`;
              html += '<div style="margin-bottom:1rem;padding:1rem;border:1px solid #555;border-radius:8px;background:#fff;color:#111;font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5">';
              let hasContent = false;
              for (const el of Array.from(tNodes)) {
                const text = el.textContent || '';
                if (text.trim()) {
                  html += `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                  hasContent = true;
                }
              }
              if (!hasContent) html += '<p style="color:var(--text-muted);font-style:italic">(Diapositiva vacía)</p>';
              html += '</div>';
            }
            setVisorHtml(html);
          }
        } catch (e: any) {
          setVisorError('Error al procesar el documento: ' + (e.message || ''));
        }
        setVisorLoading(false);
      } else if (esImagen) {
        setVisorMode('modal');
      } else {
        setVisorMode('pagina');
      }
    } catch (e: any) {
      setMsg(e.message || 'Error al cargar el archivo');
      setVisorLoading(false);
    }
  };

  const cerrarVisor = () => {
    if (visorUrl) URL.revokeObjectURL(visorUrl);
    setVisorUrl(null);
    setVisorDoc(null);
    setVisorHtml(null);
    setVisorError('');
    setVisorMode('cerrado');
    setVisorKey((k) => k + 1);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <>
    {visorMode === 'pagina' && visorDoc && visorUrl ? (
      <VisorDocumentos
        key={visorKey}
        doc={visorDoc}
        url={visorUrl}
        html={visorHtml}
        loading={visorLoading}
        error={visorError}
        mode="pagina"
        onClose={cerrarVisor}
        onDownload={descargar}
        onSaved={cargar}
      />
    ) : (
    <div>
      <div className="page-header">
        <h1>Documentos</h1>
      </div>

      {msg && <div className="error-msg">{msg}</div>}

      <div className="perfil-section">
        <h3>Subir documento</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="field-row">
            <div className="field" style={{ flex: 1 }}>
              <label>Archivo *</label>
              <input type="file" ref={fileRef} required />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Tipo</label>
              <select value={uploadTipo} onChange={(e) => { setUploadTipo(e.target.value as 'proyecto' | 'viaje'); setUploadEntidad(''); }}>
                <option value="proyecto">Proyecto</option>
                <option value="viaje">Viaje</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>{uploadTipo === 'proyecto' ? 'Proyecto' : 'Viaje'}</label>
            <select value={uploadEntidad} onChange={(e) => setUploadEntidad(e.target.value)}>
              <option value="">— Sin asignar —</option>
              {entidadesLoading && <option disabled>Cargando...</option>}
              {uploadTipo === 'proyecto'
                ? proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)
                : viajes.map((v) => <option key={v.id} value={v.id}>{v.destino}</option>)
              }
            </select>
          </div>
          <div className="field">
            <label>Nombre personalizado (opcional)</label>
            <input value={uploadNombre} onChange={(e) => setUploadNombre(e.target.value)} placeholder="Dejar vacío para usar el nombre del archivo" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Subir</button>
        </form>
      </div>

      <div style={{ margin: '1rem 0', display: 'flex', gap: '0.5rem' }}>
        {['', 'proyecto', 'viaje'].map((t) => (
          <button
            key={t}
            onClick={() => setFiltro(t)}
            className={filtro === t ? 'btn-primary' : 'btn-secondary'}
            style={{ width: 'auto', fontSize: '0.85rem' }}
          >
            {t === '' ? 'Todos' : t === 'proyecto' ? 'Proyectos' : 'Viajes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Cargando documentos...</div>
      ) : docs.length === 0 ? (
        <div className="perfil-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay documentos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {docs.map((doc) => (
            <div key={doc.id} className="perfil-section" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong
                      onClick={() => verDocumento(doc)}
                      style={{ cursor: 'pointer', color: 'var(--accent)' }}
                    >
                      {doc.nombre}
                    </strong>
                    <span style={{
                      fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px',
                      border: '1px solid var(--accent)', color: 'var(--accent)',
                    }}>
                      {doc.tipo}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString()}
                    {doc.entidadId && (
                      ` · ${doc.tipo === 'proyecto'
                        ? proyectos.find(p => p.id === doc.entidadId)?.nombre || `ID: ${doc.entidadId}`
                        : viajes.find(v => v.id === doc.entidadId)?.destino || `ID: ${doc.entidadId}`
                      }`
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => descargar(doc)} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}>
                    Descargar
                  </button>
                  <button onClick={() => eliminar(doc.id)} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto', color: 'var(--error)' }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    )}

      {visorMode === 'modal' && visorDoc && visorUrl && (
        <VisorDocumentos
          key={visorKey}
          doc={visorDoc}
          url={visorUrl}
          html={visorHtml}
          loading={visorLoading}
          error={visorError}
          mode="modal"
          onClose={cerrarVisor}
          onDownload={descargar}
          onSaved={cargar}
        />
      )}
    </>
  );
}
