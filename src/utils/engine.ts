import { Insumo, TabelaCobreRow, TrechoDuto } from '../types';

/**
 * 5.3 — Preço final de compra com crédito de ICMS
 * Créditos na compra = P_unit × ICMS_entrada
 * Valor líquido do produto = P_unit − Créditos
 * P_final = Valor líquido × (1 + IPI) × (1 + Frete)
 */
export function calcularCustoCompra(insumo: {
  precoUnit: number;
  icmsEntrada: number;
  ipi: number;
  frete: number;
}): {
  creditoCompra: number;
  valorLiquido: number;
  custoFinal: number;
} {
  const precoUnit = Number(insumo.precoUnit) || 0;
  const icmsEntrada = Number(insumo.icmsEntrada) || 0;
  const ipi = Number(insumo.ipi) || 0;
  const frete = Number(insumo.frete) || 0;

  const creditoCompra = precoUnit * icmsEntrada;
  const valorLiquido = precoUnit - creditoCompra;
  const custoFinal = valorLiquido * (1 + ipi) * (1 + frete);

  return {
    creditoCompra,
    valorLiquido,
    custoFinal,
  };
}

/**
 * 5.6 — Alerta de cotação desatualizada
 * Todo item sem preço aparece como "ZERADO"
 * Itens cotados há mais de 30 dias aparecem como "COTAR"
 * Caso contrário, "ATUALIZADO"
 */
export function obterStatusCotacao(precoUnit: number, dataCotacao: string): 'ZERADO' | 'COTAR' | 'ATUALIZADO' {
  if (!precoUnit || Number(precoUnit) <= 0) {
    return 'ZERADO';
  }

  if (!dataCotacao) {
    return 'COTAR';
  }

  const cotacaoData = new Date(dataCotacao + 'T00:00:00');
  const hoje = new Date();
  
  // Diferença em milissegundos
  const diffTime = hoje.getTime() - cotacaoData.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 30) {
    return 'COTAR';
  }

  return 'ATUALIZADO';
}

/**
 * 5.5 — Preço de venda com margem (markup em cadeia aplicado "por dentro")
 * R$ VENDA = Custo × (1 + OUT) × (1 + FT) × (1 + FN) / (1 − LC)
 */
export function calcularPrecoVenda(
  custo: number,
  out: number, // markup outros
  ft: number,  // markup frete
  fn: number,  // markup financeiro
  lc: number   // perda/comissão por dentro (taxa)
): number {
  const custoNum = Number(custo) || 0;
  const outNum = Number(out) || 0;
  const ftNum = Number(ft) || 0;
  const fnNum = Number(fn) || 0;
  const lcNum = Number(lc) || 0;

  const numerador = custoNum * (1 + outNum) * (1 + ftNum) * (1 + fnNum);
  const divisor = 1 - lcNum;

  if (divisor <= 0) {
    return numerador; // Evita divisão por zero ou markup negativo prejudicial
  }

  return numerador / divisor;
}

/**
 * 5.8 — Geometria de duto (chapa metálica e isolamento)
 * Área Isolamento (m²) = ((L + 0,04) + (A + 0,04)) × 2 × C
 * Galvanizado (m²) = (L + A) × 2 × C
 * Perímetro (m) = (L + A) × 2
 * Suporte (m) = (L + 0,1) × C / 2,5
 * Perfurado (m) = Perímetro × C
 */
export function calcularGeometriaDuto(L: number, A: number, C: number): {
  areaIsolamento: number;
  areaGalvanizado: number;
  perimetro: number;
  suporte: number;
  perfurado: number;
} {
  const lNum = Number(L) || 0;
  const aNum = Number(A) || 0;
  const cNum = Number(C) || 0;

  const areaIsolamento = ((lNum + 0.04) + (aNum + 0.04)) * 2 * cNum;
  const areaGalvanizado = (lNum + aNum) * 2 * cNum;
  const perimetro = (lNum + aNum) * 2;
  const suporte = ((lNum + 0.1) * cNum) / 2.5;
  const perfurado = perimetro * cNum;

  return {
    areaIsolamento,
    areaGalvanizado,
    perimetro,
    suporte,
    perfurado,
  };
}

/**
 * 5.7 — Peso de cobre por bitola
 * Peso = Comprimento × KG/m (da tabela técnica por bitola)
 */
export function calcularPesoCobre(comprimento: number, bitola: string, tabelaCobre: TabelaCobreRow[]): number {
  const compNum = Number(comprimento) || 0;
  const matched = tabelaCobre.find(row => row.bitola.trim() === bitola.trim());
  if (!matched) {
    return 0;
  }
  return compNum * matched.kgm;
}

/**
 * 5.9 — Consolidação final e proposta comercial
 * Preço limpo = Venda consolidada dos sistemas
 * Preço c/ comissão = Preço limpo / (1 − comissão_alure)
 * Preço c/ reserva = Preço c/ comissão / (1 − reserva)
 */
export function calcularFechamentoComercial(
  precoLimpo: number,
  comissaoAlure: number, // e.g. 0.0125
  reservaComercial: number // e.g. 0.05
): {
  precoLimpo: number;
  precoComComissao: number;
  precoFinalCliente: number;
} {
  const limpo = Number(precoLimpo) || 0;
  const comissao = Number(comissaoAlure) || 0;
  const reserva = Number(reservaComercial) || 0;

  // Divisão "por dentro"
  const divComissao = 1 - comissao;
  const precoComComissao = divComissao > 0 ? limpo / divComissao : limpo;

  const divReserva = 1 - reserva;
  const precoFinalCliente = divReserva > 0 ? precoComComissao / divReserva : precoComComissao;

  return {
    precoLimpo: limpo,
    precoComComissao,
    precoFinalCliente,
  };
}
