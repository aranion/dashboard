import Log from './Log.js'
import Widget from './Widget.js'
import SETTINGS from './settings.js'

function Dashboard(dashboardElement, settings) {
  this.domElement = dashboardElement
  this.lengthCol = settings.lengthCol || SETTINGS.lengthCol
  this.lengthRow = settings.lengthRow || SETTINGS.lengthRow
  this.listWidgets = []
  this.nextIdWidget = 0
  this.targetWidget = null

  const init = () => {
    if (this.domElement) {
      this.addRowCol()
      this.addEventMouseMove()
      this.addEventMouseDown()

      window.addEventListener('resize', (e) => {
        this.resizeCols()
        this.resizeWidgets()
      }, true)
    } else {
      Log.error('dashboardElement - Empty!')
    }
  }

  this.createWidget = (config = { id, listUsedPosition, size, position, minSize, maxSize }) => {
    const listUsedPosition = this.getListUsedPosition(null)
    const newWidget = new Widget(this, {
      id: ++this.nextIdWidget,
      listUsedPosition,
      ...config,
    })

    this.listWidgets.push(newWidget)
  }
  this.removeWidget = (widgetId) => {
    this.listWidgets = this.listWidgets.filter((widget) => widget.getId() !== widgetId)
  }
  this.getWidgets = (widgetId) => {
    if (widgetId) {
      return this.listWidgets.find((widget) => widget.getId() === widgetId)
    } else {
      return this.listWidgets
    }
  }
  this.getListUsedPosition = (widgetId) => {
    return this.listWidgets.reduce((res, widget) => {
      if (widget.getId() !== widgetId) {
        const { sizeRow, sizeCol } = widget.getSize()
        const { rowIndex, colIndex } = widget.getPosition()

        for (let r = rowIndex; r < rowIndex + sizeRow; r++) {
          for (let c = colIndex; c < colIndex + sizeCol; c++) {
            res.push(`${r}x${c}`)
          }
        }
      }

      return res
    }, [])
  }


  this.setTargetWidget = (widgetId) => {
    const foundWidgets = this.getWidgets(widgetId)

    if (foundWidgets) {
      this.targetWidget = foundWidgets
    } else {
      this.clearTargetWidget()
    }
  }
  this.clearTargetWidget = () => {
    this.targetWidget = null
  }

  this.addEventMouseMove = () => {
    this.domElement.addEventListener('mouseup', (e) => {
      if (this.targetWidget) {
        this.targetWidget.isTouchMovedBlock = false
        this.targetWidget.isTouchResizeBlock = false
        this.targetWidget.setListUsedPosition([])
      }

      this.clearTargetWidget()

      Log.debug('--> mouseup')
    }, true)

    this.domElement.addEventListener('mousemove', (e) => {
      e.preventDefault()
      e.stopPropagation()

      if (this.targetWidget) {
        const { clientHeight, clientWidth, offsetTop, offsetLeft } = this.domElement
        const partWidth = clientWidth / this.lengthCol
        const partHeight = clientHeight / this.lengthRow
        const targetIndexCol = Math.floor((e.clientX - offsetLeft) / partWidth)
        const targetIndexRow = Math.floor((e.clientY - offsetTop) / partHeight)

        if (this.targetWidget.isTouchResizeBlock) {
          const { rowIndex, colIndex } = this.targetWidget.getPosition()
          const newSizeCol = targetIndexCol - colIndex <= 0 ? 1 : targetIndexCol - colIndex + 1
          const newSizeRow = targetIndexRow - rowIndex <= 0 ? 1 : targetIndexRow - rowIndex + 1

          this.targetWidget.changeSize(newSizeRow, newSizeCol)
        }

        if (this.targetWidget.isTouchMovedBlock) {
          this.targetWidget.changePosition(targetIndexRow, targetIndexCol)
        }
      }
    }, true)
  }

  this.addEventMouseDown = () => {
    this.domElement.addEventListener(
      'mousedown',
      (e) => {
        const target = e.target
        const isTouchMovedBlock = target.className.includes('window_widget__moved_block')
        const isTouchResizeBlock = target.className.includes('window_widget__resize_block')

        if (isTouchMovedBlock || isTouchResizeBlock) {
          const widgetId = target.parentElement.id
          const listUsedPosition = this.getListUsedPosition(widgetId)

          this.setTargetWidget(widgetId)
          this.targetWidget.setListUsedPosition(listUsedPosition)
          this.targetWidget.isTouchMovedBlock = isTouchMovedBlock
          this.targetWidget.isTouchResizeBlock = isTouchResizeBlock

          Log.debug('--> mousedown (id=' + widgetId + ')')
        } else {
          Log.debug('Is not moved/resize block!')
        }
      },
      true
    )
    Log.debug('--> addEventMouseDown')
  }

  this.addRowCol = () => {
    for (let rowIndex = 0; rowIndex < this.lengthRow; rowIndex++) {
      const row = document.createElement('div')
      row.classList.add('row')

      for (let colIndex = 0; colIndex < this.lengthCol; colIndex++) {
        const col = document.createElement('div')

        const { clientHeight, clientWidth } = this.domElement
        col.classList.add('col')
        col.style.height = `${clientHeight / this.lengthRow}px`
        col.style.width = `${clientWidth / this.lengthRow}px`
        col.innerText = `${rowIndex}x${colIndex}`
        row.append(col)
      }

      this.domElement.append(row)
    }

    Log.debug('--> addRowCol')
  }

  this.resizeCols = () => {
    const cols = document.querySelectorAll('.col')
    const { clientHeight, clientWidth } = this.domElement
    const width = clientWidth / this.lengthCol
    const height = clientHeight / this.lengthRow

    cols.forEach((col) => {
      col.style.height = `${height}px`
      col.style.width = `${width}px`
    })

    Log.debug('--> resizeCols')
  }

  this.resizeWidgets = () => {
    this.getWidgets().forEach((widget) => {
      widget.resize()
    })

    Log.debug('--> resizeWnds')
  }

  init()
}

export default Dashboard