import React, { useState } from 'react';
import { Projeto, EtapaCronograma, FaturamentoMilestone } from '../types';
import { calcularPrecoVenda, calcularFechamentoComercial } from '../utils/engine';
import { 
  Calendar, 
  DollarSign, 
  Percent, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Check, 
  Layers, 
  FileText, 
  Sliders,
  PlayCircle
} from 'lucide-react';

interface CronogramaModuleProps {
  projetos: Projeto[];
  activeProjectId: string | null;
  onUpdateProjetoDados: (id: string, updated: Projeto) => void;
}

export default function CronogramaModule({
  projetos,
  activeProjectId,
  onUpdateProjetoDados,
}: CronogramaModuleProps) {
  const activeProj = projetos.find(p => p.id === activeProjectId) || null;

  // Local state for forms
  const [stageNome, setStageNome] = useState('');
  const [stageResp, setStageResp] = useState('Eng. Thiago Silva');
  const [stageInicio, setStageInicio] = useState('2026-08-01');
  const [stageFim, setStageFim] = useState('2026-08-15');

  // Sync / initialize project data if undefined
  const defaultStages: EtapaCronograma[] = [
    { id: 'st_1', nome: 'Infraestrutura e Passagem de Dutos', dataInicio: '2026-08-01', dataFim: '2026-08-10', progresso: 100, status: 'Concluido', responsavel: 'Eng. Thiago Silva' },
    { id: 'st_2', nome: 'Instalação de Cobre e Isolantes', dataInicio: '2026-08-11', dataFim: '2026-08-20', progresso: 40, status: 'Executando', responsavel: 'Eng. Thiago Silva' },
    { id: 'st_3', nome: 'Montagem de Evaporadoras e Condensadoras', dataInicio: '2026-08-21', dataFim: '2026-09-05', progresso: 0, status: 'Pendente', responsavel: 'Eng. Carlos Ramos' },
    { id: 'st_4', nome: 'Start-up, Vácuo e Testes de Pressão', dataInicio: '2026-09-06', dataFim: '2026-09-12', progresso: 0, status: 'Pendente', responsavel: 'Téc. Fernando Cruz' }
  ];

  const defaultBilling = (projPrice: number): FaturamentoMilestone[] => [
    { id: 'bl_1', descricao: 'Sinal na Assinatura do Contrato', porcentagem: 30, valor: projPrice * 0.3, dataPrevisao: '2026-07-20', pago: true },
    { id: 'bl_2', descricao: 'Entrega dos Equipamentos VRF na Obra', porcentagem: 40, valor: projPrice * 0.4, dataPrevisao: '2026-08-22', pago: false },
    { id: 'bl_3', descricao: 'Após Conclusão do Start-up e Comissionamento', porcentagem: 30, valor: projPrice * 0.3, dataPrevisao: '2026-09-15', pago: false }
  ];

  const currentCronograma = activeProj?.cronograma || {
    etapas: defaultStages,
    faturamento: []
  };

  // Pre-calculate synthetic project cost & price
  let totalVendaLimpa = 0;
  if (activeProj) {
    activeProj.sistemas.forEach(s => {
      let custo = 0;
      s.itens.forEach(it => {
        custo += (Number(it.custoUnit) || 0) * (Number(it.quantidade) || 0);
      });
      totalVendaLimpa += calcularPrecoVenda(custo, s.out, s.ft, s.fn, s.lc);
    });
  }

  // Final proposal value representing the billing basis
  const closure = activeProj 
    ? calcularFechamentoComercial(totalVendaLimpa, activeProj.comissao, activeProj.reserva)
    : { precoFinalCliente: 0 };

  const finalClientPrice = closure.precoFinalCliente;

  // Lazily init faturamento elements if empty
  React.useEffect(() => {
    if (activeProj && currentCronograma.faturamento.length === 0 && finalClientPrice > 0) {
      onUpdateProjetoDados(activeProj.id, {
        ...activeProj,
        cronograma: {
          ...currentCronograma,
          faturamento: defaultBilling(finalClientPrice)
        }
      });
    }
  }, [activeProjectId, finalClientPrice]);

  const handleAddStage = () => {
    if (!activeProj || !stageNome.trim()) return;

    const newStage: EtapaCronograma = {
      id: 'st_' + Math.random().toString(36).slice(2, 9),
      nome: stageNome,
      dataInicio: stageInicio,
      dataFim: stageFim,
      progresso: 0,
      status: 'Pendente',
      responsavel: stageResp,
    };

    const updatedEtapas = [...currentCronograma.etapas, newStage];
    updateProjectCronograma(updatedEtapas, currentCronograma.faturamento);
    setStageNome('');
  };

  const handleDeleteStage = (id: string) => {
    if (!activeProj) return;
    const updatedEtapas = currentCronograma.etapas.filter(e => e.id !== id);
    updateProjectCronograma(updatedEtapas, currentCronograma.faturamento);
  };

  const handleUpdateProgress = (id: string, prog: number) => {
    if (!activeProj) return;
    const updatedEtapas = currentCronograma.etapas.map(e => {
      if (e.id === id) {
        let status: 'Pendente' | 'Executando' | 'Concluido' | 'Atrasado' = e.status;
        if (prog === 100) {
          status = 'Concluido';
        } else if (prog > 0) {
          status = 'Executando';
        } else {
          status = 'Pendente';
        }
        return { ...e, progresso: prog, status };
      }
      return e;
    });
    updateProjectCronograma(updatedEtapas, currentCronograma.faturamento);
  };

  const handleToggleStatus = (id: string) => {
    if (!activeProj) return;
    const statuses: Array<'Pendente' | 'Executando' | 'Concluido' | 'Atrasado'> = [
      'Pendente', 'Executando', 'Concluido', 'Atrasado'
    ];
    const updatedEtapas = currentCronograma.etapas.map(e => {
      if (e.id === id) {
        const nextIndex = (statuses.indexOf(e.status) + 1) % statuses.length;
        const newStatus = statuses[nextIndex];
        let prog = e.progresso;
        if (newStatus === 'Concluido') prog = 100;
        if (newStatus === 'Pendente') prog = 0;
        return { ...e, status: newStatus, progresso: prog };
      }
      return e;
    });
    updateProjectCronograma(updatedEtapas, currentCronograma.faturamento);
  };

  const handleTogglePayment = (id: string) => {
    if (!activeProj) return;
    const updatedBilling = currentCronograma.faturamento.map(b => {
      if (b.id === id) {
        return { ...b, pago: !b.pago };
      }
      return b;
    });
    updateProjectCronograma(currentCronograma.etapas, updatedBilling);
  };

  const updateProjectCronograma = (etapas: EtapaCronograma[], faturamento: FaturamentoMilestone[]) => {
    if (!activeProj) return;
    onUpdateProjetoDados(activeProj.id, {
      ...activeProj,
      cronograma: {
        etapas,
        faturamento,
      }
    });
  };

  // Recalculate billing values in case proposal changed
  const handleRecalculateBilling = () => {
    if (!activeProj || finalClientPrice === 0) return;
    const updatedBilling = currentCronograma.faturamento.map(b => ({
      ...b,
      valor: parseFloat(((finalClientPrice * b.porcentagem) / 100).toFixed(2))
    }));
    updateProjectCronograma(currentCronograma.etapas, updatedBilling);
    alert('Valores de faturamento recalculados com base no valor da proposta atualizada!');
  };

  // Global percentages
  const physicalCompletion = currentCronograma.etapas.length > 0
    ? Math.round(currentCronograma.etapas.reduce((acc, curr) => acc + curr.progresso, 0) / currentCronograma.etapas.length)
    : 0;

  const totalPaid = currentCronograma.faturamento
    .filter(b => b.pago)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalPending = currentCronograma.faturamento
    .filter(b => !b.pago)
    .reduce((acc, curr) => acc + curr.valor, 0);

  if (!activeProj) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO ADICIONAL</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Planejamento &amp; Cronograma</h1>
          <p className="text-sm text-slate-500 font-medium">Controle físico-financeiro de prazos de obras e faturamento</p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-xl text-center text-slate-500">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">Nenhum projeto selecionado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Por favor, selecione ou crie um projeto no módulo de <strong>Projetos &amp; Orçamentos</strong> para gerenciar o cronograma de obra.
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
          <div className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-600 mb-1">MÓDULO DE GESTÃO</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Planejamento Físico-Financeiro</h1>
          <p className="text-sm text-slate-500 font-medium">Cronograma de instalação e controle de faturamento: <span className="text-slate-800 font-bold">{activeProj.nome}</span></p>
        </div>
        {finalClientPrice > 0 && (
          <button
            onClick={handleRecalculateBilling}
            className="mt-4 md:mt-0 flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <DollarSign className="w-3.5 h-3.5" /> Atualizar Valores do Fluxo ({finalClientPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
          </button>
        )}
      </div>

      {/* Progress widgets cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avanço Físico Global</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-slate-900">{physicalCompletion}%</span>
            <span className="text-[10px] text-emerald-600 font-bold">Concluído</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${physicalCompletion}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Faturamento Efetuado (Pago)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-mono font-bold text-emerald-600">
              {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Garantido em caixa</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Faturamento Pendente (A Receber)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-mono font-bold text-blue-600">
              {totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Conforme marcos de obra</p>
        </div>

        <div className="bg-blue-600 text-white p-5 rounded-xl shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-85">Valor de Contrato Alure</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold">
              {finalClientPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <p className="text-[10px] opacity-80 mt-1">Emissão via Módulo Comercial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Physical timeline (Gantt checklist) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                1. Etapas de Execução Física (Obra)
              </h2>
              <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500">
                Gantt Analítico
              </span>
            </div>

            <div className="space-y-4">
              {currentCronograma.etapas.map((etapa) => {
                let statusBadgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                if (etapa.status === 'Executando') statusBadgeColor = 'bg-blue-50 text-blue-600 border-blue-100';
                if (etapa.status === 'Concluido') statusBadgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                if (etapa.status === 'Atrasado') statusBadgeColor = 'bg-rose-50 text-rose-600 border-rose-100';

                return (
                  <div key={etapa.id} className="border border-slate-150 rounded-xl p-4 space-y-3 hover:border-slate-300 transition-colors bg-slate-50/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-800 text-xs">{etapa.nome}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Período: <strong>{new Date(etapa.dataInicio).toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(etapa.dataFim).toLocaleDateString('pt-BR')}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> {etapa.responsavel}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(etapa.id)}
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border cursor-pointer ${statusBadgeColor}`}
                          title="Clique para alternar o status"
                        >
                          {etapa.status}
                        </button>
                        <button
                          onClick={() => handleDeleteStage(etapa.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Slider control */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Avanço Físico</span>
                        <span className="font-bold text-slate-700">{etapa.progresso}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={etapa.progresso}
                          onChange={(e) => handleUpdateProgress(etapa.id, parseInt(e.target.value))}
                          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentCronograma.etapas.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Nenhuma etapa de obra cadastrada para este cronograma.</p>
              )}
            </div>

            {/* Form to add stage */}
            <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
              <h3 className="text-xs font-bold text-slate-700">Incluir Nova Etapa de Instalação</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Nome do serviço (ex: Isolação de Dutos)"
                  value={stageNome}
                  onChange={(e) => setStageNome(e.target.value)}
                  className="md:col-span-2 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Responsável (ex: Eng. Roberto)"
                  value={stageResp}
                  onChange={(e) => setStageResp(e.target.value)}
                  className="border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddStage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Início Planejado</label>
                  <input
                    type="date"
                    value={stageInicio}
                    onChange={(e) => setStageInicio(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Fim Planejado</label>
                  <input
                    type="date"
                    value={stageFim}
                    onChange={(e) => setStageFim(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Financial milestones control */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                2. Fluxo Financeiro (Medições)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Controle de faturamento em parcelas fiscais</p>
            </div>

            <div className="space-y-3">
              {currentCronograma.faturamento.map((bill) => (
                <div 
                  key={bill.id} 
                  className={`border rounded-lg p-3.5 transition-colors ${bill.pago ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-150 bg-white'}`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{bill.descricao}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Fração: <strong>{bill.porcentagem}%</strong> • Previsão: {new Date(bill.dataPrevisao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTogglePayment(bill.id)}
                      className={`p-1 rounded border shrink-0 cursor-pointer ${bill.pago ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                      title={bill.pago ? 'Marcar como Pendente' : 'Marcar como Pago'}
                    >
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex justify-between items-baseline font-mono">
                    <span className="text-[10px] font-sans text-slate-400">Parcela</span>
                    <span className={`text-xs font-bold ${bill.pago ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {bill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              ))}

              {currentCronograma.faturamento.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Adicione itens ao orçamento para preencher o faturamento.</p>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10.5px] text-slate-500 leading-relaxed space-y-1">
              <span className="font-bold text-slate-700 block mb-0.5">Regras Contratuais:</span>
              <p>• As medições e faturamentos devem ser validados pela fiscalização da obra antes do envio da Nota Fiscal.</p>
              <p>• Prazos de vencimento fixados em D+10 após validação física da etapa de montagem.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
