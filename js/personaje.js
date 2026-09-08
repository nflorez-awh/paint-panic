// personaje.js
// Personaje travieso e impredecible: reacciona a tus colores, se distrae,
// se aburre, se emociona, y siempre está tramando algo.
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

    // --- Personalidad aleatoria: cada personaje nace distinto ---
    this.personalidad = {
      energia: random(0.6, 1.8),      // qué tan rápido/inquieto es
      curiosidad: random(0.3, 1),     // qué tan seguido "opina" con burbujas
      terquedad: random(0.5, 1.5),    // cuánto aguanta antes de explotar al encerrarse
      travieso: random(0.5, 2.2),     // qué tan seguido hace travesuras (bombas/filtros) por su cuenta
      dramatico: random() < 0.35      // algunos son extra teatrales
    };

    // --- Deambular orgánico con ruido Perlin (en vez de random puro) ---
    this.ruidoOffX = random(1000);
    this.ruidoOffY = random(5000);

    // --- Rastro persistente: va dejando una huella tenue de su recorrido ---
    this.temporizadorRastro = 0;

    // --- Estilo cromático propio: cada personaje "nace" con una armonía de color ---
    // (analoga = tonos vecinos, complementaria = opuestos, triada = 3 tonos equidistantes)
    this.tipoArmonia = random(['analoga', 'complementaria', 'triada']);
    this.tonoBase = random(360);

    // --- Simetría: algunos personajes pintan en espejo, como un kaleidoscopio ---
    this.simetria = random(['ninguna', 'ninguna', 'vertical', 'horizontal', 'doble']);

    // --- Impulsos creativos autónomos: bombas de color / filtros sin que lo encierres ---
    this.temporizadorTravesura = random(90, 220) / this.personalidad.travieso;
    this.filtrosDisponibles = ['gris', 'invertir', 'blur', 'posterizar', 'sepia', 'pixelado', 'espejo', 'arcoiris'];
    this.frasesTravesura = ['¡sorpresa!', '¡cambio de look!', '¡boom!', '¡a ver esto!', '¡tachán!', 'jeje...', '¡color va!'];

    // --- Animación de vida: parpadeo, rebote, bamboleo ---
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

    // Cooldown para que no cambie de estado todo el tiempo
    this.cooldownCambioEstado = 0;
  }

  actualizar(pintor, detector, configUI) {
    // 1. Detección del color que está usando el usuario (Alquimia de Colores)
    let colorActual = configUI && configUI.pincelColor ? configUI.pincelColor : [0, 255, 0];
    let velocidadMod = 1;

    if (colorActual[0] > 200 && colorActual[1] < 50) {
      // ROJO: Lo enfurece, va más rápido
      velocidadMod = 2.2;
      this.colorCuerpo = [220, 20, 60];
    } else if (colorActual[2] > 200 && colorActual[0] < 100) {
      // AZUL: Lo congela / ralentiza
      velocidadMod = 0.3;
      this.colorCuerpo = [40, 120, 255];
    } else if (colorActual[0] > 200 && colorActual[1] > 200) {
      // BLANCO / AMARILLO: Lo calma
      velocidadMod = 0.7;
      this.colorCuerpo = [240, 240, 240];
    }

    velocidadMod *= this.personalidad.energia;

    // 2. Animaciones de "estar vivo" (siempre corren, sin importar el estado)
    this._actualizarVida();

    if (this.cooldownCambioEstado > 0) this.cooldownCambioEstado--;

    // 2.5. Impulso creativo autónomo: tira bombas de color, cambia filtros,
    // o hace ambas cosas, sin necesidad de encerrarlo contra un muro.
    // No lo hace si ya está dormido o de por sí ocupado destruyendo/asustado.
    if (this.estado !== 'durmiendo' && this.estado !== 'asustado') {
      this.temporizadorTravesura--;
      if (this.temporizadorTravesura <= 0) {
        this._hacerTravesura(pintor, configUI);
        this.temporizadorTravesura = random(140, 320) / this.personalidad.travieso;
      }
    }

    // 3. Comportamiento según el estado actual
    if (this.estado === 'vagar') {
      // Deambular orgánico con ruido Perlin: en vez de saltos random puros,
      // la dirección cambia suavemente, como si "fluyera" por el lienzo.
      let t = frameCount * 0.006 * this.personalidad.energia;
      let angulo = noise(this.ruidoOffX, t) * TWO_PI * 3;
      let empuje = 0.12 * this.personalidad.energia;
      this.vx += Math.cos(angulo) * empuje;
      this.vy += Math.sin(angulo) * empuje;
      this.vx = constrain(this.vx * 0.96, -3.5, 3.5); // fricción leve para que no se dispare
      this.vy = constrain(this.vy * 0.96, -3.5, 3.5);

      this.x += this.vx * velocidadMod;
      this.y += this.vy * velocidadMod;

      // Rastro persistente: va dejando una huella tenue de por dónde pasó
      this.temporizadorRastro--;
      if (this.temporizadorRastro <= 0 && pintor && typeof pintor.dibujarTrazo === 'function') {
        pintor.dibujarTrazo(width - this.x, this.y, {
          tamano: random(6, 14),
          color: [...this.colorCuerpo, random(20, 55)],
          tipo: 'pincel'
        });
        this.temporizadorRastro = random(3, 9);
      }

      // Charla espontánea aunque no cambie de estado
      this._quizasHablar(this.frasesVagar, 0.002 * this.personalidad.curiosidad);

      // Probabilidades aleatorias de cambiar de acción imprevistamente
      if (this.cooldownCambioEstado === 0) {
        let azar = random();
        if (azar < 0.004) {
          this._cambiarEstado('mirando');
        } else if (azar < 0.008) {
          this._cambiarEstado('vandalismo');
        } else if (azar < 0.012) {
          this._cambiarEstado('bailando');
        } else if (azar < 0.015) {
          this._cambiarEstado('durmiendo');
        } else if (azar < 0.019) {
          this.teletransportarse();
        }
      }

    } else if (this.estado === 'mirando') {
      // Se queda completamente quieto clavando la mirada
      this.temporizadorEstado++;
      this.colorCuerpo = [150, 0, 255]; // Púrpura amenazante
      this._quizasHablar(this.frasesMirando, 0.02);

      if (this.temporizadorEstado > 80) {
        this.detonarBombaColor(pintor);
        this._cambiarEstado('vagar');
      }

    } else if (this.estado === 'vandalismo') {
      // Se vuelve loco borrando trazos tuyos por puro maltrato artístico
      this.temporizadorEstado++;
      if (pintor && typeof pintor.borrar === 'function') {
        pintor.borrar(width - this.x, this.y, 40);
      }
      // Se mueve erráticamente mientras destruye, no queda pegado
      this.x += random(-4, 4) * velocidadMod;
      this.y += random(-4, 4) * velocidadMod;
      this.colorCuerpo = [0, 0, 0];
      this._quizasHablar(this.frasesVandalismo, 0.04);

      if (this.temporizadorEstado > 60) {
        this._cambiarEstado('vagar');
      }

    } else if (this.estado === 'bailando') {
      // Da vueltas felizmente en su lugar, sin dañar nada
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
      // Se queda inmóvil "roncando" y de repente despierta de un salto
      this.temporizadorEstado++;
      this.vx *= 0.9;
      this.vy *= 0.9;
      this.colorCuerpo = [120, 120, 200];
      this._quizasHablar(this.frasesDormido, 0.03);

      if (this.temporizadorEstado > 90 || random() < 0.01) {
        // Se despierta sobresaltado
        this.vx = random(-4, 4);
        this.vy = random(-4, 4);
        this._cambiarEstado('asustado');
      }

    } else if (this.estado === 'asustado') {
      // Salto de sobresalto breve, luego sigue con su vida
      this.temporizadorEstado++;
      this.x += this.vx * 2.5;
      this.y += this.vy * 2.5;
      this.escalaPulso = 1.3;
      this._quizasHablar(this.frasesSusto, 0.15);

      if (this.temporizadorEstado > 15) {
        this._cambiarEstado('vagar');
      }
    }

    // 4. Colisiones con los bordes de la pantalla
    if (this.x < 30 || this.x > width - 30) {
      this.vx *= -1;
      this.x = constrain(this.x, 30, width - 30);
    }
    if (this.y < 30 || this.y > height - 30) {
      this.vy *= -1;
      this.y = constrain(this.y, 30, height - 30);
    }

    // 5. Detección de Muros (Negro del usuario) para encerrarlo
    if (pintor && pintor.lienzo) {
      pintor.lienzo.loadPixels();
      let idxX = Math.floor(this.x);
      let idxY = Math.floor(this.y);
      let index = (idxY * width + idxX) * 4;

      if (pintor.lienzo.pixels.length > 0 && index > 0 && index < pintor.lienzo.pixels.length) {
        let r = pintor.lienzo.pixels[index];
        let g = pintor.lienzo.pixels[index + 1];
        let b = pintor.lienzo.pixels[index + 2];
        let a = pintor.lienzo.pixels[index + 3];

        if (a > 100 && r < 40 && g < 40 && b < 40) {
          this.vx *= -1;
          this.vy *= -1;
          this.tiempoAtrapado++;

          // La terquedad de su personalidad decide cuánto aguanta encerrado
          let limitePaciencia = 100 * this.personalidad.terquedad;
          if (this.tiempoAtrapado > limitePaciencia) {
            this.detonarBomba(pintor, configUI);
            this.tiempoAtrapado = 0;
          }
        } else {
          this.tiempoAtrapado = max(0, this.tiempoAtrapado - 0.2);
        }
      }
    }
  }

  // --- Animaciones de vida: parpadeo, bamboleo, respiración ---
  _actualizarVida() {
    this.anguloBamboleo += 0.06;

    // Parpadeo aleatorio
    this.temporizadorParpadeo--;
    if (this.temporizadorParpadeo <= 0) {
      this.parpadeando = true;
      if (this.temporizadorParpadeo < -6) {
        this.parpadeando = false;
        this.temporizadorParpadeo = random(60, 220);
      }
    }

    // Pulso de escala vuelve suavemente a 1 (para el salto de susto, etc.)
    this.escalaPulso = lerp(this.escalaPulso, 1, 0.1);

    // Rotación vuelve a 0 cuando no está bailando
    if (this.estado !== 'bailando') {
      this.rotacionActual = lerp(this.rotacionActual, 0, 0.1);
    }

    // La burbuja de diálogo se apaga sola
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
    this.cooldownCambioEstado = 20; // evita cambios frenéticos entre estados
  }

  teletransportarse() {
    // Un capricho random: desaparece y reaparece en otro lado, con chispas
    this.x = random(40, width - 40);
    this.y = random(40, height - 40);
    this.escalaPulso = 1.6;
  }

  // --- Interacción entre varios personajes (para arte generativo tipo "ecosistema") ---
  // Si tu sketch crea un array de PersonajeGenetico, llamá a este método para
  // cada par (por ejemplo con un doble for) en cada frame:
  //   for (let i = 0; i < personajes.length; i++) {
  //     for (let j = i + 1; j < personajes.length; j++) {
  //       personajes[i].interactuarCon(personajes[j], pintor);
  //     }
  //   }
  distanciaA(otro) {
    return Math.hypot(this.x - otro.x, this.y - otro.y);
  }

  interactuarCon(otro, pintor) {
    let d = this.distanciaA(otro);
    if (d > 70) return; // muy lejos, no pasa nada

    // Rebote suave: se "empujan" al cruzarse, como partículas
    let ang = Math.atan2(this.y - otro.y, this.x - otro.x);
    let fuerza = 0.15;
    this.vx += Math.cos(ang) * fuerza;
    this.vy += Math.sin(ang) * fuerza;

    // Ocasionalmente "contagian" su tono de color al otro, mezclando estilos
    if (random() < 0.01) {
      this.tonoBase = lerp(this.tonoBase, otro.tonoBase, 0.5);
      this._quizasHablar(['¡contagio de color!', 'toma un poco del mío', '¡mezcla!'], 1);
    }

    // Muy cerca y con suerte, sueltan una bomba conjunta justo entre los dos
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

  // Decide, al azar, qué travesura hacer: bomba de color, cambio de filtro,
  // una ráfaga de varias bombas por todo el lienzo, o combo de ambas.
  _hacerTravesura(pintor, configUI) {
    let opcion = random();
    if (opcion < 0.40) {
      this.detonarBombaColor(pintor);
      this._quizasHablar(this.frasesTravesura, 1); // siempre comenta lo que hizo
    } else if (opcion < 0.70) {
      this.provocarCambioCaotico(configUI);
      this._quizasHablar(this.frasesTravesura, 1);
    } else if (opcion < 0.90) {
      this.dispararRafagaBombas(pintor);
      this._quizasHablar(this.frasesTravesura, 1);
    } else {
      // Combo dramático: bomba de color Y cambio de filtro a la vez
      this.detonarBombaColor(pintor);
      this.provocarCambioCaotico(configUI);
      this._quizasHablar(this.frasesTravesura, 1);
    }
    this.escalaPulso = 1.25; // un pequeño saltito de emoción al hacer la travesura
  }

  provocarCambioCaotico(configUI) {
    if (configUI && 'filtro' in configUI) {
      // Cambio de filtro permanente: se queda así hasta la próxima travesura,
      // no vuelve solo a la normalidad.
      configUI.filtro = random(this.filtrosDisponibles);
    }
  }

  // Tamaños de "bolita" de pincel: mediano, grande o extragrande (nunca chiquito)
  _tamanoBolita() {
    let categoria = random(['mediano', 'grande', 'extragrande']);
    if (categoria === 'mediano') return random(30, 45);
    if (categoria === 'grande') return random(46, 65);
    return random(66, 90); // extragrande
  }

  // Decide el "modo de color" de una bomba entera antes de tirarla:
  // - multicolor: varios colores, pero armónicos entre sí (no cualquier RGB)
  // - monocromatico: un único color base, variando solo la opacidad
  _elegirModoColor() {
    return random() < 0.5 ? 'multicolor' : 'monocromatico';
  }

  // Convierte HSB (0-360, 0-100, 0-100) a RGB (0-255) sin tocar el
  // colorMode global de p5, para no afectar el resto del sketch.
  _hsbToRgb(h, s, b) {
    s /= 100; b /= 100;
    let k = n => (n + h / 60) % 6;
    let f = n => b - b * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
    return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
  }

  // Genera una paleta de colores armónica a partir del tono propio del
  // personaje (this.tonoBase) y su tipo de armonía (analoga/complementaria/triada).
  _paletaArmonica() {
    let h = this.tonoBase;
    if (this.tipoArmonia === 'complementaria') {
      return [h, (h + 180) % 360];
    } else if (this.tipoArmonia === 'triada') {
      return [h, (h + 120) % 360, (h + 240) % 360];
    }
    // análoga: tonos vecinos
    return [h, (h + 30) % 360, (h - 30 + 360) % 360];
  }

  // Genera el color de una bolita según el modo elegido para esa bomba.
  // colorBase se usa solo en modo monocromático.
  _colorParaTrazo(modoColor, colorBase) {
    if (modoColor === 'monocromatico') {
      let opacidad = random(60, 255); // opacidad bien variable, de sutil a sólida
      return [colorBase[0], colorBase[1], colorBase[2], opacidad];
    }
    // multicolor: elige un tono de la paleta armónica del personaje,
    // variando saturación/brillo para que no sea siempre el mismo golpe de color
    let paleta = this._paletaArmonica();
    let tono = random(paleta);
    let rgb = this._hsbToRgb(tono, random(55, 100), random(70, 100));
    return [...rgb, random(180, 255)];
  }

  // Dibuja un trazo y, según this.simetria, sus reflejos — como un kaleidoscopio.
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
          // Los trazos salen distribuidos en círculo, como una explosión de confeti
          let ang = (TWO_PI / cantidad) * i + random(-0.2, 0.2);
          let r = random(20, 60);
          px = cx + Math.cos(ang) * r;
          py = cy + Math.sin(ang) * r;
        } else if (patron === 'linea') {
          // Una ráfaga en línea, como si disparara una metralleta de color
          let ang = random(TWO_PI);
          px = cx + Math.cos(ang) * (i * 8);
          py = cy + Math.sin(ang) * (i * 8);
        } else {
          // Salpicadura desordenada (pero con pincel, no spray)
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

  // Un ataque de creatividad total: bombas de color repartidas por TODO
  // el lienzo, no solo cerca del personaje. Reservado para momentos raros.
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
    if (configUI && 'filtro' in configUI) {
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

    // Cuerpo Rectangular (con una pequeña "respiración")
    let respirar = this.estado === 'durmiendo' ? Math.sin(frameCount * 0.08) * 2 : Math.sin(this.anguloBamboleo) * 1;
    ctx.stroke(255);
    ctx.strokeWeight(2);
    ctx.fill(...this.colorCuerpo);
    ctx.rectMode(CENTER);
    ctx.rect(0, 0, this.wRect, this.hRect + respirar, 8);

    // Ojos
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
        // ojos cerrados en arquito
        ctx.stroke(0);
        ctx.strokeWeight(2);
        ctx.line(-14, -4, -6, -4);
        ctx.line(6, -4, 14, -4);
        ctx.noStroke();
      } else if (this.estado === 'asustado') {
        // ojos bien abiertos y grandes
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

    // Burbuja de diálogo espontánea
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