import React, { useState } from 'react';
import { Projeto } from '../types';
import { calcularPrecoVenda, calcularFechamentoComercial } from '../utils/engine';
import { FileText, Printer, ShieldCheck, DollarSign, Calculator, Percent, ArrowLeft, Download, Send } from 'lucide-react';
import Logo from './Logo';

interface PropostaModuleProps {
  projetos: Projeto[];
  activeProjectId: string | null;
  onSetActiveProject: (id: string | null) => void;
  onUpdateProjetoDados: (id: string, updated: Projeto) => void;
}

export default function PropostaModule({
  projetos,
  activeProjectId,
  onSetActiveProject,
  onUpdateProjetoDados,
}: PropostaModuleProps) {
  const [comissaoForm, setComissaoForm] = useState(1.25); // 1.25% default
  const [reservaForm, setReservaForm] = useState(5.00);   // 5% default
  const [isPrintMode, setIsPrintMode] = useState(false);

  const activeProj = projetos.find(p => p.id === activeProjectId) || null;

  // Sync state with active project values on load
  React.useEffect(() => {
    if (activeProj) {
      setComissaoForm(Number(activeProj.comissao) * 100);
      setReservaForm(Number(activeProj.reserva) * 100);
    }
  }, [activeProjectId]);

  const handleSaveClosure = () => {
    if (!activeProj) return;
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      comissao: comissaoForm / 100,
      reserva: reservaForm / 100,
    });
    alert('Fórmula de fechamento comercial atualizada com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeProj) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO 04</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Proposta Comercial</h1>
          <p className="text-sm text-slate-500">Geração de proposta formal com cálculo de comissão e reserva</p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-xl text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">Nenhum projeto selecionado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Por favor, selecione ou crie um projeto no módulo de <strong>Projetos &amp; Orçamentos</strong> para gerar a proposta comercial.
          </p>
        </div>
      </div>
    );
  }

  // Pre-calculate synthetic list
  const sistemasData = activeProj.sistemas.map(s => {
    let custo = 0;
    s.itens.forEach(it => {
      custo += (Number(it.custoUnit) || 0) * (Number(it.quantidade) || 0);
    });
    const vendaLimpa = calcularPrecoVenda(custo, s.out, s.ft, s.fn, s.lc);
    return {
      tipo: s.tipo,
      custo,
      vendaLimpa,
    };
  });

  const totalCusto = sistemasData.reduce((acc, curr) => acc + curr.custo, 0);
  const totalVendaLimpa = sistemasData.reduce((acc, curr) => acc + curr.vendaLimpa, 0);

  // Apply closure formulas "por dentro"
  const closure = calcularFechamentoComercial(totalVendaLimpa, activeProj.comissao, activeProj.reserva);

  if (isPrintMode) {
    return (
      <div className="bg-white text-slate-900 p-10 min-h-screen max-w-4xl mx-auto space-y-8 font-sans border border-slate-300 shadow-xl print:border-0 print:shadow-none print:p-0">
        {/* Back and Print buttons in preview */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <button 
            onClick={() => setIsPrintMode(false)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Painel
          </button>
          <div className="space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer inline-flex"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Proposta
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6">
          <div className="flex flex-col items-start">
            <Logo size="md" inline />
            <p className="text-xs text-slate-500 font-mono mt-2">Instalações, Dutos, VRF, Elétrica e Hidráulica</p>
          </div>
          <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
            <div>PROPOSTA DE ORÇAMENTO</div>
            <div className="font-bold text-slate-900">Nº {activeProj.id.slice(5).toUpperCase()}-2026</div>
            <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        {/* Client Metadata */}
        <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200/80">
          <div>
            <span className="font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1">DADOS DA OBRA / CLIENTE</span>
            <div className="font-bold text-slate-800 text-sm">{activeProj.nome}</div>
            <div className="text-slate-600 mt-1">Localização: {activeProj.local}</div>
          </div>
          <div className="text-right">
            <span className="font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1">ESPECIFICAÇÕES DA INSTALAÇÃO</span>
            <div className="text-slate-600">Capacidade Total Estimada: <b>{activeProj.capacidadeTR} TR</b></div>
            <div className="text-slate-600">Escopo: Sistemas de Climatização Integrados</div>
          </div>
        </div>

        {/* Scope breakdown table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase text-slate-800 border-b border-slate-300 pb-1">1. RESUMO SINTÉTICO DO ESCOPO</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-600 uppercase font-mono tracking-wider">
                <th className="py-2">Especificação do Sistema / Disciplina</th>
                <th className="py-2 text-right">Preço de Venda Base (Limpo)</th>
                <th className="py-2 text-right">Participação (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {sistemasData.map(item => (
                <tr key={item.tipo}>
                  <td className="py-2.5 text-slate-800">{item.tipo} — Climatização e Instalações</td>
                  <td className="py-2.5 text-right font-mono text-slate-900">
                    {item.vendaLimpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600">
                    {totalVendaLimpa > 0 ? (((item.vendaLimpa / totalVendaLimpa) * 100).toFixed(1) + '%') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-400 font-bold bg-slate-50">
                <td className="py-3 px-2 text-slate-700">SUBTOTAL (PREÇO LIMPO)</td>
                <td className="py-3 px-2 text-right font-mono text-slate-900">
                  {totalVendaLimpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-3 px-2 text-right font-mono">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms and Financial Consolidation */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-800 border-b border-slate-300 pb-1">2. CONDIÇÕES COMERCIAIS &amp; FECHAMENTO</h3>
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="text-[11px] text-slate-500 leading-relaxed space-y-2">
              <p>• Impostos municipais e estaduais incidentes sobre os serviços inclusos.</p>
              <p>• Prazo de execução conforme cronograma físico-financeiro a ser pactuado no contrato.</p>
              <p>• Validade desta proposta: 15 (quinze) dias a contar da data de emissão.</p>
            </div>
            <div className="bg-slate-900 text-white rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span>Subtotal Limpo:</span>
                <span>{totalVendaLimpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span>Comissão de Intermediação ({comissaoForm.toFixed(2)}%):</span>
                <span>{closure.precoComComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1 text-sky-300">
                <span>VALOR TOTAL PROPOSTO:</span>
                <span>{closure.precoFinalCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="text-[10px] text-slate-400 text-right font-sans pt-1">
                Taxas aplicadas em cascata fiscal "por dentro"
              </div>
            </div>
          </div>
        </div>

        {/* Signature Fields */}
        <div className="grid grid-cols-2 gap-12 pt-16 text-center text-[11px]">
          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">ALURE CLIMATIZAÇÃO S/A</div>
            <div className="text-slate-400">Representante Comercial / Engenharia</div>
          </div>
          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">ACEITE DO CLIENTE</div>
            <div className="text-slate-400">Nome: _________________________________</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO 04</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fechamento &amp; Proposta Comercial</h1>
          <p className="text-sm text-slate-500">Consolidação sintética por sistemas, incidência de taxas por dentro e emissão de relatório</p>
        </div>
        <button
          onClick={() => setIsPrintMode(true)}
          className="mt-4 md:mt-0 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" /> Visualizar Proposta PDF
        </button>
      </div>

      {/* Synthetic breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">Resumo Sintético por Sistema</h2>
        <p className="text-xs text-slate-500 mb-4">Equivalente à aba "Total → Resumo Sintético" da planilha de custos original.</p>

        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider text-[10px] border-b border-slate-150">
                <th className="px-4 py-3 font-semibold">Disciplina / Sistema</th>
                <th className="px-4 py-3 text-right font-semibold">Custo Consolidado (Líquido)</th>
                <th className="px-4 py-3 text-right font-semibold">Venda Base (Preço Limpo)</th>
                <th className="px-4 py-3 text-right font-semibold">Margem Bruta</th>
                <th className="px-4 py-3 text-right font-semibold">Representatividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {sistemasData.map(item => {
                const markupGain = item.vendaLimpa > 0 ? (((item.vendaLimpa - item.custo) / item.vendaLimpa) * 100) : 0;
                return (
                  <tr key={item.tipo} className="hover:bg-slate-50/30">
                    <td className="px-4 py-3 font-bold text-slate-800">{item.tipo}</td>
                    <td className="px-4 py-3 text-right font-mono">{item.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{item.vendaLimpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                      +{markupGain.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500 font-medium">
                      {totalVendaLimpa > 0 ? (((item.vendaLimpa / totalVendaLimpa) * 100).toFixed(1) + '%') : '—'}
                    </td>
                  </tr>
                );
              })}
              {sistemasData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400 font-mono">Nenhum sistema adicionado ao projeto ainda.</td>
                </tr>
              )}
            </tbody>
            {sistemasData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-700 font-mono uppercase">Totais Consolidados</td>
                  <td className="px-4 py-3 text-right font-mono">{totalCusto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-700 text-sm">{totalVendaLimpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">
                    +{totalVendaLimpa > 0 ? (((totalVendaLimpa - totalCusto) / totalVendaLimpa) * 100).toFixed(1) : '0'}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono">100.0%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Closure commercial & final value widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closure form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Configuração de Fechamento Comercial</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Padrão de cálculo em cascata 5.9: O sistema embute a comissão Alure e a reserva técnica "por dentro" através da divisão <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10.5px]">Valor / (1 - Taxa)</code>.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3 text-slate-400" /> Comissão Alure (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={comissaoForm}
                onChange={(e) => setComissaoForm(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">Alure (ex: 1.25%)</span>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-400" /> Reserva Comercial (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={reservaForm}
                onChange={(e) => setReservaForm(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">Tolerância / Risco (ex: 5%)</span>
            </div>
          </div>

          <button
            onClick={handleSaveClosure}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer h-9 transition-colors"
          >
            Aplicar e Recalcular Preço Final
          </button>
        </div>

        {/* Closure calculation result log */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Resumo Comercial Final</h2>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-xs py-2">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-sans">Preço Limpo (Soma dos Sistemas)</span>
              <span className="font-semibold text-slate-700">{totalVendaLimpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-sans flex items-center gap-1">Preço com Comissão <span className="text-[10px] bg-slate-100 px-1 py-0.2 rounded">1 - {activeProj.comissao * 100}%</span></span>
              <span className="font-semibold text-slate-700">{closure.precoComComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between py-3.5 items-baseline border-t border-slate-200">
              <span className="font-bold text-slate-800 font-sans text-sm">PREÇO FINAL CLIENTE</span>
              <span className="font-bold text-blue-700 text-lg">{closure.precoFinalCliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-150 rounded-lg p-3 text-[11px] text-emerald-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Proposta Pronta para Emissão:</strong>
              <p className="mt-0.5 text-emerald-700 font-sans">
                Selecione "Visualizar Proposta PDF" no topo para ver e imprimir a via formal de aceite do cliente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
