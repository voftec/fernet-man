# Ingeniería inversa de Pepsiman

Documento de diseño para reproducir la estructura jugable de *Pepsiman*
(KID, PlayStation, 1999) sin copiar código, modelos, marcas ni recursos del
original. La adaptación, **Fernet Man**, conserva su gramática de runner y la
reinterpreta como una experiencia móvil infinita ambientada en Córdoba.

## 1. Bucle principal

Pepsiman corre automáticamente por un corredor tridimensional. El jugador no
controla el avance: lee el camino, elige una línea, salta, se desliza, acelera
o frena para superar una secuencia diseñada. La tensión nace de tres sistemas:

1. Obstáculos con una respuesta correcta y una ventana corta.
2. Coleccionables que tientan al jugador a tomar rutas más peligrosas.
3. Un límite de tiempo que penaliza caídas y vuelve relevante el dash.

La cámara normalmente persigue al personaje. El último segmento de cada etapa
invierte la puesta en escena: la cámara queda delante y una amenaza gigantesca
persigue al héroe.

## 2. Controles y verbos

- Movimiento lateral continuo para esquivar y alinearse con coleccionables.
- Salto para autos, huecos y obstáculos bajos.
- Deslizamiento para camiones, carteles y obstáculos elevados.
- Arriba + deslizar ejecuta un dash: aumenta la velocidad y rompe barreras
  débiles, pero altera el timing de los peligros móviles.
- Dash + salto produce un salto largo.
- Abajo + deslizar frena brevemente para sincronizar cruces.

Los modificadores temporales alteran los verbos básicos. El ejemplo más claro
es el tacho de basura sobre la cabeza, que invierte izquierda/derecha y reduce
la maniobrabilidad. También hay segmentos sobre tabla y dentro de un barril.

## 3. Daño, recursos y progresión

- El indicador de salud admite tres impactos menores.
- Los impactos consumen salud y tiempo mediante una animación de caída.
- Caer en un hueco o recibir un impacto pesado puede quitar una vida.
- Diez latas recuperan una unidad de salud.
- En dificultad normal, cada 20 latas otorga una vida al final del nivel; en
  Expert, cada 25. Cada sección distribuye 100 latas.
- Al agotarse el tiempo o la salud se vuelve al último checkpoint.
- La interfaz muestra latas, salud, cronómetro, progreso de la sección y vidas.

## 4. Estructura del juego original

Hay cuatro stages. Cada uno contiene dos escenas de cámara trasera y una escena
final de persecución con cámara frontal:

1. **San Francisco / suburbios:** cruces, autos, peatones, jardines, casas,
   camiones de basura y el primer segmento con controles invertidos.
2. **Nueva York:** calles céntricas, construcción, metro y tráfico más denso.
3. **Texas:** rutas, desierto, rocas, trenes y amenazas de gran escala.
4. **Pepsi City:** fábrica, cintas transportadoras y el sistema informático de
   la marca.

Las dos primeras escenas terminan en una máquina expendedora o en la entrega de
la bebida. La tercera culmina escapando de un objeto gigante, a menudo una lata.

## 5. Lenguaje de diseño de niveles

Pepsiman no genera sus recorridos de forma puramente aleatoria. Funciona como
una pista de obstáculos coreografiada y aprendible:

- El escenario anticipa peligros con siluetas, carriles y animación.
- Las latas forman líneas que enseñan la trayectoria segura o una ruta de riesgo.
- Los obstáculos móviles dependen del momento de llegada; abusar del dash puede
  hacer que un cruce antes seguro sea peligroso.
- Los checkpoints dividen secuencias y reducen la repetición después de fallar.
- La dificultad aumenta mediante combinaciones, no agregando muchos botones.
- El slapstick convierte el fallo en espectáculo, en vez de una pausa seca.

## 6. Traducción a Fernet Man

Fernet Man adopta los verbos esenciales y los simplifica para touch:

- Swipe izquierda/derecha: cambiar entre tres carriles.
- Swipe arriba: saltar.
- Swipe abajo: agacharse/deslizarse.
- El avance es automático y acelera con la distancia.
- Las botellas reemplazan las latas y conceden una vida cada 25 unidades.
- Tres impactos terminan la carrera; un breve parpadeo evita daño encadenado.

En lugar de pistas fijas, usa patrones procedurales y object pooling. Tres
tramos visuales aparecen durante la misma carrera infinita:

1. Centro Histórico: Cabildo, fachadas coloniales y plazas.
2. Nueva Córdoba: edificios altos, pendientes y tránsito.
3. Güemes / La Cañada: casas bajas, comercios, tipas y puentes.

La adaptación debe conservar lo que hace legible al original: telegráficos
claros, contraste entre carriles, ritmo de aparición y animaciones cómicas.

## 7. Fuentes consultadas

- Hardcore Gaming 101, “Pepsiman”:
  https://www.hardcoregaming101.net/pepsiman/
- GameFAQs, guía de Odino (mecánicas, HUD, latas y walkthrough):
  https://gamefaqs.gamespot.com/ps/575071-pepsiman/faqs/59615
- GameFAQs, guía de Pepsiboy (obstáculos y timing):
  https://gamefaqs.gamespot.com/ps/575071-pepsiman/faqs/4993
- Wikipedia, “Pepsiman (video game)” (estructura y desarrollo):
  https://en.wikipedia.org/wiki/Pepsiman_(video_game)
- Municipalidad de Córdoba, circuito Barrio Güemes:
  https://turismo.cordoba.gob.ar/circuito-barrio-guemes/
- Córdoba Turismo, Barrio Nueva Córdoba:
  https://cordobaturismo.gov.ar/experiencias/barrio-nueva-cordoba/
