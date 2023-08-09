'use strict'

import Dashboard from './dashboard.js'
import SETTINGS from './settings.js'

window.addEventListener('load', (e) => {
  const general_wrapper = document.querySelector('.general_wrapper')
  const button = document.querySelector('#buttonAdd')

  const dashboard = new Dashboard(general_wrapper, { ...SETTINGS })

  button.addEventListener('click', () => {
    dashboard.createWidget({
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