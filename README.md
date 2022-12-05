# Develop webgl + swiper

```bash
npm i

npm start
```

Hace unos dos años estuve haciendo cosas con WebGL usando la librería <a href="https://www.curtainsjs.com/" target="_blank" rel="noopener">https://www.curtainsjs.com/</a> y hoy vuelvo a retomarlo basándome en una de las entradas: <a href="https://ivanalbizu.eu/blog/webgl-slideshow/" target="_blank" rel="noopener">https://ivanalbizu.eu/blog/webgl-slideshow/</a>. Voy a omitir mucho código ya que muchas cosas son una réplica, haré hincapié en cosas que sean diferentes, todas relacionadas con la integración de la librería <a href="https://swiperjs.com/" target="_blank" rel="noopener">swiperjs</a> y curtainsjs

## HTML para canvas WebGL

Necesitamos crear contenedor donde se generará el canvas para crear la animación con WebGL

```html
<div class="wrapper">
  <div class="canvas"></div>
  <div class="slides multi-textures">
    <img
      style="display: none"
      src="./src/img/displacement4.jpg"
      crossorigin="anonymous"
      data-sampler="displacement" />
  </div>
</div>
```

La imagen será usada para establecer un patrón para la animación. Curtainsjs requiere todas las imágenes que forman la animación pero en lugar de añadir las etiquetas imagen lo haremos con javascript clonando las imágenes que añadamos a swiper

## Inicialización de swiper

Swiper tiene muchas opciones. Si se añaden más opciones no sé como se comportará. Ánimo a que pruebes bajo tu responsabilidad ;)

```javascript
import Swiper, { Navigation } from 'swiper';
const swiperEl = document.querySelector('.swiper');

const swiper = new Swiper(swiperEl, {
  modules: [Navigation],
  slidesPerView: 'auto',
  spaceBetween: 16,
  loop: true,
  slideToClickedSlide: true,

  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  on: {
    beforeInit: () => {
      swiperEl.querySelectorAll('img').forEach((img) => {
        planeElement.appendChild(img.cloneNode());
      });
    },
  },
});
```

Para dar soporte a Loop he añadido un script para clonar los nodos imágenes dentro del método <code>beforeInit</code>, ya que swiper duplica nodos para hacer el efecto loop

## Actualización de texturas

Usando custainsjs necesitamos especificar la textura inicial (activeTexture) y la textura final (nextTexture). Con swiperjs tenemos muy fácil conocer la imagen actual y la siguiente

```javascript
initEvent(activeTexture, nextTexture) {
  // usamos el evento para detectar cuando se produce la transición
  this.swiper.on('realIndexChange', () => {
    // usamos una propiedad local para usarlo como bloqueo esperar a que las transiciones de produzcan
    if (!this.slidesState.isChanging) {
      this.curtains.enableDrawing();

      this.slidesState.isChanging = true;
      this.swiper.disable();

      // cargamos la imagen usando la API de swiper: this.swiper.realIndex
      nextTexture.setSource(
        this.multiTexturesPlane.images[this.swiper.realIndex + 1]
      );

      setTimeout(() => {
        this.curtains.disableDrawing();

        this.slidesState.isChanging = false;
        // actualizamos la textura
        activeTexture.setSource(
          this.multiTexturesPlane.images[this.swiper.realIndex + 1]
        );

        this.slidesState.transitionTimer = 0;
        this.swiper.enable();
      }, 1700);
    }
  });
}
```

