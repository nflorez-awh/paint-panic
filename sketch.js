let camara, detector, detectorMovimiento, pintor, escena, menu;
let debugMode = true;
let personaje;

// Estado configurable desde la UI (lo van modificando las opciones del menú)
let configUI = {
  pincelTipo: 'redondo',
  pincelTamano: 20,
  pincelColor: [0, 255, 0],
  filtro: 'ninguno',        // ninguno | gris | invertir | blur | posterizar
  fondoModo: 'camara',      // camara | color
  fondoColor: [20, 30, 90],
};

let menuTree; // se arma en setup(), porque usa color() y necesita que p5 ya esté listo

function setup() {
  // Canvas interno de 800x600 (proporción 4:3)
  createCanvas(800, 600);
  smooth();

  camara = new Camara();
  camara.iniciar();

  detector = new DetectorMultiColor();
  detectorMovimiento = new DetectorMovimiento(800, 600);
  pintor = new Pintor(800, 600);
  escena = createGraphics(800, 600); // buffer donde componemos fondo + trazos antes de mostrar

  menuTree = construirMenuTree();
  menu = new MenuManager(menuTree, configUI);
  personaje = new PersonajeGenetico(800, 600);

}

function draw() {
  background(0);

  // 1. Analizar los tres colores en un solo pase (pincel, selector, borrador)
  detector.analizar(camara.video);

  // 1.b Analizar MOVIMIENTO real por frame difference (requisito técnico
  // central del proyecto): compara este frame contra el anterior.
  detectorMovimiento.analizar(camara.video);

  // 2. Armar la escena (fondo + trazos) en un buffer aparte
  escena.clear();
  if (configUI.fondoModo === 'camara') {
    camara.mostrar(escena);
  } else {
    escena.background(...configUI.fondoColor);
  }
  pintor.mostrar(escena);
  aplicarFiltro(escena, configUI.filtro);

  // 3. Mostrar la escena ya compuesta (con filtro) en el canvas principal
  image(escena, 0, 0, width, height);
// --- Actualizar y mostrar al personaje en el canvas principal ---
  if (personaje) {
    // Se le pasa el detector de MOVIMIENTO (no el de color) para que
    // reaccione en tiempo real a lo que hacés frente a la cámara, y
    // configUI para que sus travesuras (bombas, filtros) puedan actuar.
    personaje.actualizar(pintor, detectorMovimiento, configUI);
    personaje.mostrar(); // Al no pasarle 'escena', se dibuja directamente en la pantalla principal
  }

  // Coordenadas espejadas de cada rol, para que coincidan con lo que se ve en pantalla
  let pincelX = width - detector.pincel.x,   pincelY = detector.pincel.y;
  let selX    = width - detector.selector.x, selY    = detector.selector.y;
  let borrX   = width - detector.borrador.x, borrY   = detector.borrador.y;

  // 4. VERDE -> Pincel: pinta en el lienzo con el tipo/tamaño/color elegidos en la UI
  if (detector.pincel.detectado) {
    pintor.dibujarTrazo(detector.pincel.x, detector.pincel.y, {
      tamano: configUI.pincelTamano,
      color: configUI.pincelColor,
      tipo: configUI.pincelTipo,
    });
  }

  // 5. ROJO -> Borrador: borra en el lienzo
  if (detector.borrador.detectado) {
    pintor.borrar(detector.borrador.x, detector.borrador.y);
  }

  // 6. AZUL -> Selector: navega el menú (categorías y submenús)
  menu.actualizar(detector.selector.detectado, selX, selY);
  menu.mostrar();

  // 7. Cursores visuales: dan feedback de dónde está actuando cada color
  dibujarCursores(pincelX, pincelY, selX, selY, borrX, borrY);

  // 8. Panel de Debug
  if (debugMode) {
    dibujarDebug();
  }
}

// Aplica el filtro elegido al buffer de la escena (fondo + trazos, no la UI)
function aplicarFiltro(pg, tipo) {
  switch (tipo) {
    case 'gris':       pg.filter(GRAY); break;
    case 'invertir':   pg.filter(INVERT); break;
    case 'blur':       pg.filter(BLUR, 3); break;
    case 'posterizar': pg.filter(POSTERIZE, 3); break;
    case 'ninguno':
    default:
      break;
  }
}

// Árbol de categorías y opciones del menú de UI.
// Cada nodo hoja (sin "children") tiene una "accion(config)" que modifica configUI.
function construirMenuTree() {
  return {
    id: 'root',
    children: [
      {
        id: 'pincel', label: 'Pincel', color: color(0, 200, 80),
        children: [
          {
            id: 'tipo', label: 'Tipo', color: color(90),
            children: [
              { id: 'redondo', label: 'Redondo', color: color(210), accion: c => c.pincelTipo = 'redondo' },
              { id: 'cuadrado', label: 'Cuadrado', color: color(210), accion: c => c.pincelTipo = 'cuadrado' },
              { id: 'spray', label: 'Spray', color: color(210), accion: c => c.pincelTipo = 'spray' },
            ],
          },
          {
            id: 'tamano', label: 'Tamaño', color: color(90),
            children: [
              { id: 'chico', label: 'Chico', color: color(210), accion: c => c.pincelTamano = 10 },
              { id: 'mediano', label: 'Mediano', color: color(210), accion: c => c.pincelTamano = 22 },
              { id: 'grande', label: 'Grande', color: color(210), accion: c => c.pincelTamano = 38 },
            ],
          },
          {
            id: 'color', label: 'Color', color: color(90),
            children: [
              { id: 'negro', label: 'Negro', color: color(40, 40, 40), accion: c => c.pincelColor = [10, 10, 10] }, // <-- ¡Añadido aquí!
              { id: 'rojo', label: 'Rojo', color: color(220, 40, 40), accion: c => c.pincelColor = [220, 40, 40] },
              { id: 'naranja', label: 'Naranja', color: color(255, 140, 0), accion: c => c.pincelColor = [255, 140, 0] },
              { id: 'amarillo', label: 'Amarillo', color: color(230, 220, 30), accion: c => c.pincelColor = [230, 220, 30] },
              { id: 'verde', label: 'Verde', color: color(40, 200, 60), accion: c => c.pincelColor = [40, 200, 60] },
              { id: 'azul', label: 'Azul', color: color(40, 90, 230), accion: c => c.pincelColor = [40, 90, 230] },
              { id: 'blanco', label: 'Blanco', color: color(240), accion: c => c.pincelColor = [240, 240, 240] },
            ],
          },
        ],
      },
      {
        id: 'filtros', label: 'Filtros', color: color(190, 80, 220),
        children: [
          { id: 'f_ninguno', label: 'Ninguno', color: color(210), accion: c => c.filtro = 'ninguno' },
          { id: 'f_gris', label: 'B/N', color: color(180), accion: c => c.filtro = 'gris' },
          { id: 'f_invertir', label: 'Invertir', color: color(180), accion: c => c.filtro = 'invertir' },
          { id: 'f_blur', label: 'Blur', color: color(180), accion: c => c.filtro = 'blur' },
          { id: 'f_poster', label: 'Poster', color: color(180), accion: c => c.filtro = 'posterizar' },
        ],
      },
      {
        id: 'fondo', label: 'Fondo', color: color(70, 140, 255),
        children: [
          { id: 'camara', label: 'Cámara', color: color(210), accion: c => c.fondoModo = 'camara' },
          {
            id: 'colorFondo', label: 'Color sólido', color: color(90),
            children: [
              { id: 'cf_negro', label: 'Negro', color: color(20), accion: c => { c.fondoModo = 'color'; c.fondoColor = [0, 0, 0]; } },
              { id: 'cf_azul', label: 'Azul', color: color(20, 30, 90), accion: c => { c.fondoModo = 'color'; c.fondoColor = [20, 30, 90]; } },
              { id: 'cf_rojo', label: 'Rojo', color: color(90, 20, 20), accion: c => { c.fondoModo = 'color'; c.fondoColor = [90, 20, 20]; } },
              { id: 'cf_blanco', label: 'Blanco', color: color(235), accion: c => { c.fondoModo = 'color'; c.fondoColor = [235, 235, 235]; } },
            ],
          },
        ],
      },
      {
        // Calibración del detector de MOVIMIENTO (frame difference): a qué
        // tan sensible es a cambios de píxel, y cuánta proporción del frame
        // tiene que cambiar para considerar que "hay movimiento".
        id: 'movimiento', label: 'Movimiento', color: color(255, 120, 40),
        children: [
          {
            id: 'sensibilidad', label: 'Sensibilidad', color: color(90),
            children: [
              { id: 'sens_alta', label: 'Alta', color: color(210), accion: () => detectorMovimiento.sensibilidad = 12 },
              { id: 'sens_media', label: 'Media', color: color(210), accion: () => detectorMovimiento.sensibilidad = 25 },
              { id: 'sens_baja', label: 'Baja', color: color(210), accion: () => detectorMovimiento.sensibilidad = 45 },
            ],
          },
          {
            id: 'umbral', label: 'Umbral', color: color(90),
            children: [
              { id: 'umb_bajo', label: 'Bajo', color: color(210), accion: () => detectorMovimiento.thresholdActivo = 0.01 },
              { id: 'umb_medio', label: 'Medio', color: color(210), accion: () => detectorMovimiento.thresholdActivo = 0.02 },
              { id: 'umb_alto', label: 'Alto', color: color(210), accion: () => detectorMovimiento.thresholdActivo = 0.05 },
            ],
          },
        ],
      },
    ],
  };
}

function dibujarCursores(pincelX, pincelY, selX, selY, borrX, borrY) {
  push();
  noFill();
  strokeWeight(2);

  if (detector.pincel.detectado) {
    stroke(0, 255, 0);
    ellipse(pincelX, pincelY, 24, 24);
  }
  if (detector.selector.detectado) {
    stroke(50, 130, 255);
    ellipse(selX, selY, 18, 18);
    line(selX - 10, selY, selX + 10, selY);
    line(selX, selY - 10, selX, selY + 10);
  }
  if (detector.borrador.detectado) {
    stroke(255, 50, 50);
    ellipse(borrX, borrY, 35, 35);
  }
  pop();
}

function dibujarDebug() {
  fill(0, 180);
  noStroke();
  rect(15, 15, 300, 210, 8);

  fill(0, 255, 150);
  textSize(14);
  textFont('monospace');
  text(`[ MODO MODULAR - 800x600 ]`, 25, 40);

  fill(255);
  textSize(12);
  text(`Pincel (verde):  ${detector.pincel.contador}`, 25, 62);
  text(`Selector (azul): ${detector.selector.contador}`, 25, 80);
  text(`Borrador (rojo): ${detector.borrador.contador}`, 25, 98);
  text(`Pincel: ${configUI.pincelTipo} / ${configUI.pincelTamano}px`, 25, 118);
  text(`Filtro: ${configUI.filtro} | Fondo: ${configUI.fondoModo}`, 25, 136);

  // --- Detección de movimiento (frame difference) ---
  fill(255, 170, 60);
  text(`--- Movimiento (frame difference) ---`, 25, 158);
  fill(255);
  // La dirección se espeja para mostrar, porque el video en pantalla está
  // espejado (ver Camara.mostrar) pero el análisis se hace sobre el frame crudo.
  let dirCruda = detectorMovimiento.direccion;
  let dirMostrada = dirCruda === 'Izquierda' ? 'Derecha' : dirCruda === 'Derecha' ? 'Izquierda' : dirCruda;
  text(`Velocidad: ${detectorMovimiento.categoriaVelocidad} | Activo: ${detectorMovimiento.activo}`, 25, 176);
  text(`Dirección: ${dirMostrada} | Gestos: ${detectorMovimiento.gestos}`, 25, 194);
  text(`Sensibilidad: ${detectorMovimiento.sensibilidad} | Umbral: ${detectorMovimiento.thresholdActivo.toFixed(2)}`, 25, 212);
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    debugMode = !debugMode;
  }
  if (key === 'c' || key === 'C') {
    pintor.limpiar();
  }
  if (key === 'g' || key === 'G') {
    detectorMovimiento.reiniciarGestos();
  }
}