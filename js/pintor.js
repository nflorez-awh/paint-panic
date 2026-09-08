class Pintor {
  constructor(w, h) {
    this.lienzo = createGraphics(w, h);
    this.lienzo.clear();
  }

  dibujarTrazo(x, y, opciones = {}) {
    let tamano = opciones.tamano ?? 20;
    
    // Forzado a negro si no viene color o si por error llega el verde anterior
    let col = opciones.color;
    if (!col || (col[0] === 0 && col[1] === 255 && col[2] === 0)) {
      col = [0, 0, 0];
    }
    
    let tipo = opciones.tipo ?? 'redondo';
    let xEspejo = width - x;

    this.lienzo.noStroke();
    this.lienzo.fill(col[0], col[1], col[2], 170);

    switch (tipo) {
      case 'cuadrado':
        this.lienzo.rectMode(CENTER);
        this.lienzo.rect(xEspejo, y, tamano, tamano);
        break;

      case 'spray':
        for (let i = 0; i < 10; i++) {
          let ang = random(TWO_PI);
          let rad = random(tamano);
          let px = xEspejo + cos(ang) * rad;
          let py = y + sin(ang) * rad;
          this.lienzo.ellipse(px, py, 3, 3);
        }
        break;

      case 'redondo':
      default:
        this.lienzo.ellipse(xEspejo, y, tamano, tamano);
        break;
    }
  }

  mostrar(pg) {
    let ctx = pg || window;
    ctx.image(this.lienzo, 0, 0, ctx.width, ctx.height);
  }

  borrar(x, y, radio = 35) {
    let xEspejo = width - x;
    this.lienzo.erase();
    this.lienzo.noStroke();
    this.lienzo.ellipse(xEspejo, y, radio, radio);
    this.lienzo.noErase();
  }

  limpiar() {
    this.lienzo.clear();
  }
}