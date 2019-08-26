import EventEmitter from 'eventemitter3'
import dat from 'dat.gui'
import '../style/datGui.scss'

export default class Setting extends EventEmitter {
  constructor (p) {
    super()
    this.pageSize = p
    this.gui = new dat.GUI({ autoPlace: false })
    this.folders = []
    this.controllers = []
    const container = document.querySelector('header')
    container.appendChild(this.gui.domElement)
  }

  updateControllers (p) {
    this.deleteControllers()
    this.deleteFolders(this.gui.__folders)
    this.setControllers(p)
    this.configController()
  }

  setControllers (p) {
    const keys = Object.keys(p)
    _.each(keys, (key) => {
      if (_.isObject(p[key])) {
        let folder
        if (this.folders.length > 0) {
          folder = this.setFolder(key, _.last(this.folders))
        } else {
          folder = this.setFolder(key)
        }
        this.folders.push(folder)
        this.setControllers(p[key])
      } else if (this.folders.length > 0) {
        this.setController(p, key, _.last(this.folders))
      } else {
        this.setController(p, key)
      }
    })
    this.folders.pop()
  }

  setController (obj, property, folder) {
    let controller
    if (folder) {
      controller = folder.add(obj, property)
    } else {
      controller = this.gui.add(obj, property)
    }

    controller.path = _.reduce(this.folders, (result, value, key) => `${result}.${value.name}`, '')
    controller.onChange(this._onChange.bind(this, controller))
    this.controllers.push(controller)
  }

  setFolder (name, folder = null) {
    let newFolder
    if (folder) {
      newFolder = folder.addFolder(name)
    } else {
      newFolder = this.gui.addFolder(name)
    }
    newFolder.open()
    return newFolder
  }

  deleteControllers () {
    _.each(this.controllers, (controller) => {
      controller.remove()
    })
    _.remove(this.controllers)
  }

  deleteFolders (folders) {
    _.each(folders, (folder) => {
      if (Object.keys(folder.__folders).length > 0) {
        this.deleteFolders(folder.__folders)
        folder.parent.removeFolder(folder)
      } else {
        folder.parent.removeFolder(folder)
      }
    })
  }

  configController () {
    _.each(this.controllers, (controller, i) => {
      if (controller.constructor.name === 'NumberControllerBox') {
        controller.min(0)
        controller.step(1)
      }

      // config custom property
      if (controller.property === 'startRadian') {
        const path = controller.path
        const sliderController = controller.max(360)
        sliderController.path = path
        sliderController.onChange(this._onChange.bind(this, sliderController))
        this.controllers[i] = sliderController
      }
      if (controller.path === '.center' && controller.property === 'x') {
        const path = controller.path
        const sliderController = controller.max(this.pageSize.width)
        sliderController.path = path
        sliderController.onChange(this._onChange.bind(this, sliderController))
        this.controllers[i] = sliderController
      }
      if (controller.path === '.center' && controller.property === 'y') {
        const path = controller.path
        const sliderController = controller.max(this.pageSize.height)
        sliderController.path = path
        sliderController.onChange(this._onChange.bind(this, sliderController))
        this.controllers[i] = sliderController
      }
    })
  }

  _onChange (controller, value) {
    this.emit('change', controller.path, controller.property, value)
  }
}
