declare module 'csv-parser' {
  import { Transform } from 'stream';

  interface CsvParserOptions {
    escape?: string;
    headers?: string[] | boolean;
    mapHeaders?: (args: { header: string; index: number }) => string | null;
    mapValues?: (args: { header: string; index: number; value: any }) => any;
    newline?: string;
    quote?: string;
    raw?: boolean;
    separator?: string;
    skipComments?: boolean | string;
    skipLines?: number;
    maxRowBytes?: number;
    strict?: boolean;
  }

  function csv(options?: CsvParserOptions): Transform;

  export = csv;
}
