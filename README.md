# Paint Panic! Un proyecto de mitad de semestre para visión artificial
Paint Panic es una experiencia interactiva desarrollada en p5.js que combina técnicas de visión artificial con principios de diseño generativo. El proyecto integra dos formas de percepción del usuario frente a la cámara —detección de color y detección de movimiento por frame difference— para alimentar el comportamiento de un personaje autónomo que pinta, reacciona y actúa según lo que ve.

El objetivo era crear una experiencia interactiva en p5.js que utilice la detección de movimiento corporal como input para manipular y generar contenido visual artístico, aplicando técnicas de visión artificial y principios de diseño generativo, combinada con un segundo canal de entrada basado en detección de color para el control directo de pintura y navegación de menú.

El proyecto fue inspirado en el videojuego [**Mario Paint**](https://www.youtube.com/watch?v=MX3HERvqHwI&t=802s), la animación de [**Animator vs. Animation**](https://www.youtube.com/watch?v=npTC6b5-yvM) de [**Alan Becker**](https://www.youtube.com/@alanbecker) y [**A Musical Wall where Little People Live**](https://www.teamlab.art/ew/littlepeople-wall-asm/artsciencemuseum/) de **teamLab**

## ¿Cómo funciona?

Existe un agente autónomo cuyo comportamiento está basado en una máquina de estados finitos, modulada por una personalidad aleatoria y por dos capas de percepción: **color + movimiento**. Cada instancia nace con rasgos propios que determinan cómo se comporta y hacen que ningún personaje sea exactamente igual a otro.

### Estados de comportamiento

* **Vagar** — deambula y deja un rastro tenue de su color.
* **Mirando** — permanece quieto observando; después de un tiempo puede detonar una bomba de color.
* **Vandalismo** — borra trazos del usuario mientras se desplaza de forma errática.
* **Bailando** — gira felizmente en su lugar sin dañar el lienzo.
* **Durmiendo** — permanece quieto durante un tiempo y luego despierta de forma repentina.
* **Asustado** — realiza un breve salto de sobresalto, provocado por un movimiento brusco del usuario o por haber permanecido encerrado.

### Reacción al color

El color del marcador detectado por la cámara funciona como una segunda capa de interacción. El color seleccionado para pintar también modifica el comportamiento del personaje: **el rojo aumenta su velocidad, el azul la reduce y el blanco o amarillo tiende a calmarlo**.

### Reacción al movimiento real

De forma independiente al color, el personaje analiza el movimiento del usuario mediante **frame difference**. Esta información se utiliza simultáneamente de varias maneras:

* **Intensidad del movimiento** → modifica la velocidad del personaje.
* **Movimiento clasificado como “Rápido”** → puede provocar que entre en el estado **asustado**.
* **Ausencia sostenida de movimiento** → aumenta la probabilidad de que el personaje se duerma.
* **Dirección predominante del movimiento** → ejerce un pequeño empuje sobre su desplazamiento.
* **Cada gesto nuevo detectado** → puede provocar inmediatamente un acto aleatorio, como una bomba de color o un cambio de filtro.

### Travesuras autónomas

El personaje también posee un comportamiento independiente de las acciones del usuario. Un temporizador interno determina cuándo realizar una de cuatro acciones aleatorias:

1. Bomba de color.
2. Cambio de filtro.
3. Ráfaga de bombas por todo el lienzo.
4. Combinación de las anteriores.

Las bombas pueden utilizar diferentes patrones geométricos ya sean spray, anillo o líne y distintos tamaños como mediano, grande o extragrande. Su color puede ser **multicolor y armónico**, utilizando diferentes niveles de opacidad.

## Guía de Controles

### Cómo interactuar

Paint Panic utiliza la cámara para convertir los **colores y movimientos del usuario en acciones dentro del lienzo**. No es necesario tocar la pantalla para interactuar con el programa: basta con colocar frente a la cámara uno de los marcadores de colores.

|   Marcador   | Función                                                                                                               |
| :----------: | --------------------------------------------------------------------------------------------------------------------- |
| 🟢 **Verde** | **Pincel:** pinta sobre el lienzo utilizando el tipo, tamaño y color seleccionados.                                  |
| 🔵 **Azul** | **Selector:** funciona como cursor para navegar por el menú y seleccionar diferentes herramientas y configuraciones. |
| 🔴 **Rojo** | **Borrador:** elimina los trazos del lienzo al mover el marcador sobre ellos.                                        |

### El personaje también está jugando

El personaje no es simplemente un elemento controlado por el usuario: **también observa, reacciona y toma sus propias decisiones**.

Tus movimientos pueden modificar su velocidad, dirección y estado de ánimo. Los movimientos rápidos pueden asustarlo, mientras que permanecer quieto durante un tiempo puede hacer que se duerma. Cada nuevo gesto detectado también puede provocar una de sus travesuras.

Al mismo tiempo, el personaje puede actuar por iniciativa propia. Puede vagar, bailar, dormir, observar o incluso **vandalizar tu pintura**. También puede generar bombas de color, cambiar filtros o llenar el lienzo con efectos inesperados.

Por eso, **no todo lo que ocurre en el lienzo está bajo el control del usuario**. La experiencia consiste en pintar mientras se observa y se responde al comportamiento del personaje.

### Teclado (depuración)

| Tecla | Acción                              |
| :---: | ----------------------------------- |
| **D** | Muestra u oculta el panel de debug. |
| **C** | Limpia el lienzo.                   |
| **G** | Reinicia el contador de gestos.     |
