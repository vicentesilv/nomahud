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

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function iconoDocumento(mime: string, ext: string) {
  if (mime.startsWith('image/')) return '🖼';
  if (ext === 'pdf') return '📄';
  if (ext === 'docx') return '📝';
  if (ext === 'xlsx') return '📊';
  if (ext === 'pptx') return '📽';
  return '📁';
}

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
    <div className="page-documentos">
      <div className="page-header">
        <h1>Documentos</h1>
      </div>

      {msg && <div className="error-msg">{msg}</div>}

      <div className="documentos-section">
        <h3>Subir documento</h3>
        <form onSubmit={handleUpload} className="documentos-upload-form">
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
          <div className="field-row">
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
              <label>Nombre (opcional)</label>
              <input value={uploadNombre} onChange={(e) => setUploadNombre(e.target.value)} placeholder="Dejar vacío para usar el nombre del archivo" />
            </div>
          </div>
          <button type="submit" className="btn-primary btn-icon" style={{ width: 'auto' }}>
            <IconUpload />
            Subir
          </button>
        </form>
      </div>

      <div className="documentos-filtros">
        {(['', 'proyecto', 'viaje'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFiltro(t)}
            className={`documentos-filtro-btn ${filtro === t ? 'active' : ''}`}
          >
            {t === '' ? 'Todos' : t === 'proyecto' ? 'Proyectos' : 'Viajes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="documentos-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-24" />
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="documentos-empty">
          <IconFile />
          <h3>No hay documentos</h3>
          <p>Subí tu primer documento para empezar.</p>
        </div>
      ) : (
        <div className="documentos-grid">
          {docs.map((doc, idx) => {
            const ext = doc.nombre.split('.').pop()?.toLowerCase() || '';
            return (
              <div key={doc.id} className="documento-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="documento-card-icon">{iconoDocumento(doc.mimeType, ext)}</div>
                <div className="documento-card-info">
                  <span
                    className="documento-card-nombre"
                    onClick={() => verDocumento(doc)}
                    title="Ver documento"
                  >
                    {doc.nombre}
                  </span>
                  <div className="documento-card-meta">
                    <span className="documento-card-type">{doc.tipo}</span>
                    <span>{formatSize(doc.size)}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    {doc.entidadId && (
                      <span>
                        {doc.tipo === 'proyecto'
                          ? proyectos.find(p => p.id === doc.entidadId)?.nombre || `ID: ${doc.entidadId}`
                          : viajes.find(v => v.id === doc.entidadId)?.destino || `ID: ${doc.entidadId}`
                        }
                      </span>
                    )}
                  </div>
                </div>
                <div className="documento-card-actions">
                  <button onClick={() => verDocumento(doc)} className="btn-icon-only-sm" title="Ver">
                    <IconEye />
                  </button>
                  <button onClick={() => descargar(doc)} className="btn-icon-only-sm" title="Descargar">
                    <IconDownload />
                  </button>
                  <button onClick={() => eliminar(doc.id)} className="btn-icon-only-sm" title="Eliminar" style={{ color: 'var(--error)' }}>
                    <IconTrash />
                  </button>
                </div>
              </div>
            );
          })}
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
