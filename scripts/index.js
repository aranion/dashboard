'use strict'

const LENGTH_ROW = 12
const LENGTH_COL = 12

const listWnd = {
  list: [],
  nextId: 0,
  wrapper: null,
  init: function (general_wrapper) {
    if (general_wrapper) {
      this.wrapper = general_wrapper
    } else {
      log.error('general_wrapper is Empty!')
    }
  },
  set: function (config = { id, listUsedPosition, size, position, minSize, maxSize }) {
    const listUsedPosition = this.getListUsedPosition(null)

    if (this.wrapper) {
      const newWnd = new Wnd(this.wrapper, {
        id: ++this.nextId,
        listUsedPosition,
        ...config,
      })

      this.list.push(newWnd)
    } else {
      log.error('this.wrapper is Empty!')
    }
  },
  remove: function (wndId) {
    this.list = this.list.filter((wnd) => wnd.getId() !== wndId)
  },
  get: function (wndId) {
    if (wndId) {
      return this.list.find((wnd) => wnd.getId() === wndId)
    }
    return this.list
  },
  getListUsedPosition: function (wndId) {
    return this.list.reduce((res, wnd) => {
      if (wnd.getId() !== wndId) {
        const { sizeRow, sizeCol } = wnd.getSize()
        const { rowIndex, colIndex } = wnd.getPosition()

        for (let r = rowIndex; r < rowIndex + sizeRow; r++) {
          for (let c = colIndex; c < colIndex + sizeCol; c++) {
            res.push(`${r}x${c}`)
          }
        }
      }

      return res
    }, [])
  },
}
const targetWnd = {
  wnd: null,
  set: function (id) {
    const foundWnd = listWnd.get(id)

    if (foundWnd) {
      this.wnd = foundWnd
    } else {
      this.clear()
    }
  },
  get: function () {
    return this.wnd
  },
  clear: function () {
    this.wnd = null
  },
}
const log = {
  isShow: true,
  show: function () {
    this.isShow = true
  },
  hide: function () {
    this.isShow = false
  },
  debug: function (...text) {
    if (this.isShow) {
      console.debug(...text)
    }
  },
  error: function (...text) {
    if (this.isShow) {
      console.error(...text)
    }
  },
}

function Wnd(general_wrapper, config) {
  this.general_wrapper = general_wrapper
  this.wnd = document.createElement('div')
  this.movedBlock = document.createElement('div')
  this.bodyWidget = document.createElement('div')
  this.resizeBlock = document.createElement('div')

  this.beforeChangePosition = []
  this.listUsedPosition = []
  this.position = []

  this.wnd.classList.add('window_widget')

  this.isTouchResizeBlock = false
  this.isTouchMovedBlock = false

  const init = () => {
    if (this.general_wrapper) {
      for (let rowIndex = 0; rowIndex < LENGTH_ROW; rowIndex++) {
        const cols = []
        for (let colIndex = 0; colIndex < LENGTH_COL; colIndex++) {
          cols.push(0)
        }
        this.position.push(cols)
      }

      const { id, listUsedPosition, size, position } = config

      this.wnd.id = id ?? new Date().getTime()
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

      this.general_wrapper.append(this.wnd)

      log.debug(`--> init (id=${this.wnd.id})`)
    } else {
      log.error('Error: general_wrapper - is Empty!')
    }
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

          this.wnd.style.transform = `translate(${positionX}px, ${positionY}px)`

          log.debug(`--> moveWnd (id=${this.wnd.id})`)
          return null
        }
      }
    }
  }
  const calcWidthAndHeight = () => {
    const { sizeCol, sizeRow } = this.getSize()
    const { clientWidth, clientHeight } = this.general_wrapper
    const widthOnePart = clientWidth / LENGTH_COL
    const heightOnePart = clientHeight / LENGTH_ROW

    log.debug(`--> calcWidthAndHeight (id=${this.wnd.id})`)

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

    log.debug(`--> copyPosition (id=${this.wnd.id})`)
  }
  const clearPosition = () => {
    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.position[rowIndex].length; colIndex++) {
        this.position[rowIndex][colIndex] = 0
      }
    }

    log.debug(`--> clearPosition (id = ${this.wnd.id})`)
  }
  const restorePosition = () => {
    for (let rowIndex = 0; rowIndex < this.position.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.position[rowIndex].length; colIndex++) {
        this.position[rowIndex][colIndex] = this.beforeChangePosition[rowIndex][colIndex]
      }
    }

    log.debug(`--> restorePosition (id = ${this.wnd.id})`)
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

    log.debug(`--> checkMinMaxSize (id=${this.wnd.id})`)

    return { checkedSizeRow, checkedSizeCol }
  }
  const setSize = (sizeRow, sizeCol) => {
    if (isNaN(+sizeCol) || isNaN(+sizeRow)) {
      log.error('Error: sizeCol or sizeRow - isNaN!')
      return null
    }

    const { checkedSizeRow, checkedSizeCol } = checkMinMaxSize(sizeRow, sizeCol)
    const { rowIndex, colIndex } = this.getPosition()

    for (let r = 0; r < rowIndex + checkedSizeRow; r++) {
      for (let c = 0; c < colIndex + checkedSizeCol; c++) {
        const d = checkMinMaxSize(r, c)
        const s = checkUsedPosition(d.checkedSizeRow, d.checkedSizeCol)

        if (s) {
          if (!this.wnd.dataset.sizeCol && !this.wnd.dataset.sizeRow) {
            this.wnd.dataset.sizeCol = r
            this.wnd.dataset.sizeRow = c

            const { width, height } = calcWidthAndHeight()

            this.wnd.style.width = `${width}px`
            this.wnd.style.height = `${height}px`
          }

          return
        }
      }
    }

    this.wnd.dataset.sizeCol = checkedSizeCol
    this.wnd.dataset.sizeRow = checkedSizeRow

    const { width, height } = calcWidthAndHeight()

    this.wnd.style.width = `${width}px`
    this.wnd.style.height = `${height}px`
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

    log.debug(`${this.position.reduce((ss, p) => (ss += p.reduce((s, t) => (s += t + '|'), '|') + '\n'), '')}`)
    log.debug(`--> setPosition (id=${this.wnd.id})`)
  }
  const checkUsedPosition = (rowIndex, colIndex) => {
    return !!this.listUsedPosition.find((position) => position === `${rowIndex}x${colIndex}`)
  }
  const checkInitPosition = (rowIndex, colIndex) => {
    const { sizeRow, sizeCol } = this.getSize()

    for (let r = rowIndex; r < LENGTH_ROW; r++) {
      for (let c = colIndex; c < LENGTH_COL; c++) {
        const isNotUsePosition = !checkUsedPosition(r, c)

        if (isNotUsePosition) {
          let isFoundPosition = true

          for (let rr = r; rr < r + sizeRow; rr++) {
            const isMaxRowIndex = rr + sizeRow === LENGTH_ROW

            if (!isFoundPosition) break

            if (isMaxRowIndex) {
              break
            }

            for (let cc = c; cc < c + sizeCol; cc++) {
              const isUsePosition = checkUsedPosition(rr, cc)
              const isMaxRowIndex = cc + sizeCol === LENGTH_COL

              // Если достигнут максимальный индекс - пропустить все колонки
              if (isMaxRowIndex) {
                break
              }
              if (rr + sizeRow > LENGTH_ROW || cc + sizeCol > LENGTH_COL) {
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
    this.wnd.append(this.resizeBlock)

    log.debug(`--> addResizeBlock (id=${this.wnd.id})`)
  }
  const addMovedBlock = () => {
    this.movedBlock.classList.add('window_widget__moved_block')
    this.wnd.append(this.movedBlock)

    log.debug(`--> addMovedBlock (id=${this.wnd.id})`)
  }
  const addBodyWidget = () => {
    this.bodyWidget.classList.add('window_widget__body_block')
    this.bodyWidget.innerText = this.getId()
    this.wnd.append(this.bodyWidget)

    log.debug(`--> addBodyWidget (id=${this.wnd.id})`)
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
    const sizeCol = +this.wnd.dataset.sizeCol
    const sizeRow = +this.wnd.dataset.sizeRow

    if (isNaN(sizeCol) || isNaN(sizeRow)) {
      log.error('Error: sizeCol or sizeRow - isNaN!')
      return null
    }

    return { sizeRow, sizeCol }
  }
  this.getId = () => {
    return this.wnd.id
  }

  this.setListUsedPosition = (newListUsedPosition) => {
    this.listUsedPosition = Array.isArray(newListUsedPosition) ? newListUsedPosition : []
  }

  this.changePosition = (rowIndex, colIndex) => {
    setPosition(rowIndex, colIndex)
    move()

    log.debug(`--> changePosition (id=${this.wnd.id})`)
  }
  this.changeSize = (sizeRow, sizeCol) => {
    // const { rowIndex, colIndex } = this.getPosition()

    if (!isNaN(sizeCol) && !isNaN(sizeRow)) {
      setSize(sizeRow, sizeCol)
      // setPosition(rowIndex, colIndex)
      move()
    } else {
      log.error('isNaN sizeRow/sizeCol ')
    }

    log.debug(`--> changeSize (id=${this.wnd.id})`)
  }
  this.resize = () => {
    const { sizeRow, sizeCol } = this.getSize()

    this.changeSize(sizeRow, sizeCol)

    log.debug(`--> resize (id=${this.wnd.id})`)
  }

  init()
}

const addEventMouseMove = (general_wrapper) => {
  if (general_wrapper) {
    general_wrapper.addEventListener(
      'mouseup',
      (e) => {
        const target = targetWnd.get()

        if (target) {
          target.isTouchMovedBlock = false
          target.isTouchResizeBlock = false
          target.setListUsedPosition([])
        }

        targetWnd.clear()

        log.debug('--> mouseup')
      },
      true
    )

    general_wrapper.addEventListener(
      'mousemove',
      (e) => {
        e.preventDefault()
        e.stopPropagation()

        const target = targetWnd.get()

        if (target) {
          const { clientHeight, clientWidth, offsetTop, offsetLeft } = general_wrapper
          const partWidth = clientWidth / LENGTH_COL
          const partHeight = clientHeight / LENGTH_ROW
          const targetIndexCol = Math.floor((e.clientX - offsetLeft) / partWidth)
          const targetIndexRow = Math.floor((e.clientY - offsetTop) / partHeight)

          if (target.isTouchResizeBlock) {
            const { rowIndex, colIndex } = target.getPosition()
            const newSizeCol = targetIndexCol - colIndex <= 0 ? 1 : targetIndexCol - colIndex + 1
            const newSizeRow = targetIndexRow - rowIndex <= 0 ? 1 : targetIndexRow - rowIndex + 1

            target.changeSize(newSizeRow, newSizeCol)
          }

          if (target.isTouchMovedBlock) {
            target.changePosition(targetIndexRow, targetIndexCol)
          }
        }
      },
      true
    )
  } else {
    log.error('Error: general_wrapper - Empty!')
  }
}

const addEventMouseDown = (general_wrapper) => {
  if (general_wrapper) {
    general_wrapper.addEventListener(
      'mousedown',
      (e) => {
        const target = e.target
        const isTouchMovedBlock = target.className.includes('window_widget__moved_block')
        const isTouchResizeBlock = target.className.includes('window_widget__resize_block')

        console.log('<---------------------------------------->')

        if (isTouchMovedBlock || isTouchResizeBlock) {
          const idWnd = target.parentElement.id
          const listUsedPosition = listWnd.getListUsedPosition(idWnd)

          targetWnd.set(idWnd)
          targetWnd.get().setListUsedPosition(listUsedPosition)
          targetWnd.get().isTouchMovedBlock = isTouchMovedBlock
          targetWnd.get().isTouchResizeBlock = isTouchResizeBlock

          log.debug('--> mousedown (id=' + idWnd + ')')
        } else {
          log.debug('Is not moved/resize block!')
        }
      },
      true
    )
    log.debug('--> addEventMouseDown')
  } else {
    log.error('Error: general_wrapper - Empty!')
  }
}

const addRowCol = (general_wrapper) => {
  if (general_wrapper) {
    for (let rowIndex = 0; rowIndex < LENGTH_ROW; rowIndex++) {
      const row = document.createElement('div')
      row.classList.add('row')

      for (let colIndex = 0; colIndex < LENGTH_COL; colIndex++) {
        const col = document.createElement('div')

        const { clientHeight, clientWidth } = general_wrapper
        col.classList.add('col')
        col.style.height = `${clientHeight / LENGTH_ROW}px`
        col.style.width = `${clientWidth / LENGTH_COL}px`
        col.innerText = `${rowIndex}x${colIndex}`
        row.append(col)
      }

      general_wrapper.append(row)
    }

    log.debug('--> addRowCol')
  } else {
    log.error('Error: general_wrapper - EMPTY!')
  }
}

const resizeCols = (general_wrapper) => {
  if (general_wrapper) {
    const cols = document.querySelectorAll('.col')
    const { clientHeight, clientWidth } = general_wrapper
    const width = clientWidth / LENGTH_COL
    const height = clientHeight / LENGTH_ROW

    cols.forEach((col) => {
      col.style.height = `${height}px`
      col.style.width = `${width}px`
    })

    log.debug('--> resizeCols')
  } else {
    log.error('Error: general_wrapper - EMPTY!')
  }
}

const resizeWnds = (listWnd) => {
  if (listWnd) {
    listWnd.get().forEach((wnd) => {
      wnd.resize()
    })

    log.debug('--> resizeWnds')
  } else {
    log.error('Error: listWnd - EMPTY!')
  }
}

window.addEventListener('load', (e) => {
  const general_wrapper = document.querySelector('.general_wrapper')

  listWnd.init(general_wrapper)

  addRowCol(general_wrapper)
  addEventMouseMove(general_wrapper)
  addEventMouseDown(general_wrapper)

  function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

  document.querySelector('#buttonAdd').addEventListener('click', () => {
    listWnd.set({
      minSize: [2, 2],
    })
  })

  // listWnd.set({
  //   size: [2, 2],
  //   position: [1, 1],
  //   // minSize: [2, 3],
  //   // maxSize: [4, 4],
  // })
  // listWnd.set({
  //   size: [2, 2],
  //   position: [2, 2],
  //   // minSize: [2, 2],
  //   // maxSize: [5, 5],
  // })
  // listWnd.set({
  //   position: [0, 1],
  //   size: [3, 2],
  // })
  // listWnd.set({
  //   id: 'size: [2, 2],',
  //   size: [2, 2],
  // })
})
window.addEventListener(
  'resize',
  (e) => {
    const general_wrapper = document.querySelector('.general_wrapper')

    resizeCols(general_wrapper)
    resizeWnds(listWnd)
  },
  true
)