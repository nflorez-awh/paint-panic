// detectorMovimiento.js
// Detección de movimiento real por FRAME DIFFERENCE: compara el frame actual
// de la cámara contra el frame anterior para saber qué cambió, cuánto cambió,
// y hacia dónde. Es la técnica que pide la guía del proyecto (no detección
// de color): background subtraction / frame difference.
//
// Para que rinda bien en tiempo real, la comparación NO se hace sobre los
// 800x600 píxeles completos: se reduce el frame a un buffer chico (por
// defecto ~15% del tamaño) y se compara ahí. Es la misma idea, mucho más barata.
//
// Expone, en cada frame, TODAS las lecturas que pide la guía (secciones
// "Ideas de Interacción con Detección de Movimiento"):
//   - Opción 1 Detector de Velocidad -> categoriaVelocidad: 'Inmóvil'|'Lento'|'Normal'|'Rápido'
//   - Opción 2 Trigger de Acción     -> activo: boolean
//   - Opción 3 Contador de Gestos    -> gestos: number (picos de actividad)
//   - Opción 4 Detector de Dirección -> direccion: 'Izquierda'|'Derecha'|'Arriba'|'Abajo'|'Ninguna'
//   - Opción 5 Control por Movimiento -> intensidadControl(): 0..1 continuo

class DetectorMovimiento {
  constructor(w, h, escala = 0.15) {
    this.w = w;
    this.h = h;
    this.bufW = Math.max(20, Math.floor(w * escala));
    this.bufH = Math.max(15, Math.floor(h * escala));

    this.bufferActual = createGraphics(this.bufW, this.bufH);
    this.bufferAnterior = createGraphics(this.bufW, this.bufH);
    this.frameAnteriorListo = false;

    // --- Calibración (ajustable en vivo desde el menú, ver sketch.js) ---
    this.sensibilidad = 25;      // 0-255: diferencia mínima por píxel para contar como "cambio"
    this.thresholdActivo = 0.02; // 0-1: fracción de píxeles cambiados para considerar "hay movimiento"

    // --- Resultados expuestos (se leen desde sketch.js / personaje.js) ---
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
    // 1. Reducimos el frame actual de la cámara a baja resolución
    this.bufferActual.image(video, 0, 0, this.bufW, this.bufH);
    this.bufferActual.loadPixels();

    if (!this.frameAnteriorListo) {
      // Primer frame: no hay "anterior" todavía, solo guardamos referencia
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

    for (let y = 0; y < this.bufH; y++) {
      for (let x = 0; x < this.bufW; x++) {
        let i = (y * this.bufW + x) * 4;
        // Diferencia absoluta por canal entre el frame actual y el anterior
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
        }
      }
    }

    // --- Opción 5: Control por Movimiento (intensidad continua) ---
    this.intensidad = cambiados / totalPixeles;
    this.intensidadSuave = lerp(this.intensidadSuave, this.intensidad, 0.25);

    // --- Opción 2: Trigger de Acción (binario) ---
    this.activo = this.intensidad > this.thresholdActivo;

    // Centroide del movimiento, en coordenadas del canvas real (no del buffer chico)
    if (cambiados > 0) {
      this.centroX = (sumaX / cambiados) / this.bufW * this.w;
      this.centroY = (sumaY / cambiados) / this.bufH * this.h;
    }

    // --- Opción 1: Detector de Velocidad (clasificación) ---
    if (this.intensidadSuave < 0.005) this.categoriaVelocidad = 'Inmóvil';
    else if (this.intensidadSuave < 0.03) this.categoriaVelocidad = 'Lento';
    else if (this.intensidadSuave < 0.08) this.categoriaVelocidad = 'Normal';
    else this.categoriaVelocidad = 'Rápido';

    // --- Opción 4: Detector de Dirección (predominante) ---
    if (cambiados > 5) {
      let horiz = Math.abs(actDer - actIzq);
      let vert = Math.abs(actAbajo - actArriba);
      if (Math.max(horiz, vert) < cambiados * 0.08) {
        this.direccion = 'Ninguna'; // movimiento parejo, sin dirección clara
      } else if (horiz > vert) {
        // OJO: esto está en coordenadas "crudas" del video (sin espejar).
        // Como el resto del proyecto espeja horizontalmente para mostrar en
        // pantalla, quien llama a esto debe invertir Izquierda/Derecha si
        // va a mostrarlo al usuario (ver dibujarDebug en sketch.js).
        this.direccion = actDer > actIzq ? 'Derecha' : 'Izquierda';
      } else {
        this.direccion = actAbajo > actArriba ? 'Abajo' : 'Arriba';
      }
    } else {
      this.direccion = 'Ninguna';
    }

    // --- Opción 3: Contador de Gestos (picos de actividad) ---
    // Un "gesto" es un pico de movimiento que sube claramente por encima del
    // umbral y luego vuelve a bajar — como un wave de mano.
    if (this.intensidadSuave > this.thresholdActivo * 2.5 && !this._enPico) {
      this._enPico = true;
      this.gestos++;
    } else if (this.intensidadSuave < this.thresholdActivo && this._enPico) {
      this._enPico = false;
    }

    // El frame actual pasa a ser el "anterior" para la próxima comparación
    this.bufferAnterior.image(this.bufferActual, 0, 0);
    this.bufferAnterior.loadPixels();
  }

  // Valor continuo 0..1 listo para mapear a cualquier parámetro visual
  // (tamaño, velocidad, opacidad, lo que sea) — Opción 5 de la guía.
  intensidadControl() {
    return constrain(this.intensidadSuave / 0.1, 0, 1);
  }

  reiniciarGestos() {
    this.gestos = 0;
  }
}