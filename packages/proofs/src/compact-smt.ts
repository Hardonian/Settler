import crypto from "node:crypto";

export const SMT_DEPTH = 256;

const LEAF_PREFIX = Buffer.from([0x00]);
const NODE_PREFIX = Buffer.from([0x01]);

export function hashNodes(left: Buffer, right: Buffer): Buffer {
  return crypto.createHash("sha256").update(NODE_PREFIX).update(left).update(right).digest();
}

export function hashLeaf(key: Buffer, value: Buffer): Buffer {
  return crypto.createHash("sha256").update(LEAF_PREFIX).update(key).update(value).digest();
}

export function hashEmptyLeaf(): Buffer {
  return crypto.createHash("sha256").update(LEAF_PREFIX).digest();
}

let emptyHashesCache: Buffer[] | null = null;

export function getEmptyHashes(): Buffer[] {
  if (emptyHashesCache) return emptyHashesCache;
  const empty: Buffer[] = new Array(SMT_DEPTH + 1);
  empty[SMT_DEPTH] = hashEmptyLeaf();
  for (let d = SMT_DEPTH - 1; d >= 0; d--) {
    empty[d] = hashNodes(empty[d + 1]!, empty[d + 1]!);
  }
  emptyHashesCache = empty;
  return empty;
}

export function getBit(key: Buffer, index: usize): number {
  const byteIdx = Math.floor(index / 8);
  const bitIdx = 7 - (index % 8);
  return (key[byteIdx]! >> bitIdx) & 1;
}

type usize = number;

export interface SmtProof {
  keyHex: string;
  valueHex?: string;
  siblingsHex: string[];
  rootHex: string;
  isInclusion: boolean;
}

export interface CompactSmtProof {
  keyHex: string;
  valueHex?: string;
  presenceBitmapHex: string;
  nonEmptySiblingsHex: string[];
  rootHex: string;
  isInclusion: boolean;
}

export interface SmtVerificationResult {
  valid: boolean;
  computedRoot: string;
  expectedRoot: string;
  isNonInclusion: boolean;
  error?: string;
}

export function compressSmtProof(proof: SmtProof): CompactSmtProof {
  if (proof.siblingsHex.length !== SMT_DEPTH) {
    throw new Error(
      `Invalid siblings length for compression: expected ${SMT_DEPTH}, got ${proof.siblingsHex.length}`
    );
  }

  const emptyHashes = getEmptyHashes();
  const bitmap = Buffer.alloc(32);
  const nonEmptySiblingsHex: string[] = [];

  for (let depthRev = 0; depthRev < SMT_DEPTH; depthRev++) {
    const depth = SMT_DEPTH - 1 - depthRev;
    const expectedEmptyHex = emptyHashes[depth + 1]!.toString("hex");
    const siblingHex = proof.siblingsHex[depthRev]!.toLowerCase();

    if (siblingHex !== expectedEmptyHex) {
      const byteIdx = Math.floor(depthRev / 8);
      const bitIdx = 7 - (depthRev % 8);
      bitmap[byteIdx]! |= 1 << bitIdx;
      nonEmptySiblingsHex.push(proof.siblingsHex[depthRev]!);
    }
  }

  return {
    keyHex: proof.keyHex,
    valueHex: proof.valueHex,
    presenceBitmapHex: bitmap.toString("hex"),
    nonEmptySiblingsHex,
    rootHex: proof.rootHex,
    isInclusion: proof.isInclusion,
  };
}

export function expandSmtProof(compact: CompactSmtProof): SmtProof {
  const bitmap = Buffer.from(compact.presenceBitmapHex, "hex");
  if (bitmap.length !== 32) {
    throw new Error("Invalid presenceBitmapHex length (expected 32 bytes)");
  }

  const emptyHashes = getEmptyHashes();
  const siblingsHex: string[] = [];
  let explicitIdx = 0;

  for (let depthRev = 0; depthRev < SMT_DEPTH; depthRev++) {
    const depth = SMT_DEPTH - 1 - depthRev;
    const byteIdx = Math.floor(depthRev / 8);
    const bitIdx = 7 - (depthRev % 8);
    const isPresent = ((bitmap[byteIdx]! >> bitIdx) & 1) === 1;

    if (isPresent) {
      const sibling = compact.nonEmptySiblingsHex[explicitIdx++];
      if (!sibling) {
        throw new Error("Premature end of nonEmptySiblingsHex");
      }
      siblingsHex.push(sibling);
    } else {
      siblingsHex.push(emptyHashes[depth + 1]!.toString("hex"));
    }
  }

  if (explicitIdx !== compact.nonEmptySiblingsHex.length) {
    throw new Error("Superfluous non-empty siblings provided in compact proof");
  }

  return {
    keyHex: compact.keyHex,
    valueHex: compact.valueHex,
    siblingsHex,
    rootHex: compact.rootHex,
    isInclusion: compact.isInclusion,
  };
}

export function verifySmtProof(proof: SmtProof): SmtVerificationResult {
  if (proof.isInclusion !== (proof.valueHex !== undefined)) {
    return {
      valid: false,
      computedRoot: "",
      expectedRoot: proof.rootHex,
      isNonInclusion: !proof.isInclusion,
      error: "Proof kind is inconsistent with valueHex presence",
    };
  }

  const rootBuf = Buffer.from(proof.rootHex, "hex");
  if (rootBuf.length !== 32) {
    return {
      valid: false,
      computedRoot: "",
      expectedRoot: proof.rootHex,
      isNonInclusion: !proof.isInclusion,
      error: "Invalid rootHex format (expected 32 bytes hex)",
    };
  }

  const keyBuf = Buffer.from(proof.keyHex, "hex");
  if (keyBuf.length !== 32) {
    return {
      valid: false,
      computedRoot: "",
      expectedRoot: proof.rootHex,
      isNonInclusion: !proof.isInclusion,
      error: "Invalid keyHex format (expected 32 bytes hex)",
    };
  }

  if (proof.siblingsHex.length !== SMT_DEPTH) {
    return {
      valid: false,
      computedRoot: "",
      expectedRoot: proof.rootHex,
      isNonInclusion: !proof.isInclusion,
      error: `Invalid siblings length: expected ${SMT_DEPTH}, got ${proof.siblingsHex.length}`,
    };
  }

  let currentHash: Buffer;
  if (proof.valueHex !== undefined) {
    const valBuf = Buffer.from(proof.valueHex, "hex");
    if (valBuf.length !== 32) {
      return {
        valid: false,
        computedRoot: "",
        expectedRoot: proof.rootHex,
        isNonInclusion: false,
        error: "Invalid valueHex format (expected 32 bytes hex)",
      };
    }
    currentHash = hashLeaf(keyBuf, valBuf);
  } else {
    currentHash = hashEmptyLeaf();
  }

  for (let depthRev = 0; depthRev < SMT_DEPTH; depthRev++) {
    const depth = SMT_DEPTH - 1 - depthRev;
    const bit = getBit(keyBuf, depth);
    const siblingBuf = Buffer.from(proof.siblingsHex[depthRev]!, "hex");
    if (siblingBuf.length !== 32) {
      return {
        valid: false,
        computedRoot: "",
        expectedRoot: proof.rootHex,
        isNonInclusion: !proof.isInclusion,
        error: "Invalid sibling hash format (expected 32 bytes hex)",
      };
    }

    if (bit === 0) {
      currentHash = hashNodes(currentHash, siblingBuf);
    } else {
      currentHash = hashNodes(siblingBuf, currentHash);
    }
  }

  const computedRoot = currentHash.toString("hex");
  const valid = computedRoot.toLowerCase() === proof.rootHex.toLowerCase();

  return {
    valid,
    computedRoot,
    expectedRoot: proof.rootHex,
    isNonInclusion: proof.valueHex === undefined,
    error: valid ? undefined : "Root hash mismatch: computed root does not match declared root",
  };
}

export function verifyCompactSmtProof(compact: CompactSmtProof): SmtVerificationResult {
  try {
    const expanded = expandSmtProof(compact);
    return verifySmtProof(expanded);
  } catch (err) {
    return {
      valid: false,
      computedRoot: "",
      expectedRoot: compact.rootHex,
      isNonInclusion: compact.valueHex === undefined,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export class SparseMerkleTree {
  private root: Buffer;
  private readonly emptyHashes: Buffer[];
  private readonly nodes = new Map<string, [Buffer, Buffer]>();
  private readonly entries = new Map<string, Buffer>();

  constructor() {
    this.emptyHashes = getEmptyHashes();
    this.root = this.emptyHashes[0]!;
  }

  rootHex(): string {
    return this.root.toString("hex");
  }

  get(key: Buffer | string): string | null {
    const keyBuf = typeof key === "string" ? Buffer.from(key, "hex") : key;
    const val = this.entries.get(keyBuf.toString("hex"));
    return val ? val.toString("hex") : null;
  }

  update(key: Buffer | string, value: Buffer | string): string {
    const keyBuf = typeof key === "string" ? Buffer.from(key, "hex") : key;
    const valBuf = typeof value === "string" ? Buffer.from(value, "hex") : value;
    if (keyBuf.length !== 32 || valBuf.length !== 32) {
      throw new Error("Key and value must both be 32 bytes");
    }

    this.entries.set(keyBuf.toString("hex"), valBuf);
    const siblings = this.collectSiblings(keyBuf);

    let currentHash = hashLeaf(keyBuf, valBuf);

    for (let depthRev = 0; depthRev < SMT_DEPTH; depthRev++) {
      const depth = SMT_DEPTH - 1 - depthRev;
      const bit = getBit(keyBuf, depth);
      const sibling = siblings[depthRev]!;
      const [left, right] = bit === 0 ? [currentHash, sibling] : [sibling, currentHash];
      const parentHash = hashNodes(left, right);
      this.nodes.set(parentHash.toString("hex"), [left, right]);
      currentHash = parentHash;
    }

    this.root = currentHash;
    return this.root.toString("hex");
  }

  proveInclusion(key: Buffer | string): SmtProof | null {
    const keyBuf = typeof key === "string" ? Buffer.from(key, "hex") : key;
    const val = this.entries.get(keyBuf.toString("hex"));
    if (!val) return null;

    const siblings = this.collectSiblings(keyBuf);
    return {
      keyHex: keyBuf.toString("hex"),
      valueHex: val.toString("hex"),
      siblingsHex: siblings.map((s) => s.toString("hex")),
      rootHex: this.root.toString("hex"),
      isInclusion: true,
    };
  }

  proveNonInclusion(key: Buffer | string): SmtProof | null {
    const keyBuf = typeof key === "string" ? Buffer.from(key, "hex") : key;
    if (this.entries.has(keyBuf.toString("hex"))) return null;

    const siblings = this.collectSiblings(keyBuf);
    return {
      keyHex: keyBuf.toString("hex"),
      valueHex: undefined,
      siblingsHex: siblings.map((s) => s.toString("hex")),
      rootHex: this.root.toString("hex"),
      isInclusion: false,
    };
  }

  proveCompactInclusion(key: Buffer | string): CompactSmtProof | null {
    const proof = this.proveInclusion(key);
    return proof ? compressSmtProof(proof) : null;
  }

  proveCompactNonInclusion(key: Buffer | string): CompactSmtProof | null {
    const proof = this.proveNonInclusion(key);
    return proof ? compressSmtProof(proof) : null;
  }

  private collectSiblings(key: Buffer): Buffer[] {
    const siblings: Buffer[] = new Array(SMT_DEPTH);
    let currentHash = this.root;

    for (let depth = 0; depth < SMT_DEPTH; depth++) {
      const bit = getBit(key, depth);
      const node = this.nodes.get(currentHash.toString("hex"));
      if (node) {
        if (bit === 0) {
          siblings[depth] = node[1];
          currentHash = node[0];
        } else {
          siblings[depth] = node[0];
          currentHash = node[1];
        }
      } else {
        const childDepth = depth + 1;
        siblings[depth] = this.emptyHashes[childDepth]!;
        currentHash = this.emptyHashes[childDepth]!;
      }
    }

    siblings.reverse();
    return siblings;
  }
}
