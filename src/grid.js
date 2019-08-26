/**
 * Grid view
 * Nodes are considered as rectangles
 */
import Layout from './layout'
/**
 * @param {Object || Number} p.spacing horizontal and vertical distance between nodes
 * @param Point p.offset {x,y} coordinates where to place first node
 * @param Object p.node {width, height} of node (add to spacing when calculating next node position)
 */
export default class Grid extends Layout {
  constructor (p = {}) {
    super(p)
  }

  static get defaults () {
    return {
      offset: { x: 0, y: 0 },
      cellOffset: { x: 0, y: 0 },
    }
  }

  /**
  * Algorythm
  */
  run () {
    if (_.isEmpty(this.nodes)) return
    this.columns = this.p.columns || 0
    this.rows = this.p.rows || 0
    this.width = this.p.width || 0
    this.height = this.p.height || 0
    let columns
    let rows

    switch (this.p.name) {
    case ('Grid'):
      if (this.width) {
        columns = this._calculateColumns()
        if (columns === 0) {
          this._getDefaultCoords()
          break
        }
        this._getCoords(columns, 'column')
        break
      }
      rows = this._calculateRows()
      if (rows === 0) {
        this._getDefaultCoords()
        break
      }
      this._getCoords(rows)
      break
    case ('List'):
      if (this.columns) {
        this._getCoords(1, 'column')
        break
      }
      this._getCoords(1)
      break
    case ('Table'):
      if (this.columns) {
        this._getCoords(this.columns, 'column')
        break
      }
      this._getCoords(this.rows)
      break
    default:
      this._getDefaultCoords()
    }

    super.run()
  }

  _getCoords (count, draw = 'row') {
    const coords = this.coords
    const cellWidth = this.p.cell.width || 0
    const cellHeight = this.p.cell.height || 0
    const offset = this.p.offset
    let i = 0
    let j = 0

    if (draw === 'column') {
      _.each(this.nodes, (node, index) => {
        if (i === count) {
          i = 0
          j++
        }
        const x = (i * cellWidth) + offset.x
        const y = (j * cellHeight) + offset.y
        i++
        coords[index] = { x, y }
      })
    } else {
      _.each(this.nodes, (node, index) => {
        if (j === count && count !== 0) {
          j = 0
          i++
        }
        const x = (i * cellWidth) + offset.x
        const y = (j * cellHeight) + offset.y
        j++
        coords[index] = { x, y }
      })
    }
  }

  _getDefaultCoords () {
    _.each(this.nodes, (node, i) => {
      const x = this.p.offset.x || 0
      const y = this.p.offset.y || 0
      this.coords[i] = { x, y }
    })
  }

  _calculateColumns () {
    return Math.floor((this.p.width - this.p.offset.x) / this.p.cell.width)
  }

  _calculateRows () {
    return Math.floor((this.p.height - this.p.offset.y) / this.p.cell.height)
  }
}
