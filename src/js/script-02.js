import { Curtains, Plane } from 'curtainsjs';
import fragment from './shaders/fragment-02.glsl';
import vertex from './shaders/vertex-02.glsl';

import Swiper, { Navigation } from 'swiper';

const swiperEl = document.querySelector('.swiper');
const wrapper = document.querySelector('.wrapper');
const canvas = wrapper.querySelector('.canvas');
const planeElement = wrapper.querySelector('.multi-textures');

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

class WebglSlides {
  constructor(set) {
    this.swiper = set.swiper;
    this.canvas = set.canvas;

    this.planeElement = set.planeElement;
    this.multiTexturesPlane = null;
    this.slidesState = {
      activeTextureIndex: 1,
      nextTextureIndex: null,
      maxTextures: this.canvas.querySelectorAll('img').length, // -1 to displacement

      isChanging: false,
      transitionTimer: 0,
    };
    this.params = {
      vertexShader: document.getElementById('vs')?.textContent || vertex,
      fragmentShader: document.getElementById('fs')?.textContent || fragment,
      uniforms: {
        transitionTimer: {
          name: 'uTransitionTimer',
          type: '1f',
          value: 0,
        },
      },
    };

    this.init();
  }

  init() {
    this.setupCurtains();
    this.initPlane();
    this.update();
  }

  setupCurtains() {
    this.curtains = new Curtains({
      container: this.canvas,
      watchScroll: false,
      pixelRatio: Math.min(1.5, window.devicePixelRatio),
    });
    this.curtains.onError(() => this.error());
    this.curtains.onContextLost(() => this.restoreContext());
  }

  initPlane() {
    this.multiTexturesPlane = new Plane(
      this.curtains,
      this.planeElement,
      this.params
    );

    this.multiTexturesPlane
      .onLoading((texture) => {
        texture.setMinFilter(this.curtains.gl.LINEAR_MIPMAP_NEAREST);
      })
      .onReady(() => {
        const activeTexture = this.multiTexturesPlane.createTexture({
          sampler: 'activeTexture',
          fromTexture:
            this.multiTexturesPlane.textures[
              this.slidesState.activeTextureIndex
            ],
        });
        const nextTexture = this.multiTexturesPlane.createTexture({
          sampler: 'nextTexture',
          fromTexture:
            this.multiTexturesPlane.textures[this.slidesState.nextTextureIndex],
        });

        this.initEvent(activeTexture, nextTexture);
      });
  }

  update() {
    this.multiTexturesPlane.onRender(() => {
      if (this.slidesState.isChanging) {
        this.slidesState.transitionTimer =
          (1 - 0.05) * this.slidesState.transitionTimer + 0.05 * 60;

        if (
          this.slidesState.transitionTimer >= 59 &&
          this.slidesState.transitionTimer !== 60
        ) {
          this.slidesState.transitionTimer = 60;
        }
      }

      this.multiTexturesPlane.uniforms.transitionTimer.value =
        this.slidesState.transitionTimer;
    });
  }

  initEvent(activeTexture, nextTexture) {
    this.swiper.on('realIndexChange', () => {
      if (!this.slidesState.isChanging) {
        this.curtains.enableDrawing();

        this.slidesState.isChanging = true;
        this.swiper.disable();

        nextTexture.setSource(
          this.multiTexturesPlane.images[this.swiper.realIndex + 1]
        );

        setTimeout(() => {
          this.curtains.disableDrawing();

          this.slidesState.isChanging = false;
          activeTexture.setSource(
            this.multiTexturesPlane.images[this.swiper.realIndex + 1]
          );

          this.slidesState.transitionTimer = 0;
          this.swiper.enable();
        }, 1700);
      }
    });
  }

  error() {
    document.body.classList.add('no-curtains', 'image-1');
  }

  restoreContext() {
    this.curtains.restoreContext();
  }

  // Not necesary, only for change Displacements Texture
  removePlanes() {
    this.curtains.dispose();
  }
}

window.addEventListener('load', () => {
  let slide = new WebglSlides({
    swiper,
    canvas,
    planeElement,
  });

  // Down, not necesary, only for change Displacements Texture
  document.querySelector('.js-open-modal').addEventListener('click', () => {
    document.body.classList.add('modal-active');
  });
  document.querySelector('.js-close-modal').addEventListener('click', () => {
    document.body.classList.remove('modal-active');
  });

  const settings = document.querySelectorAll('[data-setting]');
  settings.forEach((setting) => {
    setting.addEventListener('click', (event) => {
      const target = event.target;
      const path = target.getAttribute('src');
      settings.forEach((setting) => setting.classList.remove('active'));
      target.classList.add('active');
      document.querySelector('[data-sampler]').src = path;

      slide.removePlanes();
      slide = new WebglSlides({
        swiper,
        canvas,
        planeElement,
      });
    });
  });
});
