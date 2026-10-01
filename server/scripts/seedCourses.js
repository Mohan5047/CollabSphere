const pool = require("../config/db");

// ============================================================================
// 19 CANONICAL CATEGORIES & THEIR COURSES
// ============================================================================

const CATALOG = [
  {
    categoryName: "Programming Languages",
    description: "Core and modern programming languages for software engineering",
    trackName: "Programming Languages Track",
    trackDesc: "Master programming fundamentals from C and Java to Rust and Go",
    courses: [
      {
        title: "C Programming",
        desc: "Master core C programming, pointers, manual memory allocation, and system-level software engineering.",
        level: "Beginner",
        duration: 18,
        modules: [
          {
            title: "C Fundamentals & Syntax",
            desc: "Basic data types, control flow, operators, and functions in C",
            lessons: [
              { title: "Introduction to C & Compilers", desc: "Setting up GCC, compiling your first C program, and understanding main().", duration: 25 },
              { title: "Variables, Data Types & Operators", desc: "Primitive types, size of types, type casting, and arithmetic operations.", duration: 30 },
              { title: "Control Flow & Loops", desc: "Conditional if-else branching, switch statements, and loop constructs.", duration: 35 }
            ]
          },
          {
            title: "Functions & Scope",
            desc: "Modular programming, call by value vs reference, and variable scope",
            lessons: [
              { title: "Defining & Invoking Functions", desc: "Function prototypes, parameter passing, and return values.", duration: 30 },
              { title: "Variable Scope & Storage Classes", desc: "Automatic, static, register, and external storage classes.", duration: 35 },
              { title: "Recursion in C", desc: "Base cases, call stack visualizer, and recursive algorithms.", duration: 40 }
            ]
          },
          {
            title: "Arrays & Strings",
            desc: "Single and multi-dimensional arrays, string manipulation functions",
            lessons: [
              { title: "Array Declarations & Operations", desc: "Array indexing, traversal, and bounds checking in C.", duration: 35 },
              { title: "Multi-dimensional Arrays & Matrices", desc: "2D arrays, matrix arithmetic, and tabular memory layout.", duration: 40 },
              { title: "C-Style String Operations", desc: "Null-terminated character arrays, strlen, strcpy, and strcmp functions.", duration: 45 }
            ]
          },
          {
            title: "Pointers & Memory Architecture",
            desc: "Pointers, dereferencing, pointer arithmetic, and memory addressing",
            lessons: [
              { title: "Understanding Memory Addresses & Pointers", desc: "Address-of operator (&) and dereferencing operator (*).", duration: 45 },
              { title: "Pointer Arithmetic & Array Pointer Relationship", desc: "Stepping through memory blocks using typed pointer arithmetic.", duration: 50 },
              { title: "Pointers to Pointers & Function Pointers", desc: "Double pointers, dynamic callback functions, and function table dispatch.", duration: 55 }
            ]
          },
          {
            title: "Dynamic Memory Management & Structures",
            desc: "Heap allocation, structs, unions, and preventing memory leaks",
            lessons: [
              { title: "Malloc, Calloc, Realloc & Free", desc: "Allocating heap memory, reallocating buffers, and avoiding dangling pointers.", duration: 45 },
              { title: "Structures & Unions in C", desc: "Custom data types, struct padding, memory layout, and unions.", duration: 40 },
              { title: "File I/O & Capstone Project", desc: "Reading and writing binary/text files and building a CLI database.", duration: 60 }
            ]
          }
        ]
      },
      {
        title: "C++ Programming",
        desc: "Object-oriented programming, templates, Standard Template Library (STL), and modern C++ design.",
        level: "Intermediate",
        duration: 24,
        modules: [
          {
            title: "C++ Foundations & OOP Core",
            desc: "Namespaces, classes, objects, access specifiers, and constructors",
            lessons: [
              { title: "Transitioning from C to Modern C++", desc: "Namespaces, references vs pointers, and standard stream I/O.", duration: 30 },
              { title: "Encapsulation, Classes & Constructors", desc: "Constructors, destructors, copy constructors, and initialization lists.", duration: 40 },
              { title: "Inheritance & Polymorphism", desc: "Base and derived classes, virtual functions, and vtables.", duration: 45 }
            ]
          },
          {
            title: "Operator Overloading & Advanced OOP",
            desc: "Customizing operator behaviors and managing object lifecycles",
            lessons: [
              { title: "Operator Overloading Principles", desc: "Overloading stream, arithmetic, and subscript operators.", duration: 45 },
              { title: "Abstract Classes & Pure Virtual Interfaces", desc: "Defining interface contracts and runtime polymorphism.", duration: 40 },
              { title: "Resource Acquisition Is Initialization (RAII)", desc: "Managing resources safely with scope-bound object lifetimes.", duration: 45 }
            ]
          },
          {
            title: "Templates & Generic Programming",
            desc: "Function templates, class templates, and generic abstractions",
            lessons: [
              { title: "Function Templates & Type Deduction", desc: "Writing reusable generic algorithms across data types.", duration: 40 },
              { title: "Class Templates & Specialization", desc: "Building generic container classes and explicit specializations.", duration: 45 },
              { title: "Template Metaprogramming Basics", desc: "Compile-time evaluation and type traits in modern C++.", duration: 50 }
            ]
          },
          {
            title: "Standard Template Library (STL)",
            desc: "Containers, iterators, and high-performance algorithms",
            lessons: [
              { title: "Sequential Containers: Vector, Deque & List", desc: "Performance characteristics, memory layout, and dynamic resizing.", duration: 45 },
              { title: "Associative Containers: Set, Map & Unordered Map", desc: "Balanced binary search trees vs hash table implementations.", duration: 45 },
              { title: "STL Algorithms & Lambda Expressions", desc: "std::sort, std::transform, std::find, and modern lambda syntax.", duration: 50 }
            ]
          },
          {
            title: "Modern C++ (C++11 to C++20)",
            desc: "Smart pointers, move semantics, rvalue references, and concurrency",
            lessons: [
              { title: "Move Semantics & Rvalue References", desc: "std::move, move constructors, and zero-cost resource transfer.", duration: 50 },
              { title: "Smart Pointers: unique_ptr, shared_ptr, weak_ptr", desc: "Eliminating memory leaks and circular reference prevention.", duration: 45 },
              { title: "Multithreading & C++ Capstone Project", desc: "std::thread, mutex, lock_guard, and building a high-speed trade engine.", duration: 60 }
            ]
          }
        ]
      },
      {
        title: "Java Programming",
        desc: "Core Java, JVM architecture, multithreading, OOP, and the enterprise Collections framework.",
        level: "Beginner",
        duration: 28,
        modules: [
          {
            title: "Java Foundations & Architecture",
            desc: "JDK, JRE, JVM architecture, primitive types, and control flow",
            lessons: [
              { title: "Understanding the Java Virtual Machine (JVM)", desc: "Bytecode compilation, JIT compiler, and class loader mechanics.", duration: 30 },
              { title: "Java Syntax, Variables & Operators", desc: "Data types, variable declarations, and control flow statements.", duration: 35 },
              { title: "Arrays & String Pool Immutability", desc: "Memory allocation of arrays and why String is immutable in Java.", duration: 40 }
            ]
          },
          {
            title: "Object-Oriented Programming in Java",
            desc: "Classes, encapsulation, inheritance, interfaces, and records",
            lessons: [
              { title: "Classes, Objects & Constructors", desc: "Constructors, 'this' keyword, and object instantiation.", duration: 40 },
              { title: "Inheritance, Method Overriding & 'super'", desc: "Extending classes, polymorphism, and overriding object methods.", duration: 45 },
              { title: "Interfaces, Abstract Classes & Java Records", desc: "Contract design, default interface methods, and immutable records.", duration: 45 }
            ]
          },
          {
            title: "Exception Handling & File I/O",
            desc: "Robust error handling, custom exceptions, and NIO file operations",
            lessons: [
              { title: "Checked vs Unchecked Exceptions", desc: "Try-catch-finally blocks, throw, throws, and multi-catch syntax.", duration: 40 },
              { title: "Custom Exceptions & Try-with-Resources", desc: "Creating domain exceptions and auto-closable resource management.", duration: 40 },
              { title: "Java I/O Streams & Modern Java NIO.2", desc: "Reading and writing files with Path, Files, and ByteBuffers.", duration: 45 }
            ]
          },
          {
            title: "Java Collections Framework & Generics",
            desc: "List, Set, Map hierarchies, Iterators, and generic type parameters",
            lessons: [
              { title: "ArrayList, LinkedList & Vector", desc: "Comparing dynamic array resizing vs doubly-linked node structures.", duration: 45 },
              { title: "HashSet, TreeSet & HashMap Internals", desc: "Hashcode-equals contract, collision buckets, and red-black tree trees.", duration: 50 },
              { title: "Java Generics & Wildcards (? extends / super)", desc: "Writing type-safe generic classes and invariance/covariance.", duration: 50 }
            ]
          },
          {
            title: "Streams, Lambdas & Concurrency",
            desc: "Functional programming in Java, parallel streams, and threads",
            lessons: [
              { title: "Lambda Expressions & Functional Interfaces", desc: "Consumer, Supplier, Function, Predicate, and method references.", duration: 45 },
              { title: "The Java Stream API", desc: "Filter, map, flatMap, reduce, and collector pipelines.", duration: 50 },
              { title: "Multithreading, Executors & Java Project", desc: "Thread lifecycle, synchronized blocks, ExecutorService, and capstone.", duration: 60 }
            ]
          }
        ]
      },
      {
        title: "Python Programming",
        desc: "Python from fundamentals to advanced scripting, OOP, generators, decorators, and data processing.",
        level: "Beginner",
        duration: 20,
        modules: [
          {
            title: "Python Syntax & Built-in Data Structures",
            desc: "Variables, dynamic typing, lists, tuples, dictionaries, and sets",
            lessons: [
              { title: "Python Environment & Execution Model", desc: "CPython interpreter, bytecode compilation, and virtual environments.", duration: 25 },
              { title: "Lists, Tuples, Dictionaries & Sets", desc: "Comprehensive review of indexing, slicing, hashing, and lookups.", duration: 35 },
              { title: "List & Dictionary Comprehensions", desc: "Writing expressive, idiomatic, and high-performance comprehensions.", duration: 30 }
            ]
          },
          {
            title: "Functions & Functional Programming",
            desc: "Keyword arguments, *args, **kwargs, lambda functions, and closures",
            lessons: [
              { title: "Function Signatures, Default & Arbitrary Arguments", desc: "Positional, keyword-only, *args, and **kwargs parameters.", duration: 35 },
              { title: "Closures & Scope (LEGB Rule)", desc: "Local, Enclosing, Global, and Built-in variable resolution.", duration: 40 },
              { title: "Decorators in Practice", desc: "Writing function wrappers, timing decorators, and authenticated wrappers.", duration: 45 }
            ]
          },
          {
            title: "Object-Oriented Python",
            desc: "Classes, dunder methods, inheritance, and dataclasses",
            lessons: [
              { title: "Classes, Attributes & __init__", desc: "Instance attributes, class attributes, and self parameter.", duration: 35 },
              { title: "Special Dunder Magic Methods", desc: "__str__, __repr__, __len__, __getitem__, and operator overloading.", duration: 45 },
              { title: "Inheritance, Multiple Inheritance & MRO", desc: "Super() resolution order and building clean class hierarchies.", duration: 45 }
            ]
          },
          {
            title: "Generators, Iterators & Context Managers",
            desc: "Memory-efficient data pipelines and context management",
            lessons: [
              { title: "Iterators vs Iterables Protocol", desc: "Implementing __iter__ and __next__ protocols on custom objects.", duration: 40 },
              { title: "Generators & the 'yield' Keyword", desc: "Lazy evaluation, memory-saving data pipelines, and generator expressions.", duration: 45 },
              { title: "Context Managers & 'with' Statement", desc: "Managing files and network sockets with __enter__ and __exit__.", duration: 40 }
            ]
          },
          {
            title: "File Handling, Modules & Capstone Project",
            desc: "Packaging, external dependencies, and building a CLI utility",
            lessons: [
              { title: "File Operations, JSON & CSV Parsing", desc: "Reading and transforming semi-structured files safely.", duration: 40 },
              { title: "Packages, Modules & pip Management", desc: "Organizing code into modules, __init__.py, and requirements.txt.", duration: 40 },
              { title: "Capstone: Automation & Scraping Tool", desc: "Building a fully functional production CLI automation tool.", duration: 55 }
            ]
          }
        ]
      },
      {
        title: "JavaScript",
        desc: "Modern ES6+ JavaScript, asynchronous event loop, closures, prototypes, and DOM interaction.",
        level: "Beginner",
        duration: 16,
        modules: [
          {
            title: "JavaScript Engine & Variables",
            desc: "Execution contexts, hoisting, var, let, const, and types",
            lessons: [
              { title: "How JS Executes: V8 Engine & Call Stack", desc: "Compilation phases, call stack, and memory heap architecture.", duration: 30 },
              { title: "Variable Scoping, Hoisting & TDZ", desc: "Differences between var, let, and const and temporal dead zones.", duration: 35 },
              { title: "Type Coercion & Strict Equality", desc: "Understanding falsy values, explicit conversions, and === checks.", duration: 30 }
            ]
          },
          {
            title: "Functions, Closures & 'this'",
            desc: "First-class functions, lexical scoping, and execution contexts",
            lessons: [
              { title: "First-Class Functions & Arrow Functions", desc: "Anonymous functions, arrow function limitations, and expression syntax.", duration: 35 },
              { title: "Closures & Practical Use Cases", desc: "Encapsulation, factory functions, and private state retention.", duration: 40 },
              { title: "Demystifying 'this' & Call, Apply, Bind", desc: "Default, implicit, explicit, and new binding rules.", duration: 45 }
            ]
          },
          {
            title: "Asynchronous JavaScript & Event Loop",
            desc: "Microtasks, macrotasks, promises, and async/await",
            lessons: [
              { title: "The Event Loop, Microtasks & Callback Queue", desc: "How asynchronous operations work in single-threaded JavaScript.", duration: 45 },
              { title: "Promises & Promise Combinators", desc: "Promise.all, Promise.race, Promise.allSettled, and error handling.", duration: 45 },
              { title: "Async/Await Syntax & Try/Catch", desc: "Writing synchronous-looking asynchronous code and clean error handling.", duration: 40 }
            ]
          },
          {
            title: "DOM Manipulation & Browser Events",
            desc: "Targeting DOM nodes, bubbling, capturing, and delegation",
            lessons: [
              { title: "Selecting & Modifying DOM Nodes", desc: "QuerySelector, innerHTML, textContent, and dynamic elements.", duration: 35 },
              { title: "Event Bubbling, Capturing & Delegation", desc: "Event propagation mechanics and optimizing memory with delegation.", duration: 40 },
              { title: "Browser Storage: LocalStorage & SessionStorage", desc: "Storing and managing user preferences and tokens on the client.", duration: 35 }
            ]
          },
          {
            title: "Modern ES Modules & Capstone Project",
            desc: "ES6 modules, destructuring, spread/rest, and web app project",
            lessons: [
              { title: "ES6 Destructuring, Spread & Rest Operators", desc: "Modern object and array patterns for clean data access.", duration: 35 },
              { title: "Import/Export & Modular JavaScript", desc: "Organizing modern code into reusable ESM modules.", duration: 35 },
              { title: "JavaScript Capstone: Interactive Dashboard", desc: "Building an end-to-end interactive client-side application.", duration: 55 }
            ]
          }
        ]
      },
      {
        title: "TypeScript",
        desc: "Strict typing, generics, utility types, and enterprise architecture with modern TypeScript.",
        level: "Intermediate",
        duration: 18,
        modules: [
          {
            title: "TypeScript Foundations",
            desc: "Why TypeScript, type inference, primitive types, and tsconfig.json",
            lessons: [
              { title: "TypeScript Compiler (tsc) & Architecture", desc: "Type-checking vs transpilation and setting up strict mode.", duration: 30 },
              { title: "Basic Types & Type Inference", desc: "Number, string, boolean, arrays, tuples, and type assertions.", duration: 35 },
              { title: "Union & Intersection Types", desc: "Combining types, type narrowing, and discriminated unions.", duration: 40 }
            ]
          },
          {
            title: "Interfaces vs Type Aliases",
            desc: "Object typing, declaration merging, and function contracts",
            lessons: [
              { title: "Defining Interfaces & Extending Them", desc: "Optional properties, readonly fields, and interface inheritance.", duration: 40 },
              { title: "Type Aliases & Complex Types", desc: "When to choose type over interface and union compositions.", duration: 35 },
              { title: "Type Guards & Narrowing", desc: "typeof, instanceof, and custom user-defined type predicates.", duration: 45 }
            ]
          },
          {
            title: "Generics & Generic Constraints",
            desc: "Reusable, type-safe functions, classes, and interfaces",
            lessons: [
              { title: "Generic Functions & Interfaces", desc: "Parameterizing types and creating reusable generic models.", duration: 45 },
              { title: "Generic Constraints (extends)", desc: "Limiting generic parameters using interfaces and 'keyof'.", duration: 45 },
              { title: "Generic Classes & Containers", desc: "Building type-safe stacks, queues, and API repositories.", duration: 50 }
            ]
          },
          {
            title: "Advanced Utility Types & Mapped Types",
            desc: "Partial, Required, Pick, Omit, Record, and conditional types",
            lessons: [
              { title: "Built-in Utility Types in Practice", desc: "Transforming types with Partial, Pick, Omit, and Record.", duration: 45 },
              { title: "Conditional Types & the 'infer' Keyword", desc: "Writing dynamic types that resolve based on type conditions.", duration: 50 },
              { title: "Template Literal Types & Index Signatures", desc: "Building strict string formats and dynamic dictionary mappings.", duration: 45 }
            ]
          },
          {
            title: "Enterprise Architecture & Capstone Project",
            desc: "Configuring production builds, strict typing, and full project",
            lessons: [
              { title: "Strict Null Checks & Unknown vs Any", desc: "Defensive typing and eliminating runtime type crashes.", duration: 40 },
              { title: "TypeScript with Express & React", desc: "Typing request/response payloads, props, hooks, and context.", duration: 50 },
              { title: "Capstone: Type-Safe Full-Stack SDK", desc: "Developing a fully typed API client and domain model library.", duration: 55 }
            ]
          }
        ]
      },
      {
        title: "Go Programming",
        desc: "Go concurrency with goroutines, channels, interfaces, and microservices architecture.",
        level: "Intermediate",
        duration: 20,
        modules: [
          {
            title: "Go Fundamentals & Idioms",
            desc: "Pointers, structs, slices, maps, and package architecture",
            lessons: [
              { title: "Go Toolchain, Modules & Syntax", desc: "Go environment, go mod, package main, and basic types.", duration: 30 },
              { title: "Slices, Arrays & Memory Layout", desc: "Slice headers, capacity, append mechanics, and memory allocation.", duration: 40 },
              { title: "Structs, Custom Types & Methods", desc: "Value vs pointer receivers, struct embedding, and composition.", duration: 45 }
            ]
          },
          {
            title: "Interfaces & Error Handling",
            desc: "Implicit interfaces, duck typing, and explicit error returns",
            lessons: [
              { title: "Implicit Interfaces in Go", desc: "How Go implements interface compliance without 'implements'.", duration: 45 },
              { title: "Idiomatic Error Handling", desc: "Errors are values, wrapping errors, errors.Is, and errors.As.", duration: 40 },
              { title: "Type Assertions & Type Switches", desc: "Safely inspecting underlying concrete types from interfaces.", duration: 40 }
            ]
          },
          {
            title: "Goroutines & Channels",
            desc: "Lightweight concurrency, communication, and synchronization",
            lessons: [
              { title: "Goroutine Internals & M:N Scheduler", desc: "Go runtime scheduler, OS threads vs goroutines, and stack sizes.", duration: 45 },
              { title: "Buffered vs Unbuffered Channels", desc: "Communicating Sequential Processes (CSP) principles in Go.", duration: 50 },
              { title: "The Select Statement & Timeouts", desc: "Multiplexing channel operations and handling non-blocking sends.", duration: 45 }
            ]
          },
          {
            title: "Synchronization & Context Package",
            desc: "Sync primitives, race detector, and request cancellation",
            lessons: [
              { title: "Sync.Mutex, RWMutex & WaitGroups", desc: "Preventing data races and coordinating concurrent worker groups.", duration: 45 },
              { title: "Go Race Detector & Best Practices", desc: "Running 'go test -race' to discover race conditions.", duration: 40 },
              { title: "The Context Package (context.Context)", desc: "Passing deadlines, cancellation signals, and request-scoped values.", duration: 50 }
            ]
          },
          {
            title: "HTTP Microservices & Capstone Project",
            desc: "net/http standard library, REST APIs, and microservice build",
            lessons: [
              { title: "Building High-Throughput HTTP Servers", desc: "Standard net/http handlers, custom multiplexers, and middleware.", duration: 45 },
              { title: "JSON Marshaling & Database Connectivity", desc: "Database/sql connection pooling and clean JSON serialization.", duration: 50 },
              { title: "Capstone: Concurrent Web Crawler & Microservice", desc: "Building a production-ready concurrent data fetching service.", duration: 60 }
            ]
          }
        ]
      },
      {
        title: "Rust Programming",
        desc: "Memory safety without garbage collection, borrow checker, ownership, and concurrent systems programming.",
        level: "Advanced",
        duration: 30,
        modules: [
          {
            title: "Rust Foundations & Syntax",
            desc: "Cargo, immutability by default, data types, and control flow",
            lessons: [
              { title: "The Rust Philosophy & Cargo", desc: "Why Rust, package manager Cargo, and compiling zero-cost abstractions.", duration: 30 },
              { title: "Variables, Mutability & Shadowing", desc: "Explicit mut keyword, memory guarantees, and stack vs heap in Rust.", duration: 35 },
              { title: "Functions & Expression-Based Syntax", desc: "Statements vs expressions and clean return semantics.", duration: 35 }
            ]
          },
          {
            title: "Ownership, Borrowing & Lifetimes",
            desc: "The core memory management model that makes Rust unique",
            lessons: [
              { title: "The Ownership Rules Explained", desc: "Each value has one owner, move semantics, and automatic dropping.", duration: 50 },
              { title: "Borrowing & References", desc: "Immutable references (&T) vs mutable references (&mut T).", duration: 50 },
              { title: "Understanding Explicit Lifetimes ('a)", desc: "Borrow checker rules, lifetime annotations, and struct references.", duration: 55 }
            ]
          },
          {
            title: "Enums, Pattern Matching & Error Handling",
            desc: "Option, Result, match statements, and robust safety",
            lessons: [
              { title: "Rust Enums & Rich Data Payloads", desc: "Defining tagged unions with associated state and variants.", duration: 40 },
              { title: "Pattern Matching & the 'match' Construct", desc: "Exhaustive pattern matching, if let, and guard clauses.", duration: 45 },
              { title: "Result, Option & the '?' Operator", desc: "Handling nullability and cascading errors without exceptions.", duration: 45 }
            ]
          },
          {
            title: "Traits, Generics & Smart Pointers",
            desc: "Shared behavior, generic constraints, and memory pointer types",
            lessons: [
              { title: "Defining & Implementing Traits", desc: "Rust's version of interfaces, derive macros, and default methods.", duration: 50 },
              { title: "Trait Bounds & Dynamic Dispatch (dyn Trait)", desc: "Static dispatch (monomorphization) vs dynamic vtable dispatch.", duration: 50 },
              { title: "Smart Pointers: Box, Rc, Arc & RefCell", desc: "Heap allocation, reference counting, and interior mutability.", duration: 55 }
            ]
          },
          {
            title: "Fearless Concurrency & Systems Capstone",
            desc: "Threads, message passing, shared state, and systems engineering",
            lessons: [
              { title: "Threads & Move Closures in Rust", desc: "Spawning threads and transferring ownership across thread boundaries.", duration: 50 },
              { title: "Channels & Shared State with Arc<Mutex<T>>", desc: "Synchronizing multi-threaded access without race conditions.", duration: 55 },
              { title: "Capstone: Multi-Threaded High-Performance Server", desc: "Building a high-throughput network service from scratch in Rust.", duration: 65 }
            ]
          }
        ]
      }
    ]
  },
  {
    categoryName: "Web Development",
    description: "Frontend, backend, and full-stack web engineering technologies",
    trackName: "Web Development Track",
    trackDesc: "From HTML/CSS to advanced React, Node.js, and Full-Stack Architecture",
    courses: [
      {
        title: "HTML & CSS Fundamentals",
        desc: "Semantic HTML5, CSS Grid, Flexbox, responsive layouts, and web accessibility standards.",
        level: "Beginner",
        duration: 14,
        modules: [
          {
            title: "Semantic HTML5 & Document Structure",
            desc: "Elements, attributes, SEO metadata, and semantic markup",
            lessons: [
              { title: "HTML5 Document Structure & Meta Tags", desc: "DOCTYPE, head, viewport meta, and search engine metadata.", duration: 25 },
              { title: "Semantic Tags: Main, Article, Nav & Section", desc: "Improving document structure, screen reader accessibility, and SEO.", duration: 30 },
              { title: "Forms, Input Types & Built-in Validation", desc: "Form controls, pattern attributes, labels, and accessible forms.", duration: 35 }
            ]
          },
          {
            title: "CSS Foundations & Box Model",
            desc: "Selectors, cascade, specificity, and box model mechanics",
            lessons: [
              { title: "CSS Syntax, Selectors & Specificity", desc: "Class, ID, attribute selectors, and calculating specificity scores.", duration: 30 },
              { title: "The CSS Box Model: Margin, Border, Padding, Content", desc: "Box-sizing: border-box and margin collapse resolution.", duration: 35 },
              { title: "Color Systems, Typography & Custom Properties", desc: "Hex, HSL, web fonts, rem units, and CSS custom variables.", duration: 35 }
            ]
          },
          {
            title: "Modern Layouts: Flexbox",
            desc: "One-dimensional responsive layouts with CSS Flexbox",
            lessons: [
              { title: "Flex Containers & Main vs Cross Axis", desc: "Flex-direction, justify-content, and align-items.", duration: 35 },
              { title: "Flex Items: Grow, Shrink & Basis", desc: "Controlling flexible child dimensions with flex-grow and basis.", duration: 40 },
              { title: "Common Flexbox UI Patterns", desc: "Navigation bars, centering modals, and responsive card lists.", duration: 40 }
            ]
          },
          {
            title: "Modern Layouts: CSS Grid",
            desc: "Two-dimensional responsive layouts with CSS Grid",
            lessons: [
              { title: "Grid Container & Template Columns/Rows", desc: "Fractional units (fr), repeat(), and grid-gap.", duration: 40 },
              { title: "Auto-Fit, Auto-Fill & MinMax", desc: "Building responsive grids without media queries.", duration: 45 },
              { title: "Grid Template Areas & Complex Dashboards", desc: "Naming grid regions for intuitive responsive UI redesign.", duration: 45 }
            ]
          },
          {
            title: "Responsive Design, Animations & Project",
            desc: "Media queries, transitions, transforms, and complete landing page",
            lessons: [
              { title: "Mobile-First Design & Media Queries", desc: "Breakpoints, fluid typography, and mobile-first strategy.", duration: 35 },
              { title: "CSS Transitions, Transforms & Keyframe Animations", desc: "Smooth micro-interactions and GPU-accelerated transforms.", duration: 40 },
              { title: "Capstone: Responsive SaaS Landing Page", desc: "Building a modern, accessible, responsive landing page from scratch.", duration: 55 }
            ]
          }
        ]
      },
      {
        title: "JavaScript for Web Development",
        desc: "Interactive web pages, DOM manipulation, asynchronous fetch APIs, and client-side web applications.",
        level: "Beginner",
        duration: 18,
        modules: [
          {
            title: "DOM Navigation & Manipulation",
            desc: "Selecting, creating, updating, and removing DOM elements dynamically",
            lessons: [
              { title: "DOM Tree Traversal & Querying", desc: "ParentNode, children, siblings, and querySelectorAll.", duration: 30 },
              { title: "Manipulating Classes, Styles & Attributes", desc: "ClassList API, getAttribute, and modifying inline CSS.", duration: 35 },
              { title: "Creating & Appending Dynamic Elements", desc: "DocumentFragment, createElement, and performant batch DOM updates.", duration: 40 }
            ]
          },
          {
            title: "Events & User Interaction",
            desc: "Click, keyboard, input, and scroll event listeners with optimization",
            lessons: [
              { title: "Event Listeners & Event Objects", desc: "Target, currentTarget, preventDefault, and stopPropagation.", duration: 35 },
              { title: "Form Validation & Submit Handling", desc: "Validating user input before form submission in real time.", duration: 40 },
              { title: "Debouncing & Throttling Event Handlers", desc: "Optimizing search inputs and scroll handlers for high performance.", duration: 45 }
            ]
          },
          {
            title: "Working with Web APIs & Fetch",
            desc: "Making HTTP requests, parsing JSON, and rendering async data",
            lessons: [
              { title: "Fetch API & REST Integration", desc: "GET, POST, PUT, DELETE requests with headers and payloads.", duration: 40 },
              { title: "Handling HTTP Errors & Loading States", desc: "Status checking, try/catch, and rendering spinner UI.", duration: 40 },
              { title: "Browser Storage & Session Persistence", desc: "Storing user preferences in LocalStorage and session cookies.", duration: 35 }
            ]
          },
          {
            title: "Modern Build Tools & Modular JS",
            desc: "NPM, Vite, ES Modules, and organizing client codebases",
            lessons: [
              { title: "NPM Packages & Dependency Management", desc: "Package.json, semantic versioning, and package installations.", duration: 35 },
              { title: "Bundling with Vite", desc: "Hot module replacement, environment variables, and build output.", duration: 40 },
              { title: "Separation of Concerns in Frontend Code", desc: "Organizing state, UI components, and API service layers.", duration: 45 }
            ]
          },
          {
            title: "Interactive Web Project",
            desc: "Building a rich interactive web application with API integration",
            lessons: [
              { title: "Planning the Application Architecture", desc: "Component breakdown, data flow, and API endpoints planning.", duration: 40 },
              { title: "Implementing Features & Real-Time Filtering", desc: "Live search, filter tags, and pagination implementation.", duration: 50 },
              { title: "Capstone: Production Web App Launch", desc: "Polishing UX, responsive testing, and production deployment.", duration: 55 }
            ]
          }
        ]
      },
      {
        title: "React.js",
        desc: "Learn React from fundamentals to building production-ready frontend applications with hooks, state, and routing.",
        level: "Intermediate",
        duration: 24,
        modules: [
          {
            title: "React Fundamentals & JSX",
            desc: "Virtual DOM, JSX syntax, functional components, and props",
            lessons: [
              { title: "What is React & The Virtual DOM?", desc: "Component-based architecture, reconciliation, and unidirectional data flow.", duration: 30 },
              { title: "JSX Syntax & Rules", desc: "Embedding expressions, conditional rendering, and key attributes in lists.", duration: 35 },
              { title: "Functional Components & Passing Props", desc: "Creating modular components, prop drilling, and default props.", duration: 40 }
            ]
          },
          {
            title: "State & Event Handling (useState)",
            desc: "Interactive components, immutability, and state management",
            lessons: [
              { title: "Managing State with useState", desc: "State declaration, updater functions, and avoiding direct state mutations.", duration: 40 },
              { title: "Handling User Events in React", desc: "SyntheticEvent system, event handlers, and input bindings.", duration: 35 },
              { title: "Lifting State Up & Component Communication", desc: "Sharing state between sibling components via common parent.", duration: 45 }
            ]
          },
          {
            title: "Side Effects & Lifecycles (useEffect)",
            desc: "Data fetching, cleanup functions, and dependency arrays",
            lessons: [
              { title: "The useEffect Hook & Lifecycle Phases", desc: "Mounting, updating, and unmounting with useEffect dependencies.", duration: 45 },
              { title: "Data Fetching & Loading/Error States", desc: "Connecting React components to backend REST APIs safely.", duration: 45 },
              { title: "Effect Cleanup & Preventing Memory Leaks", desc: "Aborting fetch requests and clearing intervals/event listeners.", duration: 40 }
            ]
          },
          {
            title: "Advanced Hooks: Context, Ref & Reducer",
            desc: "useContext, useRef, useReducer, and performance memoization",
            lessons: [
              { title: "Global State with Context API (createContext)", desc: "Eliminating prop drilling for theme, auth, and user session.", duration: 50 },
              { title: "Complex State with useReducer", desc: "Action types, reducers, and predictable state transitions.", duration: 45 },
              { title: "Performance: useMemo, useCallback & React.memo", desc: "Avoiding unnecessary component re-renders in large lists.", duration: 50 }
            ]
          },
          {
            title: "Routing, Forms & Production Capstone",
            desc: "React Router, form handling, and full React application project",
            lessons: [
              { title: "Client-Side Routing with React Router", desc: "Routes, Route, Link, useNavigate, useParams, and nested routes.", duration: 45 },
              { title: "Controlled Forms & Form Validation", desc: "Building robust forms with real-time feedback and submission handling.", duration: 45 },
              { title: "Capstone: Production SaaS Dashboard in React", desc: "Building and deploying a complete multi-view productivity dashboard.", duration: 65 }
            ]
          }
        ]
      },
      {
        title: "Node.js & Express",
        desc: "Server-side JavaScript, RESTful API architecture, middleware, authentication, and database integration.",
        level: "Intermediate",
        duration: 22,
        modules: [
          {
            title: "Node.js Architecture & Core Modules",
            desc: "Event-driven runtime, non-blocking I/O, FS, path, and HTTP modules",
            lessons: [
              { title: "The Node.js Runtime & Libuv Event Loop", desc: "Thread pool, non-blocking asynchronous architecture, and process object.", duration: 30 },
              { title: "Core Modules: Path, FS & Streams", desc: "Working with the file system, buffers, and readable/writable streams.", duration: 40 },
              { title: "Creating an HTTP Server without Frameworks", desc: "Request and response objects, status codes, and manual route parsing.", duration: 40 }
            ]
          },
          {
            title: "Express.js Fundamentals & Routing",
            desc: "Setting up Express app, route parameters, and query strings",
            lessons: [
              { title: "Express App Setup & REST Conventions", desc: "HTTP verbs, standard API status codes, and modular routing.", duration: 35 },
              { title: "Route Parameters & Query Parsing", desc: "Extracting dynamic URL parameters and query strings safely.", duration: 35 },
              { title: "Express Router Architecture", desc: "Splitting routes into separate domain-specific controller modules.", duration: 40 }
            ]
          },
          {
            title: "Middleware & Error Handling",
            desc: "Built-in, third-party, and custom middleware pipelines",
            lessons: [
              { title: "Understanding the Middleware Pipeline", desc: "Request-response cycle, next() function, and request validation.", duration: 40 },
              { title: "CORS, Body-Parser & Security Headers", desc: "Configuring cross-origin resource sharing, JSON limits, and Helmet.", duration: 40 },
              { title: "Centralized Global Error Handling", desc: "Writing 4-parameter error middleware and custom ApiError classes.", duration: 45 }
            ]
          },
          {
            title: "Database Integration & Authentication",
            desc: "PostgreSQL connection pooling, JWT tokens, and bcrypt hashing",
            lessons: [
              { title: "Connecting PostgreSQL with 'pg' Pool", desc: "Configuring connection pools, parameterized queries, and transactions.", duration: 45 },
              { title: "Password Hashing with Bcrypt", desc: "Salting, hashing passwords, and secure password comparison.", duration: 40 },
              { title: "JWT Token Generation & Auth Middleware", desc: "Signing tokens, verifying authorization headers, and protected routes.", duration: 50 }
            ]
          },
          {
            title: "Production Architecture & Capstone Project",
            desc: "Environment config, logging, rate limiting, and REST API deployment",
            lessons: [
              { title: "Environment Variables & Configuration Management", desc: "Dotenv best practices and validating required environment configs.", duration: 35 },
              { title: "Rate Limiting & API Security Hardening", desc: "Preventing brute-force attacks and protecting endpoints.", duration: 40 },
              { title: "Capstone: Production-Ready Collaboration REST API", desc: "Building a fully authenticated multi-resource backend server.", duration: 60 }
            ]
          }
        ]
      },
      {
        title: "Full Stack Web Development",
        desc: "End-to-end full stack architecture connecting modern React frontend to Node.js and PostgreSQL database.",
        level: "Advanced",
        duration: 40,
        modules: [
          {
            title: "Full Stack Architecture & Monorepos",
            desc: "System design, folder structure, API contracts, and dev environment",
            lessons: [
              { title: "Full Stack Monorepo Setup & Workflow", desc: "Structuring client and server folders, scripts, and concurrent dev.", duration: 35 },
              { title: "Designing the API Contract & Data Models", desc: "Creating shared interfaces, database schemas, and endpoint specifications.", duration: 45 },
              { title: "Environment Configuration & Secrets Management", desc: "Handling local vs production environments safely.", duration: 40 }
            ]
          },
          {
            title: "Authentication & User Management",
            desc: "End-to-end login, registration, JWT persistence, and protected routes",
            lessons: [
              { title: "Full-Stack Registration Flow with Validation", desc: "Client-side validation, server hashing, and database storage.", duration: 50 },
              { title: "Login, JWT Token Issuance & Client Storage", desc: "Secure token management, LocalStorage, and AuthContext synchronization.", duration: 50 },
              { title: "Protected Routes & Role-Based Authorization", desc: "Guarding client routes and verifying roles on the backend.", duration: 45 }
            ]
          },
          {
            title: "CRUD Operations & Relational Data",
            desc: "Building complete data pipelines with optimistic UI updates",
            lessons: [
              { title: "Building the RESTful Resource Controllers", desc: "Handling relational joins and complex SQL queries on the server.", duration: 50 },
              { title: "Client Data Fetching & Axios Interceptors", desc: "Automating authorization headers and error interception on client.", duration: 45 },
              { title: "Optimistic UI Updates & Cache Invalidation", desc: "Immediate visual feedback and synchronizing server state.", duration: 50 }
            ]
          },
          {
            title: "Real-Time Communication with WebSockets",
            desc: "Socket.IO integration for live notifications, presence, and chat",
            lessons: [
              { title: "Setting Up Socket.IO on Express & Node.js", desc: "WebSocket handshakes, rooms, and socket authentication.", duration: 50 },
              { title: "Connecting React to Socket.IO Client", desc: "Managing socket connections, reconnection events, and cleanups.", duration: 50 },
              { title: "Real-Time User Presence & Notifications", desc: "Broadcasting online status and instant alert notifications.", duration: 55 }
            ]
          },
          {
            title: "Testing, Deployment & Capstone Launch",
            desc: "Production build optimization, Dockerization, and cloud deployment",
            lessons: [
              { title: "Optimizing Frontend & Backend Production Builds", desc: "Tree-shaking, code-splitting, asset compression, and gzip.", duration: 45 },
              { title: "Containerizing the Application with Docker", desc: "Writing multi-stage Dockerfiles for client, server, and database.", duration: 55 },
              { title: "Capstone: Launching the Full-Stack Cloud Workspace", desc: "Deploying the complete application to a cloud production server.", duration: 65 }
            ]
          }
        ]
      },
      {
        title: "REST API Development",
        desc: "API design principles, status codes, OpenAPI specs, authentication, rate limiting, and API security.",
        level: "Intermediate",
        duration: 18,
        modules: [
          {
            title: "REST Principles & URI Design",
            desc: "Resource-oriented design, HTTP methods, and status codes",
            lessons: [
              { title: "Core REST Constraints & Architecture", desc: "Statelessness, client-server separation, and uniform interfaces.", duration: 30 },
              { title: "Designing Clean Resource URIs", desc: "Singular vs plural naming, nested resources, and filtering queries.", duration: 35 },
              { title: "Proper Usage of HTTP Status Codes", desc: "200, 201, 204, 400, 401, 403, 404, 409, 422, and 500.", duration: 35 }
            ]
          },
          {
            title: "Request Validation & Error Schemas",
            desc: "Validating incoming payloads and returning standardized error JSON",
            lessons: [
              { title: "Schema Validation with Zod / Joi", desc: "Validating body, params, and query schemas before execution.", duration: 40 },
              { title: "Standardized RFC 7807 Error Responses", desc: "Building consistent, readable error objects for API consumers.", duration: 40 },
              { title: "Handling Edge Cases & Partial Updates (PATCH)", desc: "Implementing true idempotent PUT vs partial PATCH updates.", duration: 45 }
            ]
          },
          {
            title: "Pagination, Filtering & Sorting",
            desc: "Handling large datasets with performant query interfaces",
            lessons: [
              { title: "Offset-Based vs Keyset (Cursor) Pagination", desc: "When to choose page/limit vs cursor for high scalability.", duration: 45 },
              { title: "Dynamic Multi-Field Sorting & Filtering", desc: "Parsing query parameters safely into SQL clauses.", duration: 45 },
              { title: "Field Selection & Sparse Fieldsets", desc: "Allowing API consumers to specify only the fields they need.", duration: 40 }
            ]
          },
          {
            title: "API Security, Throttling & Caching",
            desc: "Securing public and private endpoints against abuse",
            lessons: [
              { title: "Rate Limiting with Redis / In-Memory Store", desc: "Leaky bucket and token bucket algorithms to prevent DDoS.", duration: 45 },
              { title: "API Keys & OAuth2 Token Verification", desc: "Securing APIs for third-party developers and machine-to-machine.", duration: 50 },
              { title: "HTTP Caching Headers: ETag, Cache-Control", desc: "Conditional requests (304 Not Modified) to eliminate server load.", duration: 45 }
            ]
          },
          {
            title: "OpenAPI Documentation & Capstone",
            desc: "Swagger/OpenAPI documentation, testing, and production launch",
            lessons: [
              { title: "Documenting APIs with OpenAPI 3.0 / Swagger", desc: "Generating interactive API documentation for consumers.", duration: 45 },
              { title: "Automated API Contract Testing with Supertest", desc: "Writing integration tests to verify API response shapes.", duration: 50 },
              { title: "Capstone: Enterprise-Grade Microservice API", desc: "Building a production-ready, fully documented public API.", duration: 55 }
            ]
          }
        ]
      },
      {
        title: "Frontend Development",
        desc: "Advanced frontend engineering, performance optimization, state management, and modern Webpack/Vite setups.",
        level: "Intermediate",
        duration: 26,
        modules: [
          {
            title: "Advanced Browser Mechanics & Rendering",
            desc: "Critical rendering path, reflow, repaint, and compositing",
            lessons: [
              { title: "The Critical Rendering Path Deep Dive", desc: "DOM, CSSOM, Render Tree, layout, paint, and composite stages.", duration: 35 },
              { title: "Eliminating Layout Thrashing & Forced Reflows", desc: "Batching DOM mutations and writing high-performance UI scripts.", duration: 40 },
              { title: "Resource Hints: Preload, Prefetch & Preconnect", desc: "Accelerating asset delivery and optimizing time to first paint.", duration: 40 }
            ]
          },
          {
            title: "Frontend Architecture & Design Systems",
            desc: "Component architecture, design tokens, and modular stylesheets",
            lessons: [
              { title: "Atomic Design Methodology for Components", desc: "Atoms, molecules, organisms, templates, and reusable pages.", duration: 40 },
              { title: "Building Scalable Design Tokens in CSS", desc: "Color scales, elevation levels, typography scales, and theme modes.", duration: 45 },
              { title: "Accessible Web Components (WCAG 2.1 AA)", desc: "ARIA roles, keyboard navigation, focus management, and contrast.", duration: 45 }
            ]
          },
          {
            title: "State Management Architecture",
            desc: "Local, global, and server cache state strategies",
            lessons: [
              { title: "State Management Tradeoffs (Redux vs Context vs Zustand)", desc: "Understanding when lightweight stores outperform complex state engines.", duration: 45 },
              { title: "Server State vs Client State Separation", desc: "Managing cache, staleness, and background revalidation.", duration: 45 },
              { title: "Form State Architecture & Performance", desc: "Optimizing input rendering in complex multi-step enterprise forms.", duration: 45 }
            ]
          },
          {
            title: "Performance Optimization & Web Vitals",
            desc: "LCP, FID, CLS, lazy loading, and bundle size reduction",
            lessons: [
              { title: "Measuring Core Web Vitals (LCP, INP, CLS)", desc: "Analyzing performance audits and field data with Lighthouse.", duration: 45 },
              { title: "Route-Based Code Splitting & Dynamic Imports", desc: "React.lazy, Suspense, and shrinking initial JavaScript bundles.", duration: 45 },
              { title: "Image & Media Optimization Strategies", desc: "WebP, AVIF, responsive image srcset, and lazy loading offscreen media.", duration: 40 }
            ]
          },
          {
            title: "Testing, CI/CD & Capstone Project",
            desc: "Unit testing, end-to-end testing, and production deployment",
            lessons: [
              { title: "Unit Testing Components with React Testing Library", desc: "Testing user behavior instead of implementation details.", duration: 45 },
              { title: "End-to-End Testing with Playwright", desc: "Automating user flows across Chromium, Firefox, and WebKit.", duration: 50 },
              { title: "Capstone: High-Performance Enterprise Web Application", desc: "Architecting and releasing a fully audited frontend application.", duration: 60 }
            ]
          }
        ]
      },
      {
        title: "Backend Development",
        desc: "Scalable backend systems, caching, message queues, relational database optimization, and microservices.",
        level: "Advanced",
        duration: 32,
        modules: [
          {
            title: "Scalable Backend Architecture",
            desc: "Layered architectures, dependency inversion, and clean controllers",
            lessons: [
              { title: "Layered Architecture: Controller, Service, Repository", desc: "Separating business logic from HTTP transport and data access.", duration: 40 },
              { title: "Dependency Injection & Inversion of Control", desc: "Decoupling components for easy testability and maintenance.", duration: 45 },
              { title: "Handling High Concurrency & Threading Models", desc: "Process clustering, thread pools, and asynchronous event loops.", duration: 45 }
            ]
          },
          {
            title: "Database Performance & Advanced Indexing",
            desc: "Query optimization, EXPLAIN ANALYZE, and indexing strategies",
            lessons: [
              { title: "Analyzing Query Execution Plans with EXPLAIN", desc: "Sequential scans vs index scans, joins, and cost calculations.", duration: 50 },
              { title: "B-Tree, Hash & GIN Indexing in PostgreSQL", desc: "Choosing appropriate indexes for lookups, ranges, and full-text search.", duration: 50 },
              { title: "Database Transactions & Isolation Levels", desc: "ACID guarantees, dirty reads, non-repeatable reads, and serializable isolation.", duration: 45 }
            ]
          },
          {
            title: "Caching Strategies with Redis",
            desc: "In-memory caching, cache-aside, write-through, and cache stampede",
            lessons: [
              { title: "Redis Data Structures for Backend Engineers", desc: "Strings, hashes, sets, sorted sets, and atomic increments.", duration: 45 },
              { title: "Cache-Aside Pattern & TTL Invalidation", desc: "Strategies for updating and invalidating cached database records.", duration: 45 },
              { title: "Preventing Cache Stampede & Thundering Herd", desc: "Distributed locking and probabilistic early expiration.", duration: 50 }
            ]
          },
          {
            title: "Asynchronous Job Queues & Message Brokers",
            desc: "Background processing, BullMQ, RabbitMQ, and event-driven tasks",
            lessons: [
              { title: "Why Message Queues Matter in Production", desc: "Offloading PDF generation, emails, and compute-heavy jobs.", duration: 45 },
              { title: "Implementing Redis-Based Job Queues (BullMQ)", desc: "Job concurrency, retries, backoff strategies, and dead-letter queues.", duration: 50 },
              { title: "Idempotency & Safe Duplicate Event Processing", desc: "Ensuring operations can run multiple times without unintended side effects.", duration: 50 }
            ]
          },
          {
            title: "Microservices & Distributed Systems Capstone",
            desc: "Service boundaries, inter-service communication, and resilient architecture",
            lessons: [
              { title: "Decomposing Monoliths into Microservices", desc: "Domain-Driven Design (DDD), bounded contexts, and data ownership.", duration: 50 },
              { title: "Circuit Breakers, Health Checks & Observability", desc: "Preventing cascading failures and implementing structured JSON logging.", duration: 55 },
              { title: "Capstone: Distributed Backend with Queue & Cache", desc: "Building a fault-tolerant multi-service backend with Redis and PostgreSQL.", duration: 65 }
            ]
          }
        ]
      }
    ]
  }
];

// Helper to generate courses for remaining 17 categories with high quality content
const ADDITIONAL_TRACK_DEFINITIONS = [
  {
    categoryName: "Mobile Development",
    description: "Native and cross-platform mobile application development",
    trackName: "Mobile Development Track",
    trackDesc: "Build iOS and Android apps with Kotlin, Flutter, and React Native",
    courseTitles: [
      { title: "Android Development", desc: "Native Android development with Kotlin, Jetpack Compose, ViewModels, and Room database.", level: "Intermediate", duration: 30 },
      { title: "Flutter Development", desc: "Cross-platform mobile apps with Dart, Flutter widgets, state management, and native device APIs.", level: "Intermediate", duration: 28 },
      { title: "React Native", desc: "Build native iOS and Android apps using React Native, Expo, hooks, and native bridge modules.", level: "Intermediate", duration: 25 }
    ]
  },
  {
    categoryName: "Database",
    description: "Relational SQL and NoSQL database management and optimization",
    trackName: "Database Engineering Track",
    trackDesc: "Master PostgreSQL, MySQL, MongoDB, and high-scale relational database design",
    courseTitles: [
      { title: "SQL Fundamentals", desc: "Relational database basics, queries, joins, aggregates, subqueries, and table normalization.", level: "Beginner", duration: 15 },
      { title: "PostgreSQL", desc: "Advanced PostgreSQL features, JSONB, indexing strategies, triggers, stored procedures, and optimization.", level: "Intermediate", duration: 22 },
      { title: "MySQL", desc: "MySQL database administration, storage engines, transactional integrity, and query profiling.", level: "Beginner", duration: 18 },
      { title: "Database Design", desc: "Entity-Relationship modeling, normal forms, indexing patterns, and schema design for scale.", level: "Intermediate", duration: 20 },
      { title: "MongoDB", desc: "NoSQL document database development, aggregation framework, indexing, and Mongoose ODM.", level: "Intermediate", duration: 18 },
      { title: "Advanced SQL", desc: "Window functions, Common Table Expressions (CTEs), recursive queries, and query performance tuning.", level: "Advanced", duration: 25 }
    ]
  },
  {
    categoryName: "Data Structures & Algorithms",
    description: "Core algorithms, data structures, and algorithmic problem solving",
    trackName: "Data Structures & Algorithms Track",
    trackDesc: "Master algorithmic foundations for technical interviews and competitive programming",
    courseTitles: [
      { title: "DSA Fundamentals", desc: "Time and space complexity, Big-O analysis, memory layout, and fundamental data structures.", level: "Beginner", duration: 20 },
      { title: "Arrays & Strings", desc: "Two pointers, sliding window, prefix sums, matrix transformations, and string algorithms.", level: "Beginner", duration: 22 },
      { title: "Linked Lists", desc: "Singly, doubly, and circular linked lists, pointer manipulation, and fast & slow pointers.", level: "Beginner", duration: 16 },
      { title: "Stacks & Queues", desc: "LIFO and FIFO data structures, monotonic stacks, priority queues, and evaluation engines.", level: "Beginner", duration: 18 },
      { title: "Trees & Binary Trees", desc: "Tree traversals, Binary Search Trees (BST), AVL trees, Segment trees, and Trie data structures.", level: "Intermediate", duration: 28 },
      { title: "Graph Algorithms", desc: "BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Topological Sort, and Disjoint Set Union.", level: "Advanced", duration: 32 },
      { title: "Sorting & Searching", desc: "Binary search variations, QuickSort, MergeSort, HeapSort, and non-comparison sorting algorithms.", level: "Beginner", duration: 18 },
      { title: "Dynamic Programming", desc: "Memoization, tabulation, knapsack problems, LCS, LIS, grid DP, and interval dynamic programming.", level: "Advanced", duration: 36 },
      { title: "Competitive DSA", desc: "Advanced competitive algorithmic techniques, bit manipulation, number theory, and game theory.", level: "Advanced", duration: 35 },
      { title: "Problem Solving", desc: "Structured problem-solving strategies, pattern recognition, and interview whiteboard techniques.", level: "Intermediate", duration: 24 }
    ]
  },
  {
    categoryName: "Cloud Computing",
    description: "Cloud platforms, infrastructure, serverless architectures, and security",
    trackName: "Cloud Computing Track",
    trackDesc: "Master AWS, cloud architecture patterns, and enterprise cloud infrastructure",
    courseTitles: [
      { title: "Cloud Computing Fundamentals", desc: "IaaS, PaaS, SaaS, virtualization, multi-tenancy, and cloud economic models.", level: "Beginner", duration: 14 },
      { title: "AWS Fundamentals", desc: "Core AWS ecosystem, regions, availability zones, billing, and core foundational services.", level: "Beginner", duration: 18 },
      { title: "AWS EC2", desc: "Virtual computing in the cloud, instance types, AMIs, Auto Scaling groups, and Elastic Load Balancing.", level: "Intermediate", duration: 20 },
      { title: "AWS S3", desc: "Object storage architecture, lifecycle policies, versioning, access control, and static site hosting.", level: "Beginner", duration: 16 },
      { title: "AWS IAM", desc: "Identity & Access Management, policies, roles, permissions boundaries, and least-privilege security.", level: "Intermediate", duration: 16 },
      { title: "AWS Lambda", desc: "Serverless compute, event triggers, serverless architecture patterns, and cold start optimization.", level: "Intermediate", duration: 20 },
      { title: "Cloud Architecture", desc: "Well-Architected Framework, high availability, fault tolerance, and multi-region deployment.", level: "Advanced", duration: 28 },
      { title: "Cloud Security", desc: "Encryption at rest and in transit, VPC networking, security groups, CloudTrail, and compliance.", level: "Advanced", duration: 24 }
    ]
  },
  {
    categoryName: "DevOps",
    description: "Continuous integration, containerization, automation, and infrastructure as code",
    trackName: "DevOps Engineering Track",
    trackDesc: "Learn Docker, Kubernetes, CI/CD pipelines, Linux, and cloud automation",
    courseTitles: [
      { title: "DevOps Fundamentals", desc: "DevOps culture, CALMS framework, automation principles, and continuous delivery pipelines.", level: "Beginner", duration: 16 },
      { title: "Linux for DevOps", desc: "Bash scripting, process management, SSH, systemd services, permissions, and network tooling.", level: "Beginner", duration: 20 },
      { title: "Git & GitHub", desc: "Advanced branching workflows, rebasing, merge conflict resolution, submodules, and GitHub Actions.", level: "Beginner", duration: 14 },
      { title: "Docker", desc: "Containerization fundamentals, multi-stage Dockerfiles, networking, volumes, and Docker Compose.", level: "Intermediate", duration: 22 },
      { title: "Kubernetes", desc: "Pod orchestration, Deployments, Services, Ingress, ConfigMaps, Secrets, and Helm package manager.", level: "Advanced", duration: 32 },
      { title: "CI/CD", desc: "Continuous integration and deployment automation, automated testing gates, and release strategies.", level: "Intermediate", duration: 20 },
      { title: "Jenkins", desc: "Declarative pipelines, Jenkinsfile automation, distributed agents, and enterprise build automation.", level: "Intermediate", duration: 18 },
      { title: "Infrastructure Basics", desc: "Networking, DNS, load balancing, reverse proxies with Nginx, and system reliability.", level: "Intermediate", duration: 22 },
      { title: "AWS DevOps", desc: "AWS CodePipeline, CodeBuild, CodeDeploy, Elastic Beanstalk, and CloudFormation infrastructure as code.", level: "Advanced", duration: 26 }
    ]
  },
  {
    categoryName: "Artificial Intelligence",
    description: "Artificial intelligence, deep learning, computer vision, NLP, and Generative AI",
    trackName: "Artificial Intelligence Track",
    trackDesc: "Master foundational and modern generative AI models and intelligent systems",
    courseTitles: [
      { title: "AI Fundamentals", desc: "Core AI concepts, search algorithms, heuristic search, knowledge representation, and expert systems.", level: "Beginner", duration: 18 },
      { title: "Introduction to Generative AI", desc: "LLMs, prompt engineering, diffusion models, embeddings, and generative AI tools.", level: "Beginner", duration: 16 },
      { title: "AI Problem Solving", desc: "State-space search, adversarial search, minimax with alpha-beta pruning, and constraint satisfaction.", level: "Intermediate", duration: 22 },
      { title: "Neural Networks", desc: "Perceptrons, backpropagation, activation functions, loss functions, and optimization algorithms.", level: "Intermediate", duration: 24 },
      { title: "Deep Learning", desc: "Architectures with PyTorch & TensorFlow, CNNs, RNNs, Transformers, and training dynamics.", level: "Advanced", duration: 32 },
      { title: "Computer Vision", desc: "Image processing, convolution operations, object detection with YOLO, and image segmentation.", level: "Advanced", duration: 28 },
      { title: "Natural Language Processing", desc: "Tokenization, word vectors, sentiment analysis, attention mechanisms, and BERT/GPT models.", level: "Advanced", duration: 30 },
      { title: "AI Application Development", desc: "Building AI-powered applications with LangChain, vector databases, and Retrieval-Augmented Generation.", level: "Advanced", duration: 28 }
    ]
  },
  {
    categoryName: "Data Analytics",
    description: "Data analysis, business intelligence, visualization, and reporting tools",
    trackName: "Data Analytics Track",
    trackDesc: "Transform raw data into business intelligence using Excel, SQL, Python, and Power BI",
    courseTitles: [
      { title: "Data Analytics Fundamentals", desc: "Analytics lifecycle, data types, descriptive and diagnostic analysis, and KPI tracking.", level: "Beginner", duration: 14 },
      { title: "Excel for Data Analytics", desc: "Pivot tables, VLOOKUP/XLOOKUP, statistical functions, data modeling, and dashboards in Excel.", level: "Beginner", duration: 16 },
      { title: "SQL for Data Analytics", desc: "Aggregations, analytical window functions, cohort analysis, and funnel metrics with SQL.", level: "Intermediate", duration: 20 },
      { title: "Python for Data Analytics", desc: "Exploratory data analysis, cleaning datasets, automation, and analytics workflows with Python.", level: "Intermediate", duration: 22 },
      { title: "Pandas & NumPy", desc: "Vectorized operations, dataframes, grouping, pivoting, merging, and time-series manipulation.", level: "Intermediate", duration: 20 },
      { title: "Data Visualization", desc: "Storytelling with charts, Matplotlib, Seaborn, design guidelines, and interactive charts.", level: "Beginner", duration: 16 },
      { title: "Power BI", desc: "Power Query, DAX formulas, relationship modeling, and interactive executive reporting dashboards.", level: "Intermediate", duration: 24 },
      { title: "Tableau", desc: "Calculated fields, parameters, geospatial mapping, dashboard actions, and visual data stories.", level: "Intermediate", duration: 22 }
    ]
  },
  {
    categoryName: "Data Science",
    description: "Statistical modeling, predictive algorithms, data mining, and machine learning",
    trackName: "Data Science Track",
    trackDesc: "Master statistical modeling, data preparation, feature engineering, and model validation",
    courseTitles: [
      { title: "Data Science Fundamentals", desc: "Data science lifecycle, framing business problems, data hygiene, and predictive analytics.", level: "Beginner", duration: 16 },
      { title: "Python for Data Science", desc: "Scikit-Learn, SciPy, Jupyter environments, and reproducible data scientific workflows.", level: "Beginner", duration: 20 },
      { title: "Statistics for Data Science", desc: "Probability distributions, hypothesis testing, p-values, confidence intervals, and regression.", level: "Intermediate", duration: 22 },
      { title: "Machine Learning Fundamentals", desc: "Supervised and unsupervised learning foundations, bias-variance tradeoff, and cross-validation.", level: "Intermediate", duration: 26 },
      { title: "Feature Engineering", desc: "Encoding categorical variables, imputation, scaling, polynomial features, and dimension reduction.", level: "Intermediate", duration: 20 },
      { title: "Data Preprocessing", desc: "Handling missing data, outlier detection, data normalization, and robust transformation pipelines.", level: "Beginner", duration: 18 },
      { title: "Model Evaluation", desc: "ROC-AUC, Precision-Recall, F1-score, confusion matrix, error analysis, and metric selection.", level: "Intermediate", duration: 16 }
    ]
  },
  {
    categoryName: "Cyber Security",
    description: "Information security, ethical hacking, network defense, and application security",
    trackName: "Cyber Security Track",
    trackDesc: "Defend networks, audit web applications, and implement modern cyber security architectures",
    courseTitles: [
      { title: "Cyber Security Fundamentals", desc: "CIA triad, threat vectors, risk management, security principles, and defense-in-depth.", level: "Beginner", duration: 16 },
      { title: "Network Security", desc: "Firewalls, IDS/IPS, VPNs, packet analysis with Wireshark, and network vulnerability scanning.", level: "Intermediate", duration: 22 },
      { title: "Ethical Security Fundamentals", desc: "Ethical hacking methodology, reconnaissance, scanning, exploitation, and reporting.", level: "Intermediate", duration: 26 },
      { title: "Web Security Fundamentals", desc: "OWASP Top 10 vulnerabilities: SQLi, XSS, CSRF, SSRF, and secure coding practices.", level: "Intermediate", duration: 24 },
      { title: "Authentication & Authorization", desc: "OAuth 2.0, OpenID Connect, JWT security, RBAC, ABAC, and multi-factor authentication.", level: "Intermediate", duration: 20 },
      { title: "Security Best Practices", desc: "Secrets management, least privilege, zero-trust architectures, and cloud hardening.", level: "Intermediate", duration: 18 },
      { title: "Cyber Threat Fundamentals", desc: "Malware types, ransomware mitigation, social engineering, and incident response frameworks.", level: "Beginner", duration: 16 }
    ]
  },
  {
    categoryName: "Networking",
    description: "Computer networks, protocols, infrastructure, routing, and switching",
    trackName: "Computer Networks Track",
    trackDesc: "Understand packet lifecycles, TCP/IP, DNS, HTTP/3, and routing protocols",
    courseTitles: [
      { title: "Computer Networks Fundamentals", desc: "OSI 7-layer model, network topologies, physical and data link layers, and framing.", level: "Beginner", duration: 16 },
      { title: "TCP/IP", desc: "Three-way handshakes, congestion control, windowing, UDP protocols, and IP addressing.", level: "Intermediate", duration: 20 },
      { title: "HTTP & HTTPS", desc: "Request/response lifecycles, HTTP methods, headers, status codes, TLS/SSL handshakes, and HTTP/2/3.", level: "Beginner", duration: 16 },
      { title: "DNS", desc: "Domain Name System resolution, DNS record types (A, CNAME, MX, TXT), caching, and propagation.", level: "Beginner", duration: 14 },
      { title: "Routing & Switching", desc: "VLANs, subnetting, CIDR, static routing, OSPF, BGP, and packet routing mechanics.", level: "Intermediate", duration: 24 },
      { title: "Network Security Basics", desc: "Network segmentation, NAT, DMZ architectures, SSL decryption, and DDoS mitigation.", level: "Intermediate", duration: 18 }
    ]
  },
  {
    categoryName: "Operating Systems",
    description: "Operating system architecture, process management, memory, and file systems",
    trackName: "Operating Systems Track",
    trackDesc: "Master CPU scheduling, virtual memory, threads, and Linux kernel fundamentals",
    courseTitles: [
      { title: "Operating Systems Fundamentals", desc: "Kernel vs user space, system calls, OS architecture, and hardware abstraction.", level: "Beginner", duration: 16 },
      { title: "Processes & Threads", desc: "Process lifecycle, PCB, context switching, multithreading models, and inter-process communication.", level: "Intermediate", duration: 20 },
      { title: "CPU Scheduling", desc: "First-Come-First-Serve, Round Robin, Shortest Job First, priority scheduling, and multi-level queues.", level: "Intermediate", duration: 18 },
      { title: "Memory Management", desc: "Virtual memory, paging, page replacement algorithms, segmentation, and thrashing.", level: "Intermediate", duration: 22 },
      { title: "File Systems", desc: "Inodes, file allocation tables, journaling file systems, permissions, and directory structures.", level: "Intermediate", duration: 18 },
      { title: "Linux Fundamentals", desc: "Linux directory hierarchy, shell scripting, package management, and system administration.", level: "Beginner", duration: 20 }
    ]
  },
  {
    categoryName: "Software Engineering",
    description: "Software design patterns, architecture, agile development, and clean code",
    trackName: "Software Engineering Track",
    trackDesc: "Learn clean code principles, design patterns, SDLC, testing, and system architecture",
    courseTitles: [
      { title: "Software Engineering Fundamentals", desc: "Software development methodologies, requirement engineering, and quality assurance.", level: "Beginner", duration: 16 },
      { title: "SDLC", desc: "Waterfall, V-Model, Spiral, and modern iterative software development lifecycles.", level: "Beginner", duration: 14 },
      { title: "Agile & Scrum", desc: "Scrum ceremonies, sprints, user stories, velocity tracking, kanban boards, and backlog grooming.", level: "Beginner", duration: 16 },
      { title: "Software Architecture", desc: "Monoliths, layered architecture, microservices, event-driven architecture, and CQRS.", level: "Advanced", duration: 26 },
      { title: "Design Patterns", desc: "Creational, Structural, and Behavioral Gang of Four patterns with real production code examples.", level: "Intermediate", duration: 24 },
      { title: "Testing Fundamentals", desc: "Unit testing, integration testing, E2E testing, test-driven development (TDD), and mocking.", level: "Intermediate", duration: 18 },
      { title: "Clean Code", desc: "SOLID principles, meaningful naming, refactoring techniques, DRY, and code review standards.", level: "Intermediate", duration: 16 },
      { title: "Git Workflow", desc: "GitFlow, trunk-based development, pull request conventions, and release versioning (SemVer).", level: "Beginner", duration: 14 }
    ]
  },
  {
    categoryName: "Aptitude & Placement",
    description: "Quantitative, logical, and verbal aptitude preparation for campus and corporate placements",
    trackName: "Aptitude & Placement Track",
    trackDesc: "Prepare for corporate hiring exams, technical interviews, and HR assessment rounds",
    courseTitles: [
      { title: "Quantitative Aptitude", desc: "Formulas, speed math, equations, algebra, and essential numerical problem solving.", level: "Beginner", duration: 20 },
      { title: "Logical Reasoning", desc: "Coding-decoding, blood relations, direction sense, syllogisms, and puzzle solving.", level: "Beginner", duration: 18 },
      { title: "Verbal Ability", desc: "Reading comprehension, sentence correction, grammar rules, vocabulary, and verbal aptitude.", level: "Beginner", duration: 16 },
      { title: "Number Systems", desc: "Divisibility rules, factors, prime numbers, LCM, GCD, and modular arithmetic shortcuts.", level: "Beginner", duration: 14 },
      { title: "Percentages", desc: "Percentage calculation techniques, profit and loss, discounts, and practical business math.", level: "Beginner", duration: 14 },
      { title: "Probability", desc: "Independent events, conditional probability, permutations, combinations, and Bayes theorem.", level: "Intermediate", duration: 16 },
      { title: "Time & Work", desc: "Efficiency problems, pipes and cisterns, joint work, and work-time shortcut formulas.", level: "Beginner", duration: 14 },
      { title: "Time & Distance", desc: "Relative speed, trains, boats and streams, races, and average speed equations.", level: "Beginner", duration: 14 },
      { title: "Placement Preparation", desc: "End-to-end recruitment process guidance, aptitude strategy, and company test formats.", level: "Beginner", duration: 18 },
      { title: "Technical Interview Preparation", desc: "Coding whiteboard rounds, system architecture questions, and behavioral responses.", level: "Intermediate", duration: 22 },
      { title: "HR Interview Preparation", desc: "STAR method, situational interview questions, leadership principles, and salary negotiation.", level: "Beginner", duration: 12 }
    ]
  },
  {
    categoryName: "Competitive Programming",
    description: "Algorithmic contests, fast problem solving, and complex data structures",
    trackName: "Competitive Programming Track",
    trackDesc: "Excel in Codeforces, LeetCode, CodeChef, and international programming contests",
    courseTitles: [
      { title: "Competitive Programming Fundamentals", desc: "Fast I/O, competitive environments, time-limit constraints, and contest setups.", level: "Beginner", duration: 16 },
      { title: "Problem Solving", desc: "Deconstructing contest problems, edge cases, brute-force to optimal transformations, and testing.", level: "Intermediate", duration: 24 },
      { title: "Advanced DSA", desc: "Fenwick trees, Heavy-Light Decomposition, Suffix Automata, and Treap data structures.", level: "Advanced", duration: 34 },
      { title: "Algorithms", desc: "Binary lifting, lowest common ancestor, matrix exponentiation, and network flow algorithms.", level: "Advanced", duration: 30 },
      { title: "Contest Preparation", desc: "Virtual contest strategies, time management, Codeforces / LeetCode contest mastery.", level: "Advanced", duration: 20 }
    ]
  },
  {
    categoryName: "UI/UX Design",
    description: "User experience research, wireframing, Figma design systems, and prototyping",
    trackName: "UI/UX Design Track",
    trackDesc: "Master user research, interface prototyping, Figma auto-layout, and design systems",
    courseTitles: [
      { title: "UI/UX Fundamentals", desc: "User-centered design principles, visual hierarchy, contrast, gestalt principles, and typography.", level: "Beginner", duration: 16 },
      { title: "Figma", desc: "Auto-layout, components, variants, design tokens, interactive components, and export workflows.", level: "Beginner", duration: 22 },
      { title: "User Research", desc: "User interviews, empathy mapping, persona creation, card sorting, and usability testing.", level: "Beginner", duration: 16 },
      { title: "Wireframing", desc: "Low-fidelity sketching, information architecture, user flows, and structured layout wireframes.", level: "Beginner", duration: 14 },
      { title: "Prototyping", desc: "Interactive micro-animations, clickable prototypes, smart animate, and user journey validation.", level: "Intermediate", duration: 18 },
      { title: "Design Systems", desc: "Color systems, typography scales, spacing units, atomic design, and reusable component libraries.", level: "Intermediate", duration: 22 },
      { title: "UX Principles", desc: "Fitts's Law, Hick's Law, cognitive load, affordance, feedback loops, and error prevention design.", level: "Beginner", duration: 16 }
    ]
  },
  {
    categoryName: "Career Skills",
    description: "Professional soft skills, resume building, portfolio creation, and workplace collaboration",
    trackName: "Career Skills Track",
    trackDesc: "Build resumes, polish GitHub/LinkedIn profiles, and communicate effectively in software teams",
    courseTitles: [
      { title: "Resume Building", desc: "Crafting ATS-friendly software engineering resumes, action verbs, and quantifiable impact.", level: "Beginner", duration: 10 },
      { title: "GitHub Portfolio", desc: "README polish, pinning open-source projects, documentation standards, and showcasing live apps.", level: "Beginner", duration: 12 },
      { title: "LinkedIn Profile", desc: "Headline optimization, engaging project posts, skill endorsements, and professional networking.", level: "Beginner", duration: 10 },
      { title: "Communication Skills", desc: "Clear technical explanations, asking good questions, active listening, and concise writing.", level: "Beginner", duration: 12 },
      { title: "Presentation Skills", desc: "Slide deck structure, demoing software to stakeholders, public speaking, and body language.", level: "Beginner", duration: 12 },
      { title: "Interview Skills", desc: "Answering behavioral questions, articulating thought processes, and post-interview follow-ups.", level: "Beginner", duration: 14 },
      { title: "Team Collaboration", desc: "Working with cross-functional teams, code reviews, empathy, and conflict resolution.", level: "Beginner", duration: 12 },
      { title: "Professional Skills", desc: "Time management, prioritization, remote work habits, continuous learning, and career growth.", level: "Beginner", duration: 12 }
    ]
  },
  {
    categoryName: "Machine Learning",
    description: "Machine learning algorithms, regression, classification, clustering, and deployment",
    trackName: "Machine Learning Track",
    trackDesc: "Learn predictive modeling, Scikit-Learn pipelines, feature engineering, and model deployment",
    courseTitles: [
      { title: "Machine Learning Fundamentals", desc: "Mathematical foundations, linear algebra, calculus, and basic machine learning workflows.", level: "Beginner", duration: 20 },
      { title: "Supervised Learning", desc: "Classification and regression models, training, validation, and inductive bias.", level: "Intermediate", duration: 24 },
      { title: "Unsupervised Learning", desc: "K-Means, hierarchical clustering, DBSCAN, PCA, and anomaly detection.", level: "Intermediate", duration: 22 },
      { title: "Regression", desc: "Linear regression, polynomial regression, Ridge, Lasso, and cost function optimization.", level: "Beginner", duration: 18 },
      { title: "Classification", desc: "Logistic regression, Decision Trees, Random Forests, Support Vector Machines, and Naive Bayes.", level: "Intermediate", duration: 24 },
      { title: "Clustering", desc: "Density-based spatial clustering, centroid-based models, silhouette scores, and customer segmentation.", level: "Intermediate", duration: 18 },
      { title: "Feature Engineering", desc: "Data transformations, handling high-cardinality features, embeddings, and interaction terms.", level: "Intermediate", duration: 20 },
      { title: "Model Evaluation", desc: "Cross-validation strategies, hyperparameter tuning with GridSearchCV and Optuna, and bias metrics.", level: "Intermediate", duration: 18 },
      { title: "ML Projects", desc: "End-to-end machine learning project deployment: Flask/FastAPI API wrapper, Dockerization, and monitoring.", level: "Advanced", duration: 30 }
    ]
  }
];

// Helper to generate standard 5 modules for any course
function generateStandardModules(courseTitle, categoryName) {
  return [
    {
      title: `${courseTitle} Foundations`,
      desc: `Core concepts, architecture, and foundational principles of ${courseTitle}`,
      lessons: [
        { title: `Introduction to ${courseTitle}`, desc: `Overview, historical context, and core architectural philosophy of ${courseTitle}.`, duration: 25 },
        { title: `Core Principles & Primitives`, desc: `Essential primitives, syntax, and foundational patterns in ${courseTitle}.`, duration: 35 },
        { title: `Environment Setup & Tooling`, desc: `Installing required runtimes, linters, package managers, and editors.`, duration: 30 }
      ]
    },
    {
      title: "Core Mechanics & Techniques",
      desc: `Practical techniques, best practices, and standard operations in ${courseTitle}`,
      lessons: [
        { title: "Fundamental Operations & Data Flow", desc: `Working with data models, transformations, and control flow.`, duration: 40 },
        { title: "Idiomatic Patterns & Best Practices", desc: `Industry standards, clean structure, and common antipatterns to avoid.`, duration: 35 },
        { title: "Error Handling & Edge Cases", desc: `Anticipating boundary conditions, defensive design, and exception handling.`, duration: 40 }
      ]
    },
    {
      title: "Intermediate Applications",
      desc: `Applying ${courseTitle} to realistic software development workflows`,
      lessons: [
        { title: "Modular Architecture & Organization", desc: `Structuring larger codebases into cohesive, loosely coupled units.`, duration: 40 },
        { title: "Integration with Supporting Ecosystem", desc: `Connecting with third-party libraries, APIs, and persistent storage.`, duration: 45 },
        { title: "State Management & Lifecycle", desc: `Managing state transitions, memory boundaries, and execution lifecycles.`, duration: 40 }
      ]
    },
    {
      title: "Advanced Topics & Optimization",
      desc: `Performance tuning, security considerations, and architectural scalability`,
      lessons: [
        { title: "Performance Profiling & Bottlenecks", desc: `Measuring throughput, memory footprint, and eliminating bottlenecks.`, duration: 45 },
        { title: "Security Best Practices & Hardening", desc: `Validating inputs, managing credentials, and adhering to security baselines.`, duration: 45 },
        { title: "Scalability & Distributed Patterns", desc: `Scaling techniques, concurrency models, and resilient system design.`, duration: 50 }
      ]
    },
    {
      title: "Production Deployment & Capstone",
      desc: `Testing, CI/CD, monitoring, and practical capstone project implementation`,
      lessons: [
        { title: "Automated Testing Strategies", desc: `Writing unit and integration tests to ensure deterministic behavior.`, duration: 45 },
        { title: "Packaging & Production Release", desc: `Building artifacts, containerization, and release configurations.`, duration: 45 },
        { title: `Capstone: Production ${courseTitle} Project`, desc: `Delivering a comprehensive real-world project demonstrating all core skills.`, duration: 60 }
      ]
    }
  ];
}

// Generate realistic quiz questions for each course
function generateCourseQuiz(courseTitle) {
  return {
    title: `${courseTitle} Comprehensive Assessment`,
    desc: `Test your understanding of core concepts, architecture, and practical application in ${courseTitle}.`,
    passingMarks: 70,
    totalMarks: 100,
    timeLimit: 25,
    questions: [
      {
        question: `What is the primary architectural purpose or benefit of ${courseTitle}?`,
        optionA: "Providing structured, maintainable, and high-performance solutions for its domain.",
        optionB: "Eliminating the need for software testing or debugging entirely.",
        optionC: "Acting purely as an operating system kernel replacement.",
        optionD: "Restricting developer access to modern software tools.",
        correct: "A",
        marks: 25
      },
      {
        question: `Which of the following is considered an industry best practice when using ${courseTitle}?`,
        optionA: "Hardcoding all secret credentials directly in source files.",
        optionB: "Adhering to modular separation of concerns and thorough error handling.",
        optionC: "Ignoring edge cases and disabling compiler or linter warnings.",
        optionD: "Using global mutable state for all concurrent operations.",
        correct: "B",
        marks: 25
      },
      {
        question: `How does proper error handling in ${courseTitle} improve software reliability?`,
        optionA: "It guarantees that the software will execute without requiring CPU cycles.",
        optionB: "It forces the application to terminate on every minor exception.",
        optionC: "It allows graceful recovery, detailed diagnostics, and prevents cascading failures.",
        optionD: "It bypasses network security protocols automatically.",
        correct: "C",
        marks: 25
      },
      {
        question: `In a production environment, how should ${courseTitle} artifacts or code be verified before release?`,
        optionA: "Through automated unit, integration, and performance regression tests.",
        optionB: "By deploying directly to production without testing environments.",
        optionC: "By relying exclusively on manual user bug reports after launch.",
        optionD: "By disabling all logging and telemetry systems.",
        correct: "A",
        marks: 25
      }
    ]
  };
}

// ============================================================================
// MAIN SEED RUNNER
// ============================================================================

async function seed() {
  const client = await pool.connect();
  console.log("🚀 Starting CollabSphere Learning Course Seed...");

  try {
    await client.query("BEGIN");

    // 1. Normalize Category 1 name to 'Programming Languages' if needed
    await client.query(`
      UPDATE learning_categories 
      SET name = 'Programming Languages', description = 'Core and modern programming languages for software engineering'
      WHERE id = 1
    `);

    // Combine all catalog categories
    const allCategoriesToSeed = [
      ...CATALOG,
      ...ADDITIONAL_TRACK_DEFINITIONS.map(def => ({
        categoryName: def.categoryName,
        description: def.description,
        trackName: def.trackName,
        trackDesc: def.trackDesc,
        courses: def.courseTitles.map(c => ({
          title: c.title,
          desc: c.desc,
          level: c.level,
          duration: c.duration,
          modules: generateStandardModules(c.title, def.categoryName)
        }))
      }))
    ];

    let totalCoursesCreated = 0;
    let totalModulesCreated = 0;
    let totalLessonsCreated = 0;
    let totalQuizzesCreated = 0;

    for (const catDef of allCategoriesToSeed) {
      // Find or create category
      let catRes = await client.query(
        "SELECT id FROM learning_categories WHERE LOWER(name) = LOWER($1)",
        [catDef.categoryName]
      );

      let categoryId;
      if (catRes.rows.length === 0) {
        const newCat = await client.query(
          "INSERT INTO learning_categories (name, description) VALUES ($1, $2) RETURNING id",
          [catDef.categoryName, catDef.description]
        );
        categoryId = newCat.rows[0].id;
        console.log(` Created category: "${catDef.categoryName}" (id: ${categoryId})`);
      } else {
        categoryId = catRes.rows[0].id;
      }

      // Find or create track
      let trackRes = await client.query(
        "SELECT id FROM learning_tracks WHERE category_id = $1 AND (LOWER(name) = LOWER($2) OR LOWER(name) LIKE $3)",
        [categoryId, catDef.trackName, `%${catDef.categoryName.toLowerCase()}%`]
      );

      let trackId;
      if (trackRes.rows.length === 0) {
        const newTrack = await client.query(
          "INSERT INTO learning_tracks (category_id, name, description, difficulty) VALUES ($1, $2, $3, $4) RETURNING id",
          [categoryId, catDef.trackName, catDef.trackDesc, "Beginner"]
        );
        trackId = newTrack.rows[0].id;
        console.log(` Created track: "${catDef.trackName}" (id: ${trackId})`);
      } else {
        trackId = trackRes.rows[0].id;
      }

      // Seed Courses for this track
      for (const courseDef of catDef.courses) {
        let courseRes = await client.query(
          "SELECT id FROM courses WHERE track_id = $1 AND LOWER(title) = LOWER($2)",
          [trackId, courseDef.title]
        );

        let courseId;
        if (courseRes.rows.length === 0) {
          const newCourse = await client.query(
            `INSERT INTO courses (track_id, title, description, level, duration_hours, is_published)
             VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
            [trackId, courseDef.title, courseDef.desc, courseDef.level, courseDef.duration]
          );
          courseId = newCourse.rows[0].id;
          totalCoursesCreated++;
        } else {
          courseId = courseRes.rows[0].id;
          // Ensure it is published
          await client.query("UPDATE courses SET is_published = true WHERE id = $1", [courseId]);
        }

        // Modules & Lessons for this course
        const modulesToSeed = courseDef.modules || generateStandardModules(courseDef.title, catDef.categoryName);

        for (let mIdx = 0; mIdx < modulesToSeed.length; mIdx++) {
          const modDef = modulesToSeed[mIdx];
          const modOrder = mIdx + 1;

          let modRes = await client.query(
            "SELECT id FROM modules WHERE course_id = $1 AND module_order = $2",
            [courseId, modOrder]
          );

          let moduleId;
          if (modRes.rows.length === 0) {
            const newMod = await client.query(
              `INSERT INTO modules (course_id, title, description, module_order)
               VALUES ($1, $2, $3, $4) RETURNING id`,
              [courseId, modDef.title, modDef.desc, modOrder]
            );
            moduleId = newMod.rows[0].id;
            totalModulesCreated++;
          } else {
            moduleId = modRes.rows[0].id;
          }

          // Lessons for this module
          const lessonsToSeed = modDef.lessons || [];
          for (let lIdx = 0; lIdx < lessonsToSeed.length; lIdx++) {
            const lesDef = lessonsToSeed[lIdx];
            const lesOrder = lIdx + 1;

            let lesRes = await client.query(
              "SELECT id FROM lessons WHERE module_id = $1 AND lesson_order = $2",
              [moduleId, lesOrder]
            );

            let lessonId;
            if (lesRes.rows.length === 0) {
              const newLes = await client.query(
                `INSERT INTO lessons (module_id, title, description, lesson_order, duration_minutes, is_free)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [moduleId, lesDef.title, lesDef.desc, lesOrder, lesDef.duration || 30, true]
              );
              lessonId = newLes.rows[0].id;
              totalLessonsCreated++;

              // Seed 1-2 resources for this lesson
              await client.query(
                `INSERT INTO lesson_resources (lesson_id, resource_type, title, resource_url)
                 VALUES ($1, 'NOTES', $2, 'https://collabsphere.internal/docs/lessons')`,
                [lessonId, `${lesDef.title} - Study Notes & Code Snippets`]
              );
            }
          }

          // Seed Quiz on the final module of the course if not present
          if (mIdx === modulesToSeed.length - 1) {
            let quizRes = await client.query(
              "SELECT id FROM quizzes WHERE module_id = $1",
              [moduleId]
            );

            if (quizRes.rows.length === 0) {
              const qData = generateCourseQuiz(courseDef.title);
              const newQuiz = await client.query(
                `INSERT INTO quizzes (module_id, title, description, passing_marks, total_marks, time_limit_minutes, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
                [moduleId, qData.title, qData.desc, qData.passingMarks, qData.totalMarks, qData.timeLimit]
              );
              const quizId = newQuiz.rows[0].id;
              totalQuizzesCreated++;

              for (const q of qData.questions) {
                await client.query(
                  `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, marks)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                  [quizId, q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correct, q.marks]
                );
              }
            }
          }
        }
      }
    }

    await client.query("COMMIT");
    console.log("✅ Seed completed successfully!");
    console.log(`   Courses created/verified: ${totalCoursesCreated}`);
    console.log(`   Modules created: ${totalModulesCreated}`);
    console.log(`   Lessons created: ${totalLessonsCreated}`);
    console.log(`   Quizzes created: ${totalQuizzesCreated}`);

    // Verification summary
    const finalCounts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM courses) AS courses_count,
        (SELECT COUNT(*) FROM modules) AS modules_count,
        (SELECT COUNT(*) FROM lessons) AS lessons_count,
        (SELECT COUNT(*) FROM quizzes) AS quizzes_count,
        (SELECT COUNT(*) FROM learning_categories) AS categories_count,
        (SELECT COUNT(*) FROM learning_tracks) AS tracks_count
    `);
    console.log("📊 Final Database State:", finalCounts.rows[0]);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
