/**
 * Django REST / SimpleJWT tipik hata gövdelerinden kullanıcı mesajı üretir.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Bir hata oluştu.';
}

/** Ham yanıt gövdesinden (ör. interceptor öncesi) mesaj çıkarır. */
export function messageFromResponseData(data: unknown): string {
  if (data == null) {
    return 'İstek başarısız oldu.';
  }
  if (typeof data === 'string') {
    return data;
  }
  if (typeof data !== 'object') {
    return 'İstek başarısız oldu.';
  }

  const d = data as Record<string, unknown>;

  if (typeof d.detail === 'string') {
    return d.detail;
  }
  if (Array.isArray(d.detail) && d.detail.length && typeof d.detail[0] === 'string') {
    return d.detail.join(' ');
  }

  if (d.error && typeof d.error === 'object' && d.error !== null) {
    const e = d.error as Record<string, unknown>;
    if (typeof e.message === 'string') {
      return e.message;
    }
  }

  if (typeof d.message === 'string') {
    return d.message;
  }

  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length) {
    return d.non_field_errors.map(String).join(' ');
  }

  const fieldParts: string[] = [];
  for (const [key, val] of Object.entries(d)) {
    if (['detail', 'message', 'error'].includes(key)) continue;
    if (Array.isArray(val)) {
      fieldParts.push(...val.map(String));
    } else if (typeof val === 'string') {
      fieldParts.push(val);
    } else if (val && typeof val === 'object') {
      fieldParts.push(JSON.stringify(val));
    }
  }
  if (fieldParts.length) {
    return fieldParts.join(' ');
  }

  return 'İstek başarısız oldu.';
}
