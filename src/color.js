const { pow, sqrt } = Math

export class Color {
  constructor(r, g, b) {
    [r, g, b] = [r, g, b].map(val => (val < 0)? 0 : (val > 255)? 255 : val)
    this.r = r
    this.g = g
    this.b = b
  }

  clone() {
    return new Color(this.r, this.g, this.b)
  }

  create(brightness) {
    if (this.r === 0 && this.g === 0 && this.b === 0) { return this.clone() }
    if (brightness < 0) {brightness = 0}else if (brightness > 1) {brightness = 1}
    if (brightness === 0) {return new Color(0, 0, 0)}
    if (brightness === 1) {return this.clone()}
    const mag = sqrt(pow(this.r, 2) + pow(this.g, 2) + pow(this.b, 2))
    return new Color(
      (brightness * 255 * this.r / mag + 0.5) | 0,
      (brightness * 255 * this.g / mag + 0.5) | 0,
      (brightness * 255 * this.b / mag + 0.5) | 0 
    )
  }

  toString() {
    // return `#${this.r.toString(16)}${this.g.toString(16)}${this.b.toString(16)}`
    return `rgb(${this.r},${this.g},${this.b})`
  }
}
