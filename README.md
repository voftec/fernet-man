# Fernet Man

**Fernet Man** es un runner 3D infinito de cámara trasera, inspirado en la
energía arcade de *Pepsiman* y ambientado en las calles de Córdoba, Argentina.
Corré sin fin, esquivá autos, peatones, cajones, barreras y baches; juntá
botellas de fernet y vasos de Fernet con Coca.

## Cómo jugar

No hay build ni dependencias locales. Abrí `index.html` en un navegador moderno
con conexión a internet (Three.js se carga desde un CDN), o levantá un servidor:

```bash
python -m http.server
```

Después visitá `http://localhost:8000` y tocá la pantalla para empezar.

## Controles táctiles

- Deslizá a izquierda/derecha: cambiar de carril.
- Deslizá hacia arriba: saltar.
- Deslizá hacia abajo: deslizarse por debajo de barreras altas.
- Tocá la pantalla: saltar (o empezar/reiniciar desde una pantalla).

El teclado queda disponible como fallback de desarrollo:

- **A/D** o **←/→**: cambiar de carril.
- **W**, **↑** o **Espacio**: saltar.
- **S** o **↓**: deslizarse.
- **Shift**: dash; rompe cajones de madera.
- **P**: pausar o continuar.
- **Enter**: empezar o reiniciar.

Hay tres corazones de vida. Cada choque consume un corazón y, al juntar 25
botellas, recuperás una vida extra. El puntaje combina distancia y botellas; la
velocidad y la densidad de obstáculos aumentan con el tiempo. El récord queda
guardado en `localStorage`.

La campaña contiene tres recorridos de 750 metros, cada uno con checkpoint:

1. Centro Histórico, con llegada al edificio de Devin Conf y puertas animadas.
2. Nueva Córdoba, con torres, pendientes y tránsito más denso.
3. Güemes y La Cañada, con casas bajas, tipas, puentes y ambiente nocturno.

Cada meta muestra las botellas recogidas. La salud y el tiempo se recuperan al
comenzar el nivel siguiente, mientras puntaje, botellas y vidas se conservan.

## Arquitectura

- `assets.js` es el **asset bank**: mantiene una paleta pequeña de materiales y
  geometrías reutilizables y crea prefabs low-poly para casas chorizo,
  departamentos de Nueva Córdoba, kioscos, Capuchinos, Cabildo, tipas,
  luminarias, autos, barreras, latas y vasos.
- El juego precalienta **pools** de obstáculos y coleccionables. Al pasar detrás
  de la cámara, los objetos se ocultan y se reposicionan adelante con otro
  carril o variante; no se eliminan ni se disponen durante la partida.
- Las rayas de carril, edificios, árboles, puentes y canal se reciclan
  reposicionando su `z`, manteniendo un mundo infinito sin crear objetos en
  cada frame.

## Créditos técnicos

Renderizado 3D con Three.js `0.160.0` vía import map CDN, geometría low-poly,
`PerspectiveCamera`, niebla, iluminación, animaciones procedurales y loop de
tiempo fijo en JavaScript vanilla.
