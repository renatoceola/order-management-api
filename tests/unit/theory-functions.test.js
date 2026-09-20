import { describe, expect, it } from 'vitest';

function somaImpares(n) {
  if (!Number.isInteger(n) || n <= 0) throw new TypeError('n deve ser um numero inteiro positivo');
  let soma = 0;
  for (let numero = 1; numero <= n; numero += 2) soma += numero;
  return soma;
}

function inverterPalavra(palavra) {
  if (typeof palavra !== 'string') throw new TypeError('palavra deve ser uma string');
  return Array.from(palavra).reverse().join('');
}

describe('funcoes das respostas teoricas', () => {
  it.each([
    [5, 9],
    [10, 25],
  ])('soma os impares ate %i', (n, esperado) => {
    expect(somaImpares(n)).toBe(esperado);
  });

  it('rejeita um limite invalido', () => {
    expect(() => somaImpares(0)).toThrow(TypeError);
  });

  it('inverte uma palavra e preserva caracteres Unicode', () => {
    expect(inverterPalavra('javascript')).toBe('tpircsavaj');
    expect(inverterPalavra('a😀')).toBe('😀a');
  });

  it('rejeita valor que nao seja texto', () => {
    expect(() => inverterPalavra(123)).toThrow(TypeError);
  });
});
