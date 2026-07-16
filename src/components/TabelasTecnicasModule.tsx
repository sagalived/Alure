import React, { useState } from 'react';
import { TabelaCobreRow } from '../types';
import { calcularGeometriaDuto, calcularPesoCobre } from '../utils/engine';
import { Ruler, Sliders, Weight, Plus, Trash2, Check, RefreshCw, Layers } from 'lucide-react';

interface TabelasTecnicasModuleProps {
  tabelaCobre: TabelaCobreRow[];
  onUpdateTabelaCobre: (newTable: TabelaCobreRow[]) => void;
}

interface CopperSegment {
  id: string;
  bitola: string;
  comprimento: number;
}

export default function TabelasTecnicasModule({ tabelaCobre, onUpdateTabelaCobre }: TabelasTecnicasModuleProps) {
  // Duct calculator state
  const [ductL, setDuctL] = useState(0.40);
  const [ductA, setDuctA] = useState(0.30);
  const [ductC, setDuctC] = useState(1.00);

  // Copper segments state (SUMIFS mockup)
  const [segments, setSegments] = useState<CopperSegment[]>([
    { id: '1', bitola: '1/4"', comprimento: 12.5 },
    { id: '2', bitola: '1 1/8"', comprimento: 12.5 },
    { id: '3', bitola: '3/8"', comprimento: 24 },
    { id: '4', bitola: '5/8"', comprimento: 24 },
  ]);
  const [newBitola, setNewBitola] = useState(tabelaCobre[0]?.bitola || '1/4"');
  const [newComp, setNewComp] = useState(10);

  // Duct geometry calculation
  const geo = calcularGeometriaDuto(ductL, ductA, ductC);

  // Sum lengths per copper bitola
  const totalLengths: { [bitola: string]: number } = {};
  segments.forEach(s => {
    totalLengths[s.bitola] = (totalLengths[s.bitola] || 0) + Number(s.comprimento || 0);
  });

  // Calculate total copper weight based on the technical table
  let totalWeight = 0;
  const bitolaWeightList = Object.entries(totalLengths).map(([bitola, comp]) => {
    const row = tabelaCobre.find(r => r.bitola.trim() === bitola.trim());
    const kgm = row ? row.kgm : 0;
    const weight = comp * kgm;
    totalWeight += weight;
    return { bitola, comp, kgm, weight };
  });

  // Table row editing handlers
  const handleRowChange = (index: number, field: 'bitola' | 'kgm', value: string | number) => {
    const updated = [...tabelaCobre];
    if (field === 'bitola') {
      updated[index] = { ...updated[index], bitola: String(value) };
    } else {
      updated[index] = { ...updated[index], kgm: Number(value) || 0 };
    }
    onUpdateTabelaCobre(updated);
  };

  const handleAddRow = () => {
    const updated = [...tabelaCobre, { bitola: 'Nova Bitola', kgm: 0 }];
    onUpdateTabelaCobre(updated);
  };

  const handleRemoveRow = (index: number) => {
    const updated = tabelaCobre.filter((_, idx) => idx !== index);
    onUpdateTabelaCobre(updated);
  };

  const handleAddSegment = () => {
    if (newComp <= 0) return;
    setSegments([
      ...segments,
      { id: Math.random().toString(), bitola: newBitola, comprimento: Number(newComp) }
    ]);
  };

  const handleRemoveSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO 02</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tabelas Técnicas &amp; Geometrias</h1>
          <p className="text-sm text-slate-500">Dados técnicos de engenharia de ar condicionado, dutos e cálculo de pesos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Technical copper table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Weight className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Tabela de Tubulações (kg/m)</h2>
            </div>
            <button
              onClick={handleAddRow}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-md hover:bg-blue-100/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Bitola
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dados de engenharia contendo a massa linear do cobre por diâmetro nominal. Editável para refinamentos.
          </p>

          <div className="max-h-[380px] overflow-y-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 uppercase font-mono tracking-wider sticky top-0 z-10">
                  <th className="px-3 py-2 font-semibold">Bitola (pol)</th>
                  <th className="px-3 py-2 font-semibold text-right">Peso (kg/m)</th>
                  <th className="px-3 py-2 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {tabelaCobre.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-1.5">
                      <input
                        type="text"
                        value={row.bitola}
                        onChange={(e) => handleRowChange(idx, 'bitola', e.target.value)}
                        className="w-full border border-slate-100 focus:border-blue-300 focus:outline-none bg-transparent px-1.5 py-1 rounded text-slate-800 font-sans font-bold"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        step="0.001"
                        value={row.kgm}
                        onChange={(e) => handleRowChange(idx, 'kgm', e.target.value)}
                        className="w-full border border-slate-100 focus:border-blue-300 focus:outline-none text-right bg-transparent px-1.5 py-1 rounded font-mono font-semibold text-slate-700"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 bg-slate-50 p-2 rounded border border-slate-100">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> Alterações salvas instantaneamente no armazenamento local.
          </div>
        </div>

        {/* Right column: Interactive Engineering Tools */}
        <div className="lg:col-span-7 space-y-6">
          {/* Duct Calculator */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Ruler className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Calculadora Geométrica de Dutos</h2>
            </div>
            <p className="text-xs text-slate-500">
              Padrão de fórmula 5.8: Calcula dimensões, áreas de chapa galvanizada, isolamento termoacústico e suportes a partir de L, A, C.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Largura L (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ductL}
                  onChange={(e) => setDuctL(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Altura A (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ductA}
                  onChange={(e) => setDuctA(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Comprimento C (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ductC}
                  onChange={(e) => setDuctC(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 border border-slate-150 rounded-lg">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Chapa Galvanizada</span>
                <div className="text-lg font-mono font-bold text-slate-800">{geo.areaGalvanizado.toFixed(3)} m²</div>
                <span className="text-[9px] text-slate-400 block font-mono">f: (L+A) × 2 × C</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Isolamento Térmico</span>
                <div className="text-lg font-mono font-bold text-slate-800">{geo.areaIsolamento.toFixed(3)} m²</div>
                <span className="text-[9px] text-slate-400 block font-mono">f: ((L+0.04)+(A+0.04)) × 2 × C</span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Suportes TDC</span>
                <div className="text-lg font-mono font-bold text-slate-800">{geo.suporte.toFixed(2)} m</div>
                <span className="text-[9px] text-slate-400 block font-mono">f: (L+0.1) × C / 2.5</span>
              </div>
              <div className="border-t border-slate-200/60 col-span-full pt-2 flex justify-between text-xs text-slate-500 font-mono">
                <span>Perímetro: <b>{geo.perimetro.toFixed(2)} m</b></span>
                <span>Perfurado: <b>{geo.perfurado.toFixed(2)} m</b></span>
              </div>
            </div>
          </div>

          {/* Copper length to Weight dynamic calculator (SUMIFS) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Quantitativo Cobre por Projeto (Módulo de Bitolas)</h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Padrão de cálculo 5.7: Simulação de levantamento de trechos de tubulação. O motor agrupa os comprimentos por bitola (SUMIFS) e calcula o peso total de cobre necessário.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-150">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Selecionar Bitola</label>
                <select
                  value={newBitola}
                  onChange={(e) => setNewBitola(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-none"
                >
                  {tabelaCobre.map(row => (
                    <option key={row.bitola} value={row.bitola}>{row.bitola}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Comprimento (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newComp}
                  onChange={(e) => setNewComp(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none bg-white"
                />
              </div>
              <button
                onClick={handleAddSegment}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer h-9 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Trecho
              </button>
            </div>

            {/* Segment results list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Segments list */}
              <div className="border border-slate-100 rounded-lg p-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 block">Trechos de Tubulação</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {segments.map(seg => (
                    <div key={seg.id} className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="font-mono text-slate-700">Bitola: <b>{seg.bitola}</b></span>
                      <span className="font-mono text-slate-700">Comp: <b>{seg.comprimento}m</b></span>
                      <button
                        onClick={() => handleRemoveSegment(seg.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {segments.length === 0 && (
                    <p className="text-[11px] text-slate-400 py-4 text-center">Nenhum trecho inserido.</p>
                  )}
                </div>
              </div>

              {/* Aggregation (SUMIFS outcome) */}
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 block">Cálculo de Massa Consolidada</span>
                  <div className="space-y-1.5 text-[11px] font-mono text-slate-600 max-h-28 overflow-y-auto">
                    {bitolaWeightList.map(item => (
                      <div key={item.bitola} className="flex justify-between">
                        <span>{item.bitola}: {item.comp.toFixed(1)}m × {item.kgm.toFixed(3)}kg/m</span>
                        <span className="font-bold text-slate-800">{item.weight.toFixed(3)} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-baseline text-xs font-mono">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">PESO TOTAL DE COBRE</span>
                  <span className="font-bold text-blue-700 text-sm">{totalWeight.toFixed(3)} kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
