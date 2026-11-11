import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';
import api, { backendUrl } from '../../services/api';

interface Documento {
  id: number;
  nombre: string;
  tipo: 'proyecto' | 'viaje';
  entidadId: number | null;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Props {
  doc: Documento;
  url: string;
  html: string | null;
  loading: boolean;
  error: string;
  mode: 'modal' | 'pagina';
  onClose: () => void;
  onDownload: (d: Documento) => void;
  onSaved: () => void;
}

export default function VisorDocumentos({ doc, url, html, loading, error, mode, onClose, onDownload, onSaved }: Props) {
  const [editando, setEditando] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editWorkbook, setEditWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [editPptx, setEditPptx] = useState<{ buffer: ArrayBuffer; slideFiles: string[]; slideContents: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [zoom, setZoom] = useState(100);
  const [wordCount, setWordCount] = useState(0);
  const [paginasExtra, setPaginasExtra] = useState(0);
  const [paginaSeleccionada, setPaginaSeleccionada] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ext = doc.nombre.split('.').pop()?.toLowerCase();
  const mime = doc.mimeType || '';
  const esImagen = mime.startsWith('image/');
  const esTexto = mime.startsWith('text/');
  const esDocx = ext === 'docx';
  const esXlsx = ext === 'xlsx';
  const esPptx = ext === 'pptx';

  const htmlSeguro = useMemo(() => (html ? DOMPurify.sanitize(html) : null), [html]);

  const iniciarEdicion = useCallback(async () => {
    setEditMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(backendUrl(`/documentos/${doc.id}/download`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Descarga falló (${res.status})`);
      const blob = await res.blob();
      if (esXlsx) {
        const buf = await blob.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        setEditWorkbook(wb);
      } else if (esPptx) {
        const buf = await blob.arrayBuffer();
        const { default: JSZip } = await import('jszip');
        const zip = await JSZip.loadAsync(buf.slice(0));
        const slideFiles = Object.keys(zip.files)
          .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
          .sort();
        const slideContents: string[] = [];
        for (const f of slideFiles) {
          const xml = await zip.file(f)!.async('string');
          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, 'text/xml');
          const tNodes = doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't');
          slideContents.push(Array.from(tNodes).map(el => el.textContent || '').join('\n'));
        }
        setEditPptx({ buffer: buf, slideFiles, slideContents });
      } else if (esTexto) {
        const text = await blob.text();
        setEditContent(text);
      }
      setEditando(true);
    } catch {
      setEditMsg('Error al cargar el archivo para edición');
    }
  }, [doc.id, esTexto, esXlsx, esPptx]);

  useEffect(() => {
    setEditando(false);
    setEditContent('');
    setEditWorkbook(null);
    setEditPptx(null);
    setEditMsg('');
    setZoom(100);
    setWordCount(0);
    setPaginasExtra(0);
    setPaginaSeleccionada(0);
  }, [doc.id]);

  useEffect(() => {
    if (editando && esDocx && editorRef.current && !editorRef.current.dataset.inicializado) {
      const contenido = htmlSeguro || '<p></p>';
      editorRef.current.innerHTML = `<div class="documento-pagina-a4 documento-pagina-inicial" contenteditable="true" aria-label="Página 1">${contenido}</div>`;
      editorRef.current.dataset.inicializado = 'true';
      actualizarEstadisticas();
    }
  }, [editando, esDocx, htmlSeguro]);

  const cancelarEdicion = () => {
    setEditando(false);
    setEditContent('');
    setEditWorkbook(null);
    setEditPptx(null);
    setEditMsg('');
    if (editorRef.current) delete editorRef.current.dataset.inicializado;
  };

  const aplicarFormato = (comando: string, valor?: string) => {
    editorRef.current?.focus();
    document.execCommand(comando, false, valor);
  };

  const insertarEnlace = () => {
    const url = window.prompt('URL del enlace');
    if (url && /^(https?:|mailto:)/i.test(url)) aplicarFormato('createLink', url);
  };

  const actualizarEstadisticas = () => {
    const text = editorRef.current?.innerText || '';
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const agregarHoja = () => {
    if (!editorRef.current) return;
    const hoja = document.createElement('div');
    hoja.className = 'documento-pagina-a4 documento-pagina-nueva';
    hoja.contentEditable = 'true';
    hoja.setAttribute('aria-label', 'Nueva hoja del documento');
    hoja.innerHTML = '<p><br></p>';
    editorRef.current.appendChild(hoja);
    setPaginasExtra((cantidad) => cantidad + 1);
    setPaginaSeleccionada(paginasExtra + 1);
    hoja.focus();
  };

  const eliminarHoja = (index: number) => {
    if (!editorRef.current || index === 0) return;
    const hoja = editorRef.current.querySelectorAll('.documento-pagina-nueva')[index - 1];
    hoja?.remove();
    setPaginasExtra((cantidad) => Math.max(0, cantidad - 1));
    setPaginaSeleccionada((actual) => actual >= index ? Math.max(0, actual - 1) : actual);
  };

  const renderPanelPaginas = () => {
    if (!editando || !esDocx) return null;
    const paginas = 1 + paginasExtra;
    return (
      <aside className="documento-panel-paginas" aria-label="Miniaturas de páginas">
        <div className="documento-panel-paginas-titulo">Páginas</div>
        {Array.from({ length: paginas }, (_, index) => (
          <div key={index} className="documento-miniatura-item">
            <button
              type="button"
              className={`documento-miniatura ${index === paginaSeleccionada ? 'activa' : ''}`}
              title={`Ir a la página ${index + 1}`}
              onClick={() => {
                const pagina = index === 0
                  ? editorRef.current
                  : editorRef.current?.querySelectorAll('.documento-pagina-nueva')[index - 1];
                if (pagina instanceof HTMLElement) {
                  setPaginaSeleccionada(index);
                  pagina.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  pagina.focus();
                }
              }}
            >
              <span className="documento-miniatura-hoja">
                <span className="documento-miniatura-linea larga" />
                <span className="documento-miniatura-linea" />
                <span className="documento-miniatura-linea" />
                <span className="documento-miniatura-linea corta" />
                <span className="documento-miniatura-numero">{index + 1}</span>
              </span>
              <span className="documento-miniatura-etiqueta">Página {index + 1}</span>
            </button>
            {index > 0 && (
              <button type="button" className="documento-eliminar-pagina" title={`Eliminar página ${index + 1}`} aria-label={`Eliminar página ${index + 1}`} onClick={() => eliminarHoja(index)}>×</button>
            )}
          </div>
        ))}
        <button type="button" className="documento-agregar-hoja" onClick={agregarHoja}>
          <span>＋</span>
          Agregar página
        </button>
      </aside>
    );
  };

  const renderBarraFormato = () => {
    if (!editando || !esDocx) return null;
    const accion = (comando: string, etiqueta: string, icono: string) => (
      <button
        type="button"
        className="documento-formato-btn"
        title={etiqueta}
        aria-label={etiqueta}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => aplicarFormato(comando)}
      >
        {icono}
      </button>
    );
    return (
      <div className="documento-formato-barra" role="toolbar" aria-label="Herramientas de formato">
        <select
          className="documento-formato-select"
          aria-label="Estilo de texto"
          defaultValue="p"
          onChange={(e) => aplicarFormato('formatBlock', e.target.value)}
        >
          <option value="p">Texto normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="blockquote">Cita</option>
        </select>
        <span className="documento-formato-separador" />
        {accion('bold', 'Negrita', 'B')}
        {accion('italic', 'Cursiva', 'I')}
        {accion('underline', 'Subrayado', 'U')}
        <span className="documento-formato-separador" />
        {accion('insertUnorderedList', 'Lista con viñetas', '•')}
        {accion('insertOrderedList', 'Lista numerada', '1.')}
        {accion('justifyLeft', 'Alinear a la izquierda', '≡')}
        {accion('justifyCenter', 'Centrar', '≡')}
        {accion('justifyRight', 'Alinear a la derecha', '≡')}
        <span className="documento-formato-separador" />
        {accion('undo', 'Deshacer', '↶')}
        {accion('redo', 'Rehacer', '↷')}
        <button type="button" className="documento-formato-btn documento-formato-enlace" title="Insertar enlace" aria-label="Insertar enlace" onMouseDown={(e) => e.preventDefault()} onClick={insertarEnlace}>↗</button>
        <span className="documento-formato-spacer" />
        <button type="button" className="documento-formato-btn" title="Reducir zoom" aria-label="Reducir zoom" onClick={() => setZoom((value) => Math.max(75, value - 10))}>−</button>
        <span className="documento-zoom-label">{zoom}%</span>
        <button type="button" className="documento-formato-btn" title="Aumentar zoom" aria-label="Aumentar zoom" onClick={() => setZoom((value) => Math.min(150, value + 10))}>＋</button>
      </div>
    );
  };

  const guardar = async () => {
    setSaving(true);
    setEditMsg('');
    try {
      let blob: Blob;
      if (esTexto) {
        const text = editContent || (editorRef.current?.textContent || '');
        blob = new Blob([text], { type: mime || 'text/plain' });
      } else if (esXlsx && editWorkbook) {
        const wbout = XLSX.write(editWorkbook, { bookType: 'xlsx', type: 'array' });
        blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else if (esPptx && editPptx) {
        const { default: JSZip } = await import('jszip');
        const zip = await JSZip.loadAsync(editPptx.buffer.slice(0));
        if (editorRef.current) {
          const slideEls = editorRef.current.querySelectorAll('[data-slide]');
          for (let i = 0; i < editPptx.slideFiles.length; i++) {
            const el = slideEls[i] as HTMLElement | undefined;
            if (!el) continue;
            const lines = (el.textContent || '').split('\n');
            const xml = await zip.file(editPptx.slideFiles[i])!.async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            const tNodes = Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't'));
            tNodes.forEach((node, idx) => {
              node.textContent = idx < lines.length ? lines[idx] : '';
            });
            const serializer = new XMLSerializer();
            zip.file(editPptx.slideFiles[i], serializer.serializeToString(xmlDoc));
          }
        }
        blob = await zip.generateAsync({ type: 'blob' });
      } else if (esDocx) {
        const content = editorRef.current?.innerHTML || '';
        const docx = await import('docx');

        const children: any[] = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;

        const parseNode = (node: Node): any[] => {
          const results: any[] = [];
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent || '';
              if (text.trim()) results.push(new docx.TextRun({ text }));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const el = child as HTMLElement;
              const tag = el.tagName.toLowerCase();

              const getTextRuns = (parent: HTMLElement): any[] => {
                const runs: any[] = [];
                for (const c of Array.from(parent.childNodes)) {
                  if (c.nodeType === Node.TEXT_NODE && (c.textContent || '').trim()) {
                    runs.push(new docx.TextRun({ text: c.textContent || '' }));
                  } else if (c.nodeType === Node.ELEMENT_NODE) {
                    const ce = c as HTMLElement;
                    const opts: any = { text: ce.textContent || '' };
                    if (ce.tagName === 'B' || ce.tagName === 'STRONG') opts.bold = true;
                    if (ce.tagName === 'I' || ce.tagName === 'EM') opts.italics = true;
                    if (ce.tagName === 'U') opts.underline = { type: docx.UnderlineType.SINGLE };
                    if (ce.tagName === 'A') {
                      const href = (ce as HTMLAnchorElement).getAttribute('href') || '';
                      if (/^(https?:|mailto:)/i.test(href)) opts.link = href;
                    }
                    if (opts.text.trim()) runs.push(new docx.TextRun(opts));
                  }
                }
                return runs;
              };

              if (tag === 'p') {
                children.push(new docx.Paragraph({ children: getTextRuns(el) }));
              } else if (/^h[1-6]$/.test(tag)) {
                const level = parseInt(tag[1]) as 1|2|3|4|5|6;
                const headingLevels = [undefined, docx.HeadingLevel.HEADING_1, docx.HeadingLevel.HEADING_2, docx.HeadingLevel.HEADING_3, docx.HeadingLevel.HEADING_4, docx.HeadingLevel.HEADING_5, docx.HeadingLevel.HEADING_6];
                children.push(new docx.Paragraph({
                  children: getTextRuns(el),
                  heading: headingLevels[level] || undefined,
                }));
              } else if (tag === 'ul' || tag === 'ol') {
                for (const li of Array.from(el.children)) {
                  if (li.tagName === 'LI') {
                    children.push(new docx.Paragraph({
                      children: [
                        new docx.TextRun({ text: tag === 'ol' ? `${Array.from(el.children).indexOf(li) + 1}. ` : '• ' }),
                        ...getTextRuns(li as HTMLElement),
                      ],
                    }));
                  }
                }
              } else if (tag === 'table') {
                const rows: any[] = [];
                for (const tr of Array.from(el.querySelectorAll('tr'))) {
                  const cells: any[] = [];
                  for (const td of Array.from(tr.querySelectorAll('td,th'))) {
                    cells.push(new docx.TableCell({
                      children: [new docx.Paragraph({ children: getTextRuns(td as HTMLElement) })],
                      shading: td.tagName === 'TH' ? { fill: 'E0E0E0' } : undefined,
                    }));
                  }
                  rows.push(new docx.TableRow({ children: cells }));
                }
                if (rows.length) children.push(new docx.Table({ rows }));
              } else {
                children.push(...parseNode(el));
              }
            }
          }
          return results;
        };

        parseNode(tempDiv);

        const docxDoc = new docx.Document({
          sections: [{ children }],
        });

        blob = await docx.Packer.toBlob(docxDoc);
      } else {
        throw new Error('Edición no soportada para este tipo de archivo');
      }

      const formData = new FormData();
      formData.append('archivo', blob, doc.nombre);
      await api.put(`/documentos/${doc.id}/archivo`, formData);
      setEditando(false);
      onSaved();
    } catch (e: any) {
      setEditMsg(e.message || 'Error al guardar');
    }
    setSaving(false);
  };

  const actualizarCeldaXLSX = (sheetIdx: number, row: number, col: number, value: string) => {
    if (!editWorkbook) return;
    const sheet = editWorkbook.Sheets[editWorkbook.SheetNames[sheetIdx]];
    const ref = XLSX.utils.encode_cell({ r: row, c: col });
    sheet[ref] = { t: 's', v: value };
    setEditWorkbook({ ...editWorkbook });
  };

  const renderContenido = () => {
    if (editando && esTexto) {
      return (
        <textarea
          ref={textareaRef}
          defaultValue={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="documento-editor documento-editor-texto"
        />
      );
    }

    if (editando && esDocx) {
      return (
        <div
          ref={editorRef}
          className="documento-editor documento-editor-docx documento-documento-a4"
          onInput={actualizarEstadisticas}
          style={{ zoom: `${zoom}%` }}
          role="document"
          aria-label="Documento DOCX"
        />
      );
    }

    if (editando && esXlsx && editWorkbook) {
      return (
        <div style={{ overflow: 'auto', width: '100%' }}>
          {editWorkbook.SheetNames.map((name, si) => {
            const sheet = editWorkbook.Sheets[name];
            const ref = sheet['!ref'];
            if (!ref) return null;
            const range = XLSX.utils.decode_range(ref);
            return (
              <div key={name} style={{ marginBottom: '1.5rem' }}>
                <h4 className="documento-editor-hoja-titulo">{name}</h4>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <tbody>
                    {Array.from({ length: range.e.r - range.s.r + 1 }, (_, ri) => (
                      <tr key={ri}>
                        {Array.from({ length: range.e.c - range.s.c + 1 }, (_, ci) => {
                          const addr = XLSX.utils.encode_cell({ r: range.s.r + ri, c: range.s.c + ci });
                          const cell = sheet[addr];
                          const val = cell ? cell.v : '';
                          return (
                            <td key={addr} style={{
                              border: '1px solid #555', padding: '0.3rem 0.5rem',
                              minWidth: '80px',
                            }}>
                              <input
                                value={val}
                                onChange={(e) => actualizarCeldaXLSX(si, range.s.r + ri, range.s.c + ci, e.target.value)}
                                style={{
                                  background: 'transparent', border: 'none',
                                  color: '#e0e0e0', width: '100%', outline: 'none',
                                  fontFamily: 'monospace', fontSize: '0.85rem',
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      );
    }

    if (editando && esPptx && editPptx) {
      return (
        <div ref={editorRef} style={{ overflow: 'auto', width: '100%' }}>
          {editPptx.slideContents.map((content, i) => (
            <div key={i} style={{ marginBottom: '1.5rem' }}>
                  <h4 className="documento-editor-hoja-titulo">Diapositiva {i + 1}</h4>
              <div
                contentEditable
                suppressContentEditableWarning
                data-slide={i}
                className="documento-editor documento-editor-slide"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.replace(/\n/g, '<br>')) }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (loading) return <div className="loading">Procesando documento...</div>;
    if (error) return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--error)' }}>
        <p>{error}</p>
      </div>
    );
    if (htmlSeguro) return (
      <div
        className="office-preview"
        dangerouslySetInnerHTML={{ __html: htmlSeguro }}
        style={{ width: '100%', maxWidth: '100%' }}
      />
    );
    if (esImagen)
      return <img src={url} alt={doc.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
    if (mime === 'application/pdf')
      return <iframe src={url} title={doc.nombre} style={{ width: '100%', height: '100%', border: 'none' }} />;
    if (esTexto)
      return <object data={url} type={mime} style={{ width: '100%', height: '100%', background: '#0d0d0d' }} />;
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '1rem' }}>Vista previa no disponible para este tipo de archivo.</p>
        <button onClick={() => onDownload(doc)} className="btn-primary" style={{ width: 'auto' }}>
          Descargar archivo
        </button>
      </div>
    );
  };

  const puedeEditar = esTexto || esDocx || esXlsx || esPptx;

  return mode === 'pagina' ? (
    <div className="visor-pagina">
      <div className={`visor-toolbar ${editando ? 'visor-toolbar-editando' : ''}`}>
        <div className="visor-identidad">
          <strong className="visor-titulo">{doc.nombre}</strong>
          <span className="visor-tipo">{ext?.toUpperCase() || 'ARCHIVO'}</span>
          {editando && <span className="visor-estado-edicion"><span className="visor-estado-punto" /> Editando</span>}
        </div>
        <div className="visor-acciones">
          {editMsg && <span className="visor-msg">{editMsg}</span>}
          {saving && <span className="visor-guardando">Guardando cambios...</span>}
          {editando ? (
            <>
              <button onClick={guardar} disabled={saving} className="btn-primary visor-btn-guardar">
                Guardar
              </button>
              <button onClick={cancelarEdicion} disabled={saving} className="btn-secondary visor-btn-edicion">
                Cancelar
              </button>
            </>
          ) : (
            <>
              {puedeEditar && (
                <button onClick={iniciarEdicion} className="btn-secondary visor-btn-edicion">
                  Editar
                </button>
              )}
              <button onClick={() => onDownload(doc)} className="btn-secondary visor-btn-edicion">
                Descargar
              </button>
            </>
          )}
          <button onClick={onClose} className="btn-secondary visor-btn-edicion">
            Volver
          </button>
        </div>
      </div>
      {renderBarraFormato()}
      <div className={`visor-editor-layout ${editando && esDocx ? 'visor-editor-con-panel' : ''}`}>
        <div className={`visor-contenido ${editando ? 'visor-contenido-editando' : ''}`}>
          {renderContenido()}
        </div>
        {renderPanelPaginas()}
      </div>
      {editando && esDocx && (
        <div className="documento-editor-estado">
          <span>{wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}</span>
          <span>{zoom}% de zoom</span>
          <span>Los cambios se guardan al pulsar Guardar</span>
        </div>
      )}
    </div>
  ) : (
    <div className="visor-modal-overlay" onClick={onClose}>
      <div className="visor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="visor-modal-header">
          <strong className="visor-titulo">{doc.nombre}</strong>
          <button onClick={onClose} className="btn-icon-only" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="visor-contenido">
          {renderContenido()}
        </div>
      </div>
    </div>
  );
}
