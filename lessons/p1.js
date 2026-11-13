// Phase 1 lesson content. Generated; verified practice solutions.
Object.assign(LESSONS,{
 "1.0": {
  "minutes": 50,
  "learn": "\n<p>C++ is the language of graphics engines, CUDA host code and inference runtimes. Modern C++ (C++17/20) is much safer than the C-with-classes style many tutorials still teach: you rarely write <code>new</code> or <code>delete</code> yourself.</p>\n\n<h3>Compile with warnings on</h3>\n<pre><code>g++ -Wall -Wextra -std=c++20 -O2 main.cpp -o main\n./main</code></pre>\n<p><code>-Wall -Wextra</code> catches unused variables, sign-compare bugs and missing returns. Treat every warning as a bug until you know why it is harmless.</p>\n\n<h3>Functions and overloading</h3>\n<p>Two functions may share a name if their parameter types differ. The compiler picks the best match at compile time.</p>\n<pre><code>double area(double r)            { return 3.14159 * r * r; }\ndouble area(double w, double h)  { return w * h; }\narea(2.0);       // circle\narea(2.0, 3.0);  // rectangle</code></pre>\n<p>Pass big objects by <code>const&amp;</code> to avoid copies: <code>void print(const std::string&amp; s)</code>. Pass small values (int, double) by value.</p>\n\n<h3>Structs with methods</h3>\n<pre><code>struct Vec2 {\n    float x = 0, y = 0;\n    float length() const { return std::sqrt(x * x + y * y); }  // const: does not modify\n};</code></pre>\n\n<h3>The standard containers you will use daily</h3>\n<ul>\n<li><code>std::vector&lt;T&gt;</code>: growable array, contiguous memory. Default choice.</li>\n<li><code>std::string</code>: owns its characters; no manual buffers.</li>\n<li><code>std::unordered_map&lt;K, V&gt;</code>: hash table, average O(1) lookup, <b>no order</b>.</li>\n<li><code>std::map&lt;K, V&gt;</code>: sorted tree, O(log n), iterates in key order.</li>\n</ul>\n<pre><code>std::unordered_map&lt;std::string, int&gt; counts;\ncounts[\"gpu\"]++;                 // missing key is created with value 0\nfor (const auto&amp; [word, n] : counts) { /* structured binding */ }</code></pre>\n\n<h3>Object lifetime: constructor, destructor, copy, move</h3>\n<p>A constructor runs when an object is created; the destructor runs automatically when it goes out of scope. This is <b>RAII</b>: tie a resource (memory, file, GPU buffer) to an object's lifetime so it is always released.</p>\n<pre><code>class Buffer {\npublic:\n    explicit Buffer(size_t n) : data_(new float[n]), n_(n) {}\n    ~Buffer() { delete[] data_; }\n    Buffer(const Buffer&amp; o) : data_(new float[o.n_]), n_(o.n_) {      // copy: deep copy\n        std::copy(o.data_, o.data_ + n_, data_);\n    }\n    Buffer(Buffer&amp;&amp; o) noexcept : data_(o.data_), n_(o.n_) {         // move: steal\n        o.data_ = nullptr; o.n_ = 0;\n    }\nprivate:\n    float* data_; size_t n_;\n};</code></pre>\n<p>A <b>copy</b> duplicates the data. A <b>move</b> transfers ownership and leaves the source empty; it is just a pointer swap, so it is cheap. <code>std::move(x)</code> does not move anything by itself; it casts <code>x</code> so the move constructor is chosen.</p>\n\n<h3>Smart pointers replace new/delete</h3>\n<pre><code>#include &lt;memory&gt;\nclass Buffer {\n    std::unique_ptr&lt;float[]&gt; data_;\n    size_t n_;\npublic:\n    explicit Buffer(size_t n) : data_(std::make_unique&lt;float[]&gt;(n)), n_(n) {}\n    // no destructor needed; move works automatically; copy is disabled\n};</code></pre>\n<p><code>std::unique_ptr</code> has exactly one owner and frees memory in its destructor. It cannot be copied, only moved. Use <code>std::shared_ptr</code> only when ownership is genuinely shared. This is the <b>rule of zero</b>: if members manage themselves, you write none of the five special functions.</p>\n<blockquote>Common mistake: writing a destructor that frees memory but forgetting the copy constructor. The compiler-generated copy duplicates the raw pointer, both objects delete it, and you get a double free. Use <code>unique_ptr</code> and this bug cannot happen.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>Write a word counter. Read words from stdin with <code>std::cin &gt;&gt; w</code>, lowercase them and remove every non-letter character (skip words that become empty). Count them in a <code>std::unordered_map</code>. Then copy the pairs into a <code>std::vector</code>, sort by count (highest first), ties alphabetically, and print each as <code>word count</code>. Finally print the number of unique words.</p><p>For the given stdin the expected output is:</p><pre><code>the 4\ncat 2\nand 1\nend 1\nhat 1\nunique: 5</code></pre>",
   "starter": "#include <algorithm>\n#include <cctype>\n#include <iostream>\n#include <string>\n#include <unordered_map>\n#include <vector>\n\n// Lowercase s and drop non-letters.\nstd::string clean(const std::string& s) {\n    std::string out;\n    // TODO: loop over chars, keep std::isalpha ones as std::tolower\n    return out;\n}\n\nint main() {\n    std::unordered_map<std::string, int> counts;\n    std::string w;\n    while (std::cin >> w) {\n        // TODO: clean w, skip empty, count it\n    }\n    std::vector<std::pair<std::string, int>> v(counts.begin(), counts.end());\n    // TODO: sort v by count desc, then word asc\n    for (const auto& [word, n] : v) std::cout << word << ' ' << n << '\\n';\n    std::cout << \"unique: \" << v.size() << '\\n';\n}\n",
   "stdin": "The cat and the hat.\nThe end, the cat!\n",
   "expected": "the 4\ncat 2\nand 1\nend 1\nhat 1\nunique: 5",
   "solution": "#include <algorithm>\n#include <cctype>\n#include <iostream>\n#include <string>\n#include <unordered_map>\n#include <vector>\n\nstd::string clean(const std::string& s) {\n    std::string out;\n    for (unsigned char c : s)\n        if (std::isalpha(c)) out += static_cast<char>(std::tolower(c));\n    return out;\n}\n\nint main() {\n    std::unordered_map<std::string, int> counts;\n    std::string w;\n    while (std::cin >> w) {\n        std::string c = clean(w);\n        if (!c.empty()) counts[c]++;\n    }\n    std::vector<std::pair<std::string, int>> v(counts.begin(), counts.end());\n    std::sort(v.begin(), v.end(), [](const auto& a, const auto& b) {\n        if (a.second != b.second) return a.second > b.second;\n        return a.first < b.first;\n    });\n    for (const auto& [word, n] : v) std::cout << word << ' ' << n << '\\n';\n    std::cout << \"unique: \" << v.size() << '\\n';\n}\n",
   "hint": "Sort with a lambda: if counts differ return a.second > b.second, else return a.first < b.first. Cast chars to unsigned char before isalpha."
  },
  "quiz": [
   {
    "q": "Why does iterating a std::unordered_map print words in a seemingly random order?",
    "options": [
     "It is a hash table with no defined order",
     "It sorts by insertion time",
     "It sorts by hash value alphabetically",
     "It is a bug in the standard library"
    ],
    "answer": 0,
    "why": "unordered_map buckets keys by hash; use std::map or sort a vector when you need order."
   },
   {
    "q": "A class owns a raw pointer and frees it in its destructor, but has no copy constructor. What happens when you copy it?",
    "options": [
     "The compiler refuses to copy",
     "The data is deep-copied automatically",
     "Both copies hold the same pointer and both delete it: a double free",
     "Nothing; the destructor only runs once"
    ],
    "answer": 2,
    "why": "The generated copy constructor copies the pointer value, not the data it points at."
   },
   {
    "q": "What does std::move(buf) actually do?",
    "options": [
     "Copies buf to a new address",
     "Casts buf to an rvalue so a move constructor or move assignment can be chosen",
     "Frees buf immediately",
     "Moves buf to the heap"
    ],
    "answer": 1,
    "why": "std::move is just a cast; the move constructor does the actual transfer."
   },
   {
    "q": "Why is std::unique_ptr preferred over new/delete?",
    "options": [
     "It is faster than a raw pointer",
     "It can be shared by many owners",
     "It frees memory automatically when its owner is destroyed, even on early return or exception",
     "It allocates on the stack"
    ],
    "answer": 2,
    "why": "RAII: the destructor always runs, so leaks and double frees disappear. It has no runtime overhead over a raw pointer."
   }
  ]
 },
 "1.1": {
  "minutes": 50,
  "learn": "\n<p>On modern CPUs, arithmetic is cheap and memory is slow. A main-memory access costs on the order of a hundred nanoseconds, while an L1 cache hit costs a few cycles. Fast code is mostly code that uses the cache well. The same ideas reappear in CUDA (coalescing, shared memory) and in inference (KV cache layout).</p>\n\n<h3>Cache lines</h3>\n<p>Memory moves between RAM and cache in blocks called <b>cache lines</b>, typically 64 bytes on x86 and most ARM chips. Reading one <code>float</code> pulls in its 15 neighbours for free. If your next access is one of those neighbours, it is a cache hit.</p>\n\n<h3>Row-major vs column-major</h3>\n<p>A C/C++ 2-D array <code>a[rows][cols]</code> is stored <b>row by row</b>: element <code>(r, c)</code> lives at index <code>r * cols + c</code>.</p>\n<pre><code>// fast: consecutive c are neighbours in memory (stride 4 bytes)\nfor (int r = 0; r &lt; N; ++r) for (int c = 0; c &lt; N; ++c) sum += a[r * N + c];\n// slow: each step jumps N * 4 bytes, a new cache line every access\nfor (int c = 0; c &lt; N; ++c) for (int r = 0; r &lt; N; ++r) sum += a[r * N + c];</code></pre>\n<p>For large N the second loop is often several times slower, though it does exactly the same arithmetic. The hardware prefetcher also loves sequential access.</p>\n\n<h3>Array of structs vs struct of arrays</h3>\n<pre><code>struct Particle { float x, y, z, vx, vy, vz, mass, age; };   // AoS\nstd::vector&lt;Particle&gt; ps;\n\nstruct Particles { std::vector&lt;float&gt; x, y, z, vx, vy, vz; }; // SoA</code></pre>\n<p>If an update only touches <code>x</code> and <code>vx</code>, AoS still drags all 32 bytes of each particle through the cache. SoA streams only the arrays you use and is easy for the compiler to vectorise with SIMD. GPUs prefer SoA for the same reason.</p>\n\n<h3>Padding and alignment</h3>\n<p>Each type has an alignment (a <code>double</code> must start at a multiple of 8). The compiler inserts padding to satisfy it, so field order changes <code>sizeof</code>:</p>\n<pre><code>struct A { char a; double b; char c; };  // 1 + 7 pad + 8 + 1 + 7 pad = 24\nstruct B { double b; char a; char c; };  // 8 + 1 + 1 + 6 pad = 16</code></pre>\n<p>Order fields from largest to smallest alignment to shrink structs.</p>\n\n<h3>Look at the assembly</h3>\n<p>Paste a loop into Compiler Explorer (godbolt.org). At <code>-O0</code> every variable is loaded and stored to the stack each iteration. At <code>-O2</code> values live in registers and simple loops may be unrolled or vectorised (look for <code>xmm</code>/<code>ymm</code> registers). Always benchmark optimised builds.</p>\n\n<h3>Finding memory bugs</h3>\n<pre><code>g++ -g -fsanitize=address,undefined main.cpp -o main &amp;&amp; ./main\nvalgrind ./main      # Linux, slower but needs no recompile</code></pre>\n<p>AddressSanitizer reports out-of-bounds reads, use-after-free and leaks with the exact source line.</p>\n\n<h3>Arena (bump) allocators</h3>\n<p><code>new</code> is a general allocator: it must handle any size, freeing in any order, and threads. An <b>arena</b> grabs one big block and hands out pieces by bumping an offset. Freeing is \"reset the offset to 0\". It is used for per-frame data in games and temporary tensors in inference engines.</p>\n<pre><code>size_t align_up(size_t off, size_t align) {      // align is a power of two\n    return (off + align - 1) &amp; ~(align - 1);\n}</code></pre>\n<blockquote>Common mistake: timing a debug (-O0) build, or letting the compiler delete the loop because its result is unused. Build with -O2 and print or otherwise use the result.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "cpp",
   "prompt": "<p>No timing here (results would vary); you will compute the things that <i>cause</i> the timing differences.</p><ol><li>Print <code>sizeof</code> of the two structs <code>A</code> and <code>B</code> from the lesson.</li><li>Model a 256×256 <code>float</code> matrix with 64-byte cache lines. For row-major and column-major traversal, count how many times the accessed cache line (<code>byte_address / 64</code>) differs from the previous access (count the first access too).</li><li>Implement a bump arena with <code>alloc(size, align)</code> returning the offset. Allocate (1,1), (8,8), (4,4), (16,16) and print the offsets, then the bytes used.</li></ol><p>Expected output:</p><pre><code>sizeof A=24 B=16\nrow-major line loads: 4096\ncol-major line loads: 65536\noffsets: 0 8 16 32\nused: 48</code></pre>",
   "starter": "#include <cstdio>\n#include <cstddef>\n\nstruct A { char a; double b; char c; };\nstruct B { double b; char a; char c; };\n\nlong count_lines(int N, bool row_major) {\n    long loads = 0, prev = -1;\n    for (int i = 0; i < N; ++i)\n        for (int j = 0; j < N; ++j) {\n            int r = row_major ? i : j, c = row_major ? j : i;\n            // TODO: byte address of a[r][c] (float = 4 bytes), line = addr / 64\n            // count when line != prev\n        }\n    return loads;\n}\n\nstruct Arena {\n    size_t off = 0;\n    size_t alloc(size_t size, size_t align) {\n        // TODO: align off up, remember start, advance by size\n        return 0;\n    }\n};\n\nint main() {\n    std::printf(\"sizeof A=%zu B=%zu\\n\", sizeof(A), sizeof(B));\n    std::printf(\"row-major line loads: %ld\\n\", count_lines(256, true));\n    std::printf(\"col-major line loads: %ld\\n\", count_lines(256, false));\n    Arena ar;\n    size_t o1 = ar.alloc(1, 1), o2 = ar.alloc(8, 8), o3 = ar.alloc(4, 4), o4 = ar.alloc(16, 16);\n    std::printf(\"offsets: %zu %zu %zu %zu\\n\", o1, o2, o3, o4);\n    std::printf(\"used: %zu\\n\", ar.off);\n}\n",
   "expected": "sizeof A=24 B=16\nrow-major line loads: 4096\ncol-major line loads: 65536\noffsets: 0 8 16 32\nused: 48",
   "solution": "#include <cstdio>\n#include <cstddef>\n\nstruct A { char a; double b; char c; };\nstruct B { double b; char a; char c; };\n\nlong count_lines(int N, bool row_major) {\n    long loads = 0, prev = -1;\n    for (int i = 0; i < N; ++i)\n        for (int j = 0; j < N; ++j) {\n            int r = row_major ? i : j, c = row_major ? j : i;\n            long addr = (long(r) * N + c) * 4;\n            long line = addr / 64;\n            if (line != prev) { ++loads; prev = line; }\n        }\n    return loads;\n}\n\nstruct Arena {\n    size_t off = 0;\n    size_t alloc(size_t size, size_t align) {\n        off = (off + align - 1) & ~(align - 1);\n        size_t start = off;\n        off += size;\n        return start;\n    }\n};\n\nint main() {\n    std::printf(\"sizeof A=%zu B=%zu\\n\", sizeof(A), sizeof(B));\n    std::printf(\"row-major line loads: %ld\\n\", count_lines(256, true));\n    std::printf(\"col-major line loads: %ld\\n\", count_lines(256, false));\n    Arena ar;\n    size_t o1 = ar.alloc(1, 1), o2 = ar.alloc(8, 8), o3 = ar.alloc(4, 4), o4 = ar.alloc(16, 16);\n    std::printf(\"offsets: %zu %zu %zu %zu\\n\", o1, o2, o3, o4);\n    std::printf(\"used: %zu\\n\", ar.off);\n}\n",
   "hint": "Address is (r * N + c) * 4. Row-major touches 16 floats per line, so 65536 / 16 = 4096 lines. Align with (off + align - 1) & ~(align - 1)."
  },
  "quiz": [
   {
    "q": "Summing a large 2-D C array column by column is much slower than row by row. Why?",
    "options": [
     "Column order does more additions",
     "The compiler cannot compile column loops",
     "Integer multiplication for the index is slow",
     "Each access jumps a whole row ahead, so almost every access misses the cache line just loaded"
    ],
    "answer": 3,
    "why": "Row-major storage makes rows contiguous; columns have a stride of cols * sizeof(T) bytes."
   },
   {
    "q": "A particle update reads only position and velocity, but each Particle struct also holds mass, colour and age. Which layout helps most?",
    "options": [
     "Array of structs",
     "Struct of arrays",
     "A linked list of particles",
     "A std::map keyed by id"
    ],
    "answer": 1,
    "why": "SoA streams only the fields you touch, wasting no cache-line bytes, and vectorises easily."
   },
   {
    "q": "What does an arena allocator give up compared to new/delete?",
    "options": [
     "Alignment",
     "Speed",
     "Freeing individual objects in any order",
     "The ability to allocate more than one object"
    ],
    "answer": 2,
    "why": "Arenas free everything at once by resetting the offset; that is why they are so fast."
   },
   {
    "q": "Which build should you benchmark?",
    "options": [
     "-O0, so the code is not changed",
     "-O2 or -O3, making sure the result is used so the loop is not deleted",
     "Any build; speed does not depend on flags",
     "Only builds with -g"
    ],
    "answer": 1,
    "why": "Unoptimised code is not representative, and unused results let the optimiser remove the work entirely."
   }
  ]
 },
 "1.2": {
  "minutes": 40,
  "learn": "\n<p>CMake does not build your code. It <b>generates</b> a build system (Makefiles, Ninja files or a Visual Studio solution) from a portable description in <code>CMakeLists.txt</code>. Every C++, OpenGL, Vulkan and CUDA project in this course uses it.</p>\n\n<h3>The minimal project</h3>\n<pre><code>cmake_minimum_required(VERSION 3.20)\nproject(hello LANGUAGES CXX)\n\nset(CMAKE_CXX_STANDARD 20)\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nadd_executable(hello main.cpp)</code></pre>\n<p>Build it out of source, so generated files never mix with your code:</p>\n<pre><code>cmake -S . -B build          # configure: read CMakeLists.txt, write build/\ncmake --build build          # compile\n./build/hello</code></pre>\n\n<h3>Targets are the core idea</h3>\n<p>Modern CMake is <b>target-based</b>. A target is something you build: an executable (<code>add_executable</code>) or a library (<code>add_library</code>). Settings are attached to targets, not set globally.</p>\n<pre><code>add_library(mathlib src/vec.cpp src/mat.cpp)\ntarget_include_directories(mathlib PUBLIC include)\ntarget_compile_options(mathlib PRIVATE -Wall -Wextra)\n\nadd_executable(app src/main.cpp)\ntarget_link_libraries(app PRIVATE mathlib)</code></pre>\n<p>The keyword says who else sees the setting:</p>\n<ul>\n<li><b>PRIVATE</b>: only this target uses it.</li>\n<li><b>PUBLIC</b>: this target and everything that links it.</li>\n<li><b>INTERFACE</b>: only the targets that link it (header-only libraries).</li>\n</ul>\n<p>Because <code>mathlib</code>'s include directory is PUBLIC, <code>app</code> gets it automatically when it links <code>mathlib</code>. That transitive propagation is why you should avoid old global commands like <code>include_directories()</code>.</p>\n\n<h3>Third-party libraries with FetchContent</h3>\n<pre><code>include(FetchContent)\nFetchContent_Declare(fmt\n  GIT_REPOSITORY https://github.com/fmtlib/fmt.git\n  GIT_TAG 10.2.1)\nFetchContent_MakeAvailable(fmt)\n\ntarget_link_libraries(app PRIVATE fmt::fmt)</code></pre>\n<p>CMake downloads the source at configure time and builds it as part of your project. For libraries installed on the system, use <code>find_package(glfw3 REQUIRED)</code> instead.</p>\n\n<h3>Debug and Release</h3>\n<p>With single-config generators (Makefiles, Ninja), choose the build type when configuring:</p>\n<pre><code>cmake -S . -B build-rel -DCMAKE_BUILD_TYPE=Release   # -O3 -DNDEBUG\ncmake -S . -B build-dbg -DCMAKE_BUILD_TYPE=Debug     # -g, no optimisation</code></pre>\n<p>Multi-config generators (Visual Studio, Ninja Multi-Config) pick it at build time: <code>cmake --build build --config Release</code>. Keep separate build folders for each.</p>\n\n<h3>Tests with CTest</h3>\n<pre><code>enable_testing()\nadd_executable(test_vec tests/test_vec.cpp)\ntarget_link_libraries(test_vec PRIVATE mathlib)\nadd_test(NAME vec_tests COMMAND test_vec)</code></pre>\n<p>Run <code>ctest --test-dir build</code>. A test passes if its program exits with code 0.</p>\n<h3>A layout that scales</h3>\n<pre><code>project/\n  CMakeLists.txt        # top level: project(), options, add_subdirectory()\n  src/                  # library sources\n  include/project/      # public headers\n  apps/main.cpp         # executables\n  tests/                # test executables\n  build/                # generated, never committed</code></pre>\n<p>Put <code>build/</code> in <code>.gitignore</code>. Larger projects give each folder its own <code>CMakeLists.txt</code> and pull them in with <code>add_subdirectory(src)</code>. Turn on <code>set(CMAKE_EXPORT_COMPILE_COMMANDS ON)</code> so editors like VS Code and CLion understand your include paths and flags.</p>\n<p>To compare Debug and Release speed, build the same program in both folders and time it on the same input. Expect large differences for loop-heavy code, because Debug keeps every variable in memory so the debugger can show it.</p>\n<blockquote>Common mistake: editing <code>CMakeLists.txt</code> and wondering why nothing changed, or deleting files inside <code>build/</code> by hand. When things get confusing, delete the whole build folder and configure again.</blockquote>\n",
  "practice": {
   "type": "fill",
   "prompt": "<p>Write the CMake command or shell command for each job. Use the target names given.</p>",
   "items": [
    {
     "q": "In CMakeLists.txt: create an executable target named app from main.cpp.",
     "accept": [
      "add_executable(app main.cpp)",
      "add_executable(app main.cpp )",
      "add_executable( app main.cpp )"
     ],
     "hint": "add_executable(NAME SOURCES)"
    },
    {
     "q": "In CMakeLists.txt: create a library target named core from core.cpp.",
     "accept": [
      "add_library(core core.cpp)",
      "add_library(core STATIC core.cpp)",
      "add_library( core core.cpp )"
     ],
     "hint": "add_library(NAME SOURCES)"
    },
    {
     "q": "In CMakeLists.txt: link library core into app, visible only to app.",
     "accept": [
      "target_link_libraries(app PRIVATE core)",
      "target_link_libraries( app PRIVATE core )"
     ],
     "hint": "target_link_libraries(TARGET KEYWORD LIB)"
    },
    {
     "q": "Shell: configure the project in the current folder into a folder called build.",
     "accept": [
      "cmake -S . -B build",
      "cmake -B build -S .",
      "cmake -B build",
      "cmake -S. -Bbuild"
     ],
     "hint": "-S source, -B build dir"
    },
    {
     "q": "Shell: compile the project that was configured in build.",
     "accept": [
      "cmake --build build",
      "cmake --build ./build",
      "cmake --build build/"
     ],
     "hint": "cmake --build DIR"
    },
    {
     "q": "Which value of CMAKE_BUILD_TYPE gives an optimised build without debug info?",
     "accept": [
      "Release",
      "release",
      "-DCMAKE_BUILD_TYPE=Release"
     ],
     "hint": "The opposite of Debug"
    },
    {
     "q": "Which command, after FetchContent_Declare(fmt ...), downloads fmt and makes its targets available?",
     "accept": [
      "FetchContent_MakeAvailable(fmt)",
      "fetchcontent_makeavailable(fmt)",
      "FetchContent_MakeAvailable"
     ],
     "hint": "FetchContent_Make..."
    },
    {
     "q": "Shell: run all registered tests for the build folder build.",
     "accept": [
      "ctest --test-dir build",
      "cd build && ctest",
      "ctest"
     ],
     "hint": "The CTest runner"
    }
   ]
  },
  "quiz": [
   {
    "q": "What does `cmake -S . -B build` actually do?",
    "options": [
     "Compiles all sources into build/",
     "Generates a native build system (e.g. Makefiles or Ninja files) in build/",
     "Installs the program",
     "Runs the tests"
    ],
    "answer": 1,
    "why": "That is the configure step. `cmake --build build` then runs the generated build system."
   },
   {
    "q": "Library mathlib declares `target_include_directories(mathlib PUBLIC include)`. app links mathlib. Does app see the include folder?",
    "options": [
     "No, includes are never inherited",
     "Only if app also calls include_directories",
     "Yes, PUBLIC settings propagate to targets that link mathlib",
     "Only in Release builds"
    ],
    "answer": 2,
    "why": "PUBLIC means used by the target itself and by its consumers. PRIVATE would hide it."
   },
   {
    "q": "You configured with Visual Studio's generator and pass -DCMAKE_BUILD_TYPE=Release, but get a slow Debug build. Why?",
    "options": [
     "Visual Studio is a multi-config generator; choose the config with --config Release at build time",
     "Release does not exist on Windows",
     "You must delete CMakeLists.txt first",
     "CMAKE_BUILD_TYPE only works with FetchContent"
    ],
    "answer": 0,
    "why": "Multi-config generators ignore CMAKE_BUILD_TYPE; the config is selected when building."
   }
  ]
 },
 "1.3": {
  "minutes": 55,
  "learn": "\n<p>Rust gives C++-level speed with memory safety checked at compile time. Later you will write parts of an inference runtime in it. The two ideas that make Rust different are <b>ownership</b> and <b>explicit error handling</b>.</p>\n\n<h3>Cargo</h3>\n<pre><code>cargo new wordcount     # creates Cargo.toml and src/main.rs\ncargo run               # build (debug) and run\ncargo run --release     # optimised build\ncargo test              # run #[test] functions</code></pre>\n\n<h3>Variables and types</h3>\n<pre><code>let x = 5;            // immutable by default\nlet mut total = 0;    // mut makes it changeable\ntotal += x;\nlet name: String = String::from(\"gpu\");   // owned, heap string\nlet s: &amp;str = &amp;name;                      // borrowed view of it</code></pre>\n\n<h3>Ownership in three rules</h3>\n<ol>\n<li>Every value has exactly one owner.</li>\n<li>Assigning or passing a heap value <b>moves</b> it; the old name can no longer be used.</li>\n<li>When the owner goes out of scope, the value is dropped (freed). This is C++ RAII, enforced by the compiler.</li>\n</ol>\n<pre><code>let a = String::from(\"hi\");\nlet b = a;              // a moved into b\n// println!(\"{a}\");     // compile error: value used after move\nlet c = b.clone();      // explicit deep copy</code></pre>\n\n<h3>Borrowing</h3>\n<p>To use a value without taking it, borrow it with a reference. You may have <b>either</b> many shared references <code>&amp;T</code> <b>or</b> one mutable reference <code>&amp;mut T</code> at a time, never both. This rule is what rules out data races.</p>\n<pre><code>fn count_words(text: &amp;str) -&gt; usize { text.split_whitespace().count() }\nfn push_one(v: &amp;mut Vec&lt;i32&gt;) { v.push(1); }</code></pre>\n\n<h3>Structs, enums and match</h3>\n<pre><code>struct Stats { lines: usize, words: usize }\nimpl Stats {\n    fn ratio(&amp;self) -&gt; f64 { self.words as f64 / self.lines as f64 }\n}\nenum Shape { Circle(f64), Rect(f64, f64) }\nlet area = match s { Shape::Circle(r) =&gt; 3.14 * r * r, Shape::Rect(w, h) =&gt; w * h };</code></pre>\n\n<h3>Errors: Result and ?</h3>\n<p>Rust has no exceptions. Functions that can fail return <code>Result&lt;T, E&gt;</code>: either <code>Ok(value)</code> or <code>Err(error)</code>. Missing values use <code>Option&lt;T&gt;</code>: <code>Some(v)</code> or <code>None</code>.</p>\n<pre><code>fn parse_age(s: &amp;str) -&gt; Result&lt;u32, String&gt; {\n    let n: u32 = s.trim().parse().map_err(|_| format!(\"not a number: {s}\"))?;\n    if n &gt; 150 { return Err(\"too old\".to_string()); }\n    Ok(n)\n}</code></pre>\n<p>The <code>?</code> operator means: if this is <code>Err</code>, return it from the current function now; otherwise unwrap the <code>Ok</code> value. <code>ok_or(e)</code> turns an <code>Option</code> into a <code>Result</code> so <code>?</code> works on it too. Use <code>.unwrap()</code> only in quick experiments; it panics on errors.</p>\n\n<h3>Collections</h3>\n<p><code>Vec&lt;T&gt;</code> is the growable array, <code>HashMap&lt;K, V&gt;</code> the hash table (unordered), <code>BTreeMap&lt;K, V&gt;</code> the sorted map. The entry API counts neatly: <code>*map.entry(word).or_insert(0) += 1;</code></p>\n\n<h3>Calling C (FFI)</h3>\n<pre><code>extern \"C\" { fn abs(x: i32) -&gt; i32; }      // declared in libc\nfn main() { println!(\"{}\", unsafe { abs(-3) }); }</code></pre>\n<p>The compiler cannot check foreign code, so every call goes inside <code>unsafe</code>. For your own C file, compile it with a <code>build.rs</code> (the <code>cc</code> crate) and link it.</p>\n<blockquote>Common mistake: fighting the borrow checker by cloning everything. Usually the fix is to pass <code>&amp;T</code> instead of <code>T</code>, or to shorten how long a mutable borrow lives.</blockquote>\n",
  "practice": {
   "type": "code",
   "lang": "rust",
   "prompt": "<p>Read <code>key=number</code> lines from stdin. Implement <code>parse_line</code> returning <code>Result&lt;(String, i32), String&gt;</code> using <code>?</code>: the error is <code>missing '='</code> if there is no <code>=</code>, or <code>bad number 'X'</code> if the value does not parse. In <code>main</code>, print errors as <code>line N: error</code> (1-based), sum the good values per key in a <code>BTreeMap</code>, print <code>key total</code> in key order, then the number of good lines.</p><p>Expected output:</p><pre><code>line 4: missing '='\nline 5: bad number 'x'\ncpu 6\ngpu 7\nok lines: 4</code></pre>",
   "starter": "use std::collections::BTreeMap;\nuse std::io::Read;\n\nfn parse_line(line: &str) -> Result<(String, i32), String> {\n    // TODO: split_once('=') -> Option; turn it into a Result with ok_or, then ?\n    // TODO: parse the value with .parse::<i32>(), map_err to \"bad number 'X'\", then ?\n    Err(\"todo\".to_string())\n}\n\nfn main() {\n    let mut input = String::new();\n    std::io::stdin().read_to_string(&mut input).unwrap();\n    let mut totals: BTreeMap<String, i32> = BTreeMap::new();\n    let mut ok = 0;\n    for (i, line) in input.lines().enumerate() {\n        match parse_line(line) {\n            Ok((k, v)) => { /* TODO: add to totals, count ok */ }\n            Err(e) => println!(\"line {}: {}\", i + 1, e),\n        }\n    }\n    for (k, v) in &totals {\n        println!(\"{k} {v}\");\n    }\n    println!(\"ok lines: {ok}\");\n}\n",
   "stdin": "gpu=3\ncpu=5\ngpu=4\noops\nram=x\ncpu=1\n",
   "expected": "line 4: missing '='\nline 5: bad number 'x'\ncpu 6\ngpu 7\nok lines: 4",
   "solution": "use std::collections::BTreeMap;\nuse std::io::Read;\n\nfn parse_line(line: &str) -> Result<(String, i32), String> {\n    let (k, v) = line.split_once('=').ok_or(\"missing '='\".to_string())?;\n    let n = v.trim().parse::<i32>().map_err(|_| format!(\"bad number '{}'\", v))?;\n    Ok((k.trim().to_string(), n))\n}\n\nfn main() {\n    let mut input = String::new();\n    std::io::stdin().read_to_string(&mut input).unwrap();\n    let mut totals: BTreeMap<String, i32> = BTreeMap::new();\n    let mut ok = 0;\n    for (i, line) in input.lines().enumerate() {\n        match parse_line(line) {\n            Ok((k, v)) => {\n                *totals.entry(k).or_insert(0) += v;\n                ok += 1;\n            }\n            Err(e) => println!(\"line {}: {}\", i + 1, e),\n        }\n    }\n    for (k, v) in &totals {\n        println!(\"{k} {v}\");\n    }\n    println!(\"ok lines: {ok}\");\n}\n",
   "hint": "let (k, v) = line.split_once('=').ok_or(\"missing '='\".to_string())?; then *totals.entry(k).or_insert(0) += v;"
  },
  "quiz": [
   {
    "q": "After `let b = a;` where a is a String, why can you no longer use a?",
    "options": [
     "Strings are immutable",
     "Ownership moved to b; only one owner may exist",
     "a was cloned and then freed",
     "Rust forbids reassigning variables"
    ],
    "answer": 1,
    "why": "Heap values move on assignment. Use a.clone() for a copy or &a to borrow."
   },
   {
    "q": "What does `?` do on a Result value?",
    "options": [
     "Returns the Err from the current function early; otherwise gives the Ok value",
     "Panics if it is Err",
     "Converts it to an Option",
     "Ignores the error"
    ],
    "answer": 0,
    "why": "? is early-return on error, which keeps error handling short without exceptions."
   },
   {
    "q": "Which combination of borrows is allowed at the same time?",
    "options": [
     "One &mut T and one &T",
     "Two &mut T",
     "Many &T",
     "A &mut T while the owner is also modified directly"
    ],
    "answer": 2,
    "why": "Many readers or one writer, never both: this is what prevents data races at compile time."
   },
   {
    "q": "Why must calls to an extern \"C\" function be inside unsafe?",
    "options": [
     "C functions are slower",
     "unsafe makes the call use the C calling convention",
     "It is only needed on Windows",
     "The Rust compiler cannot verify the foreign code's memory safety"
    ],
    "answer": 3,
    "why": "unsafe marks code whose safety the programmer, not the compiler, guarantees."
   }
  ]
 }
});
