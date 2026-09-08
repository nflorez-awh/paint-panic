class Camara {
  constructor() {
    this.video = null;
  }
  
  iniciar() {
    this.video = createCapture(VIDEO);
    this.video.size(800, 600); // Resolución 800x600 (4:3)
    this.video.hide();
    console.log("Cámara inicializada en 800x600");
  }
  
  // Dibuja el video en el destino indicado (pg). Si no se pasa nada,
  // dibuja directamente en el canvas principal.
  mostrar(pg) {
    let ctx = pg || window;
    ctx.push(); // Guarda el estado actual de transformación

    // Invertimos el eje X (-1) y mantenemos el Y (1)
    ctx.scale(-1, 1);

    // Como el espejo invierte las coordenadas, dibujamos la imagen
    // desplazada hacia la izquierda (ancho negativo) para que vuelva a verse.
    ctx.image(this.video, -ctx.width, 0, ctx.width, ctx.height);

    ctx.pop(); // Restaura el estado original para que no afecte a otros dibujos
  }
}