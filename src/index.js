import * as d3 from 'd3'

class Experiment {
  performance = global.performance
  mouse = {
    x: 0,
    y: 0
  }
  zoomScale = 0.4
  maxIterations = 80
  xRange = [-2.2, 1.2]
  yRange = [-1.2, 1.2]
  width = 600
  height = 400
  margin = 0.2
  iPlasmaScale
  xScale
  yScale

  constructor(_w, _h) {
    const w = this.width = _w || this.width
    const h = this.height = _h || this.height

    this.updateScale()

    //Initing canvas
    const canvasEl = d3.select('.container')
          .append('canvas')
          .attr('width', w)
          .attr('height', h)
          .node()

    canvasEl
      .addEventListener('click', this.onClick)

    this.canvas = canvasEl.getContext('2d')
  }

  updateScale = () => {
    const w = this.width
    const h = this.height

    const [x0, x1] = this.xRange
    const [y0, y1] = this.yRange

    //Scaling to proportin
    const dx = x1 - x0
    const dy = y1 - y0

    let wf = w
    let hf = h
    if(w > h) {
      wf = h*(dx/dy)
    } else {
      hf = w*(dy/dx)
    }

    const xSpace = (w-wf)/2
    this.xScale =  d3.scaleLinear()
      .domain([xSpace, w-xSpace])
      .range([
        (x0),
        (x1)
      ])

    const ySpace = (h-hf)/2
    this.yScale = d3.scaleLinear()
      .domain([ySpace, h-ySpace])
      .range([
        (y1),
        (y0)
      ])
  }

  getPerformanceDuration = () => {
    this.performance.measure(
      'draw',
      'draw-start',
      'draw-end'
    )

    try {
      const measure = this.performance.getEntriesByName('draw')
      this.performance.clearMarks()
      this.performance.clearMeasures()
      if(measure && measure[0]) {
        return `${(measure[0].duration/1000).toFixed(4)}s`
      } else {
        return 'leak'
      }
    } catch(e) {
      return 'leak'
    }
  }

  drawAxis() {
    const x0 = 0
    const x1 = this.width
    const y0 = 0
    const y1 = this.height

    const strokeColor = 'rgba(255,255,255, 0.9)'
    const altStrokeColor = 'rgba(255,255,255,0.5)'

    // Draw X axys
    this.canvas.setLineDash([1,0])
    this.canvas.beginPath()
    this.canvas.moveTo(x0, this.yScale.invert(0))
    this.canvas.lineTo(x1, this.yScale.invert(0))
    this.canvas.strokeStyle = strokeColor
    this.canvas.strokeStyle = strokeColor
    this.canvas.stroke()

    // Draw Y axis
    this.canvas.beginPath()
    this.canvas.moveTo(this.xScale.invert(0), y1)
    this.canvas.lineTo(this.xScale.invert(0), y0)
    this.canvas.strokeStyle = strokeColor
    this.canvas.stroke()

    // Draw X tick axis
    this.canvas.setLineDash([1,2])

    this.canvas.beginPath()
    this.canvas.moveTo(x0, this.yScale.invert(-1))
    this.canvas.lineTo(x1, this.yScale.invert(-1))
    this.canvas.strokeStyle = altStrokeColor
    this.canvas.stroke()

    this.canvas.beginPath()
    this.canvas.moveTo(x0, this.yScale.invert(1))
    this.canvas.lineTo(x1, this.yScale.invert(1))
    this.canvas.strokeStyle = altStrokeColor
    this.canvas.stroke()

    // Draw Y tick axis
    this.canvas.setLineDash([1,2])
    this.canvas.beginPath()
    this.canvas.moveTo(this.xScale.invert(-2), y0)
    this.canvas.lineTo(this.xScale.invert(-2), y1)
    this.canvas.strokeStyle = altStrokeColor
    this.canvas.stroke()

    this.canvas.beginPath()
    this.canvas.moveTo(this.xScale.invert(-1), y0)
    this.canvas.lineTo(this.xScale.invert(-1), y1)
    this.canvas.strokeStyle = altStrokeColor
    this.canvas.stroke()

    this.canvas.beginPath()
    this.canvas.moveTo(this.xScale.invert(1), y0)
    this.canvas.lineTo(this.xScale.invert(1), y1)
    this.canvas.strokeStyle = altStrokeColor
    this.canvas.stroke()

    //labels
    const xm = +4
    const ym = +12

    this.canvas.font = "12px Arial"
    this.canvas.fillStyle = strokeColor

    const xRange = this.xScale.range()
    const yRange = this.yScale.range()

    this.canvas.textAlign = 'start'

    this.canvas.fillText(`t = ${this.getPerformanceDuration()}`, 10, this.height-(14*4))
    this.canvas.fillText(`n = ${this.maxIterations}`, 10, this.height-(14*3))
    this.canvas.fillText(`x = [ ${xRange[0]}, ${xRange[1]} ]`, 10, this.height-(14*2))
    this.canvas.fillText(`y = [ ${yRange[1]}, ${yRange[0]} ]`, 10, this.height-14)

    this.canvas.fillText('-2', this.xScale.invert(-2)+xm, y0+ym)
    this.canvas.fillText('-1', this.xScale.invert(-1)+xm, y0+ym)
    this.canvas.fillText('0', this.xScale.invert(0)+xm, y0+ym)
    this.canvas.fillText('1', this.xScale.invert(1)+xm, y0+ym)

    this.canvas.textAlign = 'end'
    this.canvas.fillText('-1i', x1-xm, this.yScale.invert(-1)+ym)
    this.canvas.fillText('0i', x1-xm, this.yScale.invert(0)+ym)
    this.canvas.fillText('1i', x1-xm, this.yScale.invert(1)+ym)
  }

  getColor (_x, _y) {
    const x0 = this.xScale(_x)
    const y0 = this.yScale(_y)
    let n = 0

    let x = x0
    let y = y0

    while(x*x + y*y < 4 && n < this.maxIterations) {
      const xtemp = x*x - y*y + x0
      const ytemp = 2*x*y + y0
      if (x === xtemp  &&  y === ytemp) {
        n = this.maxIterations
        break
      }
      x = xtemp
      y = ytemp

      n++
    }

    if(n === this.maxIterations) {
      return 'rgb(30,30,30)'
    } else {
      return this.iPlasmaScale(n)
    }
  }

  paintPixel(x,y) {
    const color = this.getColor(x, y)
    if(color) {
      this.canvas.fillStyle = color
      this.canvas.fillRect(x,y,1,1)
    }
  }

  cleanCanvas() {
    this.canvas.fillStyle = "rgb(30, 30, 30)"
    this.canvas.fillRect(-1, -1, this.width, this.height)
  }

  drawMandelbrot() {
    //Updating color scale
    this.iPlasmaScale = d3.scaleSequential(d3.interpolateRainbow)
      .domain([0, this.maxIterations])

    this.performance.mark('draw-start')
    for(let x = 0; x < this.width; x++) {
      for(let y = 0; y < this.height; y++) {
        this.paintPixel(x,y)
      }
    }
    this.performance.mark('draw-end')

  }

  draw(newMaxIterations) {
    if(newMaxIterations) {
      this.maxIterations = newMaxIterations
    }

    this.cleanCanvas()
    this.drawMandelbrot()
    this.drawAxis()
  }

  updateZoom = () => {
    const { x, y, w, h } = this.getZoomFocus()

    this.xRange = [this.xScale(x), this.xScale(x+w)]
    this.yRange = [this.yScale(y+h), this.yScale(y)]

    this.updateScale()

    this.draw(Math.floor(this.maxIterations*(1+this.zoomScale)))
  }

  getZoomFocus = () => {
    const { x: mouseX, y: mouseY } = this.mouse

    const w = this.width*this.zoomScale
    const h = this.height*this.zoomScale

    // Forcing focus to stay inside screen
    const x = Math.min(Math.max((mouseX - w/2), 0), this.width - w)
    const y = Math.min(Math.max((mouseY - h/2), 0), this.height - h)

    return { x, y, w, h }
  }

  drawZoomPreview = () => {
    const { x, y, w, h } = this.getZoomFocus()

    this.canvas.setLineDash([2,0])
    this.canvas.rect(x, y, w, h)
    this.canvas.stroke()
  }

  updateMousePosition = (e) => {
    const { clientX: x, clientY: y } = e
    this.mouse = Object.assign({}, this.mouse, {
      x,
      y
    })
  }

  onClick = (e) => {
    this.updateMousePosition(e)
    this.drawZoomPreview()
    setTimeout(this.updateZoom, 20)
  }
}

const w = global.innerWidth
const h = global.innerHeight

const d3exp = new Experiment(w, h)
d3exp.draw()

// global.addEventListener('resize', () => {
//   const w = global.innerWidth
//   const h = global.innerHeight
//   console.log(w,h)
// })
