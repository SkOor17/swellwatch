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

## 3. Viewport Transform & Pan/Zoom Navigation

The canvas supports multi-resolution pan and zoom to navigate along the coast:

- **Zoom bounds**: $Z \in [1.0, 8.0]$ ($1.0$ fits full metropolitan France, $8.0$ allows local bay/beach zoom).
- **Coordinate transformation**:
  $$\begin{pmatrix} x_{screen} \\ y_{screen} \end{pmatrix} = \begin{pmatrix} (x_{base} - x_{center}) \cdot Z + x_{center} + \text{pan}_x \\ (y_{base} - y_{center}) \cdot Z + y_{center} + \text{pan}_y \end{pmatrix}$$
- **Zoom towards pointer**: When scrolling wheel or pinching, the geographic coordinate under the pointer remains fixed on screen.
- **Pan constraints**: Panning is softly bounded to prevent users from drifting into infinite open ocean.
- **Controls**: Interactive drag, wheel scroll, double-click to zoom in, and floating UI buttons (+ / - / recenter).

## 4. Swell Train Kinematics and Animation

Waves are modeled as wavefronts propagating towards the coast according to the average swell vector ($\theta, H_s, T_p$).

- **Direction ($\theta$)**: Swell incidence angle.
- **Line Thickness ($w$)**: Indexed on significant height ($H_s$).
  - $w = \text{clamp}(1.0 + 1.5 \times H_s, 1.5, 6.0)$ px
- **Wavelength & Spacing ($\lambda$)**: Proportional to the deep-water period squared ($T_p^2$).
- **Phase Velocity ($c$)**: Longer swells travel faster.
- **Phase ($\phi$)**: $\phi(t) = (t \times c) \pmod \lambda$

### Coastal Fade-out

As wavefronts approach the shore ($d < d_{threshold}$), opacity undergoes a cosine attenuation to simulate breaking, preventing the lines from crossing onto the landmass.

## 5. Spot Interaction & Dynamic Clustering

- **Level of Detail (LOD) / Dynamic Clustering**:
  - **National Overview ($Z < Z_{threshold}$)**: Nearby spots are clustered together with an aggregated badge showing the spot count and average condition score color.
  - **Regional/Local View ($Z \ge Z_{threshold}$)**: Clusters expand into individual pulsing spot markers.
- **Spot Markers**:
  - **Green** (Score $\ge 7.5$): Excellent conditions.
  - **Yellow/Orange** ($5.0 \le \text{Score} < 7.5$): Average conditions.
  - **Red/Grey** ($\text{Score} < 5.0$): Poor or blown-out conditions.
- Collision detection with a radius ($r = 12\text{px}$) handles hover and click events.
- Clicking triggers a Shadcn UI Sheet/Drawer to show the full forecast without leaving the map context.
