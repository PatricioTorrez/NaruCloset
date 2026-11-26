import { describe, expect, it } from 'vitest';
import { effectivePrice, formatPrice, slugify, whatsappLink } from '@/lib/format';
import { friendlyError } from '@/lib/errors';

describe('formatPrice', () => {
  it('formatea en pesos mexicanos', () => {
    expect(formatPrice(1299.5).replace(/\s/g, ' ')).toBe('$1,299.50');
    expect(formatPrice('450')).toBe('$450.00');
    expect(formatPrice(null)).toBe('');
  });
});

describe('slugify', () => {
  it('quita acentos, espacios y símbolos', () => {
    expect(slugify('Sudadera Básica  Niño')).toBe('sudadera-basica-nino');
    expect(slugify('  ¡Oferta! 50%  ')).toBe('oferta-50');
    expect(slugify('ÁÉÍÓÚ ñ')).toBe('aeiou-n');
  });
});

describe('effectivePrice', () => {
  it('usa el precio promocional cuando existe', () => {
    expect(effectivePrice(500, 399)).toBe(399);
    expect(effectivePrice(500, null)).toBe(500);
  });
});

describe('whatsappLink', () => {
  it('limpia el número y codifica el mensaje', () => {
    expect(whatsappLink('+52 55 1234 5678', 'Hola, ¿tienen talla M?')).toBe(
      'https://wa.me/525512345678?text=Hola%2C%20%C2%BFtienen%20talla%20M%3F',
    );
  });
});

describe('friendlyError', () => {
  it('traduce códigos de las funciones de inventario', () => {
    expect(friendlyError({ message: 'insufficient_stock' })).toMatch(/existencias suficientes/);
    expect(friendlyError({ message: 'invalid_input', details: 'El motivo es obligatorio.' })).toBe(
      'El motivo es obligatorio.',
    );
    expect(friendlyError({ code: '23505', message: 'duplicate key' })).toMatch(/Ya existe/);
    expect(friendlyError({ message: 'algo raro' })).toMatch(/Ocurrió un error/);
  });
});
