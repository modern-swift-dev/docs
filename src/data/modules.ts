export interface APIReference {
  target: string;
  path: string;
  flags: string[];
}

export interface DocumentationModule {
  id: string;
  name: string;
  description: string;
  category: string;
  branch: string;
  mode: "separate" | "merged";
  api: APIReference[];
}

export const modules: DocumentationModule[] = [
  { id: "calder-swiftui", name: "Calder", description: "Focused Swift utilities and UI components for Apple applications.", category: "Application foundations", branch: "main", mode: "separate", api: [
    { target: "CalderStdLib", path: "api/calder-stdlib", flags: ["--disable-indexing", "--experimental-skip-synthesized-symbols"] },
    { target: "CalderSwiftUI", path: "api/calder-swiftui", flags: ["--disable-indexing", "--experimental-skip-synthesized-symbols"] },
    { target: "CalderTheme", path: "api/calder-theme", flags: ["--disable-indexing", "--experimental-skip-synthesized-symbols"] },
    { target: "CalderUIKit", path: "api/calder-uikit", flags: ["--disable-indexing", "--experimental-skip-synthesized-symbols"] },
  ] },
  { id: "lockbox-swift", name: "Lockbox", description: "Typed Keychain access for passwords, credentials, and protected secrets.", category: "Storage", branch: "main", mode: "separate", api: [
    { target: "Lockbox", path: "documentation/lockbox", flags: [] },
  ] },
  { id: "mocksmith-swift", name: "Mocksmith", description: "Record calls, configure stubs, and verify interactions in Swift tests.", category: "Testing", branch: "main", mode: "separate", api: [
    { target: "Mocksmith", path: "documentation/api/mocksmith", flags: ["--disable-indexing"] },
    { target: "MocksmithCombine", path: "documentation/api/mocksmithcombine", flags: ["--disable-indexing"] },
    { target: "MocksmithTesting", path: "documentation/api/mocksmithtesting", flags: ["--disable-indexing"] },
    { target: "MocksmithXCTest", path: "documentation/api/mocksmithxctest", flags: ["--disable-indexing"] },
  ] },
  { id: "pathways-swift", name: "Pathways", description: "Encode typed routes as URLs and decode them back into Swift values.", category: "Application foundations", branch: "main", mode: "separate", api: [
    { target: "Pathways", path: "documentation/pathways", flags: ["--disable-indexing"] },
  ] },
  { id: "roundtrip-generator", name: "RoundTrip Generator", description: "Describe an API in Swift and generate clients, server scaffolding, and OpenAPI contracts.", category: "Code generation", branch: "main", mode: "separate", api: [
    { target: "GeneratorModels", path: "api/generatormodels", flags: ["--disable-indexing"] },
    { target: "GeneratorBuilder", path: "api/generatorbuilder", flags: ["--disable-indexing"] },
    { target: "SwiftApiGenerator", path: "api/swiftapigenerator", flags: ["--disable-indexing"] },
    { target: "SwiftVaporGenerator", path: "api/swiftvaporgenerator", flags: ["--disable-indexing"] },
    { target: "KotlinApiGenerator", path: "api/kotlinapigenerator", flags: ["--disable-indexing"] },
    { target: "KotlinAndroidApiGenerator", path: "api/kotlinandroidapigenerator", flags: ["--disable-indexing"] },
    { target: "KotlinSpringBootGenerator", path: "api/kotlinspringbootgenerator", flags: ["--disable-indexing"] },
    { target: "TypeScriptApiGenerator", path: "api/typescriptapigenerator", flags: ["--disable-indexing"] },
    { target: "OpenApiYamlGenerator", path: "api/openapiyamlgenerator", flags: ["--disable-indexing"] },
  ] },
  { id: "roundtrip-swift", name: "RoundTrip", description: "Build HTTP requests and compose REST clients for Apple platforms.", category: "Networking", branch: "main", mode: "separate", api: [
    { target: "RoundTrip", path: "api/roundtrip", flags: [] },
    { target: "RoundTripREST", path: "api/roundtrip-rest", flags: [] },
  ] },
  { id: "skein-swift", name: "Skein", description: "Compose dependency graphs with explicit lifetimes and isolation.", category: "Application foundations", branch: "main", mode: "separate", api: [
    { target: "Skein", path: "api/skein", flags: [] },
    { target: "SkeinSwiftUI", path: "api/skein-swiftui", flags: [] },
    { target: "SkeinVapor", path: "api/skein-vapor", flags: [] },
  ] },
  { id: "swift-markdown-ui", name: "MarkdownUI", description: "Render and edit Markdown in SwiftUI with composable styling.", category: "User interfaces", branch: "develop", mode: "merged", api: [
    { target: "MarkdownUI", path: "documentation/markdownui", flags: ["--disable-indexing", "--warnings-as-errors"] },
    { target: "MarkdownUIEditor", path: "documentation/markdownuieditor", flags: ["--disable-indexing", "--warnings-as-errors"] },
  ] },
  { id: "swift-snapshot-testing", name: "SnapshotTesting", description: "Verify images, previews, text, and structured values with snapshots.", category: "Testing", branch: "main", mode: "separate", api: [
    { target: "SnapshotTesting", path: "api/snapshottesting", flags: [] },
    { target: "SnapshotPreviews", path: "api/snapshotpreviews", flags: [] },
    { target: "InlineSnapshotTesting", path: "api/inlinesnapshottesting", flags: [] },
    { target: "CustomDump", path: "api/customdump", flags: [] },
  ] },
  { id: "swift-stash", name: "SwiftStash", description: "Cache values in memory and on disk with explicit eviction policies.", category: "Storage", branch: "main", mode: "separate", api: [
    { target: "SwiftStash", path: "api", flags: ["--disable-indexing"] },
  ] },
  { id: "taskloom-swift", name: "TaskLoom", description: "Compose asynchronous operations with cancellation, retries, and timeouts.", category: "Concurrency", branch: "main", mode: "separate", api: [
    { target: "TaskLoom", path: "api/taskloom", flags: [] },
  ] },
];

export function apiURL(module: DocumentationModule, api: APIReference): string {
  return module.mode === "merged"
    ? `/docs/${module.id}/${api.path}/`
    : `/docs/${module.id}/${api.path}/documentation/${api.target.toLowerCase()}/`;
}
