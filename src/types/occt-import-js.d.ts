declare module 'occt-import-js' {
  interface OcctMeshAttributes {
    position: { array: number[] };
    normal?: { array: number[] };
  }
  interface OcctMesh {
    attributes: OcctMeshAttributes;
    index: { array: number[] };
  }
  interface OcctResult {
    success: boolean;
    meshes: OcctMesh[];
  }
  interface OcctModule {
    ReadStepFile(data: Uint8Array): OcctResult;
  }
  function occtimportjs(options?: { wasmBinary?: ArrayBuffer }): Promise<OcctModule>;
  export default occtimportjs;
}
