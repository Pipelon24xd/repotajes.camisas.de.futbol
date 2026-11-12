/* =========================================================
   LA CAMISETA · comportamiento
   Todo se activa solo a partir del HTML: no hay que tocar este archivo
   para agregar fotos, galerías, capítulos o videos (ver README.md).
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Menú móvil ---------- */
  var menu = $('#menu');
  var botonMenu = $('#menu-boton');
  function cerrarMenu() {
    menu.classList.remove('abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
  }
  botonMenu.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierto');
    botonMenu.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ---------- Enlaces internos con desplazamiento suave ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var destino = id ? document.getElementById(id) : document.body;
    if (!destino) return;
    e.preventDefault();
    cerrarMenu();
    destino.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- Barra de progreso y botón de subir ---------- */
  var barra = $('.menu__progreso i');
  var subir = $('#subir');
  var pendiente = false;
  function actualizar() {
    pendiente = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, (window.pageYOffset || h.scrollTop) / max)) : 0;
    barra.style.transform = 'scaleX(' + p + ')';
    subir.classList.toggle('visible', (window.pageYOffset || h.scrollTop) > 900);
  }
  window.addEventListener('scroll', function () {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
  }, { passive: true });
  window.addEventListener('resize', actualizar);
  actualizar();
  subir.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  /* ---------- Sección activa en el menú ---------- */
  var enlaces = {};
  $$('.menu__lista a').forEach(function (a) { enlaces[a.getAttribute('href').slice(1)] = a; });
  var secciones = $$('[data-seccion]');
  function marcar(id) {
    Object.keys(enlaces).forEach(function (k) {
      var on = k === id;
      enlaces[k].classList.toggle('activo', on);
      if (on) enlaces[k].setAttribute('aria-current', 'true'); else enlaces[k].removeAttribute('aria-current');
    });
  }
  function seccionActual() {
    var linea = window.innerHeight * 0.35, actual = '';
    secciones.forEach(function (s) { if (s.getBoundingClientRect().top <= linea) actual = s.id; });
    marcar(actual);
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(seccionActual); }, { passive: true });
  seccionActual();

  /* ---------- Tiempo de lectura por capítulo ---------- */
  $$('[data-seccion].cap').forEach(function (s) {
    var destino = $('[data-lectura]', s);
    if (!destino) return;
    var texto = $$('.cuerpo p:not([aria-hidden]), .cuerpo li', s).map(function (n) { return n.textContent; }).join(' ');
    var palabras = (texto.match(/\S+/g) || []).length;
    var min = Math.max(1, Math.round(palabras / 200));
    destino.textContent = 'Lectura: ' + min + ' min';
  });

  /* ---------- Visor de fotografías ---------- */
  var visor = $('#visor');
  var imgVisor = $('#visor-img');
  var pieVisor = $('#visor-pie');
  var btnAnt = $('#visor-ant');
  var btnSig = $('#visor-sig');
  var btnCerrar = $('#visor-cerrar');
  var grupo = [], indice = 0, origen = null;

  function mostrar(i) {
    indice = (i + grupo.length) % grupo.length;
    var b = grupo[indice];
    var im = $('img', b);
    var cap = b.closest('figure') ? $('figcaption', b.closest('figure')) : null;
    imgVisor.src = b.getAttribute('data-grande') || im.currentSrc || im.src;
    imgVisor.alt = im.alt;
    pieVisor.innerHTML = '';
    if (cap) pieVisor.appendChild(document.createTextNode(cap.textContent));
    var n = document.createElement('span');
    n.textContent = grupo.length > 1 ? (indice + 1) + ' de ' + grupo.length : '';
    pieVisor.appendChild(n);
    var varias = grupo.length > 1;
    btnAnt.hidden = !varias; btnSig.hidden = !varias;
  }
  function abrir(boton) {
    var g = boton.getAttribute('data-galeria') || 'reportaje';
    grupo = $$('.zoom[data-galeria="' + g + '"]');
    if (!grupo.length) grupo = [boton];
    origen = boton;
    mostrar(Math.max(0, grupo.indexOf(boton)));
    visor.classList.add('abierto');
    visor.setAttribute('aria-hidden', 'false');
    document.body.classList.add('bloqueado');
    btnCerrar.focus();
  }
  function cerrar() {
    visor.classList.remove('abierto');
    visor.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('bloqueado');
    imgVisor.removeAttribute('src');
    if (origen) origen.focus();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.zoom');
    if (b) { e.preventDefault(); abrir(b); }
  });
  btnCerrar.addEventListener('click', cerrar);
  btnAnt.addEventListener('click', function () { mostrar(indice - 1); });
  btnSig.addEventListener('click', function () { mostrar(indice + 1); });
  visor.addEventListener('click', function (e) {
    if (e.target === visor || e.target.classList.contains('visor__escena')) cerrar();
  });
  document.addEventListener('keydown', function (e) {
    if (!visor.classList.contains('abierto')) return;
    if (e.key === 'Escape') cerrar();
    else if (e.key === 'ArrowLeft' && grupo.length > 1) mostrar(indice - 1);
    else if (e.key === 'ArrowRight' && grupo.length > 1) mostrar(indice + 1);
    else if (e.key === 'Tab') {
      var f = [btnCerrar, btnAnt, btnSig].filter(function (x) { return !x.hidden; });
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  var x0 = null;
  visor.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', function (e) {
    if (x0 === null || grupo.length < 2) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) mostrar(indice + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });

  /* ---------- Pieza de Genially ---------- */
  var gen = $('#genially');
  if (gen) {
    var url = gen.getAttribute('data-src');
    var marco = $('.genially__marco', gen);
    var velo = $('.genially__velo', gen);
    var cargar = $('#genially-cargar');
    var pantalla = $('#genially-pantalla');
    function insertar() {
      if ($('iframe', marco)) return;
      var f = document.createElement('iframe');
      f.src = url;
      f.title = gen.getAttribute('data-titulo') || 'Pieza interactiva';
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('allow', 'fullscreen');
      f.setAttribute('scrolling', 'yes');
      marco.appendChild(f);
      velo.hidden = true;
    }
    cargar.addEventListener('click', insertar);
    if (!(gen.requestFullscreen || gen.webkitRequestFullscreen)) pantalla.hidden = true;
    pantalla.addEventListener('click', function () {
      insertar();
      var r = gen.requestFullscreen ? gen.requestFullscreen() : gen.webkitRequestFullscreen();
      if (r && r.catch) r.catch(function () { pantalla.hidden = true; });
    });
  }
})();
