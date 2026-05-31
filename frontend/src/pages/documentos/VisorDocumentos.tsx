import { useState, useRef, useEffect, useCallback } from 'react';
import mammoth from 'mammoth/mammoth.browser.js';
import * as XLSX from 'xlsx';
import api from '../../services/api';

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
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ext = doc.nombre.split('.').pop()?.toLowerCase();
  const mime = doc.mimeType || '';
  const esImagen = mime.startsWith('image/');
  const esTexto = mime.startsWith('text/');
  const esDocx = ext === 'docx';
  const esXlsx = ext === 'xlsx';

  const iniciarEdicion = useCallback(async () => {
    setEditMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/documentos/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      if (esXlsx) {
        const buf = await blob.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        setEditWorkbook(wb);
      } else if (esTexto) {
        const text = await blob.text();
        setEditContent(text);
      }
      setEditando(true);
    } catch {
      setEditMsg('Error al cargar el archivo para edición');
    }
  }, [doc.id, esTexto, esXlsx]);

  useEffect(() => {
    setEditando(false);
    setEditContent('');
    setEditWorkbook(null);
    setEditMsg('');
  }, [doc.id]);

  const cancelarEdicion = () => {
    setEditando(false);
    setEditContent('');
    setEditWorkbook(null);
    setEditMsg('');
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
                    if (ce.tagName === 'U') opts.underline = { type: docx.UnderlineType.single };
                    if (ce.tagName === 'A') opts.link = (ce as HTMLAnchorElement).href;
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
          style={{
            width: '100%', height: '100%', minHeight: '400px',
            background: '#0d0d0d', color: '#e0e0e0', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem',
            resize: 'none', outline: 'none',
          }}
        />
      );
    }

    if (editando && esDocx) {
      const initialHtml = html || '<p></p>';
      return (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: initialHtml }}
          style={{
            width: '100%', minHeight: '400px',
            background: '#fff', color: '#111',
            border: '1px solid var(--border)', borderRadius: '8px',
            padding: '1rem', outline: 'none',
            fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt',
            lineHeight: '1.5',
          }}
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
                <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{name}</h4>
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

    if (loading) return <div className="loading">Procesando documento...</div>;
    if (error) return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--error)' }}>
        <p>{error}</p>
      </div>
    );
    if (html) return (
      <div
        className="office-preview"
        dangerouslySetInnerHTML={{ __html: html }}
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

  const puedeEditar = esTexto || esDocx || esXlsx;

  return mode === 'pagina' ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <strong style={{ fontSize: '0.95rem' }}>{doc.nombre}</strong>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {editMsg && <span style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{editMsg}</span>}
          {saving && <span className="loading" style={{ fontSize: '0.85rem' }}>Guardando...</span>}
          {editando ? (
            <>
              <button onClick={guardar} className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}>
                Guardar
              </button>
              <button onClick={cancelarEdicion} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              {puedeEditar && (
                <button onClick={iniciarEdicion} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}>
                  Editar
                </button>
              )}
              <button onClick={() => onDownload(doc)} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}>
                Descargar
              </button>
            </>
          )}
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto', color: 'var(--error)' }}>
            Volver
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {renderContenido()}
      </div>
    </div>
  ) : (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', maxWidth: '90vw', maxHeight: '90vh' }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem',
        }}>
          <strong style={{ fontSize: '0.95rem' }}>{doc.nombre}</strong>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: 'auto', color: 'var(--error)' }}>
            ✕
          </button>
        </div>
        {renderContenido()}
      </div>
    </div>
  );
}
