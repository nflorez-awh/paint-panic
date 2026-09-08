// ui.js
// Motor de interfaz "sin mouse": los botones se activan pintando encima con
// el SELECTOR (azul) y se llenan progresivamente, no con un click.
//
// Dos piezas:
//   - Boton: un círculo individual con animación suave (usa lerp para que
//     el progreso, el brillo y la escala no salten de golpe).
//   - MenuManager: arma botones a partir de un árbol de categorías/opciones
//     y maneja la navegación (entrar a un submenú, volver atrás).

class Boton {
  constructor(x, y, r, label, colorBase, accion) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.label = label;
    this.colorBase = colorBase;
    this.accion = accion;

    this.progreso = 0;       // valor real (puede saltar)
    this.progresoSuave = 0;  // valor animado que se muestra (siempre suave)
    this.escala = 1;

    this.velocidadLlenado = 2.6;
    this.velocidadVaciado = 3.4; // se vacía más rápido que se llena: sensación más responsiva
    this.completado = false;
  }

  contienePunto(px, py) {
    return dist(px, py, this.x, this.y) < this.r;
  }

  actualizar(pintando, px, py) {
    let dentro = pintando && this.contienePunto(px, py);

    if (dentro && !this.completado) {
      this.progreso += this.velocidadLlenado;
      if (this.progreso >= 100) {
        this.progreso = 100;
        this.completado = true;
        this.accion();
      }
    } else if (!dentro && !this.completado) {
      this.progreso -= this.velocidadVaciado;
      if (this.progreso < 0) this.progreso = 0;
    }

    // Todo lo visual se anima con lerp (interpolación suave) en vez de
    // aplicar los valores crudos directamente: así no hay saltos bruscos.
    this.progresoSuave = lerp(this.progresoSuave, this.progreso, 0.18);
    let escalaObjetivo = this.completado ? 1.12 : (dentro ? 1.06 : 1);
    this.escala = lerp(this.escala, escalaObjetivo, 0.2);
  }

  mostrar() {
    push();
    translate(this.x, this.y);
    scale(this.escala);

    // Base
    noStroke();
    fill(25, 25, 30, 230);
    ellipse(0, 0, this.r * 2 + 10);

    // Color identificador de la opción
    fill(this.colorBase);
    ellipse(0, 0, this.r * 1.5);

    // Anillo de progreso con extremos redondeados (más limpio que un "pie")
    if (this.progresoSuave > 1) {
      noFill();
      strokeCap(ROUND);
      strokeWeight(5);
      stroke(255, 255, 255, 230);
      let anguloFinal = -90 + (this.progresoSuave / 100) * 360;
      arc(0, 0, this.r * 2 + 14, this.r * 2 + 14, radians(-90), radians(anguloFinal));
      strokeCap(SQUARE);
    }

    // Halo suave cuando queda completado
    if (this.completado) {
      noFill();
      stroke(255, 255, 255, 120);
      strokeWeight(2);
      ellipse(0, 0, this.r * 2 + 22);
    }

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.label, 0, this.r + 20);
    pop();
  }
}

class MenuManager {
  // tree: { id, children: [ {id, label, color, accion?, children?}, ... ] }
  constructor(tree, config) {
    this.tree = tree;
    this.config = config;
    this.pila = ['root']; // breadcrumb: ids del camino actual dentro del árbol
    this.botones = [];
    this._construirBotones();
  }

  _nodoActual() {
    let nodo = this.tree;
    for (let i = 1; i < this.pila.length; i++) {
      nodo = nodo.children.find(c => c.id === this.pila[i]);
    }
    return nodo;
  }

  _construirBotones() {
    let nodo = this._nodoActual();
    let items = nodo.children.slice();
    if (this.pila.length > 1) {
      items.push({ id: '__atras', label: '< Atrás', color: color(70), esVolver: true });
    }

    let espacio = 100;
    let inicioX = width / 2 - ((items.length - 1) * espacio) / 2;
    let y = height - 60;

    this.botones = items.map((item, i) => {
      let x = inicioX + i * espacio;
      let accion = () => {
        if (item.esVolver) {
          this._retroceder();
        } else if (item.children) {
          this._entrar(item.id);
        } else if (item.accion) {
          item.accion(this.config);
          this._retroceder(); // seleccionar una opción hoja regresa al menú anterior
        }
      };
      return new Boton(x, y, 30, item.label, item.color || color(150), accion);
    });
  }

  _entrar(id) {
    this.pila.push(id);
    this._construirBotones();
  }

  _retroceder() {
    if (this.pila.length > 1) this.pila.pop();
    this._construirBotones();
  }

  breadcrumb() {
    // Convierte la pila de ids en algo legible, ej: "Pincel > Color"
    let nodo = this.tree;
    let partes = [];
    for (let i = 1; i < this.pila.length; i++) {
      nodo = nodo.children.find(c => c.id === this.pila[i]);
      partes.push(nodo.label);
    }
    return partes.length ? partes.join(' > ') : 'Menú';
  }

  actualizar(pintando, px, py) {
    for (let b of this.botones) b.actualizar(pintando, px, py);
  }

  mostrar() {
    // Panel de fondo detrás de la barra de botones
    push();
    noStroke();
    fill(0, 0, 0, 140);
    rectMode(CORNER);
    rect(0, height - 110, width, 110);

    fill(255, 220);
    textAlign(CENTER, CENTER);
    textSize(13);
    textFont('monospace');
    text(this.breadcrumb(), width / 2, height - 95);
    pop();

    for (let b of this.botones) b.mostrar();
  }
}