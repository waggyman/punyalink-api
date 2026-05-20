import type { FastifyRequest } from 'fastify';

export type MultipartUploadFile = {
  mimetype: string;
  buffer: Buffer;
};

export type ParsedMultipart = {
  fields: Record<string, string>;
  file?: MultipartUploadFile;
};

type MultipartFilePart = {
  type: 'file';
  fieldname: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
  toBuffer: () => Promise<Buffer>;
};

type MultipartFieldPart = {
  type: 'field';
  fieldname: string;
  value: unknown;
};

type MultipartPart = MultipartFilePart | MultipartFieldPart;

type MultipartFastifyRequest = FastifyRequest & {
  parts: () => AsyncIterableIterator<MultipartPart>;
};

const IMAGE_FIELD_NAMES = new Set(['file', 'image']);

export function isMultipartRequest(req: FastifyRequest): boolean {
  const contentType = req.headers['content-type'];
  return (
    typeof contentType === 'string' &&
    contentType.toLowerCase().includes('multipart/form-data')
  );
}

export async function parseMultipartRequest(
  req: FastifyRequest,
): Promise<ParsedMultipart> {
  const multipartReq = req as MultipartFastifyRequest;
  const fields: Record<string, string> = {};
  let file: MultipartUploadFile | undefined;

  for await (const part of multipartReq.parts()) {
    if (part.type === 'file') {
      // Fastify requires each file part to be fully consumed inside this loop.
      const buffer = await part.toBuffer();
      if (IMAGE_FIELD_NAMES.has(part.fieldname) && !file) {
        file = { mimetype: part.mimetype, buffer };
      }
      continue;
    }
    fields[part.fieldname] = String(part.value ?? '');
  }

  return { fields, file };
}

export function parseOptionalBooleanField(
  value: string | undefined,
): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}
