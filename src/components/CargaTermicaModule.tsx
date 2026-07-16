import React, { useState } from 'react';
import { Projeto, AmbienteCarga } from '../types';
import { Thermometer, Plus, Trash2, ShieldCheck, Zap, RefreshCw, Check, ArrowRight, Layers, LayoutGrid } from 'lucide-react';

interface CargaTermicaModuleProps {
  projetos: Projeto[];
  activeProjectId: string | null;
  onUpdateProjetoDados: (id: string, updated: Projeto) => void;
}

export default function CargaTermicaModule({
  projetos,
  activeProjectId,
  onUpdateProjetoDados,
}: CargaTermicaModuleProps) {
  const activeProj = projetos.find(p => p.id === activeProjectId) || null;

  // Local state for temporary inputs to create a new environment
  const [nomeForm, setNomeForm] = useState('');
  const [areaForm, setAreaForm] = useState(20);
  const [pessoasForm, setPessoasForm] = useState(2);
  const [janelasSol, setJanelasSol] = useState(false);
  const [equipamentosWatts, setEquipamentosWatts] = useState(300);

  // Sync / initialize project data if undefined
  const currentCarga = activeProj?.cargaTermica || {
    ambientes: [
      { id: 'amb_1', nome: 'Salão Principal (Showroom)', area: 45, pessoas: 8, janelasSol: true, cargaEquipamentos: 1500, btuTotal: 38100, trTotal: 3.175 },
      { id: 'amb_2', nome: 'Sala de TI / Servidores', area: 15, pessoas: 1, janelasSol: false, cargaEquipamentos: 3000, btuTotal: 19800, trTotal: 1.65 }
    ],
    totalBTU: 57900,
    totalTR: 4.825
  };

  const handleAddAmbiente = () => {
    if (!activeProj || !nomeForm.trim()) return;

    // HVAC standard formula:
    // Base load: 600 BTU/h per m² (800 if sun)
    const baseBTU = areaForm * (janelasSol ? 800 : 600);
    // +600 BTU/h per person (beyond the 1st person, or let's say all people * 600)
    const pessoasBTU = pessoasForm * 600;
    // Equipment: 1 Watt = 3.41 BTU/h
    const equipBTU = Math.round(equipamentosWatts * 3.41);
    
    const btuTotal = baseBTU + pessoasBTU + equipBTU;
    const trTotal = parseFloat((btuTotal / 12000).toFixed(3));

    const newAmbiente: AmbienteCarga = {
      id: 'amb_' + Math.random().toString(36).slice(2, 9),
      nome: nomeForm,
      area: areaForm,
      pessoas: pessoasForm,
      janelasSol,
      cargaEquipamentos: equipamentosWatts,
      btuTotal,
      trTotal,
    };

    const updatedAmbientes = [...currentCarga.ambientes, newAmbiente];
    updateCargaTermica(updatedAmbientes);

    // Reset form
    setNomeForm('');
    setAreaForm(20);
    setPessoasForm(2);
    setJanelasSol(false);
    setEquipamentosWatts(300);
  };

  const handleDeleteAmbiente = (id: string) => {
    if (!activeProj) return;
    const updatedAmbientes = currentCarga.ambientes.filter(a => a.id !== id);
    updateCargaTermica(updatedAmbientes);
  };

  const updateCargaTermica = (ambientes: AmbienteCarga[]) => {
    if (!activeProj) return;
    const totalBTU = ambientes.reduce((sum, a) => sum + a.btuTotal, 0);
    const totalTR = parseFloat((totalBTU / 12000).toFixed(3));

    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      cargaTermica: {
        ambientes,
        totalBTU,
        totalTR,
      }
    });
  };

  const handleSyncToProjectCapacity = () => {
    if (!activeProj) return;
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      capacidadeTR: parseFloat(currentCarga.totalTR.toFixed(2)),
    });
    alert(`Capacidade total do projeto sincronizada com sucesso para ${currentCarga.totalTR.toFixed(2)} TR!`);
  };

  const handlePreset = (type: string) => {
    if (type === 'office') {
      setNomeForm('Escritório Corporativo');
      setAreaForm(35);
      setPessoasForm(5);
      setJanelasSol(true);
      setEquipamentosWatts(800);
    } else if (type === 'server') {
      setNomeForm('Data Center / Rack');
      setAreaForm(12);
      setPessoasForm(0);
      setJanelasSol(false);
      setEquipamentosWatts(4000);
    } else if (type === 'meeting') {
      setNomeForm('Sala de Reuniões');
      setAreaForm(24);
      setPessoasForm(12);
      setJanelasSol(false);
      setEquipamentosWatts(500);
    }
  };

  if (!activeProj) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO ADICIONAL</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Estudo de Carga Térmica</h1>
          <p className="text-sm text-slate-500">Cálculo e dimensionamento térmico normativo de ambientes (BTU/h &amp; TR)</p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-xl text-center text-slate-500">
          <Thermometer className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">Nenhum projeto selecionado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Por favor, selecione ou crie um projeto no módulo de <strong>Projetos &amp; Orçamentos</strong> para calcular a carga térmica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO TÉCNICO</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cálculo de Carga Térmica</h1>
          <p className="text-sm text-slate-500 font-medium">Dimensionamento de BTUs e TRs do projeto: <span className="text-slate-800 font-bold">{activeProj.nome}</span></p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={handleSyncToProjectCapacity}
            disabled={currentCarga.ambientes.length === 0}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Carga com o Projeto ({currentCarga.totalTR.toFixed(2)} TR)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form & Presets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-blue-600" />
                Adicionar Novo Ambiente
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Preencha os parâmetros de carga térmica de engenharia</p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Templates Rápidos:</span>
              <div className="flex flex-wrap gap-1.5">
                <button 
                  onClick={() => handlePreset('office')} 
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold text-slate-600 cursor-pointer"
                >
                  Escritório Comum
                </button>
                <button 
                  onClick={() => handlePreset('server')} 
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold text-slate-600 cursor-pointer"
                >
                  Data Center (Calor Alto)
                </button>
                <button 
                  onClick={() => handlePreset('meeting')} 
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold text-slate-600 cursor-pointer"
                >
                  Sala de Reunião
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nome do Ambiente</label>
                <input
                  type="text"
                  placeholder="Ex: Sala de Reunião Direção"
                  value={nomeForm}
                  onChange={(e) => setNomeForm(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Área Interna (m²)</label>
                  <input
                    type="number"
                    min="1"
                    value={areaForm}
                    onChange={(e) => setAreaForm(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ocupantes (Pessoas)</label>
                  <input
                    type="number"
                    min="0"
                    value={pessoasForm}
                    onChange={(e) => setPessoasForm(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dissipação de Equipamentos (Watts)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={equipamentosWatts}
                  onChange={(e) => setEquipamentosWatts(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Soma de computadores, TVs, servidores e iluminação</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="janelasSol"
                  checked={janelasSol}
                  onChange={(e) => setJanelasSol(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="janelasSol" className="text-xs text-slate-600 font-medium select-none cursor-pointer">
                  Exposição Solar Forte / Janelas de Vidro
                </label>
              </div>

              <button
                type="button"
                onClick={handleAddAmbiente}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer h-9 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Incluir na Carga Térmica
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Environments breakdown & total summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white border-slate-200 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Ambientes</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{currentCarga.ambientes.length}</p>
            </div>
            <div className="rounded-lg border bg-white border-slate-200 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carga Térmica Total (BTU/h)</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {currentCarga.totalBTU.toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">BTU/h</span>
              </p>
            </div>
            <div className="rounded-lg border bg-blue-600 p-4 text-white shadow-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Capacidade Total Recomendada</p>
              <p className="text-xl font-bold mt-1">
                {currentCarga.totalTR.toFixed(3)} <span className="text-xs font-normal opacity-85">TR</span>
              </p>
            </div>
          </div>

          {/* Environments Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Planilha Analítica de Carga Térmica</h3>
              <span className="text-[10px] font-mono text-slate-400">Norma ABNT NBR 5858 / ASHRAE</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 uppercase font-mono tracking-wider text-[10px]">
                    <th className="px-4 py-3 font-semibold">Ambiente / Local</th>
                    <th className="px-4 py-3 font-semibold text-right">Área</th>
                    <th className="px-4 py-3 font-semibold text-right">Pessoas</th>
                    <th className="px-4 py-3 font-semibold text-center">Sol</th>
                    <th className="px-4 py-3 font-semibold text-right">Equipamentos</th>
                    <th className="px-4 py-3 font-semibold text-right text-blue-600 font-bold">Carga BTU/h</th>
                    <th className="px-4 py-3 font-semibold text-right">TR</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {currentCarga.ambientes.map((amb) => (
                    <tr key={amb.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">{amb.nome}</td>
                      <td className="px-4 py-3 text-right font-mono">{amb.area} m²</td>
                      <td className="px-4 py-3 text-right font-mono">{amb.pessoas}</td>
                      <td className="px-4 py-3 text-center font-mono">
                        {amb.janelasSol ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">SIM</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{amb.cargaEquipamentos} W</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">{amb.btuTotal.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{amb.trTotal.toFixed(2)} TR</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteAmbiente(amb.id)}
                          className="p-1 hover:bg-slate-100 text-rose-500 rounded cursor-pointer transition-colors"
                          title="Excluir ambiente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentCarga.ambientes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 font-mono">Nenhum ambiente adicionado ao estudo de carga ainda.</td>
                    </tr>
                  )}
                </tbody>
                {currentCarga.ambientes.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <td className="px-4 py-3 uppercase font-mono text-[10px]">Carga Acumulada</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {currentCarga.ambientes.reduce((acc, a) => acc + a.area, 0)} m²
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {currentCarga.ambientes.reduce((acc, a) => acc + a.pessoas, 0)}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-mono">
                        {currentCarga.ambientes.reduce((acc, a) => acc + a.cargaEquipamentos, 0)} W
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-700 text-sm">
                        {currentCarga.totalBTU.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-950 text-sm">
                        {currentCarga.totalTR.toFixed(3)} TR
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-150 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Recomendação de Instalação Alure:</strong>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Recomendamos sempre o dimensionamento de sistemas VRF com fator de simultaneidade máxima de até 120% da carga térmica calculada se os ambientes tiverem picos de uso desencontrados, gerando economia expressiva no investimento de condensadoras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
