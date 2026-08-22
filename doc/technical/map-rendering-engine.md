# SwellWatch Map Rendering Engine Specs

## 1. Objectives & Performance Constraints

The map engine provides an ultra-fluid interactive visualization of the French coastline and ocean dynamics without heavy map tile services (no Mapbox, Google Maps, or Leaflet OSM).

- **60 FPS minimum** on mobile and desktop via `requestAnimationFrame`.
- **Zero paid dependencies** or third-party mapping API keys.
- **Total cartographic asset weight < 150 KB** (Simplified GeoJSON).
- Adaptive vector rendering supporting Retina `devicePixelRatio`.

## 2. Geometry and Projection

A local Mercator or equirectangular projection is used for metropolitan France:

```javascript
x = (lng - lng_min) * (width / (lng_max - lng_min));
y = (lat_max - lat) * (height / (lat_max - lat_min));
```

- Coastal outlines are stored in simplified TopoJSON/GeoJSON format.
- Pre-compiled into a `Path2D` Canvas object on load to minimize GPU overhead per frame.
- Visuals: Dark seabed background (`#0B132B`), sleek landmass (`#1C2541`), with a soft cyan/white coastal outline.

## 3. Swell Train Kinematics and Animation

Waves are modeled as wavefronts propagating towards the coast according to the average swell vector ($\theta, H_s, T_p$).

- **Direction ($\theta$)**: Swell incidence angle.
- **Line Thickness ($w$)**: Indexed on significant height ($H_s$).
  - $w = \text{clamp}(1.0 + 1.5 \times H_s, 1.5, 6.0)$ px
- **Wavelength & Spacing ($\lambda$)**: Proportional to the deep-water period squared ($T_p^2$).
- **Phase Velocity ($c$)**: Longer swells travel faster.
- **Phase ($\phi$)**: $\phi(t) = (t \times c) \pmod \lambda$

### Coastal Fade-out

As wavefronts approach the shore ($d < d_{threshold}$), opacity undergoes a cosine attenuation to simulate breaking, preventing the lines from crossing onto the landmass.

## 4. Spot Interaction

- Surfing spots are mapped onto the Canvas.
- Displayed as pulsing points colored by condition score:
  - **Green** (Score $\ge 7.5$): Excellent conditions.
  - **Yellow/Orange** ($5.0 \le \text{Score} < 7.5$): Average conditions.
  - **Red/Grey** ($\text{Score} < 5.0$): Poor or blown-out conditions.
- Collision detection with a radius ($r = 12\text{px}$) handles hover and click events.
- Clicking triggers a Shadcn UI Sheet/Drawer to show the full forecast without leaving the map context.
