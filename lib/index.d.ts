export interface ParseOptions {
  path?: boolean;
  comments?: string | string[];
  separators?: string | string[];
  strict?: boolean;
  sections?: boolean;
  namespaces?: boolean;
  variables?: boolean;
  vars?: boolean;
  include?: boolean;
  reviver?: (this: Context, key: any, value: any) => any;
}

export interface Context {
  readonly isProperty: boolean;
  readonly isSection: boolean;
  assert(): any;
}

export function parse(data: string, options?: ParseOptions): object;
export function parse(data: string, options: ParseOptions | undefined, cb: (err: any, result: object | undefined) => void): void;

export interface StringifyOptions {
  path?: string;
  comment?: string;
  separator?: string;
  unicode?: boolean;
  replacer?: (this: Context, key: string, value: any) => any;
}
export function stringify(obj: object, options?: StringifyOptions): string;
export function stringify(obj: object, options: StringifyOptions | undefined, cb: (err: any, result: string) => void): void;

export interface Stringifier {
  header(comment: string): this;
  property(obj: { key?: any; value?: any; comment?: string }): this;
  section(obj: string | { name: string; comment?: string }): this;
}

export function createStringifier(): Stringifier;
