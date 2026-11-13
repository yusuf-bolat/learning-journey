// Phase 2 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "2.0": {
  "minutes": 35,
  "learn": "\n<p>Good design is mostly a few principles applied with discipline. You will use them for posters, slides, demo videos, README pages and UI for your own tools. Learn to name what you see; then you can fix it on purpose instead of by luck.</p>\n\n<h3>Hierarchy</h3>\n<p>Hierarchy tells the viewer what to read first, second and third. You create it with <b>size</b>, <b>weight</b>, <b>colour</b> and <b>position</b>. A poster usually needs exactly three levels: a headline that reads from across the room, supporting detail (date, place), and fine print. If everything is big and bold, nothing is.</p>\n<p>Test: squint at your design or shrink it to a thumbnail. The element you notice first should be the one you meant.</p>\n\n<h3>Contrast</h3>\n<p>Contrast is difference: light vs dark, big vs small, heavy vs thin, warm vs cool. Weak contrast looks like a mistake; strong contrast looks intentional. Make differences obvious. A headline at 1.2× body size reads as an accident; at 3× it reads as a choice.</p>\n<p>Text must also be readable. The WCAG accessibility guideline asks for a contrast ratio of at least <b>4.5:1</b> between normal body text and its background (3:1 for large text). Light grey on white usually fails.</p>\n\n<h3>Alignment</h3>\n<p>Every element should line up with something else. Invisible lines connect the design and make it look organised. Pick one strong edge (often left-aligned text) and stick to it. Centring everything is the most common beginner layout and often looks weak, because centred lines create ragged edges on both sides.</p>\n<p>A <b>grid</b> (for example 12 columns with fixed gutters, or a simple margin system) makes alignment automatic. Figma's layout grids and Auto Layout help here.</p>\n\n<h3>Proximity</h3>\n<p>Items that belong together go close together; unrelated groups get space between them. The eye reads closeness as relationship (a Gestalt principle). Date, time and venue form one group; the sponsor logos form another. Space between groups should be clearly larger than space inside a group.</p>\n\n<h3>White space</h3>\n<p>Empty space is not wasted. It separates groups, gives the headline room and signals quality. When a layout feels cluttered, remove things or add space before you shrink text.</p>\n\n<h3>Typography</h3>\n<ul>\n<li>Use at most <b>two typefaces</b>: one for headlines, one for body. Often one family in two weights is enough.</li>\n<li>Build contrast with weight and size, not with more fonts.</li>\n<li>Keep body lines around 45–75 characters long and line height about 1.4–1.6× the font size.</li>\n</ul>\n\n<h3>Colour</h3>\n<p>Limit the palette: a dominant neutral, a main colour and one accent used sparingly for the thing that matters (the call to action, the date). A common guide is the 60-30-10 split. Check your design in greyscale: if the hierarchy disappears, you relied on colour alone.</p>\n\n<h3>Working method</h3>\n<ol>\n<li>Recreate a poster you admire, pixel for pixel. Copying exposes decisions you would never notice by looking.</li>\n<li>Design your own with hard limits (2 fonts, 3 colours). Constraints force principles to do the work.</li>\n<li>Ask two people what they read first and what they think it is about. Revise once based on that, not on taste.</li>\n</ol>\n<blockquote>Common mistake: fixing a weak layout by adding effects (shadows, gradients, extra fonts). Fix hierarchy, alignment and spacing first; effects rarely rescue a layout.</blockquote>\n",
  "practice": {
   "type": "fill",
   "prompt": "<p>Name the principle or value. Answers are one or two words.</p>",
   "items": [
    {
     "q": "The date, time and venue sit tightly together, with a large gap before the sponsor logos. Which principle groups them?",
     "accept": [
      "proximity"
     ],
     "hint": "closeness"
    },
    {
     "q": "A viewer reads the headline first, then the date, then the fine print. What is this ordering called?",
     "accept": [
      "hierarchy",
      "visual hierarchy"
     ],
     "hint": "levels of importance"
    },
    {
     "q": "Every text block's left edge lines up on the same invisible vertical line. Which principle?",
     "accept": [
      "alignment"
     ],
     "hint": "lining up"
    },
    {
     "q": "Grey text on a white background is hard to read. Which property is too weak?",
     "accept": [
      "contrast",
      "colour contrast",
      "color contrast"
     ],
     "hint": "difference between light and dark"
    },
    {
     "q": "Minimum WCAG contrast ratio for normal body text (write it like 4.5:1).",
     "accept": [
      "4.5:1",
      "4.5",
      "4.5 : 1"
     ],
     "hint": "between 4 and 5"
    },
    {
     "q": "Maximum number of typefaces a beginner poster should use.",
     "accept": [
      "2",
      "two"
     ],
     "hint": "headline + body"
    },
    {
     "q": "Empty areas that separate groups and let a headline breathe are called…",
     "accept": [
      "white space",
      "whitespace",
      "negative space"
     ],
     "hint": "it is not wasted"
    }
   ]
  },
  "quiz": [
   {
    "q": "Your poster looks cluttered and every line is the same size. What should you change first?",
    "options": [
     "Create clear hierarchy: make the headline much larger and group related details",
     "Add a drop shadow to the headline",
     "Use four different fonts to add variety",
     "Centre everything"
    ],
    "answer": 0,
    "why": "Clutter is usually missing hierarchy and grouping. Effects and more fonts add noise."
   },
   {
    "q": "Why is a headline only slightly larger than body text a problem?",
    "options": [
     "It breaks accessibility rules",
     "Weak contrast looks accidental; differences should be obvious",
     "Headlines must always be bold",
     "It increases file size"
    ],
    "answer": 1,
    "why": "Contrast works when it is decisive. Small differences read as mistakes."
   },
   {
    "q": "You convert your design to greyscale and the important button disappears into the background. What does this show?",
    "options": [
     "The colour palette is too small",
     "Greyscale tests are not meaningful",
     "The hierarchy relied on hue alone; it needs value (light/dark) or size contrast too",
     "The font is too thin"
    ],
    "answer": 2,
    "why": "Value and size contrast survive greyscale and colour-blindness; hue alone does not."
   },
   {
    "q": "What is the main benefit of recreating someone else's poster exactly?",
    "options": [
     "You can publish it as your own",
     "It teaches you Figma shortcuts only",
     "It is faster than designing",
     "It reveals the spacing, sizing and alignment decisions the designer made"
    ],
    "answer": 3,
    "why": "Copying forces you to measure and notice every decision, which trains your eye."
   }
  ]
 },
 "2.1": {
  "minutes": 45,
  "learn": "\n<p>Blender is a free 3-D suite for modelling, materials, lighting, animation and rendering. The skills transfer directly to the real-time graphics phase: meshes, normals, materials and cameras are the same ideas, just rendered offline.</p>\n\n<h3>Navigation</h3>\n<ul>\n<li><b>Middle mouse drag</b>: orbit. <b>Shift + middle mouse</b>: pan. <b>Scroll</b>: zoom.</li>\n<li><b>Numpad 1 / 3 / 7</b>: front, side, top views. <b>Numpad 0</b>: look through the active camera.</li>\n<li><b>Numpad .</b> (period): frame the selected object.</li>\n<li><b>Tab</b>: toggle between Object Mode and Edit Mode.</li>\n</ul>\n\n<h3>Transform shortcuts</h3>\n<p><b>G</b> grab (move), <b>R</b> rotate, <b>S</b> scale. Follow with an axis key to constrain: <code>G Z 2</code> moves 2 units up; <code>R X 90</code> rotates 90° around X. <b>Shift + A</b> adds objects. <b>Ctrl + A</b> applies transforms, which you should do on scale before using modifiers like Bevel, so they behave evenly.</p>\n\n<h3>Edit Mode basics</h3>\n<p>Press <b>1 / 2 / 3</b> in Edit Mode to select vertices, edges or faces. <b>E</b> extrudes, <b>I</b> insets a face, <b>Ctrl + R</b> adds an edge loop, <b>Ctrl + B</b> bevels edges.</p>\n\n<h3>Modifiers: non-destructive modelling</h3>\n<p>Modifiers change a mesh without editing its vertices, and can be tweaked or removed at any time. Two you will use constantly:</p>\n<ul>\n<li><b>Subdivision Surface</b>: smooths a low-poly cage into a curved surface. Shortcut <b>Ctrl + 1/2/3</b> in Object Mode adds it with that many levels. Add edge loops near edges to keep them sharp.</li>\n<li><b>Bevel</b>: rounds hard edges. Real objects never have perfectly sharp edges, so a small bevel catches highlights and makes renders look real.</li>\n</ul>\n<p>Right-click &gt; <b>Shade Smooth</b> makes normals interpolate across faces so a low-poly surface looks smooth.</p>\n\n<h3>Materials</h3>\n<p>The default <b>Principled BSDF</b> shader is physically based. The key inputs are <b>Base Color</b>, <b>Metallic</b> (0 for plastic, wood, skin; 1 for bare metal), and <b>Roughness</b> (0 = mirror-sharp reflections, 1 = fully matte). Most real materials are either metallic or not, rarely in between.</p>\n\n<h3>Three-point lighting</h3>\n<ol>\n<li><b>Key light</b>: the main, brightest light, usually 30–45° to one side.</li>\n<li><b>Fill light</b>: weaker, on the opposite side, softens the shadows the key creates.</li>\n<li><b>Rim (back) light</b>: behind the subject, outlines its silhouette and separates it from the background.</li>\n</ol>\n<p>Area lights give soft shadows; bigger lights are softer.</p>\n\n<h3>Rendering: Eevee vs Cycles</h3>\n<p><b>Eevee</b> is a real-time rasteriser, like a game engine: fast previews. <b>Cycles</b> is a path tracer: it simulates light bounces for accurate shadows, reflections and global illumination, but is slower and produces noise that drops as you add <b>samples</b>. Enable the denoiser and render on the GPU if you have one (Preferences &gt; System). <b>F12</b> renders the current frame.</p>\n\n<h3>Animation basics</h3>\n<p>Hover a property and press <b>I</b> to insert a keyframe. Move to another frame, change the value, key it again; Blender interpolates between keys. Video length is frames ÷ frame rate, so 5 s at 24 fps is 120 frames. Set the end frame in the Output properties, choose FFmpeg video as the file format, then <b>Ctrl + F12</b> renders the animation.</p>\n<blockquote>Common mistake: scaling an object in Object Mode and then wondering why the bevel looks uneven. Apply the scale (Ctrl + A &gt; Scale) first.</blockquote>\n",
  "practice": {
   "type": "fill",
   "prompt": "<p>Answer with the Blender shortcut, term or number. Use the form shown in the lesson (for example <code>Ctrl+B</code>).</p>",
   "items": [
    {
     "q": "Key to rotate the selected object.",
     "accept": [
      "R",
      "r"
     ],
     "hint": "first letter"
    },
    {
     "q": "Key that toggles between Object Mode and Edit Mode.",
     "accept": [
      "Tab",
      "tab"
     ],
     "hint": "above Caps Lock"
    },
    {
     "q": "Shortcut to bevel selected edges in Edit Mode.",
     "accept": [
      "Ctrl+B",
      "ctrl+b",
      "Ctrl + B",
      "ctrl b",
      "Ctrl B"
     ],
     "hint": "Ctrl + first letter of bevel"
    },
    {
     "q": "Modifier that smooths a low-poly mesh into curved surfaces.",
     "accept": [
      "Subdivision Surface",
      "subdivision surface",
      "subdivision",
      "subsurf",
      "Subdivision"
     ],
     "hint": "subdivides"
    },
    {
     "q": "Light in three-point lighting placed behind the subject to outline it.",
     "accept": [
      "rim",
      "rim light",
      "back light",
      "backlight",
      "back"
     ],
     "hint": "outlines the edge"
    },
    {
     "q": "Which render engine is a path tracer?",
     "accept": [
      "Cycles",
      "cycles"
     ],
     "hint": "not Eevee"
    },
    {
     "q": "Key to insert a keyframe on the hovered property.",
     "accept": [
      "I",
      "i"
     ],
     "hint": "insert"
    },
    {
     "q": "How many frames is a 5 second animation at 24 fps?",
     "accept": [
      "120"
     ],
     "hint": "seconds × fps"
    }
   ]
  },
  "quiz": [
   {
    "q": "Your Cycles render is grainy. What reduces the noise?",
    "options": [
     "Lower the resolution",
     "Switch the material to Metallic 1",
     "Increase samples and/or enable the denoiser",
     "Remove the fill light"
    ],
    "answer": 2,
    "why": "Path tracing averages random light paths; more samples or denoising lowers the noise."
   },
   {
    "q": "Why add a small bevel to a hard-surface model?",
    "options": [
     "It reduces polygon count",
     "Real edges are slightly rounded and catch highlights, which looks realistic",
     "It is required by Cycles",
     "It fixes the normals"
    ],
    "answer": 1,
    "why": "Perfectly sharp edges reflect no light along the edge and look CG."
   },
   {
    "q": "In three-point lighting, what is the fill light for?",
    "options": [
     "Being the brightest light",
     "Lighting only the background",
     "Outlining the silhouette",
     "Softening the shadows cast by the key light"
    ],
    "answer": 3,
    "why": "The fill is weaker and opposite the key; the rim light outlines the silhouette."
   },
   {
    "q": "A material looks like plastic but should be brushed steel. Which change matters most?",
    "options": [
     "Metallic to 1 with a medium roughness",
     "Roughness to 0 with Metallic 0",
     "Base Color to grey only",
     "Add a Subdivision Surface modifier"
    ],
    "answer": 0,
    "why": "Metals are Metallic = 1; brushed metal blurs reflections, so roughness is moderate."
   }
  ]
 }
});
