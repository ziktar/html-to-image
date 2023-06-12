import { Options } from './types'
import { cloneNode } from './clone-node'
import { embedImages } from './embed-images'
import { applyStyle } from './apply-style'
import { embedWebFonts, getWebFontCSS } from './embed-webfonts'
import {
  getImageSize,
  getPixelRatio,
  createImage,
  canvasToBlob,
  nodeToDataURL,
  checkCanvasDimensions,
} from './util'

export async function toSvg<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  const { width, height } = getImageSize(node, options)
  const clonedNode = (await cloneNode(node, options, true)) as HTMLElement
  await embedWebFonts(clonedNode, options)
  await embedImages(clonedNode, options)
  applyStyle(clonedNode, options)
  const datauri = await nodeToDataURL(clonedNode, width, height)
  return datauri
}

export async function toCanvas<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<HTMLCanvasElement> {
  const { width, height } = getImageSize(node, options)
  const svg = await toSvg(node, options)
  const img = await createImage(svg)

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  const ratio = options.pixelRatio || getPixelRatio()
  const canvasWidth = options.canvasWidth || width
  const canvasHeight = options.canvasHeight || height
  const margin = options.margin || 0
  const canvasBackgroundColor =
    options.marginBackgroundColor || options.backgroundColor

  canvas.width = canvasWidth * ratio + 2 * margin
  canvas.height = canvasHeight * ratio + 2 * margin

  if (!options.skipAutoScale) {
    checkCanvasDimensions(canvas)
  }
  canvas.style.width = `${canvasWidth}`
  canvas.style.height = `${canvasHeight}`

  if (canvasBackgroundColor) {
    context.fillStyle = canvasBackgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  context.drawImage(
    img,
    margin,
    margin,
    canvas.width - 2 * margin,
    canvas.height - 2 * margin,
  )

  return canvas
}

export async function toPixelData<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<Uint8ClampedArray> {
  const { width, height } = getImageSize(node, options)
  const canvas = await toCanvas(node, options)
  const ctx = canvas.getContext('2d')!
  return ctx.getImageData(0, 0, width, height).data
}

export async function toPng<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  const canvas = await toCanvas(node, options)
  return canvas.toDataURL()
}

export async function toJpeg<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  const canvas = await toCanvas(node, options)
  return canvas.toDataURL('image/jpeg', options.quality || 1)
}

export async function toBlob<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<Blob | null> {
  const canvas = await toCanvas(node, options)
  const blob = await canvasToBlob(canvas)
  return blob
}

export async function getFontEmbedCSS<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  return getWebFontCSS(node, options)
}
