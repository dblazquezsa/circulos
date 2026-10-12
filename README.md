# Autómatas y Agentes

Sitio para la sesión «De los autómatas celulares a los modelos sociales» del Círculo Matemático de Medellín. Es a la vez la presentación de la sesión y un conjunto de módulos interactivos para explorar después.

## Contenido

| Archivo | Qué es |
| --- | --- |
| `index.html` | Página de inicio con los cinco módulos y el código QR |
| `presentacion.html` | Presentación de 16 diapositivas con los módulos incrustados |
| `modulos/pascal.html` | Módulo 1: triángulo de Pascal módulo n |
| `modulos/reglas.html` | Módulo 2: las 256 reglas de autómatas en una dimensión |
| `modulos/vida.html` | Módulo 3: Juego de la Vida |
| `modulos/coordinacion.html` | Módulo 4: Juego de la Coordinación en red |
| `modulos/dilema.html` | Módulo 5: Dilema del Prisionero espacial |
| `js/logica.js` | Reglas de todos los modelos, sin dibujo (se puede probar con Node) |

No hay que compilar nada: son archivos HTML, CSS y JavaScript. Funciona también sin internet abriendo `index.html` directamente; solo cambian las fuentes tipográficas.

## Publicar en GitHub Pages

1. Crea un repositorio y sube todo el contenido de esta carpeta a la raíz.
2. En el repositorio: **Settings → Pages → Build and deployment**, elige *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. Cuando esté publicado, escribe la dirección en `js/config.js` (`urlSitio`) para que el código QR apunte siempre a ella.

## Antes de la sesión

- La foto de *Conus textile* (`img/conus-textile.jpg`) es de [malacology-asia.com](https://www.malacology-asia.com/); el crédito aparece en las diapositivas 2 y 8.
- En el módulo 5, con «Como en el salón»: el escenario A debe quedar todo rojo en la ronda 4 y el B debe ser un rombo verde estable desde la ronda 1.

## Presentación

- Flechas, barra espaciadora o Re Pág / Av Pág (sirve con un control remoto de diapositivas) para avanzar y retroceder.
- `F` activa la pantalla completa.
- Se puede abrir directamente una diapositiva con `presentacion.html#9`.

## Colores

Negro y blanco para los autómatas, azul y amarillo para la Coordinación, verde (✓ coopera) y rojo (✗ traiciona) para el Dilema. La web no muestra equivalencias con material físico, para que sirva en otros contextos.

Código QR generado con [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (licencia MIT), incluido en `js/vendor/`.
