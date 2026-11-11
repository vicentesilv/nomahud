export interface PptxElement {
  id: string;
  kind: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  line: string;
  textHtml: string;
  text: string;
  imageSrc?: string;
  align: 'left' | 'center' | 'right' | 'justify';
  fontSize?: number;
  shapeType?: string;
}

export interface PptxSlide {
  file: string;
  relsFile: string;
  background: string;
  elements: PptxElement[];
  nueva?: boolean;
}

export interface PptxPresentation {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  slides: PptxSlide[];
}

const PRESENTATION_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

function descendants(node: Element, namespace: string, localName: string): Element[] {
  return Array.from(node.getElementsByTagNameNS(namespace, localName));
}

function firstDescendant(node: Element, namespace: string, localName: string): Element | null {
  return descendants(node, namespace, localName)[0] || null;
}

function numberAttr(node: Element | null, name: string, fallback = 0): number {
  const value = node?.getAttribute(name);
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}

function normalizeZipPath(path: string): string {
  const parts: string[] = [];
  path.split('/').forEach((part) => {
    if (!part || part === '.') return;
    if (part === '..') parts.pop();
    else parts.push(part);
  });
  return parts.join('/');
}

function relationshipTarget(slideFile: string, target: string): string {
  const base = slideFile.slice(0, slideFile.lastIndexOf('/') + 1);
  return normalizeZipPath(`${base}${target}`);
}

type ThemeColors = Map<string, string>;

function directChild(node: Element | null, namespace: string, localName: string): Element | null {
  if (!node) return null;
  return Array.from(node.children).find((child) => child.namespaceURI === namespace && child.localName === localName) || null;
}

function parseThemeColors(xml: string): ThemeColors {
  const colors: ThemeColors = new Map();
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const scheme = firstDescendant(document.documentElement, DRAWING_NS, 'clrScheme');
  if (!scheme) return colors;
  Array.from(scheme.children).forEach((entry) => {
    const value = directChild(entry, DRAWING_NS, 'srgbClr')?.getAttribute('val')
      || directChild(entry, DRAWING_NS, 'sysClr')?.getAttribute('lastClr');
    if (value) colors.set(entry.localName, `#${value}`);
  });
  return colors;
}

function colorFromElement(node: Element | null, fallback: string, theme: ThemeColors): string {
  if (!node) return fallback;
  const srgb = firstDescendant(node, DRAWING_NS, 'srgbClr');
  if (srgb?.getAttribute('val')) return `#${srgb.getAttribute('val')}`;
  const sys = firstDescendant(node, DRAWING_NS, 'sysClr');
  if (sys?.getAttribute('lastClr')) return `#${sys.getAttribute('lastClr')}`;
  const scheme = firstDescendant(node, DRAWING_NS, 'schemeClr');
  const schemeColor = scheme?.getAttribute('val');
  if (schemeColor && theme.has(schemeColor)) return theme.get(schemeColor)!;
  return fallback;
}

function parseFill(node: Element | null, fallback = 'transparent', theme: ThemeColors = new Map()): string {
  if (!node) return fallback;
  if (node.localName === 'noFill') return 'transparent';
  if (node.localName === 'solidFill') return colorFromElement(node, fallback, theme);
  if (node.localName === 'fillRef' || node.localName === 'lnRef') {
    return colorFromElement(node, fallback, theme);
  }
  const fill = Array.from(node.children).find((child) => (
    child.namespaceURI === DRAWING_NS && ['solidFill', 'noFill', 'gradFill', 'pattFill', 'blipFill'].includes(child.localName)
  ));
  if (!fill || fill.localName === 'noFill') return 'transparent';
  if (fill.localName !== 'solidFill') return colorFromElement(fill, fallback, theme);
  return colorFromElement(fill, fallback, theme);
}

function parseGeometry(node: Element): { x: number; y: number; width: number; height: number; rotation: number } {
  const transform = firstDescendant(node, DRAWING_NS, 'xfrm');
  const offset = firstDescendant(transform || node, DRAWING_NS, 'off');
  const extent = firstDescendant(transform || node, DRAWING_NS, 'ext');
  return {
    x: numberAttr(offset, 'x'),
    y: numberAttr(offset, 'y'),
    width: Math.max(1, numberAttr(extent, 'cx', 1)),
    height: Math.max(1, numberAttr(extent, 'cy', 1)),
    rotation: numberAttr(transform, 'rot') / 60000,
  };
}

interface CoordinateTransform {
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
}

function parseGroupTransform(node: Element, parent: CoordinateTransform): CoordinateTransform {
  const transform = firstDescendant(node, DRAWING_NS, 'xfrm');
  const offset = firstDescendant(transform || node, DRAWING_NS, 'off');
  const extent = firstDescendant(transform || node, DRAWING_NS, 'ext');
  const childOffset = firstDescendant(transform || node, DRAWING_NS, 'chOff');
  const childExtent = firstDescendant(transform || node, DRAWING_NS, 'chExt');
  const offsetX = numberAttr(offset, 'x');
  const offsetY = numberAttr(offset, 'y');
  const childOffsetX = numberAttr(childOffset, 'x');
  const childOffsetY = numberAttr(childOffset, 'y');
  const width = numberAttr(extent, 'cx');
  const height = numberAttr(extent, 'cy');
  const childWidth = numberAttr(childExtent, 'cx');
  const childHeight = numberAttr(childExtent, 'cy');
  const scaleX = childWidth ? width / childWidth : 1;
  const scaleY = childHeight ? height / childHeight : 1;
  return {
    originX: parent.originX + (offsetX - childOffsetX * scaleX) * parent.scaleX,
    originY: parent.originY + (offsetY - childOffsetY * scaleY) * parent.scaleY,
    scaleX: parent.scaleX * scaleX,
    scaleY: parent.scaleY * scaleY,
  };
}

function textRunHtml(run: Element, theme: ThemeColors, presentationWidth: number): string {
  const text = escapeHtml(run.textContent || '');
  const properties = firstDescendant(run, DRAWING_NS, 'rPr');
  const tags: string[] = [];
  const color = parseFill(directChild(properties, DRAWING_NS, 'solidFill'), '', theme);
  const styles: string[] = [];
  if (color && color !== 'transparent') styles.push(`color:${color}`);
  const runFontSize = Number(properties?.getAttribute('sz'));
  if (Number.isFinite(runFontSize) && runFontSize > 0) {
    styles.push(`font-size:${((runFontSize * 12700) / presentationWidth).toFixed(4)}cqw`);
  }
  const style = styles.length ? ` style="${styles.join(';')}"` : '';
  if (properties?.getAttribute('b') === '1') tags.push('strong');
  if (properties?.getAttribute('i') === '1') tags.push('em');
  if (properties?.getAttribute('u') && properties.getAttribute('u') !== 'none') tags.push('u');
  return tags.reduce((value, tag) => `<${tag}>${value}</${tag}>`, style ? `<span${style}>${text}</span>` : text);
}

function parseText(node: Element, theme: ThemeColors, presentationWidth: number): { html: string; text: string; align: PptxElement['align']; fontSize?: number } {
  const txBody = firstDescendant(node, PRESENTATION_NS, 'txBody') || firstDescendant(node, DRAWING_NS, 'txBody');
  if (!txBody) return { html: '', text: '', align: 'left' };
  const paragraphs = descendants(txBody, DRAWING_NS, 'p');
  const htmlParts: string[] = [];
  const textParts: string[] = [];
  let align: PptxElement['align'] = 'left';
  let fontSize: number | undefined;
  paragraphs.forEach((paragraph) => {
    const paragraphProperties = firstDescendant(paragraph, DRAWING_NS, 'pPr');
    const alignment = paragraphProperties?.getAttribute('algn');
    if (alignment === 'ctr') align = 'center';
    if (alignment === 'r') align = 'right';
    if (alignment === 'just') align = 'justify';
    const runs = descendants(paragraph, DRAWING_NS, 'r');
    const fields = descendants(paragraph, DRAWING_NS, 'fld');
    const runNodes = runs.length ? runs : fields;
    if (fontSize === undefined) {
      const runProperties = runNodes.map((run) => firstDescendant(run, DRAWING_NS, 'rPr')).find(Boolean);
      const parsedFontSize = Number(runProperties?.getAttribute('sz'));
      if (Number.isFinite(parsedFontSize) && parsedFontSize > 0) fontSize = parsedFontSize;
    }
    const paragraphText = runNodes.length
      ? runNodes.map((run) => runNodes === fields ? escapeHtml(run.textContent || '') : textRunHtml(run, theme, presentationWidth)).join('')
      : escapeHtml(paragraph.textContent || '');
    htmlParts.push(`<p style="text-align:${align}">${paragraphText || '<br>'}</p>`);
    textParts.push(paragraph.textContent || '');
  });
  return { html: htmlParts.join(''), text: textParts.join('\n'), align, fontSize };
}

function parseRelationships(xml: string): Map<string, string> {
  const result = new Map<string, string>();
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  Array.from(document.getElementsByTagNameNS(PACKAGE_REL_NS, 'Relationship')).forEach((relationship) => {
    const id = relationship.getAttribute('Id');
    const target = relationship.getAttribute('Target');
    if (id && target) result.set(id, target);
  });
  return result;
}

function parseSlideElements(document: XMLDocument, relationships: Map<string, string>, media: Map<string, string>, theme: ThemeColors, presentationWidth: number): PptxElement[] {
  const tree = document.getElementsByTagNameNS(PRESENTATION_NS, 'spTree')[0];
  if (!tree) return [];
  const elements: PptxElement[] = [];
  const visit = (parent: Element, coordinateTransform: CoordinateTransform = { originX: 0, originY: 0, scaleX: 1, scaleY: 1 }) => {
    Array.from(parent.children).forEach((node) => {
      if (node.namespaceURI !== PRESENTATION_NS) return;
      if (node.localName === 'grpSp') {
        visit(node, parseGroupTransform(node, coordinateTransform));
        return;
      }
      if (!['sp', 'pic', 'graphicFrame'].includes(node.localName)) return;
      const nameNode = firstDescendant(node, PRESENTATION_NS, 'cNvPr');
      const id = nameNode?.getAttribute('id') || `element-${elements.length}`;
      const geometry = parseGeometry(node);
      const transformedGeometry = {
        ...geometry,
        x: coordinateTransform.originX + geometry.x * coordinateTransform.scaleX,
        y: coordinateTransform.originY + geometry.y * coordinateTransform.scaleY,
        width: geometry.width * coordinateTransform.scaleX,
        height: geometry.height * coordinateTransform.scaleY,
      };
      const textInfo = parseText(node, theme, presentationWidth);
      const shapeProperties = firstDescendant(node, PRESENTATION_NS, 'spPr');
      const shapeType = firstDescendant(shapeProperties || node, DRAWING_NS, 'prstGeom')?.getAttribute('prst') || undefined;
      const style = firstDescendant(node, PRESENTATION_NS, 'style');
      const fillReference = firstDescendant(style || node, DRAWING_NS, 'fillRef');
      const lineReference = firstDescendant(style || node, DRAWING_NS, 'lnRef');
      const fill = parseFill(shapeProperties, 'transparent', theme) !== 'transparent'
        ? parseFill(shapeProperties, 'transparent', theme)
        : parseFill(fillReference, 'transparent', theme);
      const line = parseFill(directChild(shapeProperties || node, DRAWING_NS, 'ln'), 'transparent', theme) !== 'transparent'
        ? parseFill(directChild(shapeProperties || node, DRAWING_NS, 'ln'), 'transparent', theme)
        : parseFill(lineReference, 'transparent', theme);
      if (node.localName === 'pic') {
        const blip = firstDescendant(node, DRAWING_NS, 'blip');
        const relationId = blip?.getAttributeNS(REL_NS, 'embed') || blip?.getAttribute('r:embed') || '';
        const target = relationships.get(relationId);
        const imageSrc = target ? media.get(relationshipTarget('ppt/slides/slide.xml', target)) : undefined;
        elements.push({ ...transformedGeometry, id, kind: 'image', fill: 'transparent', line, textHtml: '', text: '', imageSrc, align: 'left', shapeType });
      } else {
        elements.push({ ...transformedGeometry, id, kind: textInfo.html ? 'text' : 'shape', fill, line, textHtml: textInfo.html, text: textInfo.text, align: textInfo.align, fontSize: textInfo.fontSize, shapeType });
      }
    });
  };
  visit(tree);
  return elements;
}

function mimeForImage(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  return extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg'
    : extension === 'gif' ? 'image/gif'
      : extension === 'svg' ? 'image/svg+xml'
        : 'image/png';
}

export async function parsePptx(buffer: ArrayBuffer): Promise<PptxPresentation> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buffer.slice(0));
  const files = Object.keys(zip.files);
  const media = new Map<string, string>();
  await Promise.all(files.filter((file) => /^ppt\/media\//.test(file) && !zip.files[file].dir).map(async (file) => {
    const base64 = await zip.file(file)!.async('base64');
    media.set(file, `data:${mimeForImage(file)};base64,${base64}`);
  }));

  const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('string');
  const theme = themeXml ? parseThemeColors(themeXml) : new Map<string, string>();

  let width = 9144000;
  let height = 5143500;
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('string');
  if (presentationXml) {
    const presentation = new DOMParser().parseFromString(presentationXml, 'application/xml');
    const size = presentation.getElementsByTagNameNS(PRESENTATION_NS, 'sldSz')[0];
    width = numberAttr(size, 'cx', width);
    height = numberAttr(size, 'cy', height);
  }

  const slideFiles = files.filter((file) => /^ppt\/slides\/slide\d+\.xml$/.test(file))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
  const slides: PptxSlide[] = [];
  for (const file of slideFiles) {
    const xml = await zip.file(file)!.async('string');
    const slideDocument = new DOMParser().parseFromString(xml, 'application/xml');
    const relsFile = `ppt/slides/_rels/${file.split('/').pop()}.rels`;
    const relsXml = await zip.file(relsFile)?.async('string');
    const relationships = relsXml ? parseRelationships(relsXml) : new Map<string, string>();
    const slideMedia = new Map<string, string>();
    relationships.forEach((target, relationId) => {
      const targetPath = relationshipTarget(file, target);
      const source = media.get(targetPath);
      if (source) slideMedia.set(relationId, source);
    });
    const elements = parseSlideElements(slideDocument, relationships, new Map([...media, ...slideMedia]), theme, width);
    const backgroundNode = slideDocument.getElementsByTagNameNS(PRESENTATION_NS, 'bg')[0];
    const background = parseFill(firstDescendant(backgroundNode || slideDocument.documentElement, DRAWING_NS, 'bgPr'), '#ffffff', theme);
    slides.push({ file, relsFile, background, elements });
  }
  return { buffer, width, height, slides };
}

function elementStyle(element: PptxElement, presentation: Pick<PptxPresentation, 'width' | 'height'>): string {
  const left = (element.x / presentation.width) * 100;
  const top = (element.y / presentation.height) * 100;
  const width = (element.width / presentation.width) * 100;
  const height = (element.height / presentation.height) * 100;
  const border = element.line !== 'transparent' ? `1px solid ${element.line}` : 'none';
  const transform = element.rotation ? `rotate(${element.rotation}deg)` : 'none';
  const borderRadius = element.shapeType === 'ellipse' ? 'border-radius:50%;' : element.shapeType === 'roundRect' ? 'border-radius:7%;' : '';
  const fontSize = element.kind === 'text' && element.fontSize
    ? `font-size:${((element.fontSize * 12700) / presentation.width).toFixed(4)}cqw;`
    : '';
  return `left:${left}%;top:${top}%;width:${width}%;height:${height}%;background:${element.fill};border:${border};transform:${transform};${borderRadius}${fontSize}`;
}

export function slideToHtml(slide: PptxSlide, presentation: Pick<PptxPresentation, 'width' | 'height'>, slideIndex = 0): string {
  const elements = slide.elements.map((element) => {
    const style = elementStyle(element, presentation);
    if (element.kind === 'image' && element.imageSrc) {
      return `<div class="pptx-element pptx-element-image" style="${style}"><img src="${element.imageSrc}" alt="" /></div>`;
    }
    if (element.kind === 'text') {
      return `<div class="pptx-element pptx-element-text" style="${style}text-align:${element.align};">${element.textHtml}</div>`;
    }
    return `<div class="pptx-element pptx-element-shape" style="${style}"></div>`;
  }).join('');
  const alturaVisual = (presentation.height * 1.12).toFixed(2);
  return `<article class="pptx-slide-preview" style="aspect-ratio:${presentation.width}/${alturaVisual};background:${slide.background};"><span class="pptx-slide-numero">Diapositiva ${slideIndex + 1}</span>${elements}</article>`;
}

export function presentationToHtml(presentation: PptxPresentation): string {
  return `<div class="pptx-preview-deck">${presentation.slides.map((slide, index) => slideToHtml(slide, presentation, index)).join('')}</div>`;
}
