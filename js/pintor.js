class Pintor {
  constructor(w, h) {
    this.lienzo = createGraphics(w, h);
    this.lienzo.clear();
  }

  // opciones = { tamano, color: [r,g,b], tipo: 'redondo' | 'cuadrado' | 'spray' }
  dibujarTrazo(x, y, opciones = {}) {
    let tamano = opciones.tamano ?? 20;
    let col = opciones.color ?? [0, 255, 0];
    let tipo = opciones.tipo ?? 'redondo';

    // Invertimos la X para que coincida con la cámara espejo
    let xEspejo = width - x;

    this.lienzo.noStroke();
    this.lienzo.fill(col[0], col[1], col[2], 170);

    switch (tipo) {
      case 'cuadrado':
        this.lienzo.rectMode(CENTER);
        this.lienzo.rect(xEspejo, y, tamano, tamano);
        break;

      case 'spray':
        // Varios puntitos dispersos alrededor del centro, como una lata de spray
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

  // Dibuja el lienzo en el destino indicado (pg). Si no se pasa nada,
  // dibuja directamente en el canvas principal.
  mostrar(pg) {
    let ctx = pg || window;
    ctx.image(this.lienzo, 0, 0, ctx.width, ctx.height);
  }

  // Borra una zona circular del lienzo (deja transparente) en vez de pintar sobre ella.
  // Misma convención que dibujarTrazo: recibe x, y "crudos" y espeja internamente.
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