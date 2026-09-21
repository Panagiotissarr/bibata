## Disclamer 
This is not my work this is just a maintenied clone of this project.
All of the the assets used are not mine every piece is owned by Abdulkaiz Khatri.

# Running
To run bibata localy you will need to do the following
  
  ```terminal
  # clone the repo
  git clone https://github.com/Panagiotissarr/bibata.git
  ```

  ```terminal
  # Install all dependencies for the app
  npm install
  ```

  ```terminal
  # Run app
  npm run dev
  ```


<details>
  <summary>Bored? one copy liner command avalible.</summary>
  
  ```terminal
  # clone the repo
  git clone https://github.com/Panagiotissarr/bibata.git
  # Install all dependencies for the app
  npm install
  # Run app
  npm run dev
  ```
</details>

Now you should be able to vist `http://localhost:3000` in your browser

## Testing Windows cursor downloads

```sh
npm test
npm run build
```

The cursor tests validate CUR bitmap data, transparency, scaled hotspots, ANI
frame counts/order and timing, including the bundled Busy and Working animations
for all four styles. Windows files are generated entirely in Node using `sharp`;
no Python or external cursor converter is required on Vercel.

After deploying encoder changes, download a **new** Windows ZIP (existing `.ani`
files are not updated automatically). Extract it and select `Cursors/Busy.ani`
for **Busy** and `Cursors/Work.ani` for **Working in Background** in Windows Mouse
Properties → Pointers, then click Apply. Check that both animate and that the
pointer hotspot stays aligned. Test both left- and right-handed styles. Browser
previews and Explorer thumbnails are not a substitute for this Windows check.

### Windows artwork size vs. canvas size

The Studio size is the size of the rendered artwork, not necessarily the CUR
file's canvas. Windows downloads pad the artwork on the right and bottom to the
next standard canvas size (32, 48, 64, 96, 128 or 256px), following
[clickgen's canvas-padding policy](https://github.com/ful1e5/clickgen/blob/main/src/clickgen/writer/windows.py).
For example, selecting 24px produces 24px artwork inside a transparent 32px
canvas, **without enlarging the artwork**. Hotspots are scaled to the artwork,
not the padded canvas. The same rule applies to every ANI frame; PNG downloads
are unchanged.

Without this padding, loading a 24px cursor at a 32px Windows system cursor size
would stretch the artwork by 33%. Windows display scaling and pointer-size
settings can still scale the final cursor. This restores the custom-size padding
policy; it does not reproduce upstream's entire multi-resolution Regular preset.

## Bibata

TLDR; This cursor set is a masterpiece of cursors available on the internet, hand-designed by [Abdulkaiz Khatri](https://github.com/ful1e5).

Bibata is an open-source, compact, and material designed cursor set that aims to improve the cursor experience for users. It is one of the most popular cursor sets in the Linux community and is now available for free on Windows as well, with multiple color and size options. Its goal is to offer personalized cursors to users.

### What does "Bibata" word mean?

The sweetest word I ever spoke was "BI-Buh," which, coincidentally, is also the word for peanuts. To make it more pronounceable and not sound like a baby's words, I added the suffix "Ta." And with that, my journey in the world of open-source began.

## Copying

This project is released under the terms of the MIT license.
See [LICENCE](./LICENSE) for more information or see
[opensource.org](https://opensource.org/licenses/MIT)

<!-- Download Counts (08/01/2024)       -->
<!-- Bibata Modern Amber          3,703 -->
<!-- Bibata Original Amber        5,307 -->
<!-- Bibata Modern Ice          180,246 -->
<!-- Bibata Original Ice          6,630 -->
<!-- Bibata Modern Classic       21,340 -->
<!-- Bibata Original Classic      8,778 -->
<!-- GitHub                     101,547 -->
<!-- ---------------------------------- -->
<!-- Total                      327,551 -->
