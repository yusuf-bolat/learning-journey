// Phase 7 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "7.0": {
  "minutes": 50,
  "learn": "\n<p>OpenCV is the standard library for classic image processing. In this project you will use it to load and clean images, find regions of interest and draw results, before and alongside any neural network. In Python an OpenCV image is just a NumPy array, so everything you know about arrays applies.</p>\n\n<h3>Images are arrays</h3>\n<pre><code>import cv2\nimg = cv2.imread(\"ct_slice.png\")              # shape (H, W, 3), dtype uint8, channel order BGR!\ngray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # shape (H, W)\nsmall = cv2.resize(gray, (256, 256), interpolation=cv2.INTER_AREA)\nprint(gray.shape, gray.dtype, gray[100, 50])  # row (y) first, then column (x)</code></pre>\n<p>Two traps: OpenCV loads colour as <b>BGR</b>, not RGB, and indexing is <code>[y, x]</code>, while functions such as <code>cv2.resize</code> and <code>cv2.rectangle</code> take <code>(x, y)</code> / <code>(width, height)</code>.</p>\n\n<h3>Blur and threshold</h3>\n<pre><code>blur = cv2.GaussianBlur(gray, (5, 5), 0)                 # remove noise first\n_, mask = cv2.threshold(blur, 127, 255, cv2.THRESH_BINARY)\n_, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)  # picks the threshold for you</code></pre>\n<p>Thresholding turns a grey image into a binary mask: 255 where the condition holds, 0 elsewhere. Otsu's method chooses the threshold that best separates two intensity groups.</p>\n\n<h3>Morphology</h3>\n<p>Morphological operations clean binary masks with a small structuring element (kernel):</p>\n<ul>\n<li><b>Erosion</b>: a pixel stays on only if <i>all</i> pixels under the kernel are on. Shrinks shapes and deletes specks.</li>\n<li><b>Dilation</b>: a pixel turns on if <i>any</i> pixel under the kernel is on. Grows shapes and fills small holes.</li>\n<li><b>Opening</b> = erosion then dilation: removes small noise, keeps big shapes roughly the same size.</li>\n<li><b>Closing</b> = dilation then erosion: fills small gaps.</li>\n</ul>\n<pre><code>k = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))\nclean = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)\nedges = cv2.Canny(blur, 50, 150)                          # edge detection, two hysteresis thresholds</code></pre>\n\n<h3>Contours and bounding boxes</h3>\n<pre><code>contours, _ = cv2.findContours(clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)\nfor c in contours:\n    if cv2.contourArea(c) &lt; 50:\n        continue\n    x, y, w, h = cv2.boundingRect(c)\n    cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 2)   # red in BGR</code></pre>\n\n<h3>The same in C++ and a webcam loop</h3>\n<pre><code>#include &lt;opencv2/opencv.hpp&gt;\nint main() {\n    cv::VideoCapture cap(0);\n    cv::Mat frame, gray;\n    while (cap.read(frame)) {\n        cv::cvtColor(frame, gray, cv::COLOR_BGR2GRAY);\n        cv::GaussianBlur(gray, gray, {5, 5}, 0);\n        cv::Canny(gray, gray, 50, 150);\n        cv::imshow(\"edges\", gray);\n        if (cv::waitKey(1) == 27) break;   // Esc\n    }\n}</code></pre>\n<p>Build it with CMake: <code>find_package(OpenCV REQUIRED)</code> and <code>target_link_libraries(app ${OpenCV_LIBS})</code>. To hit 30 FPS, measure each step with <code>cv::getTickCount()</code>; resizing the frame down first is usually the biggest win.</p>\n<blockquote>Common mistake: thresholding an image that is not <code>uint8</code> (for example a float CT slice) and getting an all-black mask. Check <code>dtype</code> and value range before every threshold.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Rebuild the core of an OpenCV mask pipeline with NumPy. Implement <code>erode</code> and <code>dilate</code> with a 3×3 square kernel (treat pixels outside the image as 0), then <code>opening = dilate(erode(m))</code>. Threshold the image at <code>&gt; 100</code>, open it to remove the single noise pixel, and print the number of on-pixels before and after plus the bounding box <code>x, y, w, h</code> of what remains (same convention as <code>cv2.boundingRect</code>). Expected output:</p><pre><code>on before=13\non after=12\nbbox x=2 y=1 w=4 h=3</code></pre>",
   "starter": "import numpy as np\n\nimg = np.array([\n    [ 10,  10,  10,  10,  10,  10,  10, 200],\n    [ 10,  10, 180, 190, 200, 210,  10,  10],\n    [ 10,  10, 190, 200, 210, 200,  10,  10],\n    [ 10,  10, 200, 210, 190, 180,  10,  10],\n    [ 10,  10,  10,  10,  10,  10,  10,  10],\n], dtype=np.uint8)\n\ndef erode(m):\n    p = np.pad(m, 1)\n    out = np.zeros_like(m)\n    # TODO: out[y, x] = 1 only if all 9 pixels of p[y:y+3, x:x+3] are 1\n    return out\n\ndef dilate(m):\n    p = np.pad(m, 1)\n    out = np.zeros_like(m)\n    # TODO: out[y, x] = 1 if any of the 9 pixels is 1\n    return out\n\nmask = (img > 100).astype(np.uint8)\nprint(f\"on before={int(mask.sum())}\")\nopened = mask  # TODO: opening\nprint(f\"on after={int(opened.sum())}\")\n# TODO: bounding box from np.nonzero(opened)\nx = y = w = h = 0\nprint(f\"bbox x={x} y={y} w={w} h={h}\")\n",
   "expected": "on before=13\non after=12\nbbox x=2 y=1 w=4 h=3",
   "solution": "import numpy as np\n\nimg = np.array([\n    [ 10,  10,  10,  10,  10,  10,  10, 200],\n    [ 10,  10, 180, 190, 200, 210,  10,  10],\n    [ 10,  10, 190, 200, 210, 200,  10,  10],\n    [ 10,  10, 200, 210, 190, 180,  10,  10],\n    [ 10,  10,  10,  10,  10,  10,  10,  10],\n], dtype=np.uint8)\n\ndef erode(m):\n    p = np.pad(m, 1)\n    out = np.zeros_like(m)\n    for y in range(m.shape[0]):\n        for x in range(m.shape[1]):\n            out[y, x] = p[y:y + 3, x:x + 3].min()\n    return out\n\ndef dilate(m):\n    p = np.pad(m, 1)\n    out = np.zeros_like(m)\n    for y in range(m.shape[0]):\n        for x in range(m.shape[1]):\n            out[y, x] = p[y:y + 3, x:x + 3].max()\n    return out\n\nmask = (img > 100).astype(np.uint8)\nprint(f\"on before={int(mask.sum())}\")\nopened = dilate(erode(mask))\nprint(f\"on after={int(opened.sum())}\")\nys, xs = np.nonzero(opened)\nx, y = int(xs.min()), int(ys.min())\nw, h = int(xs.max()) - x + 1, int(ys.max()) - y + 1\nprint(f\"bbox x={x} y={y} w={w} h={h}\")\n",
   "hint": "For a 0/1 mask, erosion is the min over the 3×3 window and dilation is the max. np.nonzero returns (rows, cols), i.e. (ys, xs)."
  },
  "quiz": [
   {
    "q": "You load an image with cv2.imread and show it with matplotlib. Red and blue look swapped. Why?",
    "options": [
     "The file is corrupt",
     "OpenCV stores channels as BGR while matplotlib expects RGB",
     "matplotlib only shows greyscale",
     "imread flips the image"
    ],
    "answer": 1,
    "why": "Convert with cv2.cvtColor(img, cv2.COLOR_BGR2RGB) before plotting."
   },
   {
    "q": "Which operation best removes small isolated noise specks from a binary mask while keeping large objects?",
    "options": [
     "Dilation",
     "Closing",
     "Opening",
     "Canny"
    ],
    "answer": 2,
    "why": "Opening erodes first (specks vanish), then dilates to restore the surviving shapes."
   },
   {
    "q": "img has shape (480, 640). Which call reads the pixel at x = 100, y = 20?",
    "options": [
     "img[20, 100]",
     "img[100, 20]",
     "img(100, 20)",
     "img[100][20]"
    ],
    "answer": 0,
    "why": "NumPy indexing is [row, column] = [y, x]."
   }
  ]
 },
 "7.1": {
  "minutes": 55,
  "learn": "\n<p>A CT scan arrives as a folder of DICOM files, usually one file per axial slice. Each file holds pixel data plus a header of tagged metadata. Getting units, spacing and slice order right is the difference between a working pipeline and a model trained on garbage.</p>\n\n<h3>Reading headers with pydicom</h3>\n<pre><code>import pydicom\nds = pydicom.dcmread(\"slice_001.dcm\")\nprint(ds.Modality, ds.PatientID)\nprint(ds.PixelSpacing)            # [row spacing, column spacing] in mm, e.g. [0.703, 0.703]\nprint(ds.SliceThickness)          # mm\nprint(ds.ImagePositionPatient)    # x, y, z of the first pixel in patient coordinates (mm)\nprint(ds.ImageOrientationPatient) # direction cosines of rows and columns\nprint(ds.RescaleSlope, ds.RescaleIntercept)\nraw = ds.pixel_array              # stored values, often int16 or uint16</code></pre>\n\n<h3>Hounsfield units</h3>\n<p>Stored pixel values are not physical units. Convert with the rescale tags:</p>\n<pre><code>hu = raw.astype(np.float32) * ds.RescaleSlope + ds.RescaleIntercept</code></pre>\n<p>The Hounsfield scale is defined so that <b>water = 0 HU</b> and <b>air = −1000 HU</b>. Rough values: lung tissue about −900 to −500, fat about −100, soft tissue +20 to +80, bone several hundred and up. A common intercept is −1024. Scanners often store padding outside the circular field of view as a very negative value (for example −2000); clip it before doing statistics.</p>\n\n<h3>Windowing</h3>\n<p>A display has 256 grey levels but CT spans thousands of HU. A <b>window</b> picks the HU range you care about and maps it to 0–255. It is usually given as centre/level L and width W, so the range is <code>[L − W/2, L + W/2]</code>. A lung window is roughly <code>[−1000, 400]</code>; a soft-tissue window is about L = 40, W = 400.</p>\n<pre><code>def window(hu, lo, hi):\n    x = np.clip(hu, lo, hi)\n    return ((x - lo) / (hi - lo) * 255).astype(np.uint8)</code></pre>\n<p>For deep learning, use the same idea but scale to <code>[0, 1]</code> instead of uint8.</p>\n\n<h3>Stacking slices in the right order</h3>\n<p>Never trust file names, and do not rely only on <code>InstanceNumber</code>. Sort by position along the slice normal. For ordinary axial scans that is the z component of <code>ImagePositionPatient</code>:</p>\n<pre><code>files = [pydicom.dcmread(p) for p in glob.glob(\"study/*.dcm\")]\nfiles.sort(key=lambda d: float(d.ImagePositionPatient[2]))\nvol = np.stack([d.pixel_array * d.RescaleSlope + d.RescaleIntercept for d in files])  # (Z, Y, X)\ndz = abs(files[1].ImagePositionPatient[2] - files[0].ImagePositionPatient[2])\nspacing = (dz, float(files[0].PixelSpacing[0]), float(files[0].PixelSpacing[1]))</code></pre>\n<p>Compute slice spacing from positions. <code>SliceThickness</code> describes how thick each slice is, which can differ from the distance between slices (overlapping or gapped reconstructions).</p>\n\n<h3>Three orthogonal views</h3>\n<pre><code>z, y, x = (s // 2 for s in vol.shape)\naxial, coronal, sagittal = vol[z], vol[:, y, :], vol[:, :, x]\n# show coronal/sagittal with aspect = dz / dy, or they look squashed\nplt.imshow(window(coronal, -1000, 400), cmap=\"gray\", aspect=spacing[0] / spacing[1])</code></pre>\n<p>Public data such as the TCIA collections comes as DICOM; read their licence and keep data organised by patient ID from the start.</p>\n<blockquote>Common mistake: computing HU on a uint16 array. <code>raw * slope + intercept</code> with an unsigned dtype wraps around instead of going negative. Cast to float (or int16/int32) first.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>You are given five slice headers in shuffled order (as dicts) and one tiny raw pixel array. Do three steps:</p><ol><li>Sort slices by the z of <code>ImagePositionPatient</code> and print their InstanceNumbers in that order, then the slice spacing from the first two positions.</li><li>Convert the raw array to HU with slope 1 and intercept −1024 and print it.</li><li>Apply a lung window <code>[−1000, 400]</code> mapped to 0–255 (clip, scale, truncate to int) and print it.</li></ol><p>Expected output:</p><pre><code>order=[5, 4, 3, 2, 1]\nspacing=2.50\nhu=[[-1024, -824], [-24, 176], [1376, -1924]]\nwin=[[0, 32], [177, 214], [255, 0]]</code></pre>",
   "starter": "import numpy as np\n\nslices = [\n    {\"InstanceNumber\": 3, \"ImagePositionPatient\": [-175.0, -175.0, -105.0]},\n    {\"InstanceNumber\": 1, \"ImagePositionPatient\": [-175.0, -175.0, -100.0]},\n    {\"InstanceNumber\": 5, \"ImagePositionPatient\": [-175.0, -175.0, -110.0]},\n    {\"InstanceNumber\": 2, \"ImagePositionPatient\": [-175.0, -175.0, -102.5]},\n    {\"InstanceNumber\": 4, \"ImagePositionPatient\": [-175.0, -175.0, -107.5]},\n]\nraw = np.array([[0, 200], [1000, 1200], [2400, -900]], dtype=np.int16)\nslope, intercept = 1.0, -1024.0\n\n# TODO 1: sort by z (index 2 of ImagePositionPatient), ascending\nordered = slices\nprint(\"order=\" + str([s[\"InstanceNumber\"] for s in ordered]))\nspacing = 0.0  # TODO: |z1 - z0|\nprint(f\"spacing={spacing:.2f}\")\n\n# TODO 2: HU\nhu = raw\nprint(\"hu=\" + str(hu.astype(int).tolist()))\n\n# TODO 3: lung window [-1000, 400] -> 0..255\nwin = hu\nprint(\"win=\" + str(win.astype(int).tolist()))\n",
   "expected": "order=[5, 4, 3, 2, 1]\nspacing=2.50\nhu=[[-1024, -824], [-24, 176], [1376, -1924]]\nwin=[[0, 32], [177, 214], [255, 0]]",
   "solution": "import numpy as np\n\nslices = [\n    {\"InstanceNumber\": 3, \"ImagePositionPatient\": [-175.0, -175.0, -105.0]},\n    {\"InstanceNumber\": 1, \"ImagePositionPatient\": [-175.0, -175.0, -100.0]},\n    {\"InstanceNumber\": 5, \"ImagePositionPatient\": [-175.0, -175.0, -110.0]},\n    {\"InstanceNumber\": 2, \"ImagePositionPatient\": [-175.0, -175.0, -102.5]},\n    {\"InstanceNumber\": 4, \"ImagePositionPatient\": [-175.0, -175.0, -107.5]},\n]\nraw = np.array([[0, 200], [1000, 1200], [2400, -900]], dtype=np.int16)\nslope, intercept = 1.0, -1024.0\n\nordered = sorted(slices, key=lambda s: s[\"ImagePositionPatient\"][2])\nprint(\"order=\" + str([s[\"InstanceNumber\"] for s in ordered]))\nspacing = abs(ordered[1][\"ImagePositionPatient\"][2] - ordered[0][\"ImagePositionPatient\"][2])\nprint(f\"spacing={spacing:.2f}\")\n\nhu = raw.astype(np.float32) * slope + intercept\nprint(\"hu=\" + str(hu.astype(int).tolist()))\n\nlo, hi = -1000.0, 400.0\nwin = (np.clip(hu, lo, hi) - lo) / (hi - lo) * 255\nprint(\"win=\" + str(win.astype(int).tolist()))\n",
   "hint": "sorted(slices, key=lambda s: s['ImagePositionPatient'][2]). Cast raw to float before applying slope and intercept. Window: (clip(hu, lo, hi) - lo) / (hi - lo) * 255."
  },
  "quiz": [
   {
    "q": "A voxel has HU = 0. What is it most likely?",
    "options": [
     "Air",
     "Water or fluid",
     "Bone",
     "Lung tissue"
    ],
    "answer": 1,
    "why": "The scale is defined with water at 0 HU and air at −1000 HU."
   },
   {
    "q": "Why should you sort slices by ImagePositionPatient rather than by file name?",
    "options": [
     "File names are always random",
     "Position gives the true physical location along the scan axis; file names and even instance numbers may not match it",
     "pydicom cannot read file names",
     "Sorting by name is slower"
    ],
    "answer": 1,
    "why": "Only the physical position guarantees correct anatomical order and lets you compute the real slice spacing."
   },
   {
    "q": "A lung window is [−1000, 400]. After windowing to 0–255, what grey value does a voxel at +900 HU get?",
    "options": [
     "0",
     "128",
     "255",
     "It wraps around to a low value"
    ],
    "answer": 2,
    "why": "Values above the window are clipped to the top, 255."
   },
   {
    "q": "Your volume is (120, 512, 512) with spacing (2.5, 0.7, 0.7) mm. A coronal view looks squashed vertically. Why?",
    "options": [
     "The HU conversion is wrong",
     "Each slice step is 2.5 mm but each pixel is 0.7 mm, so the display needs an aspect ratio of about 3.6",
     "The slices are in the wrong order",
     "Coronal views are always squashed"
    ],
    "answer": 1,
    "why": "Voxels are anisotropic; set aspect = dz / dy when showing coronal or sagittal views, or resample to isotropic spacing."
   }
  ]
 },
 "7.2": {
  "minutes": 60,
  "learn": "\n<p>NumPy alone forgets the physical meaning of a volume. SimpleITK images carry <b>spacing</b>, <b>origin</b> and <b>direction</b> with the voxels, and its filters respect them. VTK is the standard toolkit for turning volumes into surfaces and rendering them.</p>\n\n<h3>Loading a DICOM series</h3>\n<pre><code>import SimpleITK as sitk\nreader = sitk.ImageSeriesReader()\nfiles = reader.GetGDCMSeriesFileNames(\"study/\")   # sorted by position for you\nreader.SetFileNames(files)\nimg = reader.Execute()                            # already in HU (rescale applied)\nprint(img.GetSize())      # (x, y, z)  note: x first\nprint(img.GetSpacing())   # (sx, sy, sz) in mm\narr = sitk.GetArrayFromImage(img)                 # NumPy (z, y, x)</code></pre>\n<p>SimpleITK uses <code>(x, y, z)</code> order; the NumPy array it gives you is <code>(z, y, x)</code>. Mixing these up is the most common bug in this library.</p>\n\n<h3>Resampling to isotropic spacing</h3>\n<p>Typical CT voxels are anisotropic, for example 0.7 × 0.7 × 2.5 mm. Many 3-D algorithms (and 3-D CNNs) assume cubes. To resample, keep the physical extent the same: <code>new_size = round(old_size × old_spacing / new_spacing)</code> per axis.</p>\n<pre><code>def resample_iso(img, new_sp=1.0, interp=sitk.sitkLinear):\n    sp, sz = img.GetSpacing(), img.GetSize()\n    new_size = [int(round(n * s / new_sp)) for n, s in zip(sz, sp)]\n    return sitk.Resample(img, new_size, sitk.Transform(), interp,\n                         img.GetOrigin(), (new_sp,) * 3, img.GetDirection(),\n                         -1000, img.GetPixelID())       # -1000 = air outside</code></pre>\n<p>Use linear (or B-spline) interpolation for intensity images and <b>nearest neighbour</b> for label masks, otherwise labels blend into meaningless fractional values.</p>\n\n<h3>Lung segmentation: threshold + connected components</h3>\n<p>Lungs are air-filled, so they are dark (below about −320 HU). But so is the air outside the body. The classic recipe:</p>\n<ol>\n<li>Threshold: voxels below −320 HU become 1.</li>\n<li>Label connected components: each separate blob gets its own label.</li>\n<li>Drop components that touch the volume border (outside air), keep the largest remaining ones (the lungs).</li>\n<li>Close small holes (vessels) with morphological closing.</li>\n</ol>\n<pre><code>mask = sitk.BinaryThreshold(img, -1000, -320, 1, 0)\ncc = sitk.RelabelComponent(sitk.ConnectedComponent(mask))   # label 1 = largest\nstats = sitk.LabelShapeStatisticsImageFilter(); stats.Execute(cc)\nfor l in stats.GetLabels():\n    print(l, stats.GetPhysicalSize(l))                      # volume in mm³</code></pre>\n<p>Connected components is a flood fill: start at an unlabelled foreground voxel, give it a new label, then visit its neighbours (6-connectivity in 3-D, 4 in 2-D; or 26/8 if diagonals count) with a queue.</p>\n\n<h3>Surface extraction and rendering</h3>\n<p>Marching cubes turns a binary or HU volume into a triangle mesh at an iso-value. Pass the spacing so the mesh is in millimetres:</p>\n<pre><code>from skimage import measure\nverts, faces, normals, _ = measure.marching_cubes(lung_mask.astype(np.float32), level=0.5,\n                                                  spacing=(1.0, 1.0, 1.0))</code></pre>\n<p>Or in VTK, which can also smooth, render and save:</p>\n<pre><code>import vtk\nmc = vtk.vtkMarchingCubes(); mc.SetInputData(vtk_image); mc.SetValue(0, 0.5)\nmapper = vtk.vtkPolyDataMapper(); mapper.SetInputConnection(mc.GetOutputPort())\nactor = vtk.vtkActor(); actor.SetMapper(mapper)\nren = vtk.vtkRenderer(); ren.AddActor(actor)\nwin = vtk.vtkRenderWindow(); win.AddRenderer(ren)\niren = vtk.vtkRenderWindowInteractor(); iren.SetRenderWindow(win); win.Render(); iren.Start()\nw = vtk.vtkSTLWriter(); w.SetFileName(\"lungs.stl\"); w.SetInputConnection(mc.GetOutputPort()); w.Write()</code></pre>\n<blockquote>Common mistake: resampling a segmentation mask with linear interpolation. Always use <code>sitk.sitkNearestNeighbor</code> for labels.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Two parts:</p><ol><li><code>iso_size(size, spacing, new)</code>: the new grid size per axis when resampling to isotropic spacing. Print it for a CT of size <code>(512, 512, 120)</code> with spacing <code>(0.7, 0.7, 2.5)</code> mm resampled to 1 mm.</li><li>A 2-D lung segmentation on a tiny HU slice: threshold at <code>&lt; −320</code>, label 4-connected components with a BFS flood fill (scan rows top to bottom, left to right, so labels are numbered in that order), drop components that touch the image border, and print the size of each remaining component, largest first.</li></ol><p>Expected output:</p><pre><code>new size=(358, 358, 300)\ncomponents=4\ninside sizes=[4, 3]</code></pre>",
   "starter": "import numpy as np\nfrom collections import deque\n\ndef iso_size(size, spacing, new):\n    # TODO: round(n * s / new) per axis, as a tuple of ints\n    pass\n\nprint(\"new size=\" + str(iso_size((512, 512, 120), (0.7, 0.7, 2.5), 1.0)))\n\nhu = np.array([\n    [-1000, -1000,  -990, -1000, -1000, -1000],\n    [-1000,    40,    50,    30,    40, -1000],\n    [   40,  -850,  -870,    30,  -800,    40],\n    [   40,  -860,  -880,    20,  -820,    40],\n    [   40,    30,    40,    50,  -810,    40],\n    [   40,    40,    40,    40,    40,  -990],\n])\nmask = hu < -320\n\ndef label(mask):\n    lab = np.zeros(mask.shape, dtype=int)\n    n = 0\n    # TODO: for each unlabelled foreground pixel, n += 1 and BFS over 4-neighbours\n    return lab, n\n\nlab, n = label(mask)\nprint(f\"components={n}\")\nH, W = lab.shape\nborder = set(lab[0].tolist() + lab[-1].tolist() + lab[:, 0].tolist() + lab[:, -1].tolist())\n# TODO: sizes of labels 1..n not in border, sorted largest first\nsizes = []\nprint(\"inside sizes=\" + str(sizes))\n",
   "expected": "new size=(358, 358, 300)\ncomponents=4\ninside sizes=[4, 3]",
   "solution": "import numpy as np\nfrom collections import deque\n\ndef iso_size(size, spacing, new):\n    return tuple(int(round(n * s / new)) for n, s in zip(size, spacing))\n\nprint(\"new size=\" + str(iso_size((512, 512, 120), (0.7, 0.7, 2.5), 1.0)))\n\nhu = np.array([\n    [-1000, -1000,  -990, -1000, -1000, -1000],\n    [-1000,    40,    50,    30,    40, -1000],\n    [   40,  -850,  -870,    30,  -800,    40],\n    [   40,  -860,  -880,    20,  -820,    40],\n    [   40,    30,    40,    50,  -810,    40],\n    [   40,    40,    40,    40,    40,  -990],\n])\nmask = hu < -320\n\ndef label(mask):\n    lab = np.zeros(mask.shape, dtype=int)\n    n = 0\n    H, W = mask.shape\n    for y in range(H):\n        for x in range(W):\n            if mask[y, x] and lab[y, x] == 0:\n                n += 1\n                lab[y, x] = n\n                q = deque([(y, x)])\n                while q:\n                    cy, cx = q.popleft()\n                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                        ny, nx = cy + dy, cx + dx\n                        if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and lab[ny, nx] == 0:\n                            lab[ny, nx] = n\n                            q.append((ny, nx))\n    return lab, n\n\nlab, n = label(mask)\nprint(f\"components={n}\")\nH, W = lab.shape\nborder = set(lab[0].tolist() + lab[-1].tolist() + lab[:, 0].tolist() + lab[:, -1].tolist())\nsizes = sorted((int((lab == l).sum()) for l in range(1, n + 1) if l not in border), reverse=True)\nprint(\"inside sizes=\" + str(sizes))\n",
   "hint": "Physical extent n·s stays constant, so new size = round(n·s / new). In BFS, label a pixel when you push it onto the queue so it is never pushed twice."
  },
  "quiz": [
   {
    "q": "sitk.GetArrayFromImage(img) returns an array of shape (120, 512, 512). What does img.GetSize() return?",
    "options": [
     "(120, 512, 512)",
     "(512, 512, 120)",
     "(512, 120, 512)",
     "(1, 120, 512, 512)"
    ],
    "answer": 1,
    "why": "SimpleITK sizes are (x, y, z); the NumPy view is (z, y, x)."
   },
   {
    "q": "Which interpolation should you use when resampling a lung label mask?",
    "options": [
     "Linear",
     "B-spline",
     "Nearest neighbour",
     "Cubic"
    ],
    "answer": 2,
    "why": "Nearest neighbour keeps label values discrete; linear interpolation creates fractional labels at boundaries."
   },
   {
    "q": "After thresholding at −320 HU, the largest dark component is not the lungs. What is it most likely?",
    "options": [
     "The heart",
     "Bone",
     "The air surrounding the patient, which touches the volume border",
     "Fat"
    ],
    "answer": 2,
    "why": "Outside air is also below −320 HU. Remove components that touch the border before picking the largest."
   }
  ]
 },
 "7.3": {
  "minutes": 60,
  "learn": "\n<p>On a 512³ CT volume, CPU marching cubes and mesh smoothing take seconds to minutes. Each voxel and each vertex is processed independently, which is exactly the shape of work GPUs are good at. The hard parts are variable-sized output and memory.</p>\n\n<h3>Marching cubes in parallel</h3>\n<p>For each cell (the cube between 8 neighbouring voxels), mark each corner as inside (≥ iso) or outside. The 8 bits form a <b>case index</b> 0–255. A lookup table says which edges are crossed and which triangles (0 to 5) to emit. The 2-D version, marching squares, has 4 corners and 16 cases.</p>\n<p>On the GPU this becomes a classic three-pass pattern:</p>\n<ol>\n<li><b>Classify</b>: one thread per cell computes the case and the number of vertices it will emit.</li>\n<li><b>Exclusive scan</b> (prefix sum) of those counts: gives each cell its write offset and the total size, so you can allocate the output exactly.</li>\n<li><b>Generate</b>: each thread writes its triangles at its offset, interpolating vertex positions along edges.</li>\n</ol>\n<pre><code>__global__ void classify(const float* vol, int3 dim, float iso, unsigned char* cases, int* nverts) {\n    int x = blockIdx.x * blockDim.x + threadIdx.x;\n    int y = blockIdx.y * blockDim.y + threadIdx.y;\n    int z = blockIdx.z;\n    if (x &gt;= dim.x - 1 || y &gt;= dim.y - 1) return;\n    int c = 0;\n    for (int i = 0; i &lt; 8; ++i) {\n        int dx = i &amp; 1, dy = (i &gt;&gt; 1) &amp; 1, dz = (i &gt;&gt; 2) &amp; 1;   // corner order must match your table\n        if (vol[((z + dz) * dim.y + (y + dy)) * dim.x + (x + dx)] &gt;= iso) c |= 1 &lt;&lt; i;\n    }\n    int id = (z * (dim.y - 1) + y) * (dim.x - 1) + x;\n    cases[id] = c;\n    nverts[id] = numVertsTable[c];\n}\n// thrust::exclusive_scan(nverts, nverts + ncells, offsets);</code></pre>\n\n<h3>Adjacency in CSR form</h3>\n<p>Smoothing needs each vertex's neighbours. A <b>CSR</b> (compressed sparse row) layout stores them in two arrays: <code>indices</code> holds all neighbour lists back to back, and <code>indptr[v] .. indptr[v+1]</code> is vertex v's slice. Building it on the GPU with Thrust:</p>\n<ol>\n<li>From each triangle (a, b, c) emit 6 directed edges: a→b, b→a, b→c, c→b, a→c, c→a.</li>\n<li><code>thrust::sort</code> the edges by (source, destination), then <code>thrust::unique</code> to drop duplicates (edges shared by two triangles).</li>\n<li>Count edges per source and exclusive-scan to get <code>indptr</code>; the sorted destinations are <code>indices</code>.</li>\n</ol>\n\n<h3>Laplacian smoothing</h3>\n<p>Marching cubes meshes look stair-stepped. Laplacian smoothing moves every vertex toward the average of its neighbours:</p>\n<pre><code>p_new = p + λ · (mean(neighbours) − p)       # λ around 0.5, a few iterations</code></pre>\n<pre><code>__global__ void laplacian(const float3* p, float3* out, const int* indptr, const int* idx, int n, float lam) {\n    int v = blockIdx.x * blockDim.x + threadIdx.x;\n    if (v &gt;= n) return;\n    float3 s = make_float3(0, 0, 0);\n    int b = indptr[v], e = indptr[v + 1];\n    for (int k = b; k &lt; e; ++k) { float3 q = p[idx[k]]; s.x += q.x; s.y += q.y; s.z += q.z; }\n    float inv = 1.0f / max(e - b, 1);\n    out[v] = make_float3(p[v].x + lam * (s.x * inv - p[v].x),\n                         p[v].y + lam * (s.y * inv - p[v].y),\n                         p[v].z + lam * (s.z * inv - p[v].z));\n}</code></pre>\n<p>Read from <code>p</code>, write to <code>out</code>, then swap. Updating in place would let some threads see already-moved neighbours, and the result would depend on thread scheduling. Plain Laplacian smoothing also shrinks the mesh; Taubin smoothing alternates a positive and a negative λ to counter that.</p>\n\n<h3>Bounded memory: chunking</h3>\n<p>A 512³ float volume is 512 MB before any output. Process the volume in slabs of z-slices. Each slab needs one extra slice of overlap so cells on the boundary have all 8 corners. Vertices on the shared plane are generated by both neighbours unless you assign each boundary cell to exactly one slab. Reuse the same device buffers for every slab so peak memory is fixed by the slab size, not the volume.</p>\n\n<h3>A simple binary mesh format</h3>\n<p>Write a small header (magic bytes, version, vertex count, triangle count), then the float32 vertex array and the uint32 index array. A loader reads the header, checks the magic, and reads both arrays straight into memory with no parsing.</p>\n<blockquote>Common mistake: launching marching cubes with a fixed-size output buffer \"big enough\". It either wastes memory or silently overflows. Count first, scan, then allocate.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Prototype the GPU mesh steps on the CPU:</p><ol><li><code>ms_case(cell, iso)</code>: the marching-squares case index of a 2×2 cell, with bit order top-left = 1, top-right = 2, bottom-right = 4, bottom-left = 8. Print cases for two cells.</li><li>Build CSR adjacency from a triangle list exactly like the Thrust recipe: emit both directions of every edge, sort, deduplicate, count per source, prefix-sum into <code>indptr</code>.</li><li>One Laplacian smoothing step with λ = 0.5 (read old positions, write new ones). Print the new position of vertex 4.</li></ol><p>Expected output:</p><pre><code>case=6 case=15\nindptr=[0, 3, 7, 11, 14, 18]\nindices=[1, 2, 4, 0, 2, 3, 4, 0, 1, 3, 4, 1, 2, 4, 0, 1, 2, 3]\nv4=(0.500, 0.500, 1.000)</code></pre>",
   "starter": "import numpy as np\n\ndef ms_case(cell, iso):\n    # cell = [[tl, tr], [bl, br]]; bits: tl=1, tr=2, br=4, bl=8 (set if value >= iso)\n    pass\n\nprint(f\"case={ms_case([[0, 5], [0, 5]], 3)} case={ms_case([[9, 9], [9, 9]], 3)}\")\n\n# a square pyramid: 4 base vertices and an apex (vertex 4)\npos = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0.5, 0.5, 2.0]])\ntris = [(0, 1, 4), (1, 3, 4), (3, 2, 4), (2, 0, 4), (0, 1, 2), (1, 3, 2)]\nn = len(pos)\n\n# TODO: list of (src, dst) for both directions of every triangle edge\nedges = []\n# TODO: sort and remove duplicates\n# TODO: counts per source -> indptr (length n + 1, starting at 0)\nindptr, indices = [0] * (n + 1), []\nprint(\"indptr=\" + str(indptr))\nprint(\"indices=\" + str(indices))\n\nlam = 0.5\nnew = pos.copy()\n# TODO: for each v: new[v] = pos[v] + lam * (mean of pos[neighbours] - pos[v])\nx, y, z = (float(c) for c in new[4])\nprint(f\"v4=({x:.3f}, {y:.3f}, {z:.3f})\")\n",
   "expected": "case=6 case=15\nindptr=[0, 3, 7, 11, 14, 18]\nindices=[1, 2, 4, 0, 2, 3, 4, 0, 1, 3, 4, 1, 2, 4, 0, 1, 2, 3]\nv4=(0.500, 0.500, 1.000)",
   "solution": "import numpy as np\n\ndef ms_case(cell, iso):\n    (tl, tr), (bl, br) = cell\n    return (tl >= iso) * 1 | (tr >= iso) * 2 | (br >= iso) * 4 | (bl >= iso) * 8\n\nprint(f\"case={ms_case([[0, 5], [0, 5]], 3)} case={ms_case([[9, 9], [9, 9]], 3)}\")\n\npos = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0.5, 0.5, 2.0]])\ntris = [(0, 1, 4), (1, 3, 4), (3, 2, 4), (2, 0, 4), (0, 1, 2), (1, 3, 2)]\nn = len(pos)\n\nedges = []\nfor a, b, c in tris:\n    for u, v in ((a, b), (b, c), (c, a)):\n        edges += [(u, v), (v, u)]\nedges = sorted(set(edges))\ncounts = [0] * n\nfor s, _ in edges:\n    counts[s] += 1\nindptr = [0]\nfor c in counts:\n    indptr.append(indptr[-1] + c)\nindices = [d for _, d in edges]\nprint(\"indptr=\" + str(indptr))\nprint(\"indices=\" + str(indices))\n\nlam = 0.5\nnew = pos.copy()\nfor v in range(n):\n    nb = indices[indptr[v]:indptr[v + 1]]\n    new[v] = pos[v] + lam * (pos[nb].mean(axis=0) - pos[v])\nx, y, z = (float(c) for c in new[4])\nprint(f\"v4=({x:.3f}, {y:.3f}, {z:.3f})\")\n",
   "hint": "sorted(set(edges)) does sort + unique in one go. indptr is the running sum of the per-vertex counts, starting from 0."
  },
  "quiz": [
   {
    "q": "Why does GPU marching cubes use a prefix sum (scan)?",
    "options": [
     "To sort the triangles",
     "Each cell emits a different number of vertices; the scan gives each thread its output offset and the total size to allocate",
     "To compute normals",
     "To smooth the mesh"
    ],
    "answer": 1,
    "why": "Classify, scan, generate: the scan turns per-cell counts into write positions without any locking."
   },
   {
    "q": "In CSR adjacency, where are the neighbours of vertex v?",
    "options": [
     "indices[v]",
     "indptr[v]",
     "indices[indptr[v] : indptr[v+1]]",
     "indices[v * 3 : v * 3 + 3]"
    ],
    "answer": 2,
    "why": "indptr holds the start of each vertex's slice; the next entry is its end."
   },
   {
    "q": "A Laplacian smoothing kernel updates vertex positions in place in the same buffer it reads. What is the problem?",
    "options": [
     "It uses too much memory",
     "Some threads read neighbours that were already moved, so the result depends on scheduling and is not a true Laplacian step",
     "The kernel will not compile",
     "Nothing, it is the standard approach"
    ],
    "answer": 1,
    "why": "Use two buffers (read old, write new) and swap between iterations."
   },
   {
    "q": "You process a volume in z-slabs. Why does each slab need one extra slice of overlap?",
    "options": [
     "To store the header",
     "Cells at the slab boundary need voxel values from the next slice for their top corners",
     "To speed up memory copies",
     "Overlap is not needed"
    ],
    "answer": 1,
    "why": "A cell spans two slices; without overlap the boundary cells cannot be classified and the mesh gets a gap."
   }
  ]
 },
 "7.4": {
  "minutes": 55,
  "learn": "\n<p>The final pipeline chains everything: CT in, nodules detected on 2-D slices, each detection cropped and classified, results shown in the 3-D mesh. The model code is reuse. What makes or breaks the project is the evaluation: a leaky split or an accuracy-only report makes the numbers meaningless.</p>\n\n<h3>Pipeline</h3>\n<ol>\n<li>Load series with SimpleITK, convert to HU, resample, window to [0, 1].</li>\n<li><b>Detector</b>: Faster R-CNN on axial slices (often three adjacent slices as the 3 input channels for context). Output boxes with scores per slice.</li>\n<li>Merge detections across neighbouring slices into 3-D candidates (boxes that overlap with IoU &gt; a threshold on consecutive slices belong together).</li>\n<li><b>Classifier</b>: crop a patch around each candidate, run a CNN (for example a fine-tuned ResNet or EfficientNet) to predict the subtype.</li>\n<li>Map candidate centres from voxel indices to millimetres (<code>img.TransformIndexToPhysicalPoint</code>) and draw them as spheres in the VTK scene with the lung mesh.</li>\n</ol>\n\n<h3>Split by patient, never by slice</h3>\n<p>Neighbouring slices of the same scan are nearly identical. If slices are shuffled into train and test at random, the test set contains near-copies of training images, and the model is graded on memory, not generalisation. The reported accuracy can be much higher than the accuracy on a new patient.</p>\n<pre><code>from sklearn.model_selection import GroupShuffleSplit, StratifiedGroupKFold\ngss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=0)\ntrain_idx, test_idx = next(gss.split(X, y, groups=patient_ids))\nassert not set(patient_ids[train_idx]) &amp; set(patient_ids[test_idx])   # no shared patients</code></pre>\n<p>Split <i>first</i>, before any per-dataset normalisation statistics, oversampling or augmentation, and keep the patient lists in a file so every experiment uses the same split.</p>\n\n<h3>Per-class metrics</h3>\n<p>Datasets are imbalanced, so overall accuracy is dominated by the common class. For each class c, count from the confusion matrix:</p>\n<ul>\n<li><b>Precision</b> = TP / (TP + FP): of the cases predicted c, how many are c.</li>\n<li><b>Recall</b> (sensitivity) = TP / (TP + FN): of the true c cases, how many were found. For screening, this is the number clinicians care about first.</li>\n<li><b>F1</b> = 2·P·R / (P + R): their harmonic mean.</li>\n</ul>\n<pre><code>from sklearn.metrics import classification_report, confusion_matrix\nprint(confusion_matrix(y_true, y_pred))\nprint(classification_report(y_true, y_pred, digits=3))</code></pre>\n\n<h3>Confidence intervals</h3>\n<p>With a small test set, a recall of 0.80 could easily be 0.6 or 0.9 on another sample. Always report an interval. Two standard options:</p>\n<ul>\n<li><b>Wilson score interval</b> for a proportion such as recall (k successes out of n): closed form, behaves well for small n and values near 0 or 1.</li>\n<li><b>Bootstrap</b>: resample test <i>patients</i> with replacement many times, recompute the metric, take the 2.5th and 97.5th percentiles.</li>\n</ul>\n<pre><code>def wilson(k, n, z=1.96):\n    p = k / n\n    d = 1 + z * z / n\n    c = (p + z * z / (2 * n)) / d\n    h = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / d\n    return c - h, c + h</code></pre>\n<blockquote>Common mistake: bootstrapping slices instead of patients. Slices from one patient are correlated, so resampling them gives intervals that are too narrow.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "python",
   "prompt": "<p>Two parts:</p><ol><li>A slice-level split put every 4th slice in the test set. Count how many test slices come from patients that also appear in training. Then do a patient-level split (patients <code>P4</code> and <code>P5</code> are test) and print the overlap again.</li><li>For predictions over three classes, compute precision, recall and F1 per class from the counts (no sklearn), and the Wilson 95% interval for the recall of class <code>adeno</code>.</li></ol><p>Expected output:</p><pre><code>slice split: leaked test slices=5 of 5\npatient split: shared patients=0\nadeno P=0.750 R=0.750 F1=0.750\nsquamous P=0.667 R=0.667 F1=0.667\nsmall P=1.000 R=1.000 F1=1.000\nadeno recall 95% CI=[0.409, 0.929]</code></pre>",
   "starter": "patients = [f\"P{i // 4 + 1}\" for i in range(20)]   # P1..P5, 4 slices each\n\n# slice-level split: every 4th slice goes to test\ntest = [i for i in range(20) if i % 4 == 3]\ntrain = [i for i in range(20) if i % 4 != 3]\n# TODO: count test slices whose patient also appears in train\nleaked = 0\nprint(f\"slice split: leaked test slices={leaked} of {len(test)}\")\n\ntest_p = {\"P4\", \"P5\"}\n# TODO: build patient-level train/test index lists and count shared patients\nshared = 0\nprint(f\"patient split: shared patients={shared}\")\n\ny_true = [\"adeno\"] * 8 + [\"squamous\"] * 6 + [\"small\"] * 2\ny_pred = (\"adeno adeno adeno adeno adeno adeno squamous squamous \"\n          \"adeno adeno squamous squamous squamous squamous small small\").split()\nfor c in [\"adeno\", \"squamous\", \"small\"]:\n    # TODO: tp, fp, fn; precision, recall, f1\n    p = r = f1 = 0.0\n    print(f\"{c} P={p:.3f} R={r:.3f} F1={f1:.3f}\")\n\ndef wilson(k, n, z=1.96):\n    # TODO: Wilson score interval\n    return 0.0, 0.0\n\n# TODO: k = correctly predicted adeno, n = true adeno\nlo, hi = wilson(0, 1)\nprint(f\"adeno recall 95% CI=[{lo:.3f}, {hi:.3f}]\")\n",
   "expected": "slice split: leaked test slices=5 of 5\npatient split: shared patients=0\nadeno P=0.750 R=0.750 F1=0.750\nsquamous P=0.667 R=0.667 F1=0.667\nsmall P=1.000 R=1.000 F1=1.000\nadeno recall 95% CI=[0.409, 0.929]",
   "solution": "patients = [f\"P{i // 4 + 1}\" for i in range(20)]\n\ntest = [i for i in range(20) if i % 4 == 3]\ntrain = [i for i in range(20) if i % 4 != 3]\ntrain_p = {patients[i] for i in train}\nleaked = sum(patients[i] in train_p for i in test)\nprint(f\"slice split: leaked test slices={leaked} of {len(test)}\")\n\ntest_p = {\"P4\", \"P5\"}\ntrain = [i for i in range(20) if patients[i] not in test_p]\ntest = [i for i in range(20) if patients[i] in test_p]\nshared = len({patients[i] for i in train} & {patients[i] for i in test})\nprint(f\"patient split: shared patients={shared}\")\n\ny_true = [\"adeno\"] * 8 + [\"squamous\"] * 6 + [\"small\"] * 2\ny_pred = (\"adeno adeno adeno adeno adeno adeno squamous squamous \"\n          \"adeno adeno squamous squamous squamous squamous small small\").split()\nfor c in [\"adeno\", \"squamous\", \"small\"]:\n    tp = sum(t == c and p == c for t, p in zip(y_true, y_pred))\n    fp = sum(t != c and p == c for t, p in zip(y_true, y_pred))\n    fn = sum(t == c and p != c for t, p in zip(y_true, y_pred))\n    p = tp / (tp + fp) if tp + fp else 0.0\n    r = tp / (tp + fn) if tp + fn else 0.0\n    f1 = 2 * p * r / (p + r) if p + r else 0.0\n    print(f\"{c} P={p:.3f} R={r:.3f} F1={f1:.3f}\")\n\ndef wilson(k, n, z=1.96):\n    p = k / n\n    d = 1 + z * z / n\n    c = (p + z * z / (2 * n)) / d\n    h = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / d\n    return c - h, c + h\n\nk = sum(t == \"adeno\" and p == \"adeno\" for t, p in zip(y_true, y_pred))\nn = y_true.count(\"adeno\")\nlo, hi = wilson(k, n)\nprint(f\"adeno recall 95% CI=[{lo:.3f}, {hi:.3f}]\")\n",
   "hint": "TP: true and predicted are both c. FP: predicted c but true is not. FN: true c but predicted something else. Guard every division against zero."
  },
  "quiz": [
   {
    "q": "Slices from all patients are shuffled and split 80/20. Test accuracy is 97%, but on a new hospital's patients it is 70%. What is the most likely cause?",
    "options": [
     "The new hospital uses a different file format",
     "Leakage: near-identical slices of the same patients were in both train and test",
     "The learning rate was too high",
     "Test sets should be 50%"
    ],
    "answer": 1,
    "why": "Adjacent slices are highly correlated; splitting by slice lets the model be tested on patients it has already seen."
   },
   {
    "q": "A classifier gets 90% accuracy on a test set where 90% of cases are class A. What can you conclude?",
    "options": [
     "It is excellent",
     "Very little: predicting A for everything gives 90%; look at per-class recall",
     "It has perfect recall on every class",
     "It is overfitting"
    ],
    "answer": 1,
    "why": "Accuracy hides failure on minority classes; per-class recall and F1 show it."
   },
   {
    "q": "For a screening tool, why is recall usually the first metric reported?",
    "options": [
     "It is easiest to compute",
     "A missed cancer (false negative) is usually far more costly than a false alarm that gets a follow-up check",
     "Precision is not defined for medical data",
     "Recall is always higher than precision"
    ],
    "answer": 1,
    "why": "Screening aims to catch nearly all true cases; false positives are filtered by later review."
   },
   {
    "q": "How should you bootstrap a confidence interval for a per-patient study with many slices per patient?",
    "options": [
     "Resample individual slices",
     "Resample patients with replacement and recompute the metric each time",
     "Use the training set",
     "Bootstrap is not valid for medical data"
    ],
    "answer": 1,
    "why": "Patients are the independent units; resampling correlated slices underestimates the variance."
   }
  ]
 }
});
