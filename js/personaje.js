// personaje.js
// Personaje travieso: requiere 5 gestos acumulados para hacer una travesura.
class PersonajeGenetico {
  constructor(w, h) {
    this.wRect = 50;
    this.hRect = 40;
    this.x = w / 2;
    this.y = h / 2;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);

    // Estados posibles: vagar | mirando | vandalismo | bailando | durmiendo | asustado | curioso
    this.estado = 'vagar';
    this.temporizadorEstado = 0;
    this.colorCuerpo = [255, 50, 50];
    this.tiempoAtrapado = 0;

    // --- Personalidad aleatoria ---
    this.personalidad = {
      energia: random(0.6, 1.8),      
      curiosidad: random(0.3, 1),     
      terquedad: random(0.5, 1.5),    
      travieso: random(0.5, 2.2),     
      dramatico: random() < 0.35      
    };

    // --- Deambular orgánico con ruido Perlin ---
    this.ruidoOffX = random(1000);
    this.ruidoOffY = random(5000);

    // --- Rastro persistente ---
    this.temporizadorRastro = 0;

    // --- Estilo cromático propio ---
    this.tipoArmonia = random(['analoga', 'complementaria', 'triada']);
    this.tonoBase = random(360);

    // --- Simetría ---
    this.simetria = random(['ninguna', 'ninguna', 'vertical', 'horizontal', 'doble']);

    // --- Impulsos creativos autónomos (Probabilidad de bombas baja) ---
    this.temporizadorTravesura = random(500, 900) / this.personalidad.travieso;
    this.filtrosDisponibles = ['gris', 'invertir', 'blur', 'posterizar', 'sepia', 'pixelado', 'espejo', 'arcoiris'];
    this.frasesTravesura = ['¡sorpresa!', '¡cambio de look!', '¡boom!', '¡a ver esto!', '¡tachán!', 'jeje...', '¡color va!'];

    // --- Animación de vida ---
    this.anguloBamboleo = random(TWO_PI);
    this.escalaPulso = 1;
    this.parpadeando = false;
    this.temporizadorParpadeo = random(60, 200);
    this.rotacionActual = 0;

    // --- Burbuja de diálogo espontánea ---
    this.frase = null;
    this.temporizadorFrase = 0;
    this.frasesVagar = ['¿eh?', 'zzz...', 'la la la', '¿y eso qué es?', 'aburrido...', '¡wiii!', '?!'];
    this.frasesVandalismo = ['¡ja!', 'oops~', 'no era mi intención (sí lo era)', '¡bórrate!'];
    this.frasesMirando = ['te veo...', '...', 'sospechoso.', 'shh'];
    this.frasesBailando = ['¡fiesta!', '♪ ♫ ♪', '¡mírame bailar!'];
    this.frasesDormido = ['Zzz', 'Zzz...', '(ronquidos)'];
    this.frasesSusto = ['¡AH!', '¡NO!', '¡corre!'];

    this.cooldownCambioEstado = 0;
    this._ultimoConteoGestos = 0;
    this.contadorGestosParaTravesura = 0; // Acumulador para los 5 gestos
    this._estadoPrevioActivo = true; // Para detectar cambios de inactividad
  }

  actualizar(pintor, detectorMovimiento, configUI) {
    let colorActual = configUI && configUI.pincelColor ? configUI.pincelColor : [0, 255, 0];
    let velocidadMod = 1;

    if (colorActual[0] > 200 && colorActual[1] < 50) {
      velocidadMod = 2.2;
      this.colorCuerpo = [220, 20, 60];
    } else if (colorActual[2] > 200 && colorActual[0] < 100) {
      velocidadMod = 0.3;
      this.colorCuerpo = [40, 120, 255];
    } else if (colorActual[0] > 200 && colorActual[1] > 200) {
      velocidadMod = 0.7;
      this.colorCuerpo = [240, 240, 240];
    }

    velocidadMod *= this.personalidad.energia;

    let sesgoDireccionX = 0, sesgoDireccionY = 0;
    if (detectorMovimiento) {
      let control = detectorMovimiento.intensidadControl();
      velocidadMod *= map(control, 0, 1, 0.85, 2.4);

      // --- OPCIÓN 2: MODO COHETE POR VELOCIDAD EXTREMA ---
      if (detectorMovimiento.categoriaVelocidad === 'Rápido' &&
          this.estado === 'vagar' && this.cooldownCambioEstado === 0 && random() < 0.4) {
        this.vx = random(-8, 8); // Velocidad muy alta
        this.vy = random(-8, 8);
        this.colorCuerpo = [255, 240, 0]; // Amarillo brillante de cohete
        this.escalaPulso = 1.5;
        this.frase = '¡ZAS!';
        this.temporizadorFrase = 40;
        this._cambiarEstado('asustado');
      }

      // --- OPCIÓN 4: REACCIÓN NOTORIA POR INACTIVIDAD REPENTINA ---
      if (this._estadoPrevioActivo && !detectorMovimiento.activo && this.estado === 'vagar' && this.cooldownCambioEstado === 0) {
        this.vx = 0;
        this.vy = 0;
        this.escalaPulso = 0.7; // Se encoge de sorpresa
        this.frase = '¿¡Se fue todos!?';
        this.temporizadorFrase = 70;
        this._cambiarEstado('durmiendo');
      }
      this._estadoPrevioActivo = detectorMovimiento.activo;

      // --- OPCIÓN 1: EFECTO "VIENTO" O CORRIENTE DE AIRE FUERTE ---
      // Se multiplicó el sesgo drásticamente (antes era 0.05, ahora es 0.4) para que el viento mueva al personaje con fuerza
      if (detectorMovimiento.direccion === 'Izquierda') sesgoDireccionX = 0.4;
      else if (detectorMovimiento.direccion === 'Derecha') sesgoDireccionX = -0.4;
      else if (detectorMovimiento.direccion === 'Arriba') sesgoDireccionY = -0.4;
      else if (detectorMovimiento.direccion === 'Abajo') sesgoDireccionY = 0.4;

      // Acumulador de gestos: Requiere 5 cambios de gesto para activar la travesura
      if (detectorMovimiento.gestos !== this._ultimoConteoGestos) {
        this._ultimoConteoGestos = detectorMovimiento.gestos;
        if (this._ultimoConteoGestos > 0) {
          this.contadorGestosParaTravesura++;
          if (this.contadorGestosParaTravesura >= 5) {
            this.contadorGestosParaTravesura = 0;
            this._hacerTravesura(pintor, configUI);
          }
        }
      }
    }

    this._actualizarVida();

    if (this.cooldownCambioEstado > 0) this.cooldownCambioEstado--;

    if (this.estado !== 'durmiendo' && this.estado !== 'asustado') {
      this.temporizadorTravesura--;
      if (this.temporizadorTravesura <= 0) {
        this._hacerTravesura(pintor, configUI);
        this.temporizadorTravesura = random(500, 950) / this.personalidad.travieso;
      }
    }

    if (this.estado === 'vagar') {
      let t = frameCount * 0.006 * this.personalidad.energia;
      let angulo = noise(this.ruidoOffX, t) * TWO_PI * 3;
      let empuje = 0.12 * this.personalidad.energia;
      this.vx += Math.cos(angulo) * empuje;
      this.vy += Math.sin(angulo) * empuje;
      this.vx = constrain(this.vx * 0.96, -3.5, 3.5);
      this.vy = constrain(this.vy * 0.96, -3.5, 3.5);

      this.x += this.vx * velocidadMod;
      this.y += this.vy * velocidadMod;

      // Aplicación del viento con fuerza notable
      this.x += sesgoDireccionX * 25;
      this.y += sesgoDireccionY * 25;

      // --- Estela ampliada y adaptada al color actual del cuerpo ---
      this.temporizadorRastro--;
      if (this.temporizadorRastro <= 0 && pintor && typeof pintor.dibujarTrazo === 'function') {
        let tamanoEstela = random(25, 60);
        pintor.dibujarTrazo(width - this.x, this.y, {
          tamano: tamanoEstela,
          color: [...this.colorCuerpo, random(50, 110)],
          tipo: 'pincel'
        });
        this.temporizadorRastro = random(2, 5);
      }

      this._quizasHablar(this.frasesVagar, 0.002 * this.personalidad.curiosidad);

      if (this.cooldownCambioEstado === 0) {
        let azar = random();
        if (azar < 0.012) {
          this._cambiarEstado('mirando');
        } else if (azar < 0.024) {
          this._cambiarEstado('vandalismo');
        } else if (azar < 0.028) {
          this._cambiarEstado('bailando');
        } else if (azar < 0.031) {
          this._cambiarEstado('durmiendo');
        } else if (azar < 0.035) {
          this.teletransportarse();
        }
      }

    } else if (this.estado === 'mirando') {
      this.temporizadorEstado++;
      this.colorCuerpo = [150, 0, 255];
      this._quizasHablar(this.frasesMirando, 0.02);

      if (this.temporizadorEstado > 80) {
        this.detonarBombaColor(pintor);
        this._cambiarEstado('vagar');
      }

    } else if (this.estado === 'vandalismo') {
      this.temporizadorEstado++;
      if (pintor && typeof pintor.borrar === 'function') {
        pintor.borrar(width - this.x, this.y, 45);
      }
      this.x += random(-5, 5) * velocidadMod;
      this.y += random(-5, 5) * velocidadMod;
      this.colorCuerpo = [0, 0, 0];
      this._quizasHablar(this.frasesVandalismo, 0.04);

      if (this.temporizadorEstado > 120) {
        this._cambiarEstado('vagar');
      }

    } else if (this.estado === 'bailando') {
      this.temporizadorEstado++;
      let radio = 3 + Math.sin(frameCount * 0.2) * 2;
      this.x += Math.cos(frameCount * 0.3) * radio * 0.3;
      this.y += Math.sin(frameCount * 0.3) * radio * 0.3;
      this.rotacionActual = Math.sin(frameCount * 0.3) * 0.35;
      this.colorCuerpo = [255, 180, 40];
      this._quizasHablar(this.frasesBailando, 0.03);

      if (this.temporizadorEstado > 70) {
        this._cambiarEstado('vagar');
      }

    } else if (this.estado === 'durmiendo') {
      this.temporizadorEstado++;
      this.vx *= 0.9;
      this.vy *= 0.9;
      this.colorCuerpo = [120, 120, 200];
      this._quizasHablar(this.frasesDormido, 0.03);

      if (this.temporizadorEstado > 90 || random() < 0.01) {
        this.vx = random(-4, 4);
        this.vy = random(-4, 4);
        this._cambiarEstado('asustado');
      }

    } else if (this.estado === 'asustado') {
      this.temporizadorEstado++;
      this.x += this.vx * 2.5;
      this.y += this.vy * 2.5;
      this.escalaPulso = 1.3;
      this._quizasHablar(this.frasesSusto, 0.15);

      if (this.temporizadorEstado > 15) {
        this._cambiarEstado('vagar');
      }
    }

    if (this.x < 30 || this.x > width - 30) {
      this.vx *= -1;
      this.x = constrain(this.x, 30, width - 30);
    }
    if (this.y < 30 || this.y > height - 30) {
      this.vy *= -1;
      this.y = constrain(this.y, 30, height - 30);
    }

    // --- VERIFICACIÓN DE MUROS (ZONAS NEGRAS) ---
    if (pintor && pintor.lienzo) {
      let idxX = Math.floor(constrain(this.x, 0, pintor.lienzo.width - 1));
      let idxY = Math.floor(constrain(this.y, 0, pintor.lienzo.height - 1));
      
      let escalaX = pintor.lienzo.width / width;
      let escalaY = pintor.lienzo.height / height;
      let pX = Math.floor(idxX * escalaX);
      let pY = Math.floor(idxY * escalaY);

      let index = (pY * pintor.lienzo.width + pX) * 4;
      
      pintor.lienzo.loadPixels();
      if (pintor.lienzo.pixels.length > 0 && index >= 0 && index < pintor.lienzo.pixels.length) {
        let r = pintor.lienzo.pixels[index];
        let g = pintor.lienzo.pixels[index + 1];
        let b = pintor.lienzo.pixels[index + 2];
        let a = pintor.lienzo.pixels[index + 3];

        if (a > 100 && r < 50 && g < 50 && b < 50) {
          this.vx *= -0.5;
          this.vy *= -0.5;
          this.tiempoAtrapado++;

          let limitePaciencia = 60 * this.personalidad.terquedad;
          if (this.tiempoAtrapado > limitePaciencia) {
            this.detonarBomba(pintor, configUI);
            this.tiempoAtrapado = 0;
          }
        } else {
          this.tiempoAtrapado = max(0, this.tiempoAtrapado - 0.5);
        }
      }
    }
  }

  _actualizarVida() {
    this.anguloBamboleo += 0.06;

    this.temporizadorParpadeo--;
    if (this.temporizadorParpadeo <= 0) {
      this.parpadeando = true;
      if (this.temporizadorParpadeo < -6) {
        this.parpadeando = false;
        this.temporizadorParpadeo = random(60, 220);
      }
    }

    this.escalaPulso = lerp(this.escalaPulso, 1, 0.1);

    if (this.estado !== 'bailando') {
      this.rotacionActual = lerp(this.rotacionActual, 0, 0.1);
    }

    if (this.temporizadorFrase > 0) {
      this.temporizadorFrase--;
      if (this.temporizadorFrase <= 0) this.frase = null;
    }
  }

  _quizasHablar(listaFrases, probabilidad) {
    if (!this.frase && random() < probabilidad) {
      this.frase = random(listaFrases);
      this.temporizadorFrase = 50;
    }
  }

  _cambiarEstado(nuevoEstado) {
    this.estado = nuevoEstado;
    this.temporizadorEstado = 0;
    this.cooldownCambioEstado = 20;
  }

  teletransportarse() {
    this.x = random(40, width - 40);
    this.y = random(40, height - 40);
    this.escalaPulso = 1.6;
  }

  distanciaA(otro) {
    return Math.hypot(this.x - otro.x, this.y - otro.y);
  }

  interactuarCon(otro, pintor) {
    let d = this.distanciaA(otro);
    if (d > 70) return;

    let ang = Math.atan2(this.y - otro.y, this.x - otro.x);
    let fuerza = 0.15;
    this.vx += Math.cos(ang) * fuerza;
    this.vy += Math.sin(ang) * fuerza;

    if (random() < 0.01) {
      this.tonoBase = lerp(this.tonoBase, otro.tonoBase, 0.5);
      this._quizasHablar(['¡contagio de color!', 'toma un poco del mío', '¡mezcla!'], 1);
    }

    if (d < 30 && random() < 0.02 && pintor) {
      let mx = (width - this.x + width - otro.x) / 2;
      let my = (this.y + otro.y) / 2;
      this._dibujarConSimetria(pintor, mx, my, {
        tamano: this._tamanoBolita(),
        color: this._colorParaTrazo('multicolor'),
        tipo: 'pincel'
      });
    }
  }

  _hacerTravesura(pintor, configUI) {
    let opcion = random();
    if (opcion < 0.65) {
      this.detonarBombaColor(pintor);
      this._quizasHablar(this.frasesTravesura, 1);
    } else if (opcion < 0.85) {
      this.dispararRafagaBombas(pintor);
      this._quizasHablar(this.frasesTravesura, 1);
    } else {
      if (random() < 0.2) {
        this.provocarCambioCaotico(configUI);
      }
      this.detonarBombaColor(pintor);
      this._quizasHablar(this.frasesTravesura, 1);
    }
    this.escalaPulso = 1.25;
  }

  provocarCambioCaotico(configUI) {
    if (configUI && 'filtro' in configUI) {
      configUI.filtro = random(this.filtrosDisponibles);
    }
  }

  _tamanoBolita() {
    let categoria = random(['mediano', 'grande', 'extragrande']);
    if (categoria === 'mediano') return random(30, 45);
    if (categoria === 'grande') return random(46, 65);
    return random(66, 90);
  }

  _elegirModoColor() {
    return random() < 0.5 ? 'multicolor' : 'monocromatico';
  }

  _hsbToRgb(h, s, b) {
    s /= 100; b /= 100;
    let k = n => (n + h / 60) % 6;
    let f = n => b - b * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
    return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
  }

  _paletaArmonica() {
    let h = this.tonoBase;
    if (this.tipoArmonia === 'complementaria') {
      return [h, (h + 180) % 360];
    } else if (this.tipoArmonia === 'triada') {
      return [h, (h + 120) % 360, (h + 240) % 360];
    }
    return [h, (h + 30) % 360, (h - 30 + 360) % 360];
  }

  _colorParaTrazo(modoColor, colorBase) {
    if (modoColor === 'monocromatico') {
      let opacidad = random(60, 255);
      return [colorBase[0], colorBase[1], colorBase[2], opacidad];
    }
    let paleta = this._paletaArmonica();
    let tono = random(paleta);
    let rgb = this._hsbToRgb(tono, random(55, 100), random(70, 100));
    return [...rgb, random(180, 255)];
  }

  _dibujarConSimetria(pintor, px, py, opts) {
    pintor.dibujarTrazo(px, py, opts);
    if (this.simetria === 'ninguna') return;

    let mx = width - px;
    let my = height - py;
    if (this.simetria === 'vertical' || this.simetria === 'doble') {
      pintor.dibujarTrazo(mx, py, opts);
    }
    if (this.simetria === 'horizontal' || this.simetria === 'doble') {
      pintor.dibujarTrazo(px, my, opts);
    }
    if (this.simetria === 'doble') {
      pintor.dibujarTrazo(mx, my, opts);
    }
  }

  detonarBombaColor(pintor) {
    if (pintor && typeof pintor.dibujarTrazo === 'function') {
      let cantidad = this.personalidad.dramatico ? 14 : 8;
      let patron = random(['spray', 'anillo', 'linea']);
      let cx = width - this.x;
      let cy = this.y;

      let modoColor = this._elegirModoColor();
      let colorBase = this._hsbToRgb(this.tonoBase, random(60, 100), random(70, 100));

      for (let i = 0; i < cantidad; i++) {
        let px, py;
        if (patron === 'anillo') {
          let ang = (TWO_PI / cantidad) * i + random(-0.2, 0.2);
          let r = random(20, 60);
          px = cx + Math.cos(ang) * r;
          py = cy + Math.sin(ang) * r;
        } else if (patron === 'linea') {
          let ang = random(TWO_PI);
          px = cx + Math.cos(ang) * (i * 8);
          py = cy + Math.sin(ang) * (i * 8);
        } else {
          px = cx + random(-50, 50);
          py = cy + random(-50, 50);
        }

        this._dibujarConSimetria(pintor, px, py, {
          tamano: this._tamanoBolita(),
          color: this._colorParaTrazo(modoColor, colorBase),
          tipo: 'pincel'
        });
      }
    }
  }

  dispararRafagaBombas(pintor) {
    if (pintor && typeof pintor.dibujarTrazo === 'function') {
      let cantidad = this.personalidad.dramatico ? 10 : 6;
      let modoColor = this._elegirModoColor();
      let colorBase = this._hsbToRgb(this.tonoBase, random(60, 100), random(70, 100));

      for (let i = 0; i < cantidad; i++) {
        this._dibujarConSimetria(pintor, random(40, width - 40), random(40, height - 40), {
          tamano: this._tamanoBolita(),
          color: this._colorParaTrazo(modoColor, colorBase),
          tipo: 'pincel'
        });
      }
    }
  }

  detonarBomba(pintor, configUI) {
    if (pintor && typeof pintor.borrar === 'function') {
      pintor.borrar(width - this.x, this.y, 300);
    }
    if (configUI && 'filtro' in configUI && random() < 0.2) {
      configUI.filtro = random(this.filtrosDisponibles);
    }
    this.vx = random(-4, 4);
    this.vy = random(-4, 4);
    this._cambiarEstado('asustado');
  }

  mostrar(pg) {
    let ctx = pg || window;
    ctx.push();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotacionActual + Math.sin(this.anguloBamboleo) * 0.02);
    ctx.scale(this.escalaPulso);

    let respirar = this.estado === 'durmiendo' ? Math.sin(frameCount * 0.08) * 2 : Math.sin(this.anguloBamboleo) * 1;
    ctx.stroke(255);
    ctx.strokeWeight(2);
    ctx.fill(...this.colorCuerpo);
    ctx.rectMode(CENTER);
    ctx.rect(0, 0, this.wRect, this.hRect + respirar, 8);

    ctx.noStroke();
    ctx.fill(255);
    let altoOjo = this.parpadeando ? 2 : 12;
    ctx.ellipse(-10, -4, 12, altoOjo);
    ctx.ellipse(10, -4, 12, altoOjo);

    if (!this.parpadeando) {
      ctx.fill(0);
      if (this.estado === 'mirando') {
        ctx.ellipse(-10, -4, 8, 8);
        ctx.ellipse(10, -4, 8, 8);
      } else if (this.estado === 'durmiendo') {
        ctx.stroke(0);
        ctx.strokeWeight(2);
        ctx.line(-14, -4, -6, -4);
        ctx.line(6, -4, 14, -4);
        ctx.noStroke();
      } else if (this.estado === 'asustado') {
        ctx.fill(0);
        ctx.ellipse(-10, -4, 9, 9);
        ctx.ellipse(10, -4, 9, 9);
      } else {
        let lookX = constrain(this.vx * 1.5, -3, 3);
        let lookY = constrain(this.vy * 1.5, -3, 3);
        ctx.ellipse(-10 + lookX, -4 + lookY, 4, 4);
        ctx.ellipse(10 + lookX, -4 + lookY, 4, 4);
      }
    }

    if (this.frase) {
      ctx.fill(255);
      ctx.stroke(0);
      ctx.strokeWeight(1);
      ctx.rectMode(CENTER);
      ctx.rect(0, -34, textWidth ? textWidth(this.frase) + 14 : 50, 18, 6);
      ctx.noStroke();
      ctx.fill(0);
      ctx.textSize(10);
      ctx.textAlign(CENTER, CENTER);
      ctx.text(this.frase, 0, -34);
    } else if (this.estado === 'vandalismo') {
      ctx.fill(255, 50, 50);
      ctx.textSize(10);
      ctx.textAlign(CENTER, CENTER);
      ctx.text("¡BORRANDO!", 0, -30);
    }

    ctx.pop();
  }
}