let camara, detector, detectorMovimiento, pintor, escena, menu;
let debugMode = true;
let personaje;

let configUI = {
  pincelTipo: 'redondo',
  pincelTamano: 20,
  pincelColor: [0, 0, 0], 
  filtro: 'ninguno',       
  fondoModo: 'camara',      
  fondoColor: [20, 30, 90],
  modoDebugVisual: 'ambos', 
};

let menuTree; 

function setup() {
  createCanvas(800, 600);
  smooth();

  camara = new Camara();
  camara.iniciar();

  detector = new DetectorMultiColor();
  detectorMovimiento = new DetectorMovimiento(800, 600);
  pintor = new Pintor(800, 600);
  escena = createGraphics(800, 600);

  menuTree = construirMenuTree();
  menu = new MenuManager(menuTree, configUI);
  personaje = new PersonajeGenetico(800, 600);
}

function draw() {
  background(0);

  detector.analizar(camara.video);
  detectorMovimiento.analizar(camara.video);

  // --- GESTIÓN DE MODOS DEBUG VISUALES (CON CÁMARA VOLTEADA) ---
  if (configUI.modoDebugVisual === 'color') {
    push();
    translate(width, 0);
    scale(-1, 1); // Voltea la cámara horizontalmente sí o sí
    image(camara.video, 0, 0, width, height);
    pintarMascaraColorInvertida();
    pop();
    
  } else if (configUI.modoDebugVisual === 'movimiento') {
    push();
    translate(width, 0);
    scale(-1, 1); // Voltea el movimiento de la cámara sí o sí
    image(detectorMovimiento.bufferActual, 0, 0, width, height);
    pop();
    
  } else if (configUI.modoDebugVisual === 'dividido') {
    // Mitad Izquierda: Color Debug Volteado
    push();
    imageMode(CORNER);
    // Dibujamos la mitad izquierda con espejo
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, 0, width / 2, height);
    drawingContext.clip();
    
    translate(width, 0);
    scale(-1, 1);
    image(camara.video, 0, 0, width, height);
    pintarMascaraColorInvertida();
    drawingContext.restore();
    pop();

    // Mitad Derecha: Movimiento Volteado
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(width / 2, 0, width / 2, height);
    drawingContext.clip();

    translate(width, 0);
    scale(-1, 1);
    image(detectorMovimiento.bufferActual, 0, 0, width, height);
    drawingContext.restore();
    pop();

    // Línea divisoria central
    stroke(255);
    strokeWeight(4);
    line(width / 2, 0, width / 2, height);

  } else {
    // MODO AMBOS / NORMAL
    escena.clear();
    if (configUI.fondoModo === 'camara') {
      camara.mostrar(escena);
    } else {
      escena.background(...configUI.fondoColor);
    }
    pintor.mostrar(escena);
    aplicarFiltro(escena, configUI.filtro);

    image(escena, 0, 0, width, height);

    if (personaje) {
      personaje.actualizar(pintor, detectorMovimiento, configUI);
      personaje.mostrar();
    }
  }

  let pincelX = width - detector.pincel.x,   pincelY = detector.pincel.y;
  let selX    = width - detector.selector.x, selY    = detector.selector.y;
  let borrX   = width - detector.borrador.x, borrY   = detector.borrador.y;

  if (detector.pincel.detectado) {
    pintor.dibujarTrazo(detector.pincel.x, detector.pincel.y, {
      tamano: configUI.pincelTamano,
      color: configUI.pincelColor,
      tipo: configUI.pincelTipo,
    });
  }

  if (detector.borrador.detectado) {
    pintor.borrar(detector.borrador.x, detector.borrador.y);
  }

  menu.actualizar(detector.selector.detectado, selX, selY);
  menu.mostrar();

  dibujarCursores(pincelX, pincelY, selX, selY, borrX, borrY);

  if (debugMode) {
    dibujarDebug();
  }
}

// Función auxiliar de máscara con coordenadas adaptadas al scale(-1, 1)
function pintarMascaraColorInvertida() {
  camara.video.loadPixels();
  if (camara.video.pixels.length > 0) {
    noStroke();
    let salto = 10;
    for (let y = 0; y < camara.video.height; y += salto) {
      for (let x = 0; x < camara.video.width; x += salto) {
        let i = (y * camara.video.width + x) * 4;
        let r = camara.video.pixels[i];
        let g = camara.video.pixels[i + 1];
        let b = camara.video.pixels[i + 2];

        let xReal = x * (width / camara.video.width);
        let yReal = y * (height / camara.video.height);

        if (detector._esVerde(r, g, b)) {
          fill(0, 255, 0, 200);
          ellipse(xReal, yReal, 8, 8);
        } else if (detector._esAzul(r, g, b)) {
          fill(0, 100, 255, 200);
          ellipse(xReal, yReal, 8, 8);
        } else if (detector._esRojo(r, g, b)) {
          fill(255, 0, 0, 200);
          ellipse(xReal, yReal, 8, 8);
        }
      }
    }
  }
}

function aplicarFiltro(pg, tipo) {
  switch (tipo) {
    case 'gris':       pg.filter(GRAY); break;
    case 'invertir':   pg.filter(INVERT); break;
    case 'blur':       pg.filter(BLUR, 3); break;
    case 'posterizar': pg.filter(POSTERIZE, 3); break;
    case 'ninguno':
    default: break;
  }
}

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
              { id: 'negro', label: 'Negro', color: color(40, 40, 40), accion: c => c.pincelColor = [0, 0, 0] },
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
      {
        id: 'debugVisual', label: 'Modo Debug', color: color(120, 120, 120),
        children: [
          { id: 'db_ambos', label: 'Ambos (Normal)', color: color(210), accion: c => c.modoDebugVisual = 'ambos' },
          { id: 'db_color', label: 'Solo Color', color: color(40, 200, 60), accion: c => c.modoDebugVisual = 'color' },
          { id: 'db_mov', label: 'Solo Movimiento', color: color(255, 120, 40), accion: c => c.modoDebugVisual = 'movimiento' },
          { id: 'db_dividido', label: 'Pantalla Dividida', color: color(150, 50, 220), accion: c => c.modoDebugVisual = 'dividido' },
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
  rect(15, 15, 300, 225, 8);

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

  fill(255, 170, 60);
  text(`--- Movimiento (frame difference) ---`, 25, 158);
  fill(255);
  let dirCruda = detectorMovimiento.direccion;
  let dirMostrada = dirCruda === 'Izquierda' ? 'Derecha' : dirCruda === 'Derecha' ? 'Izquierda' : dirCruda;
  text(`Velocidad: ${detectorMovimiento.categoriaVelocidad} | Activo: ${detectorMovimiento.activo}`, 25, 176);
  text(`Dirección: ${dirMostrada} | Gestos: ${detectorMovimiento.gestos}`, 25, 194);
  text(`Debug Visual: ${configUI.modoDebugVisual}`, 25, 212);
}

function keyPressed() {
  if (key === 'd' || key === 'D') debugMode = !debugMode;
  if (key === 'c' || key === 'C') pintor.limpiar();
  if (key === 'g' || key === 'G') detectorMovimiento.reiniciarGestos();
}