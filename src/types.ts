export interface PrecoHistorico {
  data: string;
  preco: number;
  fornecedor: string;
}

export interface Insumo {
  id: string;
  categoria: string; // "Elétrica" | "Hidráulica" | "Frigorífica" | "Dutos" | "VRF" | "Equipamentos" | "Outros/Serviços"
  descricao: string;
  especificacao: string;
  unidade: string;
  precoUnit: number; // Preço bruto de compra
  icmsEntrada: number; // e.g. 0.20 for 20%
  ipi: number; // e.g. 0.05 for 5%
  frete: number; // e.g. 0.03 for 3%
  fornecedor: string;
  dataCotacao: string;
  historico?: PrecoHistorico[];
}

export interface TrechoTubulacao {
  id: string;
  bitola: string;
  comprimento: number;
  tipo: 'sucção' | 'líquido';
  paredeIsolamento: string;
}

export interface Circuito {
  id: string;
  nome: string; // e.g. "Circuito 1", "Pavimento 2"
  numEvaporadoras: number;
  numCondensadoras: number;
  potenciaHP: number;
  trechos: TrechoTubulacao[];
}

export interface TrechoDuto {
  id: string;
  descricao: string;
  largura: number; // L em metros
  altura: number; // A em metros
  comprimento: number; // C em metros
  tipoDuto: 'PVC' | 'Cocção' | 'Exaustão' | 'Ventilação' | 'Insuflamento-Retorno';
}

export interface ItemOrcamento {
  id: string;
  insumoId: string | null; // null if manual entry
  descricao: string;
  especificacao: string;
  unidade: string;
  quantidade: number;
  custoUnit: number; // Final calculated cost from engine
  fornecedor?: string;
}

export interface Sistema {
  id: string;
  tipo: string; // "VRF" | "Frigo Splitão" | "Mini Split" | "Elétrico" | "Hidráulica" | "Dutos" | "Grelhas" | "Equipamentos" | "Outros/Serviços"
  out: number; // Markup outros (e.g., 0.10)
  ft: number; // Markup frete (e.g., 0.02)
  fn: number; // Markup financeiro (e.g., 0.015)
  lc: number; // Perda / comissão LC "por dentro" (e.g., 0.02)
  circuitos: Circuito[]; // Used if VRF/Frigorífica
  trechosDuto: TrechoDuto[]; // Used if Dutos
  itens: ItemOrcamento[];
}

export interface AmbienteCarga {
  id: string;
  nome: string;
  area: number;
  pessoas: number;
  janelasSol: boolean;
  cargaEquipamentos: number; // em Watts
  btuTotal: number;
  trTotal: number;
}

export interface CargaTermica {
  ambientes: AmbienteCarga[];
  totalBTU: number;
  totalTR: number;
}

export interface EtapaCronograma {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  progresso: number; // 0 - 100
  status: 'Pendente' | 'Executando' | 'Concluido' | 'Atrasado';
  responsavel: string;
}

export interface FaturamentoMilestone {
  id: string;
  descricao: string;
  porcentagem: number; // e.g. 30
  valor: number;
  dataPrevisao: string;
  pago: boolean;
}

export interface CronogramaFinanceiro {
  etapas: EtapaCronograma[];
  faturamento: FaturamentoMilestone[];
}

export interface Projeto {
  id: string;
  nome: string;
  local: string;
  distanciaKm: number;
  capacidadeTR: number;
  dataCriacao: string;
  sistemas: Sistema[];
  comissao: number; // Comissão ALURE (e.g. 0.0125 for 1.25%)
  reserva: number; // Reserva comercial (e.g. 0.05 for 5%)
  cargaTermica?: CargaTermica;
  cronograma?: CronogramaFinanceiro;
}

export interface TabelaCobreRow {
  bitola: string;
  kgm: number;
}
