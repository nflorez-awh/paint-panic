// detector.js
// Detecta tres colores en un único recorrido de la imagen de la cámara:
//   - VERDE -> Pincel (pinta sobre el lienzo)
//   - AZUL  -> Selector de interfaz (mueve/activa los botones de UI, como un mouse)
//   - ROJO  -> Borrador (borra el lienzo)
//
// Cada color tiene su propio umbral mínimo de píxeles para considerarse "detectado",
// evitando falsos positivos por ruido de la cámara o luces del ambiente.

class DetectorMultiColor {
  constructor() {
    this.pincel   = { x: 0, y: 0, detectado: false, contador: 0 };
    this.selector = { x: 0, y: 0, detectado: false, contador: 0 };
    this.borrador = { x: 0, y: 0, detectado: false, contador: 0 };

    // Umbrales de píxeles mínimos para confirmar detección de cada color.
    this.umbralPincel = 800;
    this.umbralSelector = 500;
    this.umbralBorrador = 800;
  }

  analizar(video) {
    video.loadPixels();

    let cV = 0, sxV = 0, syV = 0; // verde
    let cA = 0, sxA = 0, syA = 0; // azul
    let cR = 0, sxR = 0, syR = 0; // rojo

    if (video.pixels.length > 0) {
      for (let y = 0; y < video.height; y++) {
        for (let x = 0; x < video.width; x++) {
          let i = (y * video.width + x) * 4;
          let r = video.pixels[i];
          let g = video.pixels[i + 1];
          let b = video.pixels[i + 2];

          if (this._esVerde(r, g, b)) {
            cV++; sxV += x; syV += y;
          } else if (this._esAzul(r, g, b)) {
            cA++; sxA += x; syA += y;
          } else if (this._esRojo(r, g, b)) {
            cR++; sxR += x; syR += y;
          }
        }
      }
    }

    this._actualizarResultado(this.pincel, cV, sxV, syV, this.umbralPincel);
    this._actualizarResultado(this.selector, cA, sxA, syA, this.umbralSelector);
    this._actualizarResultado(this.borrador, cR, sxR, syR, this.umbralBorrador);
  }

  _actualizarResultado(obj, contador, sumaX, sumaY, umbral) {
    obj.contador = contador;
    if (contador > umbral) {
      obj.detectado = true;
      obj.x = sumaX / contador;
      obj.y = sumaY / contador;
    } else {
      obj.detectado = false;
    }
  }

  // Verde: canal G claramente por encima de R y B
  _esVerde(r, g, b) {
    return g > r + 30 && g > b + 30;
  }

  // Azul: canal B claramente por encima de R y G
  _esAzul(r, g, b) {
    return b > r + 30 && b > g + 30;
  }

  // Rojo: R alto, G y B bajos y parecidos entre sí
  _esRojo(r, g, b) {
    return r > 150 && g < 90 && b < 90 && r > g + 60 && r > b + 60;
  }
}