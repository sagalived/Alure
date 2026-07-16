import React from 'react';
import { Insumo, Projeto } from '../types';
import { obterStatusCotacao, calcularPrecoVenda } from '../utils/engine';
import { AlertCircle, FileText, CheckCircle, Package, DollarSign, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface DashboardModuleProps {
  insumos: Insumo[];
  projetos: Projeto[];
  onNavigate: (view: string) => void;
  onOpenProject: (projectId: string) => void;
}

export default function DashboardModule({ insumos, projetos, onNavigate, onOpenProject }: DashboardModuleProps) {
  // Stats calculations
  const totalInsumos = insumos.length;
  const cotacoesVencidas = insumos.filter(i => obterStatusCotacao(i.precoUnit, i.dataCotacao) === 'COTAR').length;
  const itensZerados = insumos.filter(i => obterStatusCotacao(i.precoUnit, i.dataCotacao) === 'ZERADO').length;
  const totalProjetos = projetos.length;

  let custoGlobal = 0;
  let vendaGlobal = 0;

  projetos.forEach(p => {
    p.sistemas.forEach(s => {
      let custoSistema = 0;
      s.itens.forEach(it => {
        custoSistema += (Number(it.custoUnit) || 0) * (Number(it.quantidade) || 0);
      });
      custoGlobal += custoSistema;
      vendaGlobal += calcularPrecoVenda(custoSistema, s.out, s.ft, s.fn, s.lc);
    });
  });

  // Filter outdated and zeroed items to show in critical list
  const alertasInsumos = insumos
    .filter(i => obterStatusCotacao(i.precoUnit, i.dataCotacao) !== 'ATUALIZADO')
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel de Controle</h1>
          <p className="text-sm text-slate-500">Visão consolidada do catálogo de preços e orçamentos ativos</p>
        </div>
        <div className="mt-4 md:mt-0 font-mono text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          Ref: MARCIO-CUSTOS_OBRAS.xlsx · 15-Jul-2026
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg border bg-white border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Insumos</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalInsumos}</p>
          <p className="text-xs text-slate-400 mt-1">Materiais cadastrados</p>
        </div>

        <div className={`rounded-lg border p-5 shadow-sm ${cotacoesVencidas > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 bg-white'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${cotacoesVencidas > 0 ? 'text-amber-700' : 'text-slate-500'}`}>Re-cotar (&gt;30 dias)</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{cotacoesVencidas}</p>
          <p className="text-xs text-slate-400 mt-1">Cotações expiradas</p>
        </div>

        <div className={`rounded-lg border p-5 shadow-sm ${itensZerados > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 bg-white'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${itensZerados > 0 ? 'text-rose-700' : 'text-slate-500'}`}>Itens Sem Preço</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{itensZerados}</p>
          <p className="text-xs text-slate-400 mt-1">Materiais com preço zerado</p>
        </div>

        <div className="rounded-lg border border-blue-600 bg-blue-600 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Projetos Ativos</p>
          <p className="text-2xl font-bold mt-2">{totalProjetos}</p>
          <p className="text-xs opacity-90 mt-1">Obras em andamento</p>
        </div>
      </div>

      {/* Global Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CUSTO TOTAL ACUMULADO</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {custoGlobal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-xs text-slate-400 mt-2">Soma dos custos de aquisição líquidos (deduzidos créditos fiscais de ICMS)</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Consolidação de {totalProjetos} Obras</span>
            <button 
              onClick={() => onNavigate('projetos')} 
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Gerenciar Obras <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">PROPOSTA COMERCIAL ACUMULADA</p>
            <p className="text-2xl font-bold text-sky-300 mt-2">
              {vendaGlobal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-xs text-slate-400 mt-2">Soma dos preços de venda com markups de cada disciplina e comissões</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-blue-200/70 font-mono">Margem global est. {custoGlobal > 0 ? (((vendaGlobal - custoGlobal) / vendaGlobal) * 100).toFixed(1) + '%' : '0%'}</span>
            <button 
              onClick={() => onNavigate('proposta')} 
              className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer"
            >
              Propostas Finais <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Critical Alerts and Educational Concept Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Alertas Críticos de Cotação</h2>
              <p className="text-xs text-slate-500 mt-0.5">Insumos que requerem atualização imediata de valores para evitar propostas defasadas</p>
            </div>
            <button 
              onClick={() => onNavigate('catalogo')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Ver Catálogo Completo
            </button>
          </div>

          {alertasInsumos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-100 rounded-xl">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tudo Atualizado!</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Todos os insumos cadastrados possuem cotações válidas e inferiores a 30 dias.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono tracking-wider">
                    <th className="py-2.5 font-semibold">Material</th>
                    <th className="py-2.5 font-semibold">Fornecedor</th>
                    <th className="py-2.5 font-semibold text-right">Preço Unit.</th>
                    <th className="py-2.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alertasInsumos.map(item => {
                    const status = obterStatusCotacao(item.precoUnit, item.dataCotacao);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-800">
                          <div>{item.descricao}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.categoria} · {item.especificacao}</div>
                        </td>
                        <td className="py-2.5 text-slate-500">{item.fornecedor || '—'}</td>
                        <td className="py-2.5 text-right font-mono text-slate-700 font-semibold">
                          {item.precoUnit > 0 ? item.precoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                        </td>
                        <td className="py-2.5 text-center">
                          {status === 'ZERADO' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                              ZERADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                              COTAR
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Educational Concept / Spec Rules preservation */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Preservação das Regras Fiscais</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Este ERP foi construído em conformidade estrita com os padrões do arquivo original do orçamentador ALURE. Os seguintes motores de cálculo são aplicados automaticamente:
            </p>
            <ul className="space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 text-blue-600 font-mono font-bold">1.</div>
                <div>
                  <strong className="text-slate-800 block mb-0.5">Crédito de ICMS de Compra (Padrão 5.3)</strong>
                  O valor de custo do insumo é calculado líquido de ICMS de entrada: <code className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-[10.5px]">ValorLiquido = PrecoUnit - (PrecoUnit × ICMS_entrada)</code>. Em seguida é acrescido de IPI e Frete.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 text-blue-600 font-mono font-bold">2.</div>
                <div>
                  <strong className="text-slate-800 block mb-0.5">Markups em Cadeia (Padrão 5.5)</strong>
                  Cada disciplina/sistema possui markups independentes de Outros (OUT), Frete (FT), Financeiro (FN) e perda de faturamento (LC).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 text-blue-600 font-mono font-bold">3.</div>
                <div>
                  <strong className="text-slate-800 block mb-0.5">Cálculos "Por Dentro" (Padrão 5.9)</strong>
                  A comissão ALURE e a reserva comercial são divididas para embutir as taxas por dentro na base: <code className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-[10.5px]">Preço / (1 - Taxa)</code>, garantindo a lucratividade líquida planejada.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Projects List Shortcut */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">Atalhos para Projetos Recentes</h2>
        {projetos.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Nenhum projeto cadastrado no momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projetos.slice(0, 3).map(proj => {
              const totalSistemas = proj.sistemas.length;
              let totalVenda = 0;
              proj.sistemas.forEach(s => {
                let cost = s.itens.reduce((sum, item) => sum + (Number(item.custoUnit) || 0) * (Number(item.quantidade) || 0), 0);
                totalVenda += calcularPrecoVenda(cost, s.out, s.ft, s.fn, s.lc);
              });

              return (
                <div 
                  key={proj.id} 
                  onClick={() => onOpenProject(proj.id)}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/10 transition-all group"
                >
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-sm line-clamp-1">{proj.nome}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">{proj.local || '—'}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50">
                    <span className="text-[11px] font-mono text-slate-500">{totalSistemas} disciplina(s)</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
