import React, { useState } from 'react';
import { Projeto, Sistema, Circuito, TrechoTubulacao, TrechoDuto, ItemOrcamento, Insumo, TabelaCobreRow } from '../types';
import { calcularCustoCompra, calcularPrecoVenda, calcularGeometriaDuto } from '../utils/engine';
import { FileText, MapPin, Layers, Ruler, Plus, Trash2, ChevronDown, ChevronUp, Check, Info, ArrowRight, Sparkles, FolderOpen, Cable } from 'lucide-react';

interface ProjetosModuleProps {
  projetos: Projeto[];
  insumos: Insumo[];
  tabelaCobre: TabelaCobreRow[];
  activeProjectId: string | null;
  onSetActiveProject: (id: string | null) => void;
  onNavigate: (view: string) => void;
  onAddProjeto: (projeto: Omit<Projeto, 'id' | 'sistemas'>) => void;
  onUpdateProjetoDados: (id: string, updated: Projeto) => void;
}

const DISCIPLINAS = ["VRF", "Frigo Splitão", "Mini Split", "Elétrico", "Hidráulica", "Dutos", "Grelhas", "Equipamentos", "Outros/Serviços"];

export default function ProjetosModule({
  projetos,
  insumos,
  tabelaCobre,
  activeProjectId,
  onSetActiveProject,
  onNavigate,
  onAddProjeto,
  onUpdateProjetoDados,
}: ProjetosModuleProps) {
  const [isNewProjOpen, setIsNewProjOpen] = useState(false);
  const [projNome, setProjNome] = useState('');
  const [projLocal, setProjLocal] = useState('');
  const [projDist, setProjDist] = useState(0);
  const [projTR, setProjTR] = useState(0);

  // Single project UI controls
  const [isNewSysOpen, setIsNewSysOpen] = useState(false);
  const [sysTipo, setSysTipo] = useState('VRF');
  const [sysOut, setSysOut] = useState(10); // 10%
  const [sysFt, setSysFt] = useState(3);   // 3%
  const [sysFn, setSysFn] = useState(2);   // 2%
  const [sysLc, setSysLc] = useState(4);   // 4%

  const [openSystems, setOpenSystems] = useState<{ [id: string]: boolean }>({});

  // Active Single Project
  const activeProj = projetos.find(p => p.id === activeProjectId) || null;

  // Manual items input form (one state per active system)
  const [selectedInsumoId, setSelectedInsumoId] = useState<{ [sysId: string]: string }>({});
  const [manualDesc, setManualDesc] = useState<{ [sysId: string]: string }>({});
  const [manualUnd, setManualUnd] = useState<{ [sysId: string]: string }>({});
  const [manualQtd, setManualQtd] = useState<{ [sysId: string]: number }>({});
  const [manualCusto, setManualCusto] = useState<{ [sysId: string]: number }>({});

  // Engineering section states (add circuit, add copper segment, add duct segment)
  const [circuitNome, setCircuitNome] = useState('');
  const [circuitEvap, setCircuitEvap] = useState(4);
  const [circuitCond, setCircuitCond] = useState(1);
  const [circuitHP, setCircuitHP] = useState(10);

  const [newTubeBitola, setNewTubeBitola] = useState('3/8"');
  const [newTubeLength, setNewTubeLength] = useState(15);
  const [newTubeTipo, setNewTubeTipo] = useState<'sucção' | 'líquido'>('líquido');
  const [newTubeIsol, setNewTubeIsol] = useState('9mm');

  const [newDuctDesc, setNewDuctDesc] = useState('');
  const [newDuctL, setNewDuctL] = useState(0.40);
  const [newDuctA, setNewDuctA] = useState(0.30);
  const [newDuctC, setNewDuctC] = useState(10);
  const [newDuctTipo, setNewDuctTipo] = useState<'PVC' | 'Cocção' | 'Exaustão' | 'Ventilação' | 'Insuflamento-Retorno'>('Insuflamento-Retorno');

  const handleCreateProject = () => {
    if (!projNome.trim()) {
      alert('Nome do projeto é obrigatório.');
      return;
    }
    onAddProjeto({
      nome: projNome,
      local: projLocal,
      distanciaKm: Number(projDist) || 0,
      capacidadeTR: Number(projTR) || 0,
      dataCriacao: new Date().toISOString().slice(0, 10),
      comissao: 0.0125, // 1.25% default
      reserva: 0.05,    // 5.00% default
    });
    setProjNome('');
    setProjLocal('');
    setProjDist(0);
    setProjTR(0);
    setIsNewProjOpen(false);
  };

  const handleCreateSistema = () => {
    if (!activeProj) return;
    const novSistemas = [
      ...activeProj.sistemas,
      {
        id: 'sys_' + Math.random().toString(36).slice(2, 9),
        tipo: sysTipo,
        out: sysOut / 100,
        ft: sysFt / 100,
        fn: sysFn / 100,
        lc: sysLc / 100,
        circuitos: [],
        trechosDuto: [],
        itens: [],
      }
    ];
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: novSistemas,
    });
    setIsNewSysOpen(false);
  };

  const handleDeleteSistema = (sysId: string) => {
    if (!activeProj) return;
    if (confirm('Tem certeza que deseja remover este sistema e todos os itens lançados nele?')) {
      const filtered = activeProj.sistemas.filter(s => s.id !== sysId);
      onUpdateProjetoDados(activeProj.id, {
        ...activeProj,
        sistemas: filtered,
      });
    }
  };

  const handleToggleSystem = (sysId: string) => {
    setOpenSystems(prev => ({ ...prev, [sysId]: !prev[sysId] }));
  };

  // Add Item to System Budget
  const handleAddItem = (sysId: string) => {
    if (!activeProj) return;
    const targetSys = activeProj.sistemas.find(s => s.id === sysId);
    if (!targetSys) return;

    const insumoId = selectedInsumoId[sysId] || '';
    const qtd = Number(manualQtd[sysId]) || 1;

    let newItem: ItemOrcamento;

    if (insumoId) {
      const matched = insumos.find(i => i.id === insumoId);
      if (!matched) return;
      const comp = calcularCustoCompra(matched);
      newItem = {
        id: 'it_' + Math.random().toString(36).slice(2, 9),
        insumoId: matched.id,
        descricao: `${matched.descricao} — ${matched.especificacao}`,
        especificacao: matched.especificacao,
        unidade: matched.unidade,
        quantidade: qtd,
        custoUnit: comp.custoFinal,
        fornecedor: matched.fornecedor,
      };
    } else {
      const desc = manualDesc[sysId] || 'Insumo manual';
      const und = manualUnd[sysId] || 'UN';
      const custo = Number(manualCusto[sysId]) || 0;
      newItem = {
        id: 'it_' + Math.random().toString(36).slice(2, 9),
        insumoId: null,
        descricao: desc,
        especificacao: 'Personalizado',
        unidade: und,
        quantidade: qtd,
        custoUnit: custo,
        fornecedor: 'Manual/Equipe',
      };
    }

    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        return { ...s, itens: [...s.itens, newItem] };
      }
      return s;
    });

    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });

    // Reset inputs
    setSelectedInsumoId(p => ({ ...p, [sysId]: '' }));
    setManualDesc(p => ({ ...p, [sysId]: '' }));
    setManualUnd(p => ({ ...p, [sysId]: 'UN' }));
    setManualQtd(p => ({ ...p, [sysId]: 1 }));
    setManualCusto(p => ({ ...p, [sysId]: 0 }));
  };

  const handleDeleteItem = (sysId: string, itemId: string) => {
    if (!activeProj) return;
    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        return { ...s, itens: s.itens.filter(it => it.id !== itemId) };
      }
      return s;
    });
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });
  };

  /* ----- ENGINEERING AUTOMATION 1: COPPER CIRCUITS ----- */
  const handleAddCircuito = (sysId: string) => {
    if (!activeProj || !circuitNome.trim()) return;
    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        const novosCirc = [
          ...(s.circuitos || []),
          {
            id: 'circ_' + Math.random().toString(36).slice(2, 9),
            nome: circuitNome,
            numEvaporadoras: Number(circuitEvap) || 0,
            numCondensadoras: Number(circuitCond) || 0,
            potenciaHP: Number(circuitHP) || 0,
            trechos: [],
          }
        ];
        return { ...s, circuitos: novosCirc };
      }
      return s;
    });
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });
    setCircuitNome('');
  };

  const handleDeleteCircuito = (sysId: string, circId: string) => {
    if (!activeProj) return;
    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        return { ...s, circuitos: (s.circuitos || []).filter(c => c.id !== circId) };
      }
      return s;
    });
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });
  };

  const handleAddTrechoTubulacao = (sysId: string, circId: string) => {
    if (!activeProj || newTubeLength <= 0) return;
    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        const novosCirc = (s.circuitos || []).map(c => {
          if (c.id === circId) {
            const novosTrechos = [
              ...c.trechos,
              {
                id: 'tr_' + Math.random().toString(36).slice(2, 9),
                bitola: newTubeBitola,
                comprimento: Number(newTubeLength),
                tipo: newTubeTipo,
                paredeIsolamento: newTubeIsol,
              }
            ];
            return { ...c, trechos: novosTrechos };
          }
          return c;
        });
        return { ...s, circuitos: novosCirc };
      }
      return s;
    });
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });
  };

  const handleDeleteTrechoTubulacao = (sysId: string, circId: string, tubeId: string) => {
    if (!activeProj) return;
    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        const novosCirc = (s.circuitos || []).map(c => {
          if (c.id === circId) {
            return { ...c, trechos: c.trechos.filter(t => t.id !== tubeId) };
          }
          return c;
        });
        return { ...s, circuitos: novosCirc };
      }
      return s;
    });
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });
  };

  // Aggregates copper lengths across ALL circuits of the active system, multiplies by kg/m,
  // and adds a budget line for copper tube (if in catalog) with exact accumulated weight!
  const handleAutomateCopperWeight = (sysId: string) => {
    if (!activeProj) return;
    const targetSys = activeProj.sistemas.find(s => s.id === sysId);
    if (!targetSys) return;

    // Sum lengths
    const bitolaLengths: { [bitola: string]: number } = {};
    (targetSys.circuitos || []).forEach(c => {
      c.trechos.forEach(t => {
        bitolaLengths[t.bitola] = (bitolaLengths[t.bitola] || 0) + t.comprimento;
      });
    });

    let totalWeight = 0;
    Object.entries(bitolaLengths).forEach(([bitola, comp]) => {
      const row = tabelaCobre.find(r => r.bitola.trim() === bitola.trim());
      const kgm = row ? row.kgm : 0;
      totalWeight += comp * kgm;
    });

    if (totalWeight <= 0) {
      alert('Nenhum trecho de tubulação foi lançado nos circuitos ainda.');
      return;
    }

    // Try to find raw copper or VRF copper tube in catalog
    const matchingInsumo = insumos.find(i => i.categoria === 'VRF' && i.descricao.toLowerCase().includes('cobre')) || null;

    let newItem: ItemOrcamento;
    if (matchingInsumo) {
      const comp = calcularCustoCompra(matchingInsumo);
      newItem = {
        id: 'it_' + Math.random().toString(36).slice(2, 9),
        insumoId: matchingInsumo.id,
        descricao: `Estimativa de Tubulação de Cobre Consolidada (Circuito Weight)`,
        especificacao: 'Conforme circuitos C1-C20',
        unidade: 'kg',
        quantidade: Math.ceil(totalWeight),
        custoUnit: comp.custoFinal,
        fornecedor: matchingInsumo.fornecedor,
      };
    } else {
      newItem = {
        id: 'it_' + Math.random().toString(36).slice(2, 9),
        insumoId: null,
        descricao: `Tubulação de Cobre — Consolidado de Engenharia`,
        especificacao: 'Conforme circuitos C1-C20',
        unidade: 'kg',
        quantidade: Math.ceil(totalWeight),
        custoUnit: 45.00, // standard estimate
        fornecedor: 'Estimativa Automática',
      };
    }

    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        return { ...s, itens: [...s.itens, newItem] };
      }
      return s;
    });

    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });

    alert(`Sucesso! Estimativa de cobre de ${totalWeight.toFixed(2)} kg adicionada automaticamente como item orçamentário.`);
  };


  /* ----- ENGINEERING AUTOMATION 2: DUCT SEGMENTS ----- */
  const handleAddDuctSegment = (sysId: string) => {
    if (!activeProj || !newDuctDesc.trim() || newDuctC <= 0) return;
    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        const novosTrechos = [
          ...(s.trechosDuto || []),
          {
            id: 'td_' + Math.random().toString(36).slice(2, 9),
            descricao: newDuctDesc,
            largura: Number(newDuctL),
            altura: Number(newDuctA),
            comprimento: Number(newDuctC),
            tipoDuto: newDuctTipo,
          }
        ];
        return { ...s, trechosDuto: novosTrechos };
      }
      return s;
    });
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });
    setNewDuctDesc('');
  };

  const handleDeleteDuctSegment = (sysId: string, tdId: string) => {
    if (!activeProj) return;
    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        return { ...s, trechosDuto: (s.trechosDuto || []).filter(td => td.id !== tdId) };
      }
      return s;
    });
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });
  };

  // Computes accumulated Chapa area across all duct segments, matches catalog, and appends a line
  const handleAutomateDuctArea = (sysId: string) => {
    if (!activeProj) return;
    const targetSys = activeProj.sistemas.find(s => s.id === sysId);
    if (!targetSys) return;

    let totalChapaArea = 0;
    (targetSys.trechosDuto || []).forEach(td => {
      const geo = calcularGeometriaDuto(td.largura, td.altura, td.comprimento);
      totalChapaArea += geo.areaGalvanizado;
    });

    if (totalChapaArea <= 0) {
      alert('Nenhum trecho de duto foi lançado ainda.');
      return;
    }

    // Convert area (m2) to kg estimate (e.g., USG 26 sheet is roughly 4 kg/m2)
    const estimatedWeightKg = totalChapaArea * 4.2;

    const matchedInsumo = insumos.find(i => i.categoria === 'Dutos' && i.descricao.toLowerCase().includes('chapa')) || null;

    let newItem: ItemOrcamento;
    if (matchedInsumo) {
      const comp = calcularCustoCompra(matchedInsumo);
      newItem = {
        id: 'it_' + Math.random().toString(36).slice(2, 9),
        insumoId: matchedInsumo.id,
        descricao: `Chapa de Aço Galvanizado USG 26 (Área de Duto Automática)`,
        especificacao: `Est: ${totalChapaArea.toFixed(1)}m² de chapa`,
        unidade: 'kg',
        quantidade: Math.ceil(estimatedWeightKg),
        custoUnit: comp.custoFinal,
        fornecedor: matchedInsumo.fornecedor,
      };
    } else {
      newItem = {
        id: 'it_' + Math.random().toString(36).slice(2, 9),
        insumoId: null,
        descricao: `Massa Estimada de Chapa Metálica Galvanizada USG 26`,
        especificacao: `Est: ${totalChapaArea.toFixed(1)}m² de chapa`,
        unidade: 'kg',
        quantidade: Math.ceil(estimatedWeightKg),
        custoUnit: 14.50,
        fornecedor: 'Estimativa Automática',
      };
    }

    const updatedSistemas = activeProj.sistemas.map(s => {
      if (s.id === sysId) {
        return { ...s, itens: [...s.itens, newItem] };
      }
      return s;
    });

    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      sistemas: updatedSistemas,
    });

    alert(`Sucesso! Estimativa de ${estimatedWeightKg.toFixed(1)} kg de chapa metálica adicionada automaticamente ao orçamento.`);
  };

  /* ----- RENDER DETAILED SINGLE PROJECT VIEW ----- */
  if (activeProj) {
    let custoProjeto = 0;
    let vendaProjeto = 0;

    activeProj.sistemas.forEach(s => {
      let custoSistema = 0;
      s.itens.forEach(it => {
        custoSistema += (Number(it.custoUnit) || 0) * (Number(it.quantidade) || 0);
      });
      custoProjeto += custoSistema;
      vendaProjeto += calcularPrecoVenda(custoSistema, s.out, s.ft, s.fn, s.lc);
    });

    return (
      <div className="space-y-6">
        {/* Navigation back and header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSetActiveProject(null)}
              className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors"
            >
              ← Voltar
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{activeProj.nome}</h1>
                <span className="font-mono text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md">
                  OBRA ID: {activeProj.id.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {activeProj.local || 'Sem local'}</span>
                <span>• TR Estimado: {activeProj.capacidadeTR} TR</span>
                <span>• Logística: {activeProj.distanciaKm} km</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('proposta')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg cursor-pointer shadow-xs transition-colors"
          >
            Acessar Proposta Final <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Custo e Venda indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Custo Consolidado</span>
              <span className="text-2xl font-mono font-bold text-slate-800">{custoProjeto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">Líquido de impostos de entrada</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between border-l-4 border-l-blue-600">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Venda Consolidada (Limpa)</span>
              <span className="text-2xl font-mono font-bold text-blue-700">{vendaProjeto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">Sem comissão e reserva em cascata</div>
          </div>
        </div>

        {/* Subheader and Create system button */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Disciplinas e Levantamento Técnico</h2>
            <p className="text-xs text-slate-500">Crie abas de disciplinas contendo memória de cálculo e itens de orçamento</p>
          </div>
          <button
            onClick={() => setIsNewSysOpen(true)}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors"
          >
            + Nova Disciplina
          </button>
        </div>

        {/* Modal: Add system */}
        {isNewSysOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
              <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider">Nova Disciplina / Sistema</h3>
                <button onClick={() => setIsNewSysOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Disciplina</label>
                  <select
                    value={sysTipo}
                    onChange={(e) => setSysTipo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                  >
                    {DISCIPLINAS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Fórmula do markup em cadeia:</strong>
                    <p className="font-mono mt-1 bg-white px-1.5 py-1 rounded border border-blue-100 text-[10.5px]">
                      Venda = Custo × (1+OUT) × (1+FT) × (1+FN) / (1−LC)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Outros OUT (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sysOut}
                      onChange={(e) => setSysOut(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Frete FT (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sysFt}
                      onChange={(e) => setSysFt(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Financ. FN (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sysFn}
                      onChange={(e) => setSysFn(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Perda LC (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sysLc}
                      onChange={(e) => setSysLc(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsNewSysOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSistema}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
                >
                  Criar Disciplina
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEMS CARDS RENDERING */}
        {activeProj.sistemas.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 py-16 text-center text-slate-500 rounded-xl">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Nenhuma disciplina cadastrada neste projeto</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Selecione o botão acima para adicionar sistemas (ex: VRF, Dutos, Elétrica ou Serviços) e começar a orçar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProj.sistemas.map(sys => {
              const isCollapsed = !openSystems[sys.id];
              let sysCusto = 0;
              sys.itens.forEach(it => {
                sysCusto += (Number(it.custoUnit) || 0) * (Number(it.quantidade) || 0);
              });
              const sysVenda = calcularPrecoVenda(sysCusto, sys.out, sys.ft, sys.fn, sys.lc);

              return (
                <div key={sys.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  {/* System Header */}
                  <div
                    onClick={() => handleToggleSystem(sys.id)}
                    className="bg-slate-50/70 border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-slate-50 select-none"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{sys.tipo}</h3>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Markups: OUT={sys.out * 100}% · FT={sys.ft * 100}% · FN={sys.fn * 100}% · LC={sys.lc * 100}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-2 sm:mt-0 bg-white sm:bg-transparent p-2 sm:p-0 rounded border sm:border-0 border-slate-100">
                      <div className="text-right font-mono text-xs text-slate-500">
                        Custo: <span className="font-bold text-slate-800">{sysCusto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      <div className="text-right font-mono text-xs text-slate-500 border-l border-slate-200 pl-4">
                        Preço Venda: <span className="font-bold text-blue-700">{sysVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSistema(sys.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir disciplina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* System Body */}
                  {!isCollapsed && (
                    <div className="p-5 space-y-6">

                      {/* EXTRA LEVEL AUTOMATION FOR VRF/FRIGORIFICA (CIRCUITS C1-C20 SETUP) */}
                      {(sys.tipo === 'VRF' || sys.tipo === 'Frigorífica') && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Cable className="w-4 h-4 text-blue-600" /> Memória de Levantamento: Circuitos de Cobre (C1 — C20)
                              </h4>
                              <p className="text-[11px] text-slate-500">Lance trechos de cobre neste módulo. O motor calculará o peso total de cobre.</p>
                            </div>
                            <button
                              onClick={() => handleAutomateCopperWeight(sys.id)}
                              className="mt-2 md:mt-0 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Gerar Cobre no Orçamento
                            </button>
                          </div>

                          {/* Circuit Adder form */}
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-white p-3 rounded-lg border border-slate-150 shadow-2xs">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Identificação do Circuito</label>
                              <input
                                type="text"
                                value={circuitNome}
                                onChange={(e) => setCircuitNome(e.target.value)}
                                placeholder="Ex: C1 - Evaporadoras 1 a 5"
                                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Evaporadoras (qtd)</label>
                              <input
                                type="number"
                                value={circuitEvap}
                                onChange={(e) => setCircuitEvap(parseInt(e.target.value) || 0)}
                                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Potência (HP)</label>
                              <input
                                type="number"
                                value={circuitHP}
                                onChange={(e) => setCircuitHP(parseInt(e.target.value) || 0)}
                                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={() => handleAddCircuito(sys.id)}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded-lg cursor-pointer h-8 transition-colors flex items-center justify-center gap-1"
                            >
                              + Criar Circuito
                            </button>
                          </div>

                          {/* Circuits display */}
                          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {(sys.circuitos || []).map(circ => {
                              // Sum length in circuit
                              const circTotalLength = circ.trechos.reduce((sum, t) => sum + t.comprimento, 0);

                              return (
                                <div key={circ.id} className="bg-white border border-slate-150 rounded-lg p-3 space-y-3 shadow-2xs relative">
                                  <button
                                    onClick={() => handleDeleteCircuito(sys.id, circ.id)}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer text-xs font-mono"
                                  >
                                    Excluir Circuito
                                  </button>
                                  <div className="flex items-center gap-4 border-b border-slate-100 pb-1.5">
                                    <h5 className="font-bold text-xs text-slate-800">{circ.nome}</h5>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Evaps: {circ.numEvaporadoras} · Conds: {circ.numCondensadoras} · Potência: {circ.potenciaHP} HP · Comprimento: {circTotalLength.toFixed(1)}m
                                    </span>
                                  </div>

                                  {/* Add segment in circuit */}
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end bg-slate-50/50 p-2 rounded-md border border-slate-100">
                                    <div>
                                      <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bitola</label>
                                      <select
                                        value={newTubeBitola}
                                        onChange={(e) => setNewTubeBitola(e.target.value)}
                                        className="w-full border border-slate-200 rounded-md p-1 text-[11px] bg-white focus:outline-none"
                                      >
                                        {tabelaCobre.map(row => (
                                          <option key={row.bitola} value={row.bitola}>{row.bitola}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">Comp. (m)</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={newTubeLength}
                                        onChange={(e) => setNewTubeLength(parseFloat(e.target.value) || 0)}
                                        className="w-full border border-slate-200 rounded-md p-1 text-[11px] font-mono focus:outline-none bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">Função</label>
                                      <select
                                        value={newTubeTipo}
                                        onChange={(e) => setNewTubeTipo(e.target.value as any)}
                                        className="w-full border border-slate-200 rounded-md p-1 text-[11px] bg-white focus:outline-none"
                                      >
                                        <option value="líquido">Líquido</option>
                                        <option value="sucção">Sucção</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">Isolam.</label>
                                      <input
                                        type="text"
                                        value={newTubeIsol}
                                        onChange={(e) => setNewTubeIsol(e.target.value)}
                                        placeholder="Ex: 19mm"
                                        className="w-full border border-slate-200 rounded-md p-1 text-[11px] focus:outline-none bg-white"
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleAddTrechoTubulacao(sys.id, circ.id)}
                                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] py-1 px-2 rounded-md cursor-pointer h-7 transition-colors"
                                    >
                                      + Lançar Trecho
                                    </button>
                                  </div>

                                  {/* Segments of this circuit list */}
                                  {circ.trechos.length > 0 && (
                                    <div className="overflow-x-auto pt-1">
                                      <table className="w-full text-left text-[10px] border-collapse font-mono text-slate-500">
                                        <thead>
                                          <tr className="border-b border-slate-100 text-[9px] uppercase text-slate-400">
                                            <th className="py-1">Bitola</th>
                                            <th className="py-1 text-right">Comprimento</th>
                                            <th className="py-1">Função</th>
                                            <th className="py-1">Isolamento</th>
                                            <th className="py-1 text-right">Ação</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {circ.trechos.map(tr => (
                                            <tr key={tr.id}>
                                              <td className="py-1 font-bold text-slate-700">{tr.bitola}</td>
                                              <td className="py-1 text-right font-bold text-slate-700">{tr.comprimento} m</td>
                                              <td className="py-1">{tr.tipo}</td>
                                              <td className="py-1">{tr.paredeIsolamento}</td>
                                              <td className="py-1 text-right">
                                                <button
                                                  onClick={() => handleDeleteTrechoTubulacao(sys.id, circ.id, tr.id)}
                                                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                                >
                                                  ✕
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {(sys.circuitos || []).length === 0 && (
                              <p className="text-xs text-slate-400 text-center py-4 bg-white border border-slate-150 rounded-lg">
                                Nenhum circuito adicionado para este sistema de refrigeração.
                              </p>
                            )}
                          </div>
                        </div>
                      )}


                      {/* EXTRA LEVEL AUTOMATION FOR DUTOS (DUCT TRECHOS SETUP) */}
                      {sys.tipo === 'Dutos' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-blue-600" /> Memória de Levantamento: Geometria de Dutos
                              </h4>
                              <p className="text-[11px] text-slate-500">Lance ramais e eixos de dutos. O motor calculará áreas de chapa e isolamento em m².</p>
                            </div>
                            <button
                              onClick={() => handleAutomateDuctArea(sys.id)}
                              className="mt-2 md:mt-0 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Gerar Chapas no Orçamento
                            </button>
                          </div>

                          {/* Duct adder form */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end bg-white p-3 rounded-lg border border-slate-150 shadow-2xs">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Eixo / Ramal do Duto</label>
                              <input
                                type="text"
                                value={newDuctDesc}
                                onChange={(e) => setNewDuctDesc(e.target.value)}
                                placeholder="Ex: Ramal Principal Insuflamento"
                                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Largura L (m)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={newDuctL}
                                onChange={(e) => setNewDuctL(parseFloat(e.target.value) || 0)}
                                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono focus:outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Altura A (m)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={newDuctA}
                                onChange={(e) => setNewDuctA(parseFloat(e.target.value) || 0)}
                                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono focus:outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Comp. C (m)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={newDuctC}
                                onChange={(e) => setNewDuctC(parseFloat(e.target.value) || 0)}
                                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono focus:outline-none bg-white"
                              />
                            </div>
                            <button
                              onClick={() => handleAddDuctSegment(sys.id)}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded-lg cursor-pointer h-8 transition-colors flex items-center justify-center gap-1"
                            >
                              + Adicionar Duto
                            </button>
                          </div>

                          {/* Ducts segments list table */}
                          {(sys.trechosDuto || []).length > 0 ? (
                            <div className="overflow-x-auto bg-white border border-slate-150 rounded-lg shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse font-mono">
                                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-400">
                                  <tr>
                                    <th className="px-3 py-2 font-semibold">Ramal</th>
                                    <th className="px-3 py-2 text-right">L × A × C (m)</th>
                                    <th className="px-3 py-2 text-right">Área Chapa</th>
                                    <th className="px-3 py-2 text-right">Isolamento</th>
                                    <th className="px-3 py-2 text-right">Suportes</th>
                                    <th className="px-3 py-2 text-right">Ação</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                  {(sys.trechosDuto || []).map(td => {
                                    const calc = calcularGeometriaDuto(td.largura, td.altura, td.comprimento);
                                    return (
                                      <tr key={td.id} className="hover:bg-slate-50/40">
                                        <td className="px-3 py-2 font-sans font-bold text-slate-800">{td.descricao}</td>
                                        <td className="px-3 py-2 text-right">{td.largura.toFixed(2)} × {td.altura.toFixed(2)} × {td.comprimento.toFixed(1)}m</td>
                                        <td className="px-3 py-2 text-right font-bold text-slate-800">{calc.areaGalvanizado.toFixed(2)} m²</td>
                                        <td className="px-3 py-2 text-right">{calc.areaIsolamento.toFixed(2)} m²</td>
                                        <td className="px-3 py-2 text-right">{calc.suporte.toFixed(2)} m</td>
                                        <td className="px-3 py-2 text-right">
                                          <button
                                            onClick={() => handleDeleteDuctSegment(sys.id, td.id)}
                                            className="text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                          >
                                            ✕
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-4 bg-white border border-slate-150 rounded-lg">
                              Nenhum trecho de duto adicionado para este sistema de distribuição.
                            </p>
                          )}
                        </div>
                      )}


                      {/* DISCIPLINE BUDGET TABLE (ORÇAMENTO REAL) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="text-sm font-bold text-slate-800">Planilha Orçamentária da Disciplina</h4>
                        </div>

                        {sys.itens.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-150 rounded-lg text-xs font-mono">
                            Nenhum item orçado ainda. Use os controles abaixo para inserir materiais ou serviços.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-250/50 rounded-lg">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider text-[10px] border-b border-slate-200">
                                  <th className="px-4 py-2.5 font-semibold">Material / Atividade</th>
                                  <th className="px-4 py-2.5 font-semibold text-right">Qtd</th>
                                  <th className="px-4 py-2.5 font-semibold text-right">Custo Unit.*</th>
                                  <th className="px-4 py-2.5 font-semibold text-right">Custo Total</th>
                                  <th className="px-4 py-2.5 font-semibold text-right bg-blue-50/40 text-blue-800">Preço Venda (com Markup)</th>
                                  <th className="px-4 py-2.5 font-semibold text-right">Ação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sys.itens.map(it => {
                                  const cTotal = (Number(it.custoUnit) || 0) * (Number(it.quantidade) || 0);
                                  const vTotal = calcularPrecoVenda(cTotal, sys.out, sys.ft, sys.fn, sys.lc);

                                  return (
                                    <tr key={it.id} className="hover:bg-slate-50/30">
                                      <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800 text-sm">{it.descricao}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                          {it.insumoId ? `Vinculado ao Catálogo · Fornecedor: ${it.fornecedor || '—'}` : 'Inserção Manual / Serviço'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{it.quantidade} <span className="font-sans font-normal text-slate-400 text-[10px]">{it.unidade}</span></td>
                                      <td className="px-4 py-3 text-right font-mono text-slate-600">{it.custoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{cTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-700 bg-blue-50/10">{vTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          onClick={() => handleDeleteItem(sys.id, it.id)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer transition-colors"
                                          title="Remover item"
                                        >
                                          ✕
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          * Custo Unitário do Catálogo já inclui as deduções de créditos fiscais e acréscimos logísticos.
                        </div>

                        {/* Inserter controls */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-3 space-y-4">
                          <div className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-blue-600" /> Lançar Item de Custos no Orçamento
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Insumo selector */}
                            <div className="md:col-span-5">
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Selecionar Insumo do Catálogo</label>
                              <select
                                value={selectedInsumoId[sys.id] || ''}
                                onChange={(e) => setSelectedInsumoId(p => ({ ...p, [sys.id]: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                              >
                                <option value="">— LANÇAR MANUAL (ATIVIDADE/SERVIÇO/DESPESA) —</option>
                                {insumos
                                  // filter catalog matching closest discipline for UI convenience
                                  .filter(i => selectedInsumoId[sys.id] ? true : (sys.tipo === 'Dutos' ? i.categoria === 'Dutos' : sys.tipo === 'VRF' ? i.categoria === 'VRF' : i.categoria === i.categoria))
                                  .map(i => (
                                    <option key={i.id} value={i.id}>{i.descricao} [{i.especificacao}] — {i.unidade}</option>
                                  ))}
                              </select>
                            </div>

                            {/* Qtd */}
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Quantidade</label>
                              <input
                                type="number"
                                step="0.01"
                                value={manualQtd[sys.id] !== undefined ? manualQtd[sys.id] : 1}
                                onChange={(e) => setManualQtd(p => ({ ...p, [sys.id]: parseFloat(e.target.value) || 0 }))}
                                className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none bg-white"
                              />
                            </div>

                            {/* Save btn */}
                            <div className="md:col-span-5">
                              <button
                                onClick={() => handleAddItem(sys.id)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer h-9 transition-colors flex items-center justify-center gap-1"
                              >
                                {selectedInsumoId[sys.id] ? 'Vincular Insumo' : 'Lançar no Orçamento'}
                              </button>
                            </div>
                          </div>

                          {/* Manual parameters (only shown if selector is empty) */}
                          {!selectedInsumoId[sys.id] && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-2 border-t border-slate-200/50 animate-in fade-in duration-100">
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição Manual</label>
                                <input
                                  type="text"
                                  value={manualDesc[sys.id] || ''}
                                  onChange={(e) => setManualDesc(p => ({ ...p, [sys.id]: e.target.value }))}
                                  placeholder="Ex: Diárias de alimentação e alojamento"
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Und</label>
                                <input
                                  type="text"
                                  value={manualUnd[sys.id] || 'UN'}
                                  onChange={(e) => setManualUnd(p => ({ ...p, [sys.id]: e.target.value }))}
                                  placeholder="UN"
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none bg-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Custo Unit. (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={manualCusto[sys.id] !== undefined ? manualCusto[sys.id] : 0}
                                  onChange={(e) => setManualCusto(p => ({ ...p, [sys.id]: parseFloat(e.target.value) || 0 }))}
                                  placeholder="0,00"
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ----- RENDER PROJECTS LIST VIEW ----- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO 03</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projetos &amp; Orçamentos</h1>
          <p className="text-sm text-slate-500">Estimativas, levantamentos quantitativos e consolidação de custos de obras</p>
        </div>
        <button
          onClick={() => setIsNewProjOpen(true)}
          className="mt-4 md:mt-0 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Novo Projeto/Obra
        </button>
      </div>

      {/* Projects Grid */}
      {projetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
          <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">Nenhum projeto cadastrado</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Abra o fluxo de orçamento clicando no botão acima para iniciar um levantamento de obras.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetos.map(proj => {
            const totalSistemas = proj.sistemas.length;
            let totalCusto = 0;
            let totalVenda = 0;

            proj.sistemas.forEach(s => {
              let cost = s.itens.reduce((sum, item) => sum + (Number(item.custoUnit) || 0) * (Number(item.quantidade) || 0), 0);
              totalCusto += cost;
              totalVenda += calcularPrecoVenda(cost, s.out, s.ft, s.fn, s.lc);
            });

            return (
              <div
                key={proj.id}
                onClick={() => onSetActiveProject(proj.id)}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl shadow-xs hover:shadow-lg p-5 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded uppercase">
                      ID: {proj.id.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{proj.dataCriacao}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-base line-clamp-2 transition-colors mb-2">
                    {proj.nome}
                  </h3>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 items-center mt-2 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {proj.local || '—'}</span>
                    <span>• {proj.capacidadeTR} TR</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Preço Final Estimado</span>
                    <span className="text-base font-mono font-bold text-blue-700">
                      {totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-150">
                    {totalSistemas} Disciplinas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE PROJECT */}
      {isNewProjOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">Novo Orçamento de Obra</h2>
              <button onClick={() => setIsNewProjOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Nome da Obra / Cliente</label>
                <input
                  type="text"
                  value={projNome}
                  onChange={(e) => setProjNome(e.target.value)}
                  placeholder="Ex: Shopping Rio Mar — Torre B"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Cidade / UF</label>
                <input
                  type="text"
                  value={projLocal}
                  onChange={(e) => setProjLocal(e.target.value)}
                  placeholder="Ex: Recife - PE"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Distância Logística (km)</label>
                  <input
                    type="number"
                    value={projDist}
                    onChange={(e) => setProjDist(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Capacidade Estimada (TR)</label>
                  <input
                    type="number"
                    value={projTR}
                    onChange={(e) => setProjTR(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsNewProjOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
              >
                Cadastrar Obra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
