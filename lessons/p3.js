// Phase 3 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "3.0": {
  "minutes": 60,
  "learn": "\n<p>OpenGL is a cross-platform API for drawing with the GPU. It is old but excellent for learning, because the concepts (buffers, shaders, transforms, lighting) carry straight over to Vulkan, DirectX and CUDA interop.</p>\n\n<h3>The setup</h3>\n<p>OpenGL itself does not open windows. <b>GLFW</b> creates the window and OpenGL context and gives you input; <b>glad</b> loads the OpenGL function pointers; <b>GLM</b> provides vector and matrix maths that matches GLSL. The render loop is:</p>\n<pre><code>while (!glfwWindowShouldClose(win)) {\n    glClearColor(0.1f, 0.1f, 0.15f, 1.0f);\n    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);\n    // draw calls\n    glfwSwapBuffers(win);   // show the finished frame\n    glfwPollEvents();\n}</code></pre>\n\n<h3>Vertex data: VBO and VAO</h3>\n<p>A <b>VBO</b> (vertex buffer object) is GPU memory holding vertex data. A <b>VAO</b> (vertex array object) remembers how to read it: for each attribute, its location, component count, type, <b>stride</b> (bytes from one vertex to the next) and <b>offset</b> (bytes from the start of a vertex to this attribute).</p>\n<pre><code>// interleaved: position(3) normal(3) uv(2) = 8 floats = 32 bytes per vertex\nglVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);\nglVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3 * sizeof(float)));\nglVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));\nglEnableVertexAttribArray(0); // and 1, 2</code></pre>\n<p>Wrong stride or offset is the most common cause of garbage triangles.</p>\n\n<h3>Shaders</h3>\n<p>Shaders are small GLSL programs that run on the GPU. The <b>vertex shader</b> runs once per vertex and outputs a clip-space position; the <b>fragment shader</b> runs once per pixel-sized fragment and outputs a colour. Values passed from vertex to fragment shader are interpolated across the triangle.</p>\n<pre><code>#version 330 core\nlayout(location = 0) in vec3 aPos;\nuniform mat4 uMVP;\nvoid main() { gl_Position = uMVP * vec4(aPos, 1.0); }</code></pre>\n\n<h3>Transforms: model, view, projection</h3>\n<p>A vertex goes through a chain of 4×4 matrices: <b>model</b> (object space to world), <b>view</b> (world to camera, built with <code>glm::lookAt</code>), and <b>projection</b> (camera to clip space, <code>glm::perspective</code>). Because matrices apply right to left, the order is <code>clip = P * V * M * v</code>.</p>\n<p>The OpenGL perspective matrix for vertical field of view <i>fov</i>, aspect ratio <i>a</i>, near <i>n</i> and far <i>f</i>, with <code>t = 1 / tan(fov/2)</code>:</p>\n<pre><code>[ t/a  0   0             0           ]\n[ 0    t   0             0           ]\n[ 0    0   (f+n)/(n-f)   2fn/(n-f)   ]\n[ 0    0  -1             0           ]</code></pre>\n<p>After the vertex shader, the GPU divides by <code>w</code> (the <b>perspective divide</b>) to get normalised device coordinates (NDC) in [-1, 1], then maps them to the viewport: <code>x_screen = (x_ndc + 1) / 2 * width</code>. Since <code>w = -z_eye</code>, distant points shrink.</p>\n<p>A fly-through camera stores a position plus yaw and pitch angles, computes a front vector from them each frame, and calls <code>lookAt(pos, pos + front, up)</code>. Multiply movement speed by frame time so it is independent of FPS.</p>\n\n<h3>Textures</h3>\n<p>Each vertex carries UV coordinates in [0, 1]. The fragment shader samples the texture at the interpolated UV with <code>texture(uTex, vUV)</code>. Set filtering (<code>GL_LINEAR</code>, mipmaps) and wrapping (<code>GL_REPEAT</code>) on the texture object.</p>\n\n<h3>Phong lighting</h3>\n<p>Phong lighting sums three terms per fragment, with all vectors normalised: <b>N</b> the surface normal, <b>L</b> the direction to the light, <b>V</b> the direction to the viewer, <b>R</b> = <code>reflect(-L, N)</code> = <code>2(N·L)N - L</code>.</p>\n<pre><code>ambient  = ka\ndiffuse  = kd * max(dot(N, L), 0)\nspecular = ks * pow(max(dot(R, V), 0), shininess)\ncolour   = (ambient + diffuse + specular) * lightColour * objectColour</code></pre>\n<p>Higher shininess gives a smaller, sharper highlight. Normals must be transformed by the inverse transpose of the model matrix if you scale non-uniformly.</p>\n\n<h3>Loading models</h3>\n<p>An <code>.obj</code> file is text: <code>v</code> lines are positions, <code>vn</code> normals, <code>vt</code> UVs, and <code>f</code> lines list indices (1-based) as <code>v/vt/vn</code>. Libraries like tinyobjloader or Assimp parse them into your interleaved vertex buffer.</p>\n<blockquote>Common mistake: multiplying matrices in the wrong order (<code>M * V * P</code>). In GLM and GLSL the matrix closest to the vector is applied first, so write <code>P * V * M * v</code>.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>Do on the CPU what the GPU does for one vertex.</p><ol><li>Print the stride and the offsets (in bytes) of position, normal and UV for an interleaved layout of 3 + 3 + 2 floats.</li><li>Fill in <code>perspective()</code> (OpenGL convention, row-major <code>m[row][col]</code>). Transform the model-space point (1, 1, 0) by M = translate(0, 0, -3), V = identity and P = perspective(90°, 800/600, near 1, far 10). Print clip-space w, NDC x y z, and the screen position in an 800×600 viewport.</li><li>Phong at the origin with normal (0,1,0), light at (0,2,2), viewer at (0,3,-1), ka = 0.1, kd = 1, ks = 0.5, shininess 32. Print the diffuse factor, specular factor (before ks) and total intensity.</li></ol><p>Expected output:</p><pre><code>stride=32 offsets=0,12,24\nclip w=3.0000\nndc=(0.2500, 0.3333, 0.4815)\nscreen=(500.00, 400.00)\ndiffuse=0.7071 spec=0.0281 total=0.8212</code></pre>",
   "starter": "#include <cmath>\n#include <cstdio>\n\nstruct V3 { double x, y, z; };\nV3 sub(V3 a, V3 b) { return {a.x - b.x, a.y - b.y, a.z - b.z}; }\ndouble dot(V3 a, V3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }\nV3 scale(V3 a, double s) { return {a.x * s, a.y * s, a.z * s}; }\nV3 norm(V3 a) { return scale(a, 1.0 / std::sqrt(dot(a, a))); }\n\nstruct M4 { double m[4][4] = {}; };\nM4 identity() { M4 r; for (int i = 0; i < 4; ++i) r.m[i][i] = 1; return r; }\nM4 mul(const M4& a, const M4& b) {\n    M4 r;\n    for (int i = 0; i < 4; ++i) for (int j = 0; j < 4; ++j)\n        for (int k = 0; k < 4; ++k) r.m[i][j] += a.m[i][k] * b.m[k][j];\n    return r;\n}\nM4 translate(double x, double y, double z) {\n    M4 r = identity(); r.m[0][3] = x; r.m[1][3] = y; r.m[2][3] = z; return r;\n}\nM4 perspective(double fovy, double aspect, double n, double f) {\n    M4 r;\n    // TODO: t = 1 / tan(fovy / 2); fill the 5 non-zero entries\n    return r;\n}\n\nint main() {\n    // 1. layout\n    int stride = 0, offPos = 0, offNrm = 0, offUV = 0;   // TODO\n    std::printf(\"stride=%d offsets=%d,%d,%d\\n\", stride, offPos, offNrm, offUV);\n\n    // 2. MVP\n    const double PI = 3.14159265358979323846;\n    M4 P = perspective(PI / 2, 800.0 / 600.0, 1.0, 10.0);\n    M4 mvp = mul(P, mul(identity(), translate(0, 0, -3)));\n    double v[4] = {1, 1, 0, 1}, c[4] = {0, 0, 0, 0};\n    // TODO: c = mvp * v, then NDC = c / c[3], then screen\n    double nx = 0, ny = 0, nz = 0, sx = 0, sy = 0;\n    std::printf(\"clip w=%.4f\\n\", c[3]);\n    std::printf(\"ndc=(%.4f, %.4f, %.4f)\\n\", nx, ny, nz);\n    std::printf(\"screen=(%.2f, %.2f)\\n\", sx, sy);\n\n    // 3. Phong\n    V3 p{0, 0, 0}, N{0, 1, 0}, light{0, 2, 2}, eye{0, 3, -1};\n    V3 L = norm(sub(light, p)), V = norm(sub(eye, p));\n    // TODO: R = 2 (N.L) N - L ; diffuse ; spec ; total = ka + kd*diffuse + ks*spec\n    double diffuse = 0, spec = 0, total = 0;\n    std::printf(\"diffuse=%.4f spec=%.4f total=%.4f\\n\", diffuse, spec, total);\n}\n",
   "expected": "stride=32 offsets=0,12,24\nclip w=3.0000\nndc=(0.2500, 0.3333, 0.4815)\nscreen=(500.00, 400.00)\ndiffuse=0.7071 spec=0.0281 total=0.8212",
   "solution": "#include <cmath>\n#include <cstdio>\n\nstruct V3 { double x, y, z; };\nV3 sub(V3 a, V3 b) { return {a.x - b.x, a.y - b.y, a.z - b.z}; }\ndouble dot(V3 a, V3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }\nV3 scale(V3 a, double s) { return {a.x * s, a.y * s, a.z * s}; }\nV3 norm(V3 a) { return scale(a, 1.0 / std::sqrt(dot(a, a))); }\n\nstruct M4 { double m[4][4] = {}; };\nM4 identity() { M4 r; for (int i = 0; i < 4; ++i) r.m[i][i] = 1; return r; }\nM4 mul(const M4& a, const M4& b) {\n    M4 r;\n    for (int i = 0; i < 4; ++i) for (int j = 0; j < 4; ++j)\n        for (int k = 0; k < 4; ++k) r.m[i][j] += a.m[i][k] * b.m[k][j];\n    return r;\n}\nM4 translate(double x, double y, double z) {\n    M4 r = identity(); r.m[0][3] = x; r.m[1][3] = y; r.m[2][3] = z; return r;\n}\nM4 perspective(double fovy, double aspect, double n, double f) {\n    M4 r;\n    double t = 1.0 / std::tan(fovy / 2);\n    r.m[0][0] = t / aspect;\n    r.m[1][1] = t;\n    r.m[2][2] = (f + n) / (n - f);\n    r.m[2][3] = 2 * f * n / (n - f);\n    r.m[3][2] = -1;\n    return r;\n}\n\nint main() {\n    int fs = sizeof(float);\n    int stride = 8 * fs, offPos = 0, offNrm = 3 * fs, offUV = 6 * fs;\n    std::printf(\"stride=%d offsets=%d,%d,%d\\n\", stride, offPos, offNrm, offUV);\n\n    const double PI = 3.14159265358979323846;\n    M4 P = perspective(PI / 2, 800.0 / 600.0, 1.0, 10.0);\n    M4 mvp = mul(P, mul(identity(), translate(0, 0, -3)));\n    double v[4] = {1, 1, 0, 1}, c[4] = {0, 0, 0, 0};\n    for (int i = 0; i < 4; ++i) for (int k = 0; k < 4; ++k) c[i] += mvp.m[i][k] * v[k];\n    double nx = c[0] / c[3], ny = c[1] / c[3], nz = c[2] / c[3];\n    double sx = (nx + 1) / 2 * 800, sy = (ny + 1) / 2 * 600;\n    std::printf(\"clip w=%.4f\\n\", c[3]);\n    std::printf(\"ndc=(%.4f, %.4f, %.4f)\\n\", nx, ny, nz);\n    std::printf(\"screen=(%.2f, %.2f)\\n\", sx, sy);\n\n    V3 p{0, 0, 0}, N{0, 1, 0}, light{0, 2, 2}, eye{0, 3, -1};\n    V3 L = norm(sub(light, p)), V = norm(sub(eye, p));\n    V3 R = sub(scale(N, 2 * dot(N, L)), L);\n    double diffuse = std::fmax(dot(N, L), 0.0);\n    double spec = std::pow(std::fmax(dot(R, V), 0.0), 32);\n    double total = 0.1 + 1.0 * diffuse + 0.5 * spec;\n    std::printf(\"diffuse=%.4f spec=%.4f total=%.4f\\n\", diffuse, spec, total);\n}\n",
   "hint": "Stride is 8 * 4 bytes. P[0][0] = t/aspect, P[1][1] = t, P[2][2] = (f+n)/(n-f), P[2][3] = 2fn/(n-f), P[3][2] = -1. Divide x, y, z by w."
  },
  "quiz": [
   {
    "q": "An interleaved vertex has position (3 floats) and colour (3 floats). What stride and colour offset do you pass to glVertexAttribPointer?",
    "options": [
     "stride 3, offset 3",
     "stride 24 bytes, offset 12 bytes",
     "stride 12 bytes, offset 0",
     "stride 6, offset 12"
    ],
    "answer": 1,
    "why": "Stride and offset are in bytes: 6 floats × 4 = 24; colour starts after 3 floats = 12."
   },
   {
    "q": "Which order transforms a model-space vertex correctly in GLSL?",
    "options": [
     "M * V * P * v",
     "v * M * V * P",
     "V * P * M * v",
     "P * V * M * v"
    ],
    "answer": 3,
    "why": "The matrix nearest the vector applies first: model, then view, then projection."
   },
   {
    "q": "Why do distant objects appear smaller with a perspective projection?",
    "options": [
     "The fragment shader scales them",
     "The projection puts -z_eye into w, and the perspective divide by w shrinks far points",
     "The view matrix moves them closer to the origin",
     "Textures are mipmapped"
    ],
    "answer": 1,
    "why": "Clip coordinates are divided by w; w grows with distance."
   },
   {
    "q": "In Phong lighting, what happens to the highlight when you increase shininess from 8 to 128?",
    "options": [
     "It gets smaller and sharper",
     "It gets larger and softer",
     "It changes colour",
     "The diffuse term doubles"
    ],
    "answer": 0,
    "why": "pow(cos, n) falls off faster with larger n, so only directions very close to R stay bright."
   }
  ]
 },
 "3.1": {
  "minutes": 55,
  "learn": "\n<p>This lesson is about where GPU time and memory go. The techniques here (offscreen rendering, instancing, compute) are the bridge between graphics and the CUDA work coming later.</p>\n\n<h3>Framebuffers and post-processing</h3>\n<p>By default you draw into the window's framebuffer. A <b>framebuffer object</b> (FBO) lets you draw into a texture instead. Post-processing is then two passes:</p>\n<ol>\n<li>Bind the FBO and render the scene into a colour texture (plus a depth renderbuffer).</li>\n<li>Bind the default framebuffer and draw a full-screen quad whose fragment shader samples that texture and changes it: blur, tone mapping, colour grading.</li>\n</ol>\n<pre><code>glGenFramebuffers(1, &amp;fbo);\nglBindFramebuffer(GL_FRAMEBUFFER, fbo);\nglFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, colorTex, 0);\n// check glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE</code></pre>\n<p>A <b>box blur</b> replaces each pixel with the average of its k×k neighbourhood. At the image border you must decide what \"outside\" means; <b>clamp to edge</b> reuses the nearest edge pixel. A 3×3 blur reads 9 texels per pixel; a <b>separable</b> blur does a horizontal pass then a vertical pass (3 + 3 reads) for the same result, which matters for large kernels.</p>\n\n<h3>Instancing</h3>\n<p>Each draw call costs CPU time in the driver. Drawing 100,000 cubes with 100,000 <code>glDrawElements</code> calls is limited by the CPU, not the GPU. <b>Instancing</b> draws one mesh many times in a single call:</p>\n<pre><code>glDrawElementsInstanced(GL_TRIANGLES, 36, GL_UNSIGNED_INT, 0, 100000);</code></pre>\n<p>Per-instance data (a model matrix, a colour) lives in its own buffer. Mark the attribute with <code>glVertexAttribDivisor(loc, 1)</code> so it advances once per instance rather than once per vertex. A <code>mat4</code> attribute takes 4 consecutive locations. The vertex shader can also use <code>gl_InstanceID</code>. Budget the memory: one <code>mat4</code> of floats is 64 bytes, so 100,000 instances need 6.4 MB.</p>\n\n<h3>Compute shaders</h3>\n<p>A compute shader is a GPU program outside the triangle pipeline, much like a CUDA kernel. You declare a <b>workgroup</b> size and dispatch a grid of workgroups:</p>\n<pre><code>#version 430\nlayout(local_size_x = 64) in;\nlayout(std430, binding = 0) buffer Pos { vec4 pos[]; };\nlayout(std430, binding = 1) buffer Vel { vec4 vel[]; };\nuniform uint count; uniform float dt;\nvoid main() {\n    uint i = gl_GlobalInvocationID.x;     // = gl_WorkGroupID.x * 64 + gl_LocalInvocationID.x\n    if (i &gt;= count) return;               // guard: last group may be partial\n    pos[i] += vel[i] * dt;\n}</code></pre>\n<p>On the CPU: <code>glDispatchCompute((count + 63) / 64, 1, 1)</code>, rounding up so every element gets a thread. Then <code>glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT)</code> (or the vertex-attribute barrier if you draw from the buffer) before the results are used. This is the same \"global id = block id × block size + thread id, plus a bounds check\" pattern you will write in CUDA. Note that std430 pads a <code>vec3</code> array element to 16 bytes, so <code>vec4</code> avoids surprises.</p>\n\n<h3>What costs time on the GPU</h3>\n<ul>\n<li><b>Draw calls and state changes</b>: CPU-side driver overhead. Fix with instancing, batching, fewer shader/texture switches.</li>\n<li><b>Vertex work</b>: proportional to vertex count. Fix with level of detail.</li>\n<li><b>Fragment work and overdraw</b>: shading the same pixel many times. Fix with front-to-back drawing and the depth test, cheaper shaders.</li>\n<li><b>Memory bandwidth</b>: large textures, full-screen passes, high-resolution render targets. Every post-process pass reads and writes the whole screen.</li>\n</ul>\n<p>Do not guess: capture a frame in <b>RenderDoc</b> to inspect every draw call, its inputs and outputs, and use GPU timer queries (<code>GL_TIME_ELAPSED</code>) to time passes. Measure frame time in milliseconds, not FPS: 60 FPS is 16.7 ms, and milliseconds add up linearly across passes while FPS does not.</p>\n<blockquote>Common mistake: forgetting the bounds check in a compute shader. With 1000 particles and 64-thread groups you launch 1024 invocations; the last 24 write past the end of the buffer.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>Simulate GPU work on the CPU.</p><ol><li>Apply a 3×3 box blur with clamp-to-edge and integer averaging (<code>sum / 9</code>) to the 5×5 image given (two black columns, three columns of value 90). Print the blurred rows.</li><li>Simulate a compute dispatch for 1000 particles with workgroup size 64: compute the number of groups (rounded up), loop over every group and local id, compute the global id, apply the bounds check, and update <code>pos[i] += vel[i] * dt</code>. Print groups, total invocations, idle invocations and the sum of positions.</li><li>Print the bytes needed for 100,000 instance <code>mat4</code> float matrices.</li></ol><p>Expected output:</p><pre><code>0 30 60 90 90\n0 30 60 90 90\n0 30 60 90 90\n0 30 60 90 90\n0 30 60 90 90\ngroups=16 invocations=1024 idle=24\nsum=500000.0\ninstance bytes=6400000</code></pre>",
   "starter": "#include <algorithm>\n#include <cstdio>\n#include <vector>\n\nint main() {\n    const int W = 5, H = 5;\n    int img[H][W], out[H][W];\n    for (int y = 0; y < H; ++y)\n        for (int x = 0; x < W; ++x) img[y][x] = x < 2 ? 0 : 90;\n\n    // 1. TODO: 3x3 box blur with clamp-to-edge (std::clamp) into out\n    for (int y = 0; y < H; ++y) {\n        for (int x = 0; x < W; ++x) std::printf(x ? \" %d\" : \"%d\", out[y][x]);\n        std::printf(\"\\n\");\n    }\n\n    // 2. compute dispatch\n    const unsigned count = 1000, local = 64;\n    std::vector<float> pos(count), vel(count, 1.0f);\n    for (unsigned i = 0; i < count; ++i) pos[i] = float(i);\n    const float dt = 0.5f;\n    unsigned groups = 0, idle = 0;   // TODO: groups = round up\n    // TODO: for g in groups, for l in local: i = g * local + l; guard; update\n    double sum = 0;\n    for (float p : pos) sum += p;\n    std::printf(\"groups=%u invocations=%u idle=%u\\n\", groups, groups * local, idle);\n    std::printf(\"sum=%.1f\\n\", sum);\n\n    // 3. instance buffer\n    long bytes = 0;   // TODO\n    std::printf(\"instance bytes=%ld\\n\", bytes);\n}\n",
   "expected": "0 30 60 90 90\n0 30 60 90 90\n0 30 60 90 90\n0 30 60 90 90\n0 30 60 90 90\ngroups=16 invocations=1024 idle=24\nsum=500000.0\ninstance bytes=6400000",
   "solution": "#include <algorithm>\n#include <cstdio>\n#include <vector>\n\nint main() {\n    const int W = 5, H = 5;\n    int img[H][W], out[H][W];\n    for (int y = 0; y < H; ++y)\n        for (int x = 0; x < W; ++x) img[y][x] = x < 2 ? 0 : 90;\n\n    for (int y = 0; y < H; ++y)\n        for (int x = 0; x < W; ++x) {\n            int s = 0;\n            for (int dy = -1; dy <= 1; ++dy)\n                for (int dx = -1; dx <= 1; ++dx)\n                    s += img[std::clamp(y + dy, 0, H - 1)][std::clamp(x + dx, 0, W - 1)];\n            out[y][x] = s / 9;\n        }\n    for (int y = 0; y < H; ++y) {\n        for (int x = 0; x < W; ++x) std::printf(x ? \" %d\" : \"%d\", out[y][x]);\n        std::printf(\"\\n\");\n    }\n\n    const unsigned count = 1000, local = 64;\n    std::vector<float> pos(count), vel(count, 1.0f);\n    for (unsigned i = 0; i < count; ++i) pos[i] = float(i);\n    const float dt = 0.5f;\n    unsigned groups = (count + local - 1) / local, idle = 0;\n    for (unsigned g = 0; g < groups; ++g)\n        for (unsigned l = 0; l < local; ++l) {\n            unsigned i = g * local + l;\n            if (i >= count) { ++idle; continue; }\n            pos[i] += vel[i] * dt;\n        }\n    double sum = 0;\n    for (float p : pos) sum += p;\n    std::printf(\"groups=%u invocations=%u idle=%u\\n\", groups, groups * local, idle);\n    std::printf(\"sum=%.1f\\n\", sum);\n\n    long bytes = 100000L * 16 * sizeof(float);\n    std::printf(\"instance bytes=%ld\\n\", bytes);\n}\n",
   "hint": "Round up with (count + local - 1) / local. For the blur, clamp each neighbour coordinate to [0, size-1] before reading."
  },
  "quiz": [
   {
    "q": "Drawing 100,000 cubes with one draw call each runs at 5 FPS while the GPU is mostly idle. What is the bottleneck and fix?",
    "options": [
     "Fragment shading; lower the resolution",
     "CPU draw-call overhead; use instancing",
     "Texture bandwidth; compress textures",
     "Vertex count; use fewer triangles per cube"
    ],
    "answer": 1,
    "why": "Per-call driver cost on the CPU dominates. One instanced call removes it."
   },
   {
    "q": "Why does a compute shader need `if (i >= count) return;`?",
    "options": [
     "To make it faster",
     "GLSL requires every shader to return early",
     "The dispatch is rounded up to whole workgroups, so some invocations have no element",
     "To synchronise workgroups"
    ],
    "answer": 2,
    "why": "1000 elements in groups of 64 needs 16 groups = 1024 invocations; 24 must do nothing."
   },
   {
    "q": "What does glVertexAttribDivisor(loc, 1) do?",
    "options": [
     "Makes the attribute advance once per instance instead of once per vertex",
     "Halves the attribute values",
     "Divides the vertex count by one",
     "Enables the attribute"
    ],
    "answer": 0,
    "why": "Divisor 1 means one value per instance, which is how per-instance matrices work."
   },
   {
    "q": "Your frame has a 4 ms scene pass and two full-screen post passes of 3 ms each. What is the frame time and FPS ceiling?",
    "options": [
     "10 ms, 100 FPS",
     "7 ms, about 143 FPS",
     "4 ms, 250 FPS",
     "3 ms, about 333 FPS"
    ],
    "answer": 0,
    "why": "Pass times add: 4 + 3 + 3 = 10 ms, and 1000 / 10 = 100 FPS. This is why you reason in milliseconds."
   }
  ]
 },
 "3.2": {
  "minutes": 50,
  "learn": "\n<p>Vulkan is a low-level graphics and compute API. OpenGL's driver hides a lot of work: memory allocation, synchronisation, command recording, state validation. Vulkan makes you do all of it explicitly. The triangle takes around a thousand lines, but you learn exactly what a GPU needs, and you get predictable performance and multi-threaded command recording.</p>\n\n<h3>Setup objects, in order</h3>\n<ol>\n<li><b>Instance</b> (<code>VkInstance</code>): connects your app to the Vulkan library. Enable the validation layer <code>VK_LAYER_KHRONOS_validation</code> and the debug messenger here during development.</li>\n<li><b>Surface</b> (<code>VkSurfaceKHR</code>): the window to draw into, created through GLFW.</li>\n<li><b>Physical device</b>: the actual GPU you pick. Query its <b>queue families</b> to find one that supports graphics and one that can present to the surface.</li>\n<li><b>Logical device</b> (<code>VkDevice</code>) and its <b>queues</b> (<code>VkQueue</code>): your handle for creating resources and submitting work.</li>\n<li><b>Swapchain</b> (<code>VkSwapchainKHR</code>): a set of images that rotate between your rendering and the display. You choose image count, format and present mode (FIFO is vsync and always available).</li>\n<li><b>Image views</b>, <b>render pass</b> (or dynamic rendering in Vulkan 1.3), and <b>framebuffers</b>: describe which images you render into and how attachments are loaded and stored.</li>\n<li><b>Graphics pipeline</b>: one immutable object with shaders (compiled to SPIR-V with <code>glslc</code>), vertex input layout, rasterizer, blending and the <b>pipeline layout</b>. Changing almost any state means another pipeline.</li>\n</ol>\n\n<h3>Validation layers</h3>\n<p>Vulkan drivers do almost no error checking for speed; invalid use is undefined behaviour. The validation layer checks every call during development and prints precise messages. Always run with it on and treat every message as a bug.</p>\n\n<h3>Commands and submission</h3>\n<p>You do not call draw functions directly on the device. You record into a <b>command buffer</b> (allocated from a <b>command pool</b>): begin render pass, bind pipeline, bind vertex buffer, draw, end. Then submit it to a queue with <code>vkQueueSubmit</code>. Command buffers can be recorded on several threads at once.</p>\n\n<h3>Synchronisation</h3>\n<p>The GPU runs asynchronously, so you must say what waits for what:</p>\n<ul>\n<li><b>Semaphore</b>: GPU-to-GPU ordering, e.g. \"render only after the swapchain image is acquired\" and \"present only after rendering finishes\".</li>\n<li><b>Fence</b>: GPU-to-CPU, so the CPU can wait until a frame's commands are done before reusing its command buffer.</li>\n<li><b>Pipeline barriers</b>: ordering and layout transitions inside a command buffer.</li>\n</ul>\n<p>Use 2 <b>frames in flight</b>: the CPU records frame N+1 while the GPU draws frame N, each with its own command buffer, semaphores and fence.</p>\n\n<h3>Buffers and memory</h3>\n<p>Creating a <code>VkBuffer</code> does not allocate memory. You query its requirements, choose a memory type and bind <code>VkDeviceMemory</code> to it. Memory types have properties:</p>\n<ul>\n<li><b>DEVICE_LOCAL</b>: fast GPU memory (VRAM on discrete cards), usually not visible to the CPU.</li>\n<li><b>HOST_VISIBLE | HOST_COHERENT</b>: the CPU can map and write it, but the GPU reads it more slowly.</li>\n</ul>\n<p>So vertex data uses a <b>staging buffer</b>: create a host-visible buffer with usage <code>TRANSFER_SRC</code>, <code>memcpy</code> the vertices in, then record <code>vkCmdCopyBuffer</code> into a device-local buffer with usage <code>TRANSFER_DST | VERTEX_BUFFER</code>. In real projects use the VMA library instead of raw allocations.</p>\n\n<h3>Uniform buffers and descriptors</h3>\n<p>Shaders reach resources through <b>descriptors</b>. A <b>descriptor set layout</b> declares the bindings (binding 0 is a uniform buffer for the vertex shader); a <b>descriptor pool</b> allocates <b>descriptor sets</b>; you write the buffer into the set and bind it with <code>vkCmdBindDescriptorSets</code> before drawing. Uniform buffers holding the MVP matrices are host-visible and updated every frame, one per frame in flight. Small, frequently changing data can use <b>push constants</b> instead.</p>\n<blockquote>Common mistake: updating a uniform buffer or re-recording a command buffer the GPU is still using. Wait on that frame's fence first.</blockquote>\n",
  "practice": {
   "type": "fill",
   "prompt": "<p>Name the Vulkan object, flag or value. Short answers; the Vulkan type name or the plain-English name are both accepted.</p>",
   "items": [
    {
     "q": "Name of the standard validation layer to enable during development.",
     "accept": [
      "VK_LAYER_KHRONOS_validation"
     ],
     "hint": "VK_LAYER_KHRONOS_..."
    },
    {
     "q": "Object holding the rotating set of images presented to the window.",
     "accept": [
      "swapchain",
      "VkSwapchainKHR",
      "swap chain"
     ],
     "hint": "images are swapped"
    },
    {
     "q": "Object you record draw commands into before submitting them to a queue.",
     "accept": [
      "command buffer",
      "VkCommandBuffer",
      "commandbuffer"
     ],
     "hint": "it buffers commands"
    },
    {
     "q": "Sync primitive the CPU waits on to know the GPU finished a submission.",
     "accept": [
      "fence",
      "VkFence"
     ],
     "hint": "GPU to CPU"
    },
    {
     "q": "Sync primitive that orders work between GPU operations, e.g. acquire before render.",
     "accept": [
      "semaphore",
      "VkSemaphore"
     ],
     "hint": "GPU to GPU"
    },
    {
     "q": "Memory property that lets the CPU map and write memory (the staging buffer needs it).",
     "accept": [
      "HOST_VISIBLE",
      "host visible",
      "VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT",
      "host_visible"
     ],
     "hint": "visible to the host"
    },
    {
     "q": "Buffer usage flag the staging buffer needs, since it is the source of a copy.",
     "accept": [
      "TRANSFER_SRC",
      "transfer src",
      "VK_BUFFER_USAGE_TRANSFER_SRC_BIT",
      "transfer_src"
     ],
     "hint": "transfer source"
    },
    {
     "q": "Compiled shader format Vulkan consumes (produced by glslc).",
     "accept": [
      "SPIR-V",
      "spirv",
      "spir-v",
      "SPIRV"
     ],
     "hint": "not GLSL text"
    }
   ]
  },
  "quiz": [
   {
    "q": "Why does vertex data usually go through a staging buffer?",
    "options": [
     "Vulkan forbids writing vertices from the CPU",
     "The fastest memory for the GPU (device-local) is usually not CPU-visible, so you write to host-visible memory and copy",
     "Staging buffers compress the data",
     "It is required by the validation layer"
    ],
    "answer": 1,
    "why": "Copying once into DEVICE_LOCAL memory makes every later draw read fast memory."
   },
   {
    "q": "Your app works but the validation layer prints errors. What should you do?",
    "options": [
     "Ignore them; the driver handles it",
     "Disable validation in release builds and move on",
     "Fix them: invalid usage is undefined behaviour and may break on another GPU or driver",
     "Switch to OpenGL"
    ],
    "answer": 2,
    "why": "Drivers skip checks for speed; code that happens to work on one GPU can crash on another."
   },
   {
    "q": "What is the difference between a fence and a semaphore?",
    "options": [
     "A fence lets the CPU wait for the GPU; a semaphore orders GPU work against other GPU work",
     "They are identical",
     "A semaphore lets the CPU wait; a fence orders queue operations",
     "Fences are only for compute"
    ],
    "answer": 0,
    "why": "Fences signal the host; semaphores synchronise queue operations like acquire, render and present."
   },
   {
    "q": "Why does changing blending mode in Vulkan often require a new pipeline object?",
    "options": [
     "Pipelines are immutable and bake most fixed-function state",
     "Blending is not supported",
     "It resets the swapchain",
     "Each shader needs its own pipeline layout"
    ],
    "answer": 0,
    "why": "Baking state up front lets the driver compile everything once and avoid hidden work at draw time. Some state can be marked dynamic."
   }
  ]
 }
});
