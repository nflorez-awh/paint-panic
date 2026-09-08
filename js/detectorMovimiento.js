class DetectorMovimiento {
  constructor(w, h, escala = 0.15) {
    this.w = w;
    this.h = h;
    this.bufW = Math.max(20, Math.floor(w * escala));
    this.bufH = Math.max(15, Math.floor(h * escala));

    this.bufferActual = createGraphics(this.bufW, this.bufH);
    this.bufferAnterior = createGraphics(this.bufW, this.bufH);
    this.frameAnteriorListo = false;

    this.sensibilidad = 25;
    this.thresholdActivo = 0.02;

    this.intensidad = 0;
    this.intensidadSuave = 0;
    this.categoriaVelocidad = 'Inmóvil';
    this.activo = false;
    this.direccion = 'Ninguna';
    this.centroX = 0;
    this.centroY = 0;
    this.gestos = 0;
    this._enPico = false;
  }

  analizar(video) {
    // 1. Cargamos el video actual en el buffer
    this.bufferActual.image(video, 0, 0, this.bufW, this.bufH);
    this.bufferActual.loadPixels();

    if (!this.frameAnteriorListo) {
      this.bufferAnterior.image(this.bufferActual, 0, 0);
      this.bufferAnterior.loadPixels();
      this.frameAnteriorListo = true;
      return;
    }

    let actual = this.bufferActual.pixels;
    let anterior = this.bufferAnterior.pixels;
    let totalPixeles = this.bufW * this.bufH;

    let cambiados = 0;
    let sumaX = 0, sumaY = 0;
    let actIzq = 0, actDer = 0, actArriba = 0, actAbajo = 0;

    // 2. Comparamos cuadro por cuadro y modificamos los píxeles visualmente a Blanco y Negro
    for (let y = 0; y < this.bufH; y++) {
      for (let x = 0; x < this.bufW; x++) {
        let i = (y * this.bufW + x) * 4;
        let dr = Math.abs(actual[i] - anterior[i]);
        let dg = Math.abs(actual[i + 1] - anterior[i + 1]);
        let db = Math.abs(actual[i + 2] - anterior[i + 2]);
        let diff = (dr + dg + db) / 3;

        if (diff > this.sensibilidad) {
          cambiados++;
          sumaX += x;
          sumaY += y;
          if (x < this.bufW / 2) actIzq++; else actDer++;
          if (y < this.bufH / 2) actArriba++; else actAbajo++;

          // Píxel que cambió -> Se vuelve BLANCO
          actual[i] = 255;
          actual[i + 1] = 255;
          actual[i + 2] = 255;
        } else {
          // Píxel estático -> Se vuelve NEGRO
          actual[i] = 0;
          actual[i + 1] = 0;
          actual[i + 2] = 0;
        }
        actual[i + 3] = 255; // Canal alfa opaco
      }
    }

    // 3. Actualizamos los cambios gráficos en el buffer
    this.bufferActual.updatePixels();

    this.intensidad = cambiados / totalPixeles;
    this.intensidadSuave = lerp(this.intensidadSuave, this.intensidad, 0.25);
    this.activo = this.intensidad > this.thresholdActivo;

    if (cambiados > 0) {
      this.centroX = (sumaX / cambiados) / this.bufW * this.w;
      this.centroY = (sumaY / cambiados) / this.bufH * this.h;
    }

    if (this.intensidadSuave < 0.005) this.categoriaVelocidad = 'Inmóvil';
    else if (this.intensidadSuave < 0.03) this.categoriaVelocidad = 'Lento';
    else if (this.intensidadSuave < 0.08) this.categoriaVelocidad = 'Normal';
    else this.categoriaVelocidad = 'Rápido';

    if (cambiados > 5) {
      let horiz = Math.abs(actDer - actIzq);
      let vert = Math.abs(actAbajo - actArriba);
      if (Math.max(horiz, vert) < cambiados * 0.08) {
        this.direccion = 'Ninguna';
      } else if (horiz > vert) {
        this.direccion = actDer > actIzq ? 'Derecha' : 'Izquierda';
      } else {
        this.direccion = actAbajo > actArriba ? 'Abajo' : 'Arriba';
      }
    } else {
      this.direccion = 'Ninguna';
    }

    if (this.intensidadSuave > this.thresholdActivo * 2.5 && !this._enPico) {
      this._enPico = true;
      this.gestos++;
    } else if (this.intensidadSuave < this.thresholdActivo && this._enPico) {
      this._enPico = false;
    }

    // Guardamos una copia del cuadro actual limpio (antes de alterarlo a blanco y negro) para la siguiente resta
    this.bufferAnterior.image(video, 0, 0, this.bufW, this.bufH);
    this.bufferAnterior.loadPixels();
  }

  intensidadControl() {
    return constrain(this.intensidadSuave / 0.1, 0, 1);
  }

  reiniciarGestos() {
    this.gestos = 0;
  }
}