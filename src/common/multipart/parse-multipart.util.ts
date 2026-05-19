import type { FastifyRequest } from 'fastify';

export type MultipartUploadFile = {
  mimetype: string;
  file: NodeJS.ReadableStream;
};

export type ParsedMultipart = {
  fields: Record<string, string>;
  file?: MultipartUploadFile;
};

type MultipartFastifyRequest = FastifyRequest & {
  parts: () => AsyncIterableIterator<MultipartPart>;
};

type MultipartPart =
  | {
      type: 'file';
      fieldname: string;
      mimetype: string;
      file: NodeJS.ReadableStream;
    }
  | {
      type: 'field';
      fieldname: string;
      value: unknown;
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
      if (IMAGE_FIELD_NAMES.has(part.fieldname) && !file) {
        file = { mimetype: part.mimetype, file: part.file };
      } else {
        part.file.resume();
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
