import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';
import api, { backendUrl } from '../../services/api';
import { parsePptx, type PptxElement, type PptxPresentation, type PptxSlide } from '../../utils/pptx';

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

interface PptxTextBoxProps {
  elementId: string;
  className: string;
  html: string;
  style: React.CSSProperties;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
}

function PptxTextBox({ elementId, className, html, style, onPointerDown, onPointerMove, onPointerUp }: PptxTextBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = DOMPurify.sanitize(html || '<p><br></p>');
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      data-element-id={elementId}
      contentEditable
      suppressContentEditableWarning
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}

function PptxMiniatura({ slide, presentation, index }: { slide: PptxSlide; presentation: PptxPresentation; index: number }) {
  return (
    <span
      className="documento-miniatura-hoja documento-miniatura-diapositiva"
      style={{ aspectRatio: `${presentation.width} / ${presentation.height * 1.12}` }}
    >
      <span className="pptx-miniatura-lienzo" style={{ background: slide.background }}>
        {slide.elements.map((element: PptxElement) => {
          const style: React.CSSProperties = {
            left: `${(element.x / presentation.width) * 100}%`,
            top: `${(element.y / presentation.height) * 100}%`,
            width: `${(element.width / presentation.width) * 100}%`,
            height: `${(element.height / presentation.height) * 100}%`,
            background: element.fill,
            border: element.line !== 'transparent' ? `1px solid ${element.line}` : 'none',
            transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
            textAlign: element.align,
            borderRadius: element.shapeType === 'ellipse' ? '50%' : element.shapeType === 'roundRect' ? '7%' : undefined,
            fontSize: element.kind === 'text' && element.fontSize
              ? `${((element.fontSize * 12700) / presentation.width).toFixed(4)}cqw`
              : undefined,
          };
          if (element.kind === 'image' && element.imageSrc) {
            return <span key={element.id} className="pptx-miniatura-elemento pptx-miniatura-imagen" style={style}><img src={element.imageSrc} alt="" /></span>;
          }
          if (element.kind === 'text') {
            return <span key={element.id} className="pptx-miniatura-elemento pptx-miniatura-texto" style={style} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(element.textHtml || '<p><br></p>') }} />;
          }
          return <span key={element.id} className="pptx-miniatura-elemento" style={style} />;
        })}
      </span>
      <span className="documento-miniatura-numero">{index + 1}</span>
    </span>
  );
}

export default function VisorDocumentos({ doc, url, html, loading, error, mode, onClose, onDownload, onSaved }: Props) {
  const [editando, setEditando] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editWorkbook, setEditWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [editPptx, setEditPptx] = useState<PptxPresentation | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [zoom, setZoom] = useState(100);
  const [wordCount, setWordCount] = useState(0);
  const [paginasExtra, setPaginasExtra] = useState(0);
  const [paginaSeleccionada, setPaginaSeleccionada] = useState(0);
  const [elementoMoviendo, setElementoMoviendo] = useState<string | null>(null);
  const [modoPresentacion, setModoPresentacion] = useState(false);
  const [diapositivaPresentacion, setDiapositivaPresentacion] = useState(0);
  const [formatoActivo, setFormatoActivo] = useState({
    bold: false,
    italic: false,
    underline: false,
    unordered: false,
    ordered: false,
    align: 'left',
    block: 'p',
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seleccionFormatoRef = useRef<Range | null>(null);
  const movimientoRef = useRef<{
    pointerId: number;
    slideIndex: number;
    elementId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    slideWidth: number;
    slideHeight: number;
    iniciado: boolean;
    target: HTMLElement;
  } | null>(null);

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
        setEditPptx(await parsePptx(buf));
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
    setElementoMoviendo(null);
    setModoPresentacion(false);
    setDiapositivaPresentacion(0);
    movimientoRef.current = null;
    setFormatoActivo({ bold: false, italic: false, underline: false, unordered: false, ordered: false, align: 'left', block: 'p' });
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
    const seleccion = window.getSelection();
    const rango = seleccionFormatoRef.current;
    if (!rango || !seleccion) return;
    if (rango && seleccion) {
      const nodoComun = rango.commonAncestorContainer;
      const contenedor = nodoComun.nodeType === Node.ELEMENT_NODE
        ? nodoComun as Element
        : nodoComun.parentElement;
      const cajaEditable = contenedor?.closest('[contenteditable="true"]') as HTMLElement | null;
      cajaEditable?.focus();
      seleccion.removeAllRanges();
      seleccion.addRange(rango);
    }
    const editable = (rango.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? rango.commonAncestorContainer as Element
      : rango.commonAncestorContainer.parentElement)?.closest('[contenteditable="true"]');
    if (!editable) return;

    if (['bold', 'italic', 'underline'].includes(comando)) {
      if (rango.collapsed) return;
      const etiqueta = comando === 'bold' ? 'strong' : comando === 'italic' ? 'em' : 'u';
      const envoltura = document.createElement(etiqueta);
      envoltura.appendChild(rango.extractContents());
      rango.insertNode(envoltura);
      seleccion.removeAllRanges();
      const nuevoRango = document.createRange();
      nuevoRango.selectNodeContents(envoltura);
      seleccion.addRange(nuevoRango);
    } else if (['justifyLeft', 'justifyCenter', 'justifyRight'].includes(comando)) {
      const bloque = (rango.startContainer.nodeType === Node.ELEMENT_NODE
        ? rango.startContainer as Element
        : rango.startContainer.parentElement)?.closest('p,h1,h2,h3,h4,h5,h6,blockquote,li');
      if (bloque) {
        (bloque as HTMLElement).style.textAlign = comando === 'justifyCenter' ? 'center' : comando === 'justifyRight' ? 'right' : 'left';
      }
    } else if (comando === 'formatBlock' && valor) {
      const bloque = (rango.startContainer.nodeType === Node.ELEMENT_NODE
        ? rango.startContainer as Element
        : rango.startContainer.parentElement)?.closest('p,h1,h2,h3,blockquote');
      if (bloque && bloque.tagName.toLowerCase() !== valor.toLowerCase()) {
        const nuevoBloque = document.createElement(valor);
        nuevoBloque.innerHTML = bloque.innerHTML;
        nuevoBloque.style.cssText = bloque.getAttribute('style') || '';
        bloque.replaceWith(nuevoBloque);
        seleccion.removeAllRanges();
        const nuevoRango = document.createRange();
        nuevoRango.selectNodeContents(nuevoBloque);
        seleccion.addRange(nuevoRango);
      }
    } else if (comando === 'insertUnorderedList' || comando === 'insertOrderedList') {
      const bloque = (rango.startContainer.nodeType === Node.ELEMENT_NODE
        ? rango.startContainer as Element
        : rango.startContainer.parentElement)?.closest('p,h1,h2,h3,blockquote');
      if (bloque) {
        const lista = document.createElement(comando === 'insertOrderedList' ? 'ol' : 'ul');
        const item = document.createElement('li');
        item.innerHTML = bloque.innerHTML;
        lista.appendChild(item);
        bloque.replaceWith(lista);
        seleccion.removeAllRanges();
        const nuevoRango = document.createRange();
        nuevoRango.selectNodeContents(item);
        seleccion.addRange(nuevoRango);
      }
    } else if (comando === 'createLink' && valor && !rango.collapsed) {
      const enlace = document.createElement('a');
      enlace.href = valor;
      enlace.target = '_blank';
      enlace.rel = 'noopener noreferrer';
      enlace.appendChild(rango.extractContents());
      rango.insertNode(enlace);
      seleccion.removeAllRanges();
      const nuevoRango = document.createRange();
      nuevoRango.selectNodeContents(enlace);
      seleccion.addRange(nuevoRango);
    }
    actualizarFormatoActivo();
  };

  const insertarEnlace = () => {
    const url = window.prompt('URL del enlace');
    if (url && /^(https?:|mailto:)/i.test(url)) aplicarFormato('createLink', url);
  };

  const actualizarEstadisticas = () => {
    const text = editorRef.current?.innerText || '';
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const actualizarFormatoActivo = useCallback(() => {
    const editor = editorRef.current;
    const seleccion = window.getSelection();
    if (!editor || !seleccion?.anchorNode || !editor.contains(seleccion.anchorNode)) return;
    if (seleccion.rangeCount > 0) seleccionFormatoRef.current = seleccion.getRangeAt(0).cloneRange();
    const nodoActivo = seleccion.anchorNode.nodeType === Node.ELEMENT_NODE
      ? seleccion.anchorNode as Element
      : seleccion.anchorNode.parentElement;
    const bloque = nodoActivo?.closest('p,h1,h2,h3,blockquote,li');
    const align = (bloque ? window.getComputedStyle(bloque).textAlign : 'left') as 'left' | 'center' | 'right';
    const block = bloque?.tagName.toLowerCase() || 'p';
    const siguiente = {
      bold: Boolean(nodoActivo?.closest('strong,b')),
      italic: Boolean(nodoActivo?.closest('em,i')),
      underline: Boolean(nodoActivo?.closest('u')),
      unordered: Boolean(nodoActivo?.closest('ul')),
      ordered: Boolean(nodoActivo?.closest('ol')),
      align,
      block: ['p', 'h1', 'h2', 'h3', 'blockquote'].includes(block) ? block : 'p',
    };
    setFormatoActivo((actual) => (
      actual.bold === siguiente.bold
      && actual.italic === siguiente.italic
      && actual.underline === siguiente.underline
      && actual.unordered === siguiente.unordered
      && actual.ordered === siguiente.ordered
      && actual.align === siguiente.align
      && actual.block === siguiente.block
        ? actual
        : siguiente
    ));
  }, []);

  const iniciarMovimientoElemento = (event: React.PointerEvent<HTMLElement>, slideIndex: number, elementId: string) => {
    if (event.button !== 0 || !editPptx) return;
    const slide = event.currentTarget.closest('.pptx-slide-editor');
    if (!(slide instanceof HTMLElement)) return;
    const rect = slide.getBoundingClientRect();
    const elemento = editPptx.slides[slideIndex]?.elements.find((item) => item.id === elementId);
    if (!elemento) return;
    movimientoRef.current = {
      pointerId: event.pointerId,
      slideIndex,
      elementId,
      startX: event.clientX,
      startY: event.clientY,
      originX: elemento.x,
      originY: elemento.y,
      slideWidth: rect.width,
      slideHeight: rect.height,
      iniciado: false,
      target: event.currentTarget,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moverElemento = (event: React.PointerEvent<HTMLElement>) => {
    const movimiento = movimientoRef.current;
    if (!movimiento || movimiento.pointerId !== event.pointerId || !editPptx) return;
    const deltaX = event.clientX - movimiento.startX;
    const deltaY = event.clientY - movimiento.startY;
    if (!movimiento.iniciado && Math.hypot(deltaX, deltaY) < 4) return;
    movimiento.iniciado = true;
    setElementoMoviendo(`${movimiento.slideIndex}-${movimiento.elementId}`);
    event.preventDefault();
    const nextX = Math.max(0, Math.min(editPptx.width - 1, movimiento.originX + (deltaX / movimiento.slideWidth) * editPptx.width));
    const nextY = Math.max(0, Math.min(editPptx.height - 1, movimiento.originY + (deltaY / movimiento.slideHeight) * editPptx.height));
    setEditPptx((current) => current ? {
      ...current,
      slides: current.slides.map((slide, index) => index !== movimiento.slideIndex ? slide : {
        ...slide,
        elements: slide.elements.map((element) => element.id !== movimiento.elementId ? element : { ...element, x: nextX, y: nextY }),
      }),
    } : current);
  };

  const terminarMovimientoElemento = (event: React.PointerEvent<HTMLElement>) => {
    const movimiento = movimientoRef.current;
    if (!movimiento || movimiento.pointerId !== event.pointerId) return;
    movimiento.target.releasePointerCapture?.(event.pointerId);
    movimientoRef.current = null;
    setElementoMoviendo(null);
  };

  const agregarDiapositiva = () => {
    if (!editPptx) return;
    const siguienteNumero = editPptx.slides.reduce((maximo, slide) => Math.max(maximo, Number(slide.file.match(/slide(\d+)/)?.[1] || 0)), 0) + 1;
    const nuevaDiapositiva = {
      file: `ppt/slides/slide${siguienteNumero}.xml`,
      relsFile: `ppt/slides/_rels/slide${siguienteNumero}.xml.rels`,
      background: '#ffffff',
      elements: [],
      nueva: true,
    };
    setEditPptx((actual) => actual ? { ...actual, slides: [...actual.slides, nuevaDiapositiva] } : actual);
    setPaginaSeleccionada(editPptx.slides.length);
    window.setTimeout(() => {
      const pagina = editorRef.current?.querySelector(`[data-slide="${editPptx.slides.length}"]`);
      if (pagina instanceof HTMLElement) {
        pagina.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pagina.focus();
      }
    }, 0);
  };

  const agregarCajaTexto = () => {
    if (!editPptx) return;
    const slideIndex = Math.max(0, Math.min(paginaSeleccionada, editPptx.slides.length - 1));
    const existingIds = editPptx.slides.flatMap((slide) => slide.elements.map((element) => Number(element.id))).filter(Number.isFinite);
    const elementId = String(Math.max(0, ...existingIds) + 1);
    const nuevaCaja = {
      id: elementId,
      kind: 'text' as const,
      x: Math.round(editPptx.width * 0.1),
      y: Math.round(editPptx.height * 0.12),
      width: Math.round(editPptx.width * 0.32),
      height: Math.round(editPptx.height * 0.12),
      rotation: 0,
      fill: '#ffffff',
      line: '#64748b',
      textHtml: '<p><br></p>',
      text: '',
      align: 'left' as const,
    };
    setEditPptx((actual) => actual ? {
      ...actual,
      slides: actual.slides.map((slide, index) => index === slideIndex ? { ...slide, elements: [...slide.elements, nuevaCaja] } : slide),
    } : actual);
    setPaginaSeleccionada(slideIndex);
    window.setTimeout(() => {
      const caja = editorRef.current?.querySelector(`[data-element-id="${elementId}"]`);
      if (caja instanceof HTMLElement) {
        caja.focus();
        const range = document.createRange();
        range.selectNodeContents(caja);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  const cerrarPresentacion = useCallback(() => {
    setModoPresentacion(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  const iniciarPresentacion = async () => {
    if (!editPptx?.slides.length) return;
    setDiapositivaPresentacion(paginaSeleccionada);
    setModoPresentacion(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // El visor sigue funcionando aunque el navegador no permita fullscreen.
    }
  };

  useEffect(() => {
    if (!modoPresentacion) return;
    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cerrarPresentacion();
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        setDiapositivaPresentacion((actual) => Math.min((editPptx?.slides.length || 1) - 1, actual + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        setDiapositivaPresentacion((actual) => Math.max(0, actual - 1));
      }
    };
    document.addEventListener('keydown', manejarTeclado);
    return () => document.removeEventListener('keydown', manejarTeclado);
  }, [modoPresentacion, editPptx?.slides.length, cerrarPresentacion]);

  useEffect(() => {
    if (!editando || (!esDocx && !esPptx)) return;
    document.addEventListener('selectionchange', actualizarFormatoActivo);
    return () => document.removeEventListener('selectionchange', actualizarFormatoActivo);
  }, [editando, esDocx, actualizarFormatoActivo]);

  useEffect(() => {
    if (!editando || !esPptx) return;
    const frame = requestAnimationFrame(() => {
      const editor = editorRef.current;
      const contenido = editor?.closest('.visor-contenido');
      if (contenido instanceof HTMLElement) contenido.scrollTo({ top: 0, behavior: 'auto' });
      setPaginaSeleccionada(0);
    });
    return () => cancelAnimationFrame(frame);
  }, [editando, esPptx]);

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
    if (!editando || (!esDocx && !esPptx)) return null;
    const paginas = esDocx ? 1 + paginasExtra : editPptx?.slides.length || 0;
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
                const pagina = esPptx
                  ? editorRef.current?.querySelector(`[data-slide="${index}"]`)
                  : index === 0
                    ? editorRef.current
                    : editorRef.current?.querySelectorAll('.documento-pagina-nueva')[index - 1];
                if (pagina instanceof HTMLElement) {
                  setPaginaSeleccionada(index);
                  pagina.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  pagina.focus();
                }
              }}
            >
              {esPptx && editPptx?.slides[index] ? (
                <PptxMiniatura slide={editPptx.slides[index]} presentation={editPptx} index={index} />
              ) : (
                <span className="documento-miniatura-hoja">
                  <span className="documento-miniatura-linea larga" />
                  <span className="documento-miniatura-linea" />
                  <span className="documento-miniatura-linea" />
                  <span className="documento-miniatura-linea corta" />
                  <span className="documento-miniatura-numero">{index + 1}</span>
                </span>
              )}
              <span className="documento-miniatura-etiqueta">{esPptx ? 'Diapositiva' : 'Página'} {index + 1}</span>
            </button>
            {esDocx && index > 0 && (
              <button type="button" className="documento-eliminar-pagina" title={`Eliminar página ${index + 1}`} aria-label={`Eliminar página ${index + 1}`} onClick={() => eliminarHoja(index)}>×</button>
            )}
          </div>
        ))}
        {(esDocx || esPptx) && (
          <button type="button" className="documento-agregar-hoja" onClick={esPptx ? agregarDiapositiva : agregarHoja}>
            <span>＋</span>
            {esPptx ? 'Agregar diapositiva' : 'Agregar página'}
          </button>
        )}
      </aside>
    );
  };

  const renderBarraFormato = () => {
    if (!editando || (!esDocx && !esPptx)) return null;
    const accion = (comando: string, etiqueta: string, icono: string, activa = false) => (
      <button
        type="button"
        className={`documento-formato-btn ${activa ? 'activo' : ''}`}
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
          value={formatoActivo.block}
          onChange={(e) => aplicarFormato('formatBlock', e.target.value)}
        >
          <option value="p">Texto normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="blockquote">Cita</option>
        </select>
        <span className="documento-formato-separador" />
        {accion('bold', 'Negrita', 'B', formatoActivo.bold)}
        {accion('italic', 'Cursiva', 'I', formatoActivo.italic)}
        {accion('underline', 'Subrayado', 'U', formatoActivo.underline)}
        <span className="documento-formato-separador" />
        {accion('insertUnorderedList', 'Lista con viñetas', '•', formatoActivo.unordered)}
        {accion('insertOrderedList', 'Lista numerada', '1.', formatoActivo.ordered)}
        {accion('justifyLeft', 'Alinear a la izquierda', '≡', formatoActivo.align === 'left')}
        {accion('justifyCenter', 'Centrar', '≡', formatoActivo.align === 'center')}
        {accion('justifyRight', 'Alinear a la derecha', '≡', formatoActivo.align === 'right')}
        <span className="documento-formato-separador" />
        {accion('undo', 'Deshacer', '↶')}
        {accion('redo', 'Rehacer', '↷')}
        <button type="button" className="documento-formato-btn documento-formato-enlace" title="Insertar enlace" aria-label="Insertar enlace" onMouseDown={(e) => e.preventDefault()} onClick={insertarEnlace}>↗</button>
        {esPptx && <button type="button" className="documento-formato-btn documento-formato-caja-texto" title="Insertar caja de texto" aria-label="Insertar caja de texto" onClick={agregarCajaTexto}>T</button>}
        {esPptx && <button type="button" className="documento-formato-btn documento-formato-presentar" title="Presentar diapositivas" aria-label="Presentar diapositivas" onClick={iniciarPresentacion}>▶</button>}
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
        const newSlides = editPptx.slides.filter((slide) => !zip.file(slide.file));
        if (editorRef.current) {
          const slideEls = editorRef.current.querySelectorAll<HTMLElement>('[data-slide]');
          for (let i = 0; i < editPptx.slides.length; i++) {
            const el = slideEls[i];
            if (!el) continue;
            const slideFile = editPptx.slides[i].file;
            const existingSlide = zip.file(slideFile);
            const xml = existingSlide
              ? await existingSlide.async('string')
              : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld name="Diapositiva nueva"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            el.querySelectorAll<HTMLElement>('[data-element-id]').forEach((element) => {
              if (!element.isContentEditable) return;
              const id = element.dataset.elementId;
              const originalShape = Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'sp'))
                .concat(Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'pic')))
                .concat(Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'graphicFrame')))
                .find((shape) => shape.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'cNvPr')[0]?.getAttribute('id') === id);
              if (!originalShape) return;
              const tNodes = Array.from(originalShape.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't'));
              if (!tNodes.length) return;
              const text = element.innerText.replace(/\u00a0/g, ' ').trimEnd();
              const originalText = editPptx.slides[i].elements.find((item) => item.id === id)?.text || '';
              if (text === originalText) return;
              tNodes[0].textContent = text;
              tNodes.slice(1).forEach((node) => { node.textContent = ''; });
            });
            editPptx.slides[i].elements.forEach((element) => {
              const originalShape = Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'sp'))
                .concat(Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'pic')))
                .concat(Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'graphicFrame')))
                .find((shape) => shape.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'cNvPr')[0]?.getAttribute('id') === element.id);
              const transform = originalShape?.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'xfrm')[0];
              const offset = transform?.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'off')[0];
              if (offset) {
                offset.setAttribute('x', String(Math.round(element.x)));
                offset.setAttribute('y', String(Math.round(element.y)));
              }
            });
            const shapeTree = xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'spTree')[0];
            if (shapeTree) {
              const shapeNodes = () => Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'sp'))
                .concat(Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'pic')))
                .concat(Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'graphicFrame')));
              let nextShapeId = Math.max(1, ...shapeNodes().map((shape) => Number(shape.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'cNvPr')[0]?.getAttribute('id') || 0)).filter(Number.isFinite)) + 1;
              editPptx.slides[i].elements.filter((element) => element.kind === 'text').forEach((element) => {
                if (shapeNodes().some((shape) => shape.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'cNvPr')[0]?.getAttribute('id') === element.id)) return;
                const editable = Array.from(el.querySelectorAll<HTMLElement>('[data-element-id]')).find((item) => item.dataset.elementId === element.id);
                const text = editable?.innerText.replace(/\u00a0/g, ' ').trimEnd() || '';
                const p = xmlDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:sp');
                const nvSpPr = xmlDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:nvSpPr');
                const cNvPr = xmlDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:cNvPr');
                cNvPr.setAttribute('id', element.id || String(nextShapeId));
                cNvPr.setAttribute('name', 'Caja de texto');
                const cNvSpPr = xmlDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:cNvSpPr');
                cNvSpPr.setAttribute('txBox', '1');
                const nvPr = xmlDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:nvPr');
                nvSpPr.append(cNvPr, cNvSpPr, nvPr);
                const spPr = xmlDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:spPr');
                const xfrm = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:xfrm');
                const off = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:off');
                off.setAttribute('x', String(Math.round(element.x))); off.setAttribute('y', String(Math.round(element.y)));
                const ext = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:ext');
                ext.setAttribute('cx', String(Math.round(element.width))); ext.setAttribute('cy', String(Math.round(element.height)));
                xfrm.append(off, ext);
                const geometry = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:prstGeom');
                geometry.setAttribute('prst', 'rect');
                geometry.appendChild(xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:avLst'));
                spPr.append(xfrm, geometry);
                const txBody = xmlDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:txBody');
                txBody.appendChild(xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:bodyPr'));
                txBody.appendChild(xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:lstStyle'));
                const paragraph = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:p');
                const run = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:r');
                const runProperties = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:rPr');
                runProperties.setAttribute('lang', 'es-MX');
                runProperties.setAttribute('sz', '1800');
                const textNode = xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:t');
                textNode.textContent = text;
                run.append(runProperties, textNode);
                paragraph.appendChild(run);
                paragraph.appendChild(xmlDoc.createElementNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'a:endParaRPr'));
                txBody.appendChild(paragraph);
                p.append(nvSpPr, spPr, txBody);
                shapeTree.appendChild(p);
                nextShapeId += 1;
              });
            }
            const serializer = new XMLSerializer();
            zip.file(slideFile, serializer.serializeToString(xmlDoc));
            if (!existingSlide) {
              zip.file(editPptx.slides[i].relsFile, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`);
            }
          }
          if (newSlides.length) {
            const presentationXml = await zip.file('ppt/presentation.xml')!.async('string');
            const presentationDoc = new DOMParser().parseFromString(presentationXml, 'text/xml');
            const slideIdList = presentationDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'sldIdLst')[0];
            const currentIds = Array.from(slideIdList?.children || []).map((node) => Number(node.getAttribute('id') || 0));
            const presentationRelsXml = await zip.file('ppt/_rels/presentation.xml.rels')!.async('string');
            const presentationRelsDoc = new DOMParser().parseFromString(presentationRelsXml, 'text/xml');
            const relationships = presentationRelsDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/package/2006/relationships', 'Relationship');
            const currentRelIds = Array.from(relationships).map((node) => Number((node.getAttribute('Id') || '').replace('rId', ''))).filter(Number.isFinite);
            const contentTypesXml = await zip.file('[Content_Types].xml')!.async('string');
            const contentTypesDoc = new DOMParser().parseFromString(contentTypesXml, 'text/xml');
            const contentTypesRoot = contentTypesDoc.documentElement;
            for (const [index, slide] of newSlides.entries()) {
              const slideId = Math.max(255, ...currentIds, ...newSlides.map((_, newIndex) => 255 + newIndex + 1)) + index;
              const relId = `rId${Math.max(1, ...currentRelIds, ...newSlides.map((_, newIndex) => Math.max(1, ...currentRelIds) + newIndex + 1)) + index}`;
              const slideIdNode = presentationDoc.createElementNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'p:sldId');
              slideIdNode.setAttribute('id', String(slideId));
              slideIdNode.setAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'r:id', relId);
              slideIdList?.appendChild(slideIdNode);
              const relationship = presentationRelsDoc.createElementNS('http://schemas.openxmlformats.org/package/2006/relationships', 'Relationship');
              relationship.setAttribute('Id', relId);
              relationship.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide');
              relationship.setAttribute('Target', `slides/${slide.file.split('/').pop()}`);
              presentationRelsDoc.documentElement.appendChild(relationship);
              const override = contentTypesDoc.createElementNS('http://schemas.openxmlformats.org/package/2006/content-types', 'Override');
              override.setAttribute('PartName', `/${slide.file}`);
              override.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml');
              contentTypesRoot.appendChild(override);
            }
            zip.file('ppt/presentation.xml', new XMLSerializer().serializeToString(presentationDoc));
            zip.file('ppt/_rels/presentation.xml.rels', new XMLSerializer().serializeToString(presentationRelsDoc));
            zip.file('[Content_Types].xml', new XMLSerializer().serializeToString(contentTypesDoc));
          }
        }
        const pptxZip = await zip.generateAsync({ type: 'blob' });
        blob = new Blob([pptxZip], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
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

  useEffect(() => {
    if (!editando || (!esDocx && !esPptx)) return;
    const manejarAtajo = (event: KeyboardEvent) => {
      const modificador = event.ctrlKey || event.metaKey;
      if (!modificador) return;
      const tecla = event.key.toLowerCase();
      if (tecla === 's') {
        event.preventDefault();
        void guardar();
      }
      // C, X, V, A y Z/Y se dejan al navegador para conservar la edición
      // nativa del contenido editable y el historial de cada caja de texto.
    };
    document.addEventListener('keydown', manejarAtajo);
    return () => document.removeEventListener('keydown', manejarAtajo);
  }, [editando, esDocx, esPptx, guardar]);

  const actualizarCeldaXLSX = (sheetIdx: number, row: number, col: number, value: string) => {
    if (!editWorkbook) return;
    const sheet = editWorkbook.Sheets[editWorkbook.SheetNames[sheetIdx]];
    const ref = XLSX.utils.encode_cell({ r: row, c: col });
    sheet[ref] = { t: 's', v: value };
    setEditWorkbook({ ...editWorkbook });
  };

  const renderModoPresentacion = () => {
    if (!modoPresentacion || !editPptx) return null;
    const slide = editPptx.slides[diapositivaPresentacion];
    if (!slide) return null;
    return (
      <div className="pptx-presentacion-overlay" role="dialog" aria-label="Presentación a pantalla completa">
        <div className="pptx-presentacion-barra">
          <span>{doc.nombre}</span>
          <span>{diapositivaPresentacion + 1} / {editPptx.slides.length}</span>
          <button type="button" onClick={cerrarPresentacion} aria-label="Salir de la presentación">×</button>
        </div>
        <div className="pptx-presentacion-lienzo">
          <article className="pptx-presentacion-slide" style={{ aspectRatio: `${editPptx.width} / ${editPptx.height}`, background: slide.background }}>
            {slide.elements.map((element) => {
              const style: React.CSSProperties = {
                left: `${(element.x / editPptx.width) * 100}%`,
                top: `${(element.y / editPptx.height) * 100}%`,
                width: `${(element.width / editPptx.width) * 100}%`,
                height: `${(element.height / editPptx.height) * 100}%`,
                background: element.fill,
                border: element.line !== 'transparent' ? `1px solid ${element.line}` : 'none',
                transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                textAlign: element.align,
                color: '#111827',
                borderRadius: element.shapeType === 'ellipse' ? '50%' : element.shapeType === 'roundRect' ? '7%' : undefined,
                fontSize: element.kind === 'text' && element.fontSize
                  ? `${((element.fontSize * 12700) / editPptx.width).toFixed(4)}cqw`
                  : undefined,
              };
              if (element.kind === 'image' && element.imageSrc) {
                return <div key={element.id} className="pptx-presentacion-elemento pptx-presentacion-imagen" style={style}><img src={element.imageSrc} alt="" /></div>;
              }
              if (element.kind === 'text') {
                return <div key={element.id} className="pptx-presentacion-elemento pptx-presentacion-texto" style={style} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(element.textHtml || '<p><br></p>') }} />;
              }
              return <div key={element.id} className="pptx-presentacion-elemento" style={style} />;
            })}
          </article>
        </div>
        <div className="pptx-presentacion-controles">
          <button type="button" onClick={() => setDiapositivaPresentacion((actual) => Math.max(0, actual - 1))} disabled={diapositivaPresentacion === 0} aria-label="Diapositiva anterior">‹</button>
          <button type="button" onClick={() => setDiapositivaPresentacion((actual) => Math.min(editPptx.slides.length - 1, actual + 1))} disabled={diapositivaPresentacion === editPptx.slides.length - 1} aria-label="Diapositiva siguiente">›</button>
        </div>
      </div>
    );
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
        <div ref={editorRef} className="pptx-editor-documento" style={{ '--pptx-ancho': editPptx.width, '--pptx-alto': editPptx.height } as React.CSSProperties}>
          {editPptx.slides.map((slide, slideIndex) => (
            <article key={slide.file} data-slide={slideIndex} className="pptx-slide-editor" style={{ aspectRatio: `${editPptx.width} / ${editPptx.height * 1.12}`, background: slide.background }}>
              <span className="pptx-slide-numero">Diapositiva {slideIndex + 1}</span>
              {slide.elements.map((element) => {
                const left = (element.x / editPptx.width) * 100;
                const top = (element.y / editPptx.height) * 100;
                const width = (element.width / editPptx.width) * 100;
                const height = (element.height / editPptx.height) * 100;
                const style: React.CSSProperties = {
                  left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                  background: element.fill, border: element.line !== 'transparent' ? `1px solid ${element.line}` : 'none',
                  transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                  textAlign: element.align,
                  borderRadius: element.shapeType === 'ellipse' ? '50%' : element.shapeType === 'roundRect' ? '7%' : undefined,
                  fontSize: element.kind === 'text' && element.fontSize
                    ? `${((element.fontSize * 12700) / editPptx.width).toFixed(4)}cqw`
                    : undefined,
                };
                if (element.kind === 'image' && element.imageSrc) {
                  return <div key={element.id} className={`pptx-element-editor pptx-element-editor-imagen ${elementoMoviendo === `${slideIndex}-${element.id}` ? 'moviendo' : ''}`} data-element-id={element.id} style={style} onPointerDown={(event) => iniciarMovimientoElemento(event, slideIndex, element.id)} onPointerMove={moverElemento} onPointerUp={terminarMovimientoElemento}><img src={element.imageSrc} alt="Imagen de la diapositiva" /></div>;
                }
                if (element.kind === 'text') {
                  return <PptxTextBox key={element.id} elementId={element.id} className={`pptx-element-editor pptx-element-editor-texto ${elementoMoviendo === `${slideIndex}-${element.id}` ? 'moviendo' : ''}`} html={element.textHtml} style={style} onPointerDown={(event) => iniciarMovimientoElemento(event, slideIndex, element.id)} onPointerMove={moverElemento} onPointerUp={terminarMovimientoElemento} />;
                }
                return <div key={element.id} className={`pptx-element-editor pptx-element-editor-forma ${elementoMoviendo === `${slideIndex}-${element.id}` ? 'moviendo' : ''}`} data-element-id={element.id} style={style} onPointerDown={(event) => iniciarMovimientoElemento(event, slideIndex, element.id)} onPointerMove={moverElemento} onPointerUp={terminarMovimientoElemento} />;
              })}
            </article>
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
    if (htmlSeguro) {
      if (esPptx) {
        return <div className="office-preview documento-preview-contenedor documento-preview-pptx" dangerouslySetInnerHTML={{ __html: htmlSeguro }} />;
      }
      return (
        <div className="office-preview documento-preview-contenedor">
          <article className="documento-pagina-a4 documento-vista-previa-a4" dangerouslySetInnerHTML={{ __html: htmlSeguro }} />
        </div>
      );
    }
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
      <div className={`visor-editor-layout ${editando && (esDocx || esPptx) ? 'visor-editor-con-panel' : ''}`}>
        <div className={`visor-contenido ${editando ? 'visor-contenido-editando' : ''}`}>
          {renderContenido()}
        </div>
        {renderPanelPaginas()}
      </div>
      {editando && (esDocx || esPptx) && (
        <div className="documento-editor-estado">
          {esDocx && <span>{wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}</span>}
          {esPptx && <span>{editPptx?.slides.length || 0} {editPptx?.slides.length === 1 ? 'diapositiva' : 'diapositivas'}</span>}
          <span>{zoom}% de zoom</span>
          <span>Los cambios se guardan al pulsar Guardar</span>
        </div>
      )}
      {renderModoPresentacion()}
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
