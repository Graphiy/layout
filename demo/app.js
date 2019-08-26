import * as d3Selection from 'd3-selection'
import * as d3Csv from 'd3-dsv'
import * as d3Transition from 'd3-transition' // eslint-disable-line
import * as d3Ease from 'd3-ease'

import Grid from '../src/grid'
import Force from '../src/force'
import Radial from '../src/radial'

import rawData from './data.csv'
import Setting from './setting/setting'

import './template/node.scss'
import './template/row.scss'
import './template/tile.scss'
import './template/circle.scss'
import './style/switcher.scss'
import './style/app.scss'

import layoutSets from './layouts.json'

class App {
  constructor () {
    this.container = d3Selection.select('#container')
    this.fullData = d3Csv.csvParse(rawData)
    this.data = _.slice(this.fullData, 0, 63)
    this.templates = ['row', 'tile', 'circle']
    const Layouts = [Grid, Radial, Force]
    this.layouts = _.map(Layouts, (Layout) => {
      const instance = new Layout()
      let links
      if (instance.name === 'Force') {
        links = this.prepareLinksForForceLayout()
      }
      instance.update(this.data, links)
      return instance
    })

    this.renderControls()
    this.initSlider()
    this.containerWidth = this.container.node().getBoundingClientRect().width
    this.containerHeight = document.documentElement.clientHeight - this.container.node().offsetTop
    this.setting = new Setting({ width: this.containerWidth, height: this.containerHeight })

    this.changeTemplate('circle')
    this.changeLayout(layoutSets.table)

    this.setting.on('change', this.changeConfig.bind(this))
    $(window).on('resize', this._onResize.bind(this))
  }

  prepareLinksForForceLayout () {
    const _data = _.cloneDeep(this.data)
    const source = {}
    const links = []
    _.each(_data, (node, i) => {
      if (node.id === node.group) {
        source[node.group] = i
        delete _data[i]
      }
    })
    _.each(_data, (node, i) => {
      if (node) {
        const sourceIndex = source[node.group]
        if (sourceIndex !== undefined) {
          links.push({ source: sourceIndex, target: i })
        }
      }
    })

    return links
  }

  renderControls () {
    d3Selection.select('.layout').selectAll('button')
      .data(_.values(layoutSets))
      .enter()
      .append('button')
      .html(d => d.name)
      .attr('class', d => d.name)
      .on('click', this.changeLayout.bind(this))

    d3Selection.select('.template').selectAll('button')
      .data(this.templates)
      .enter()
      .append('button')
      .html(d => d)
      .attr('class', d => d)
      .on('click', this.changeTemplate.bind(this))
  }

  initSlider () {
    const maxLength = this.fullData.length
    const value = this.data.length
    d3Selection.select('.slider')
      .append('h5')
      .html(`limit data array length ${value}`)

    d3Selection.select('.slider')
      .append('input')
      .attr('id', 'limit')
      .attr('type', 'range')
      .attr('min', 1)
      .attr('max', maxLength)
      .attr('step', 1)
      .attr('value', value)
      .on('input', this.changeData.bind(this))
  }

  changeTemplate (template) {
    d3Selection.selectAll('.template button')
      .classed('active', false)
    d3Selection.select(`.${template}`)
      .classed('active', true)

    this.template = template
    this.render()
  }

  changeLayout (d) {
    let prevLayout

    if (this.layout) {
      this.layout.off('end')
      prevLayout = this.layout
    }

    this.layout = this.layouts.find(layout => layout.constructor.name === d.type)
    this.layout.on('end', this.updatePosition.bind(this))

    d3Selection.selectAll('.layout button').classed('active', false)
    d3Selection.select(`.${d.name}`).classed('active', true)

    let layoutSet = _.extend({}, d.config, { name: d.name })

    this.setting.updateControllers(d.config)

    // use previous coordinates to start Force layout for more predictable nodes position
    if (this.layout.name === 'Force') {
      let coords
      if (!prevLayout) coords = this._initialCoords()
      else coords = App.getNodesCoords()

      this.nodeInitPosition(coords)
      layoutSet = _.extend({
        width: this.containerWidth,
        height: this.containerHeight,
      }, layoutSet)
    }
    this.layout.p = layoutSet
  }

  _initialCoords () {
    const length = d3Selection.selectAll('.node').nodes().length
    return _.map(_.range(length), () => ({
      x: this.containerWidth * Math.random(),
      y: this.containerHeight * Math.random(),
    }))
  }

  updatePosition () {
    const coords = this.layout.coords
    const nodes = $('.node')

    if (this.container.selectAll('svg').nodes().length && this.layout.name !== 'Force') {
      this.container.selectAll('svg').remove()
    }

    if (this.layout.name === 'Force') {
      const line = this.container.selectAll('line')
      if (line !== this.layout.links.length) {
        this._initializeLine()
      }
      this._updateLinePosition()

      const nodeRect = d3Selection.select('.node').node().getBoundingClientRect()
      const nodeWidth = nodeRect.width
      const nodeHeight = nodeRect.height

      _.each(nodes, (node, i) => {
        const coord = coords[i]
        $(node).css({ transform: `translate(${coord.x - (nodeWidth / 2)}px, ${coord.y - (nodeHeight / 2)}px)` })
      })
    } else {
      _.each(nodes, (node, i) => {
        const coord = coords[i]
        $(node).css({ transform: `translate(${coord.x}px, ${coord.y}px)` })
      })
    }
  }

  nodeInitPosition (coords) {
    if (coords.length !== this.layout.nodes.length) return
    _.each(this.layout.nodes, (node, i) => {
      node.x = coords[i].x
      node.y = coords[i].y
    })
  }

  static getNodesCoords () {
    const coords = []
    const nodes = d3Selection.selectAll('.node')
    _.each(nodes.nodes(), (node, i) => {
      const position = node.style.transform.slice(10, -1).split(',')
      coords[i] = { x: parseFloat(position[0]), y: parseFloat(position[1]) }
    })
    return coords
  }

  render () {
    const nodes = this.container.selectAll('.node').data(this.data, d => d.id)

    nodes.attr('class', 'node').classed(this.template, true)

    nodes.enter()
      .append('div')
      .style('background', d => d.id)
      .style('transform', 'translate(0px, 0px)')
      .attr('class', 'node')
      .classed(this.template, true)
      .append('div')
      .html(d => d.id)

    nodes.exit().remove()
  }

  changeData () {
    const limit = d3Selection.select('#limit').nodes()[0].value
    this.data = _.slice(this.fullData, 0, limit)

    _.each(this.layouts, (layout) => {
      let links
      if (layout.name === 'Force') {
        links = this.prepareLinksForForceLayout()
      }
      layout.update(this.data, links)
    })
    this.render()
    this.layout.run()

    d3Selection.select('.slider h5')
      .html(`limit data array length ${limit}`)
  }

  _initializeLine () {
    const startLinksPosition = this._calcStartLinksPosition()
    this.svg = d3Selection.select('svg')
    if (!this.svg.nodes().length) {
      this.svg = this.container.append('svg')
        .attr('width', this.containerWidth)
        .attr('height', this.containerHeight)
    }

    this.svg.selectAll('line')
      .data(startLinksPosition)
      .enter()
      .append('line')
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)
      .attr('stroke-width', 1)
      .attr('stroke', 'black')
  }

  _updateLinePosition () {
    const edgesCoords = this.layout.edgesCoords

    const line = this.svg.selectAll('line')
      .data(edgesCoords)

    line.transition()
      .ease(d3Ease.easeLinear)
      .duration(750)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)

    line.enter()
      .append('line')
      .transition()
      .ease(d3Ease.easeLinear)
      .duration(750)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)

    line.exit()
      .remove()
  }

  _calcStartLinksPosition () {
    const coords = []
    const items = d3Selection.selectAll('.node')
    const links = this.layout.links
    _.each(links, (link, i) => {
      let source = items.nodes()[link.source.index].style.transform.slice(10, -1)
      let target = items.nodes()[link.target.index].style.transform.slice(10, -1)
      source = source.split(',')
      target = target.split(',')
      coords[i] = {
        x1: parseFloat(source[0]),
        y1: parseFloat(source[1]),
        x2: parseFloat(target[0]),
        y2: parseFloat(target[1]),
      }
    })
    return coords
  }

  changeConfig (property, path, value) {
    if (property === 'startRadian') {
      value *= (Math.PI / 180)
    }
    _.set(this.layout.p, `${path}${property}`, value)
  }

  _onResize () {
    this.layout.p.width = this.container.node().getBoundingClientRect().width
  }
}
new App() // eslint-disable-line
