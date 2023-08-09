const Log = {
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

export default Log