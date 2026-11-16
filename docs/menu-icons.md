# Products menu: icons and see-through panel

The Products panel is built by `web/assets/js/site.js` from the `XR` list. Products added later (DrizzleTown, Star Viewer) are listed right after it with their own icon, line and GAME/APP kind. A product the list doesn't know is picked up from the page; its home-page card fills in the icon, line and GAME tag even when its menu link comes first.

To add a new product to the menu properly, add it to that list (id = its `data-product`).

Panel transparency: the `.xr-mega` background (`.52` / `.46`). Lower = clearer.
