import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  calcularCustoCompra,
  calcularFechamentoComercial,
  calcularGeometriaDuto,
  calcularPesoCobre,
  calcularPrecoVenda,
  obterStatusCotacao,
} from './engine';

describe('calcularCustoCompra', () => {
  it('deve calcular credito, valor liquido e custo final corretamente', () => {
    const result = calcularCustoCompra({
      precoUnit: 100,
      icmsEntrada: 0.2,
      ipi: 0.1,
      frete: 0.05,
    });

    expect(result.creditoCompra).toBeCloseTo(20);
    expect(result.valorLiquido).toBeCloseTo(80);
    expect(result.custoFinal).toBeCloseTo(92.4);
  });

  it('deve tratar entradas invalidas como zero', () => {
    const result = calcularCustoCompra({
      precoUnit: Number.NaN,
      icmsEntrada: Number.NaN,
      ipi: Number.NaN,
      frete: Number.NaN,
    });

    expect(result).toEqual({
      creditoCompra: 0,
      valorLiquido: 0,
      custoFinal: 0,
    });
  });
});

describe('obterStatusCotacao', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve retornar ZERADO quando preco for zero ou invalido', () => {
    expect(obterStatusCotacao(0, '2026-07-01')).toBe('ZERADO');
    expect(obterStatusCotacao(Number.NaN, '2026-07-01')).toBe('ZERADO');
  });

  it('deve retornar COTAR quando data estiver vazia', () => {
    expect(obterStatusCotacao(10, '')).toBe('COTAR');
  });

  it('deve retornar COTAR para cotacao acima de 30 dias', () => {
    expect(obterStatusCotacao(10, '2026-06-01')).toBe('COTAR');
  });

  it('deve retornar ATUALIZADO para cotacao em ate 30 dias', () => {
    expect(obterStatusCotacao(10, '2026-06-20')).toBe('ATUALIZADO');
  });
});

describe('calcularPrecoVenda', () => {
  it('deve aplicar markups em cadeia com divisor por dentro', () => {
    const result = calcularPrecoVenda(100, 0.1, 0.05, 0.02, 0.1);
    const expected = (100 * 1.1 * 1.05 * 1.02) / 0.9;

    expect(result).toBeCloseTo(expected);
  });

  it('deve evitar divisao invalida quando lc >= 1', () => {
    const result = calcularPrecoVenda(100, 0.1, 0.05, 0.02, 1);
    const numerador = 100 * 1.1 * 1.05 * 1.02;

    expect(result).toBeCloseTo(numerador);
  });
});

describe('calcularGeometriaDuto', () => {
  it('deve calcular area, perimetro e insumos de duto', () => {
    const result = calcularGeometriaDuto(0.5, 0.3, 10);

    expect(result.areaIsolamento).toBeCloseTo(((0.5 + 0.04) + (0.3 + 0.04)) * 2 * 10);
    expect(result.areaGalvanizado).toBeCloseTo((0.5 + 0.3) * 2 * 10);
    expect(result.perimetro).toBeCloseTo((0.5 + 0.3) * 2);
    expect(result.suporte).toBeCloseTo(((0.5 + 0.1) * 10) / 2.5);
    expect(result.perfurado).toBeCloseTo(((0.5 + 0.3) * 2) * 10);
  });
});

describe('calcularPesoCobre', () => {
  const tabela = [
    { bitola: '1/4', kgm: 0.12 },
    { bitola: '3/8', kgm: 0.21 },
  ];

  it('deve calcular peso para bitola existente', () => {
    const result = calcularPesoCobre(50, '3/8', tabela);
    expect(result).toBeCloseTo(10.5);
  });

  it('deve retornar zero para bitola inexistente', () => {
    const result = calcularPesoCobre(50, '1/2', tabela);
    expect(result).toBe(0);
  });
});

describe('calcularFechamentoComercial', () => {
  it('deve calcular fechamento com comissao e reserva por dentro', () => {
    const result = calcularFechamentoComercial(1000, 0.0125, 0.05);

    expect(result.precoLimpo).toBe(1000);
    expect(result.precoComComissao).toBeCloseTo(1000 / 0.9875);
    expect(result.precoFinalCliente).toBeCloseTo((1000 / 0.9875) / 0.95);
  });

  it('deve usar fallback seguro quando divisor for invalido', () => {
    const resultComissao = calcularFechamentoComercial(1000, 1, 0.05);
    expect(resultComissao.precoComComissao).toBe(1000);

    const resultReserva = calcularFechamentoComercial(1000, 0.1, 1);
    expect(resultReserva.precoFinalCliente).toBeCloseTo(1000 / 0.9);
  });
});
