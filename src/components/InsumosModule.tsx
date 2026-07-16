import React, { useState } from 'react';
import { Insumo, PrecoHistorico } from '../types';
import { calcularCustoCompra, obterStatusCotacao } from '../utils/engine';
import { Search, Plus, Filter, Edit2, Trash2, Calendar, FileSpreadsheet, History, Info } from 'lucide-react';

interface InsumosModuleProps {
  insumos: Insumo[];
  onAddInsumo: (insumo: Omit<Insumo, 'id'>) => void;
  onUpdateInsumo: (id: string, insumo: Insumo) => void;
  onDeleteInsumo: (id: string) => void;
}

const CATEGORIAS = ["Todas", "Elétrica", "Hidráulica", "Frigorífica", "Dutos", "VRF", "Equipamentos", "Outros/Serviços"];

export default function InsumosModule({ insumos, onAddInsumo, onUpdateInsumo, onDeleteInsumo }: InsumosModuleProps) {
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Insumo | null>(null);

  // Form states
  const [categoria, setCategoria] = useState('VRF');
  const [descricao, setDescricao] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  const [unidade, setUnidade] = useState('UN');
  const [precoUnit, setPrecoUnit] = useState(0);
  const [icmsEntrada, setIcmsEntrada] = useState(0.20); // 20% default
  const [ipi, setIpi] = useState(0.05); // 5% default
  const [frete, setFrete] = useState(0.02); // 2% default
  const [fornecedor, setFornecedor] = useState('');
  const [dataCotacao, setDataCotacao] = useState(new Date().toISOString().slice(0, 10));

  const filteredInsumos = insumos.filter(item => {
    const matchesCat = selectedCat === 'Todas' || item.categoria === selectedCat;
    const matchesSearch = 
      item.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.especificacao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fornecedor || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenNewModal = () => {
    setEditingInsumo(null);
    setCategoria('VRF');
    setDescricao('');
    setEspecificacao('');
    setUnidade('UN');
    setPrecoUnit(0);
    setIcmsEntrada(0.20);
    setIpi(0.05);
    setFrete(0.02);
    setFornecedor('');
    setDataCotacao(new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Insumo) => {
    setEditingInsumo(item);
    setCategoria(item.categoria);
    setDescricao(item.descricao);
    setEspecificacao(item.especificacao);
    setUnidade(item.unidade);
    setPrecoUnit(item.precoUnit);
    setIcmsEntrada(item.icmsEntrada);
    setIpi(item.ipi);
    setFrete(item.frete);
    setFornecedor(item.fornecedor);
    setDataCotacao(item.dataCotacao || new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!descricao.trim()) {
      alert('Descrição do material é obrigatória.');
      return;
    }

    const insumoData = {
      categoria,
      descricao,
      especificacao,
      unidade,
      precoUnit: Number(precoUnit) || 0,
      icmsEntrada: Number(icmsEntrada) || 0,
      ipi: Number(ipi) || 0,
      frete: Number(frete) || 0,
      fornecedor,
      dataCotacao,
    };

    if (editingInsumo) {
      // Manage price changes audit log
      const hist: PrecoHistorico[] = editingInsumo.historico ? [...editingInsumo.historico] : [];
      if (editingInsumo.precoUnit !== Number(precoUnit) && editingInsumo.precoUnit > 0) {
        hist.push({
          data: editingInsumo.dataCotacao || new Date().toISOString().slice(0, 10),
          preco: editingInsumo.precoUnit,
          fornecedor: editingInsumo.fornecedor || 'Não informado',
        });
      }

      onUpdateInsumo(editingInsumo.id, {
        ...editingInsumo,
        ...insumoData,
        historico: hist,
      });
    } else {
      onAddInsumo(insumoData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO 01</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Catálogo de Insumos</h1>
          <p className="text-sm text-slate-500">Cadastro central de matérias-primas, custos base e incidências fiscais</p>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="mt-4 md:mt-0 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Novo Insumo
        </button>
      </div>

      {/* Controls: Search & Category Pills */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar material, especificação ou fornecedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Filter className="w-3.5 h-3.5" /> Filtrar por Disciplina
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  selectedCat === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredInsumos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">Nenhum insumo encontrado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Tente redefinir a busca ou adicione novos insumos no botão acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-mono tracking-wider">
                  <th className="px-5 py-3.5 font-semibold">Insumo</th>
                  <th className="px-5 py-3.5 font-semibold">Disciplina</th>
                  <th className="px-5 py-3.5 font-semibold">Und</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Preço de Compra (Bruto)</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Encargos Fiscais</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Custo Líquido Final</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInsumos.map(item => {
                  const compInfo = calcularCustoCompra(item);
                  const status = obterStatusCotacao(item.precoUnit, item.dataCotacao);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Name & Spec */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 text-sm">{item.descricao}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Espec: <span className="text-slate-700 font-sans font-medium">{item.especificacao || '—'}</span> · Fornecedor: <span className="text-slate-700 font-sans font-medium">{item.fornecedor || '—'}</span>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="px-5 py-4 text-slate-600 font-medium">{item.categoria}</td>

                      {/* Unit */}
                      <td className="px-5 py-4 font-mono text-slate-500 font-semibold">{item.unidade}</td>

                      {/* Raw Purchase Price */}
                      <td className="px-5 py-4 text-right font-mono text-slate-700 font-semibold">
                        {item.precoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Taxes */}
                      <td className="px-5 py-4 text-center font-mono text-[10.5px] text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1" title="Crédito de ICMS Entrada">
                          ICMS: -{(item.icmsEntrada * 100).toFixed(0)}%
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1" title="Imposto sobre Produtos Industrializados">
                          IPI: +{(item.ipi * 100).toFixed(0)}%
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded" title="Acréscimo de Frete sobre compra">
                          FRT: +{(item.frete * 100).toFixed(0)}%
                        </span>
                      </td>

                      {/* Calculated Final Cost */}
                      <td className="px-5 py-4 text-right font-mono text-blue-700 font-bold text-sm bg-blue-50/10">
                        {compInfo.custoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Quote Status */}
                      <td className="px-5 py-4 text-center">
                        {status === 'ZERADO' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                            ZERADO
                          </span>
                        )}
                        {status === 'COTAR' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                            COTAR
                          </span>
                        )}
                        {status === 'ATUALIZADO' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ATUALIZADO
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" /> {item.dataCotacao || '—'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right space-x-2">
                        {item.historico && item.historico.length > 0 && (
                          <button
                            onClick={() => setViewingHistory(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer transition-colors inline-block"
                            title="Ver histórico de alterações de preços"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50/50 cursor-pointer transition-colors inline-block"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o insumo "${item.descricao}"?`)) {
                              onDeleteInsumo(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50/50 cursor-pointer transition-colors inline-block"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE OR EDIT INSUMO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold font-mono uppercase tracking-wider">
                {editingInsumo ? 'Editar Insumo' : 'Novo Insumo do Catálogo'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Disciplina</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIAS.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Unidade de Medida</label>
                  <input
                    type="text"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="Ex: Metro, kg, un, Barra"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição do Material</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Tubo de Cobre Rígido"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Especificação Técnica</label>
                <input
                  type="text"
                  value={especificacao}
                  onChange={(e) => setEspecificacao(e.target.value)}
                  placeholder="Ex: 1 1/8&quot; - barra 6m"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Preço Unitário de Compra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoUnit}
                    onChange={(e) => setPrecoUnit(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Fornecedor Cotado</label>
                  <input
                    type="text"
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    placeholder="Nome do fornecedor"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tax Matrix Accordion/Header */}
              <div className="bg-slate-50 border border-slate-150 rounded-lg p-4 space-y-3">
                <div className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" /> Matriz Fiscal para Cálculo de Preço Líquido
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">ICMS Entrada (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={icmsEntrada * 100}
                      onChange={(e) => setIcmsEntrada((parseFloat(e.target.value) || 0) / 100)}
                      placeholder="e.g. 12%"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500 bg-white"
                    />
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Dedução (crédito)</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">IPI Compra (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ipi * 100}
                      onChange={(e) => setIpi((parseFloat(e.target.value) || 0) / 100)}
                      placeholder="e.g. 5%"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500 bg-white"
                    />
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Acréscimo fiscal</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Frete Compra (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={frete * 100}
                      onChange={(e) => setFrete((parseFloat(e.target.value) || 0) / 100)}
                      placeholder="e.g. 2%"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500 bg-white"
                    />
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Acréscimo logística</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Data da Cotação</label>
                <input
                  type="date"
                  value={dataCotacao}
                  onChange={(e) => setDataCotacao(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Salvar Insumo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORICAL POPUP MODAL */}
      {viewingHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-sky-400" /> Histórico de Preços
              </h2>
              <button 
                onClick={() => setViewingHistory(null)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="font-bold text-slate-800 text-base">{viewingHistory.descricao}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{viewingHistory.especificacao}</div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Evolução do Valor de Compra</div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {/* Current Active Price */}
                  <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-lg p-2 text-xs">
                    <div>
                      <div className="font-bold text-blue-900">Preço Atual</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">Cotado em: {viewingHistory.dataCotacao} por {viewingHistory.fornecedor || '—'}</div>
                    </div>
                    <div className="font-mono font-bold text-blue-700 text-sm">
                      {viewingHistory.precoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  {/* Past Historical Entries */}
                  {viewingHistory.historico?.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between border border-slate-100 rounded-lg p-2 text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-700">Cotação Anterior</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Cotado em: {entry.data} por {entry.fornecedor}</div>
                      </div>
                      <div className="font-mono text-slate-600 font-semibold">
                        {entry.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border-t border-slate-150 px-5 py-3 flex justify-end">
              <button
                onClick={() => setViewingHistory(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
