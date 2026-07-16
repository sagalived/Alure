import { Insumo, Projeto, TabelaCobreRow } from '../types';

export const DEFAULT_TABELA_COBRE: TabelaCobreRow[] = [
  { bitola: '1/4"', kgm: 0.124 },
  { bitola: '5/16"', kgm: 0.159 },
  { bitola: '3/8"', kgm: 0.195 },
  { bitola: '1/2"', kgm: 0.266 },
  { bitola: '5/8"', kgm: 0.337 },
  { bitola: '3/4"', kgm: 0.408 },
  { bitola: '7/8"', kgm: 0.478 },
  { bitola: '1"', kgm: 0.549 },
  { bitola: '1 1/8"', kgm: 0.620 },
  { bitola: '1 1/4"', kgm: 0.691 },
  { bitola: '1 3/8"', kgm: 0.762 },
  { bitola: '1 5/8"', kgm: 0.904 },
  { bitola: '1 7/8"', kgm: 1.046 },
  { bitola: '2"', kgm: 1.116 },
];

export const DEFAULT_INSUMOS: Insumo[] = [
  // VRF / Frigorífica
  {
    id: 'ins_1',
    categoria: 'VRF',
    descricao: 'Tubo de Cobre Rígido sem costura',
    especificacao: '1 1/8" - barra 6m',
    unidade: 'Barra',
    precoUnit: 345.50,
    icmsEntrada: 0.12,
    ipi: 0.05,
    frete: 0.02,
    fornecedor: 'Frigelar',
    dataCotacao: '2026-07-10',
  },
  {
    id: 'ins_2',
    categoria: 'VRF',
    descricao: 'Isolamento Térmico Elastomérico',
    especificacao: '1 1/8" x 19mm - tubulação de sucção',
    unidade: 'Metro',
    precoUnit: 24.80,
    icmsEntrada: 0.12,
    ipi: 0.00,
    frete: 0.01,
    fornecedor: 'Armacell',
    dataCotacao: '2026-06-25', // Older than 30 days compared to 2026-07-15, will trigger COTAR alert!
  },
  {
    id: 'ins_3',
    categoria: 'VRF',
    descricao: 'Refnet de Cobre tipo Y',
    especificacao: 'DIS-180-Y (Linha 2 Tubos)',
    unidade: 'Peça',
    precoUnit: 420.00,
    icmsEntrada: 0.18,
    ipi: 0.08,
    frete: 0.03,
    fornecedor: 'Daikin Brasil',
    dataCotacao: '2026-07-14',
  },
  // Dutos
  {
    id: 'ins_4',
    categoria: 'Dutos',
    descricao: 'Chapa de Aço Galvanizado USG 26',
    especificacao: 'Espessura 0.50mm',
    unidade: 'kg',
    precoUnit: 14.50,
    icmsEntrada: 0.12,
    ipi: 0.05,
    frete: 0.04,
    fornecedor: 'Gerdau',
    dataCotacao: '2026-07-12',
  },
  {
    id: 'ins_5',
    categoria: 'Dutos',
    descricao: 'Perfil de Alumínio TDC',
    especificacao: 'TDC-30 barra 5m',
    unidade: 'Barra',
    precoUnit: 85.00,
    icmsEntrada: 0.12,
    ipi: 0.05,
    frete: 0.02,
    fornecedor: 'MetalDutos',
    dataCotacao: '2026-07-02',
  },
  // Elétrica
  {
    id: 'ins_6',
    categoria: 'Elétrica',
    descricao: 'Cabo de Cobre Flexível PP HePR 0,6/1kV',
    especificacao: '4x10mm²',
    unidade: 'Metro',
    precoUnit: 42.10,
    icmsEntrada: 0.18,
    ipi: 0.10,
    frete: 0.03,
    fornecedor: 'Cobrecom',
    dataCotacao: '2026-07-08',
  },
  {
    id: 'ins_7',
    categoria: 'Elétrica',
    descricao: 'Eletroduto de Aço Galvanizado Pesado',
    especificacao: '1" - barra 3m com luva',
    unidade: 'Barra',
    precoUnit: 68.20,
    icmsEntrada: 0.12,
    ipi: 0.05,
    frete: 0.05,
    fornecedor: 'Tigre S/A',
    dataCotacao: '2026-07-15',
  },
  // Hidráulica
  {
    id: 'ins_8',
    categoria: 'Hidráulica',
    descricao: 'Bomba de Condensado Vertical de Pistão',
    especificacao: 'Vazão 15 l/h - 220V',
    unidade: 'Peça',
    precoUnit: 310.00,
    icmsEntrada: 0.12,
    ipi: 0.12,
    frete: 0.02,
    fornecedor: 'Siccom',
    dataCotacao: '2026-05-10', // outdated (> 30 days) -> COTAR
  },
  // Equipamentos
  {
    id: 'ins_9',
    categoria: 'Equipamentos',
    descricao: 'Unidade Condensadora VRF Daikin',
    especificacao: '12 HP - R410A - 380V/3ph',
    unidade: 'Unidade',
    precoUnit: 34500.00,
    icmsEntrada: 0.12,
    ipi: 0.15,
    frete: 0.02,
    fornecedor: 'Daikin Brasil',
    dataCotacao: '2026-07-11',
  },
  {
    id: 'ins_10',
    categoria: 'Equipamentos',
    descricao: 'Evaporadora VRF Cassete 4 Vias Daikin',
    especificacao: '24.000 BTU/h - 220V',
    unidade: 'Unidade',
    precoUnit: 4800.00,
    icmsEntrada: 0.12,
    ipi: 0.15,
    frete: 0.02,
    fornecedor: 'Daikin Brasil',
    dataCotacao: '0', // Zerado/não cotado yet -> ZERADO status
  },
];

export const DEFAULT_PROJETOS: Projeto[] = [
  {
    id: 'proj_demo',
    nome: 'Edifício Corporate Tower — Pavimento 12',
    local: 'São Paulo - SP',
    distanciaKm: 45,
    capacidadeTR: 24,
    dataCriacao: '2026-07-10',
    comissao: 0.0125, // 1.25% de comissão da Alure
    reserva: 0.05,    // 5.00% de reserva comercial
    sistemas: [
      {
        id: 'sis_vrf',
        tipo: 'VRF',
        out: 0.10, // 10% outros
        ft: 0.03,  // 3% frete
        fn: 0.02,  // 2% financeiro
        lc: 0.04,  // 4% perda por dentro
        circuitos: [
          {
            id: 'circ_1',
            nome: 'Circuito C1 — Fachada Norte',
            numEvaporadoras: 5,
            numCondensadoras: 1,
            potenciaHP: 12,
            trechos: [
              { id: 't_1', bitola: '1/4"', comprimento: 25, tipo: 'líquido', paredeIsolamento: '9mm' },
              { id: 't_2', bitola: '1 1/8"', comprimento: 25, tipo: 'sucção', paredeIsolamento: '19mm' },
              { id: 't_3', bitola: '3/8"', comprimento: 18, tipo: 'líquido', paredeIsolamento: '9mm' },
              { id: 't_4', bitola: '5/8"', comprimento: 18, tipo: 'sucção', paredeIsolamento: '13mm' },
            ]
          }
        ],
        trechosDuto: [],
        itens: [
          {
            id: 'it_vrf_1',
            insumoId: 'ins_1',
            descricao: 'Tubo de Cobre Rígido sem costura - 1 1/8" - barra 6m',
            especificacao: '1 1/8" - barra 6m',
            unidade: 'Barra',
            quantidade: 10,
            custoUnit: 326.27, // Preço final calculado com créditos de ICMS e acréscimos de IPI e frete
            fornecedor: 'Frigelar',
          },
          {
            id: 'it_vrf_2',
            insumoId: 'ins_9',
            descricao: 'Unidade Condensadora VRF Daikin - 12 HP - R410A - 380V/3ph',
            especificacao: '12 HP - R410A - 380V/3ph',
            unidade: 'Unidade',
            quantidade: 1,
            custoUnit: 35686.44,
            fornecedor: 'Daikin Brasil',
          }
        ]
      },
      {
        id: 'sis_dutos',
        tipo: 'Dutos',
        out: 0.08,
        ft: 0.05,
        fn: 0.015,
        lc: 0.03,
        circuitos: [],
        trechosDuto: [
          { id: 'td_1', descricao: 'Ramal Principal Insuflamento', largura: 0.60, altura: 0.40, comprimento: 15, tipoDuto: 'Insuflamento-Retorno' },
          { id: 'td_2', descricao: 'Ramais Secundários Derivação', largura: 0.30, altura: 0.20, comprimento: 22, tipoDuto: 'Insuflamento-Retorno' }
        ],
        itens: [
          {
            id: 'it_dut_1',
            insumoId: 'ins_4',
            descricao: 'Chapa de Aço Galvanizado USG 26 - Espessura 0.50mm',
            especificacao: 'Espessura 0.50mm',
            unidade: 'kg',
            quantidade: 245,
            custoUnit: 13.91,
            fornecedor: 'Gerdau',
          }
        ]
      },
      {
        id: 'sis_eletrico',
        tipo: 'Elétrico',
        out: 0.05,
        ft: 0.02,
        fn: 0.01,
        lc: 0.02,
        circuitos: [],
        trechosDuto: [],
        itens: [
          {
            id: 'it_el_1',
            insumoId: 'ins_6',
            descricao: 'Cabo de Cobre Flexível PP HePR 0,6/1kV - 4x10mm²',
            especificacao: '4x10mm²',
            unidade: 'Metro',
            quantidade: 120,
            custoUnit: 39.18,
            fornecedor: 'Cobrecom',
          },
          {
            id: 'it_el_2',
            insumoId: null,
            descricao: 'Mão de Obra de Lançamento de Cabos e Quadros',
            especificacao: 'Serviço técnico',
            unidade: 'H/M',
            quantidade: 40,
            custoUnit: 45.00, // Manual
            fornecedor: 'Equipe Própria',
          }
        ]
      }
    ]
  }
];
