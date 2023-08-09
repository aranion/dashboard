import Log from './Log.js'

function Widget(dashboard, config) {
  this.dashboardElement = dashboard.domElement
  this.widget = document.createElement('div')
  this.movedBlock = document.createElement('div')
  this.bodyWidget = document.createElement('div')
  this.resizeBlock = document.createElement('div')

  this.beforeChangePosition = []
  this.listUsedPosition = []
  this.position = []

  this.widget.classList.add('window_widget')

  this.isTouchResizeBlock = false
  this.isTouchMovedBlock = false

  const init = () => {
    for (let rowIndex = 0; rowIndex < dashboard.lengthRow; rowIndex++) {
      const cols = []
      for (let colIndex = 0; colIndex < dashboard.lengthCol; colIndex++) {
        cols.push(0)
      }
      this.position.push(cols)
    }

    const { id, listUsedPosition, size, position } = config

    this.widget.id = id ?? new Date().getTime()
    this.setListUsedPosition(listUsedPosition)

    const isConfigSize = Array.isArray(size) && size.length === 2 && !isNaN(+size[0]) && !isNaN(+size[1])
    const isConfigPosition = Array.isArray(position) && position.length === 2 && !isNaN(+position[0]) && !isNaN(+position[1])

    const [sizeRow, sizeCol] = isConfigSize ? size : [1, 1]
    const [rowIndex, colIndex] = isConfigPosition ? position : [0, 0]

    setSize(sizeRow, sizeCol)
    const checkedInitPosition = checkInitPosition(rowIndex, colIndex)
    setPosition(checkedInitPosition.rowIndex, checkedInitPosition.colIndex)
    move()

    addMovedBlock()
    addBodyWidget()
    addResizeBlock()

    this.dashboardElement.append(this.widget)

    Log.debug(`--> init (id=${this.widget.id})`)
  }
  const move = () => {
    const rows = document.querySelectorAll('.row')
    // TODO ИСПОЛЬЗОВАТЬ МАТРИЦУ ПОЗИЦИИ И РАСЧЕТ ШИРИНЫ НА ЕЕ ОСНОВЕ
    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.position[rowIndex].length; colIndex++) {
        if (this.position[rowIndex][colIndex] === '*') {
          const col = rows[rowIndex].querySelectorAll('.col')[colIndex]
          const general_wrapper = document.querySelector('.general_wrapper')
          const { clientWidth, clientHeight } = general_wrapper
          const { offsetTop, offsetLeft, clientLeft, clientTop } = col
          const startPositionXY = {
            x: offsetLeft - clientWidth / 2,
            y: offsetTop - clientHeight / 2,
          }
          const { width, height } = calcWidthAndHeight()
          const positionX = Math.floor(startPositionXY.x + width / 2)
          const positionY = Math.floor(startPositionXY.y + height / 2)

          this.widget.style.transform = `translate(${positionX}px, ${positionY}px)`

          Log.debug(`--> moveWnd (id=${this.widget.id})`)
          return null
        }
      }
    }
  }
  const calcWidthAndHeight = () => {
    const { sizeCol, sizeRow } = this.getSize()
    const { clientWidth, clientHeight } = this.dashboardElement
    const widthOnePart = clientWidth / dashboard.lengthCol
    const heightOnePart = clientHeight / dashboard.lengthRow

    Log.debug(`--> calcWidthAndHeight (id=${this.widget.id})`)

    return { width: Math.floor(widthOnePart * sizeCol), height: Math.floor(heightOnePart * sizeRow) }
  }
  const copyPosition = () => {
    const newBeforeChangePosition = []

    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      const cols = []

      for (let colIndex = 0; colIndex < this.position[rowIndex].length; colIndex++) {
        cols.push(this.position[rowIndex][colIndex])
      }

      newBeforeChangePosition.push(cols)
    }

    this.beforeChangePosition = newBeforeChangePosition

    Log.debug(`--> copyPosition (id=${this.widget.id})`)
  }
  const clearPosition = () => {
    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.position[rowIndex].length; colIndex++) {
        this.position[rowIndex][colIndex] = 0
      }
    }

    Log.debug(`--> clearPosition (id = ${this.widget.id})`)
  }
  const restorePosition = () => {
    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.position[rowIndex].length; colIndex++) {
        this.position[rowIndex][colIndex] = this.beforeChangePosition[rowIndex][colIndex]
      }
    }

    Log.debug(`--> restorePosition (id = ${this.widget.id})`)
  }
  const checkMaxMinPosition = (rowIndex, colIndex, sizeRow, sizeCol) => {
    let checkedColIndex = colIndex
    let checkedRowIndex = rowIndex

    const checkMax = () => {
      const rowLength = this.position.length
      const colLength = this.position[rowIndex].length
      const isMaxColIndex = checkedColIndex + sizeCol > colLength
      const isMaxRowIndex = checkedRowIndex + sizeRow > rowLength

      checkedColIndex = isMaxColIndex ? colLength - sizeCol : checkedColIndex
      checkedRowIndex = isMaxRowIndex ? rowLength - sizeRow : checkedRowIndex
    }
    const checkMin = () => {
      const isMinColIndex = checkedColIndex < 0
      const isMinRowIndex = checkedRowIndex < 0
      const minSizeColIndex = 0
      const minSizeRowIndex = 0

      checkedColIndex = isMinColIndex ? minSizeColIndex : checkedColIndex
      checkedRowIndex = isMinRowIndex ? minSizeRowIndex : checkedRowIndex
    }

    checkMax()
    checkMin()

    return { checkedRowIndex, checkedColIndex }
  }
  const checkMinMaxSize = (sizeRow, sizeCol) => {
    const { rowIndex } = this.getPosition()
    const rowLength = this.position.length
    const colLength = this.position[rowIndex].length
    const isMaxSizeCol = sizeCol - 1 >= colLength
    const isMaxSizeRow = sizeRow - 1 >= rowLength
    const isMinSizeCol = sizeCol - 1 < 0
    const isMinSizeRow = sizeRow - 1 < 0

    let checkedSizeCol = isMaxSizeCol ? colLength : isMinSizeCol ? 1 : sizeCol
    let checkedSizeRow = isMaxSizeRow ? rowLength : isMinSizeRow ? 1 : sizeRow

    if (config?.maxSize && Array.isArray(config.maxSize)) {
      const [maxColSize, maxRowSize] = config.maxSize

      checkedSizeCol = checkedSizeCol > maxColSize ? maxColSize : checkedSizeCol
      checkedSizeRow = checkedSizeRow > maxRowSize ? maxRowSize : checkedSizeRow
    }

    if (config?.minSize && Array.isArray(config.minSize)) {
      const [minColSize, minRowSize] = config.minSize

      checkedSizeCol = checkedSizeCol < minColSize ? minColSize : checkedSizeCol
      checkedSizeRow = checkedSizeRow < minRowSize ? minRowSize : checkedSizeRow
    }

    Log.debug(`--> checkMinMaxSize (id=${this.widget.id})`)

    return { checkedSizeRow, checkedSizeCol }
  }
  const setSize = (sizeRow, sizeCol) => {
    if (isNaN(+sizeCol) || isNaN(+sizeRow)) {
      Log.error('Error: sizeCol or sizeRow - isNaN!')
      return null
    }

    const { checkedSizeRow, checkedSizeCol } = checkMinMaxSize(sizeRow, sizeCol)
    const { rowIndex, colIndex } = this.getPosition()

    for (let r = 0; r < rowIndex + checkedSizeRow; r++) {
      for (let c = 0; c < colIndex + checkedSizeCol; c++) {
        const d = checkMinMaxSize(r, c)
        const s = checkUsedPosition(d.checkedSizeRow, d.checkedSizeCol)

        if (s) {
          if (!this.widget.dataset.sizeCol && !this.widget.dataset.sizeRow) {
            this.widget.dataset.sizeCol = r
            this.widget.dataset.sizeRow = c

            const { width, height } = calcWidthAndHeight()

            this.widget.style.width = `${width}px`
            this.widget.style.height = `${height}px`
          }

          return
        }
      }
    }

    this.widget.dataset.sizeCol = checkedSizeCol
    this.widget.dataset.sizeRow = checkedSizeRow

    const { width, height } = calcWidthAndHeight()

    this.widget.style.width = `${width}px`
    this.widget.style.height = `${height}px`
  }
  const setPosition = (newRowIndex, newColIndex) => {
    const { sizeRow, sizeCol } = this.getSize()

    let isSetPositionCompleted = false

    // Скопировать предыдущее положение
    copyPosition()

    // Сбросить все позиции
    clearPosition()

    // Найти доступную новую позицию
    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      const rowLength = this.position.length
      const colLength = this.position[rowIndex].length

      if (isSetPositionCompleted) break

      for (let colIndex = 0; colIndex < colLength; colIndex++) {
        const isNewPosition = rowIndex === newRowIndex && colIndex === newColIndex

        if (isSetPositionCompleted) break

        if (isNewPosition) {
          isSetPositionCompleted = true

          const { checkedColIndex, checkedRowIndex } = checkMaxMinPosition(rowIndex, colIndex, sizeRow, sizeCol)

          // Заполнить новую позицию
          for (let r = 0; r < sizeRow; r++) {
            for (let c = 0; c < sizeCol; c++) {
              const isNotUsePosition = checkUsedPosition(checkedRowIndex + r, checkedColIndex + c)

              if (isNotUsePosition) {
                restorePosition()
                return
              }

              this.position[checkedRowIndex + r][checkedColIndex + c] = '*'
            }
          }
        }
      }
    }

    // Если изменения позиции не произошло, вернуть предыдущее положение
    if (!isSetPositionCompleted) {
      restorePosition()
    }

    Log.debug(`${this.position.reduce((ss, p) => (ss += p.reduce((s, t) => (s += t + '|'), '|') + '\n'), '')}`)
    Log.debug(`--> setPosition (id=${this.widget.id})`)
  }
  const checkUsedPosition = (rowIndex, colIndex) => {
    return !!this.listUsedPosition.find((position) => position === `${rowIndex}x${colIndex}`)
  }
  const checkInitPosition = (rowIndex, colIndex) => {
    const { sizeRow, sizeCol } = this.getSize()

    for (let r = rowIndex; r < dashboard.lengthRow; r++) {
      for (let c = colIndex; c < dashboard.lengthCol; c++) {
        const isNotUsePosition = !checkUsedPosition(r, c)

        if (isNotUsePosition) {
          let isFoundPosition = true

          for (let rr = r; rr < r + sizeRow; rr++) {
            const isMaxRowIndex = rr + sizeRow === dashboard.lengthRow

            if (!isFoundPosition) break

            if (isMaxRowIndex) {
              break
            }

            for (let cc = c; cc < c + sizeCol; cc++) {
              const isUsePosition = checkUsedPosition(rr, cc)
              const isMaxRowIndex = cc + sizeCol === dashboard.lengthCol

              // Если достигнут максимальный индекс - пропустить все колонки
              if (isMaxRowIndex) {
                break
              }
              if (rr + sizeRow > dashboard.lengthRow || cc + sizeCol > dashboard.lengthCol) {
                isFoundPosition = false
                break
              }
              if (isUsePosition) {
                isFoundPosition = false
                break
              }
            }
          }
          if (isFoundPosition) {
            return { rowIndex: r, colIndex: c }
          }
        }
      }
    }

    return { rowIndex: 0, colIndex: 0 }
  }
  const addResizeBlock = () => {
    this.resizeBlock.classList.add('window_widget__resize_block')
    this.widget.append(this.resizeBlock)

    Log.debug(`--> addResizeBlock (id=${this.widget.id})`)
  }
  const addMovedBlock = () => {
    this.movedBlock.classList.add('window_widget__moved_block')
    this.widget.append(this.movedBlock)

    Log.debug(`--> addMovedBlock (id=${this.widget.id})`)
  }
  const addBodyWidget = () => {
    this.bodyWidget.classList.add('window_widget__body_block')
    this.bodyWidget.innerText = this.getId()
    this.widget.append(this.bodyWidget)

    Log.debug(`--> addBodyWidget (id=${this.widget.id})`)
  }

  this.getPosition = () => {
    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.position[rowIndex].length; colIndex++) {
        if (this.position[rowIndex][colIndex] === '*') {
          return { rowIndex, colIndex }
        }
      }
    }

    return { rowIndex: 0, colIndex: 0 }
  }
  this.getSize = () => {
    const sizeCol = +this.widget.dataset.sizeCol
    const sizeRow = +this.widget.dataset.sizeRow

    if (isNaN(sizeCol) || isNaN(sizeRow)) {
      Log.error('Error: sizeCol or sizeRow - isNaN!')
      return null
    }

    return { sizeRow, sizeCol }
  }
  this.getId = () => {
    return this.widget.id
  }

  this.setListUsedPosition = (newListUsedPosition) => {
    this.listUsedPosition = Array.isArray(newListUsedPosition) ? newListUsedPosition : []
  }

  this.changePosition = (rowIndex, colIndex) => {
    setPosition(rowIndex, colIndex)
    move()

    Log.debug(`--> changePosition (id=${this.widget.id})`)
  }
  this.changeSize = (sizeRow, sizeCol) => {
    // const { rowIndex, colIndex } = this.getPosition()

    if (!isNaN(sizeCol) && !isNaN(sizeRow)) {
      setSize(sizeRow, sizeCol)
      // setPosition(rowIndex, colIndex)
      move()
    } else {
      Log.error('isNaN sizeRow/sizeCol ')
    }

    Log.debug(`--> changeSize (id=${this.widget.id})`)
  }
  this.resize = () => {
    const { sizeRow, sizeCol } = this.getSize()

    this.changeSize(sizeRow, sizeCol)

    Log.debug(`--> resize (id=${this.widget.id})`)
  }

  init()
}

export default Widget