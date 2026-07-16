import React, { useState, useEffect } from 'react';
import { Insumo, Projeto, TabelaCobreRow } from './types';
import { DEFAULT_INSUMOS, DEFAULT_PROJETOS, DEFAULT_TABELA_COBRE } from './data/defaults';

// Modular views
import DashboardModule from './components/DashboardModule';
import InsumosModule from './components/InsumosModule';
import TabelasTecnicasModule from './components/TabelasTecnicasModule';
import ProjetosModule from './components/ProjetosModule';
import PropostaModule from './components/PropostaModule';
import CargaTermicaModule from './components/CargaTermicaModule';
import CronogramaModule from './components/CronogramaModule';
import Logo from './components/Logo';

import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  FolderKanban, 
  FileSignature, 
  Layers, 
  Building2,
  ChevronRight,
  User,
  LogOut,
  Thermometer,
  Calendar
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<string>('dashboard');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tabelaCobre, setTabelaCobre] = useState<TabelaCobreRow[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial State Hydration from LocalStorage
  useEffect(() => {
    try {
      const storedInsumos = localStorage.getItem('alure_erp_insumos');
      const storedProjetos = localStorage.getItem('alure_erp_projetos');
      const storedTabela = localStorage.getItem('alure_erp_tabela_cobre');

      if (storedInsumos) {
        setInsumos(JSON.parse(storedInsumos));
      } else {
        setInsumos(DEFAULT_INSUMOS);
        localStorage.setItem('alure_erp_insumos', JSON.stringify(DEFAULT_INSUMOS));
      }

      if (storedProjetos) {
        setProjetos(JSON.parse(storedProjetos));
      } else {
        setProjetos(DEFAULT_PROJETOS);
        localStorage.setItem('alure_erp_projetos', JSON.stringify(DEFAULT_PROJETOS));
      }

      if (storedTabela) {
        setTabelaCobre(JSON.parse(storedTabela));
      } else {
        setTabelaCobre(DEFAULT_TABELA_COBRE);
        localStorage.setItem('alure_erp_tabela_cobre', JSON.stringify(DEFAULT_TABELA_COBRE));
      }

      // Pre-select the demo project if available
      if (storedProjetos) {
        const parsed = JSON.parse(storedProjetos);
        if (parsed.length > 0) {
          setActiveProjectId(parsed[0].id);
        }
      } else {
        setActiveProjectId('proj_demo');
      }

    } catch (e) {
      console.error('Failed to load local storage datasets', e);
      // Fallbacks
      setInsumos(DEFAULT_INSUMOS);
      setProjetos(DEFAULT_PROJETOS);
      setTabelaCobre(DEFAULT_TABELA_COBRE);
      setActiveProjectId('proj_demo');
    }
    setIsLoaded(true);
  }, []);

  // 2. Persistence Triggers
  const persistInsumos = (updated: Insumo[]) => {
    setInsumos(updated);
    localStorage.setItem('alure_erp_insumos', JSON.stringify(updated));
  };

  const persistProjetos = (updated: Projeto[]) => {
    setProjetos(updated);
    localStorage.setItem('alure_erp_projetos', JSON.stringify(updated));
  };

  const persistTabelaCobre = (updated: TabelaCobreRow[]) => {
    setTabelaCobre(updated);
    localStorage.setItem('alure_erp_tabela_cobre', JSON.stringify(updated));
  };

  // 3. Callback handlers for CRUD actions
  const handleAddInsumo = (item: Omit<Insumo, 'id'>) => {
    const newItem: Insumo = {
      ...item,
      id: 'ins_' + Math.random().toString(36).slice(2, 9),
    };
    persistInsumos([...insumos, newItem]);
  };

  const handleUpdateInsumo = (id: string, updatedItem: Insumo) => {
    const updated = insumos.map(i => i.id === id ? updatedItem : i);
    persistInsumos(updated);
  };

  const handleDeleteInsumo = (id: string) => {
    persistInsumos(insumos.filter(i => i.id !== id));
  };

  const handleUpdateTabelaCobre = (newTable: TabelaCobreRow[]) => {
    persistTabelaCobre(newTable);
  };

  const handleAddProjeto = (proj: Omit<Projeto, 'id' | 'sistemas'>) => {
    const newProj: Projeto = {
      ...proj,
      id: 'proj_' + Math.random().toString(36).slice(2, 9),
      sistemas: [],
    };
    persistProjetos([...projetos, newProj]);
    setActiveProjectId(newProj.id);
  };

  const handleUpdateProjetoDados = (id: string, updatedProj: Projeto) => {
    const updated = projetos.map(p => p.id === id ? updatedProj : p);
    persistProjetos(updated);
  };

  // Navigation utility to reset active single-project details when entering other general modules
  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-mono text-xs">
        <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>Hydrating Alure ERP Datasets...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Sidebar Container with Professional Polish Aesthetic */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 hidden md:flex flex-col justify-between sticky top-0 h-screen select-none text-slate-300">
        {/* Brand Header with custom SVG Logo */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-start">
          <Logo size="md" dark inline />
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          <button
            onClick={() => handleViewChange('dashboard')}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              view === 'dashboard'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleViewChange('catalogo')}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              view === 'catalogo'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-5 h-5 shrink-0" />
            <span>Catálogo de Insumos</span>
          </button>

          <button
            onClick={() => handleViewChange('tecnicas')}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              view === 'tecnicas'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Tabelas Técnicas</span>
          </button>

          <button
            onClick={() => handleViewChange('projetos')}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              view === 'projetos'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FolderKanban className="w-5 h-5 shrink-0" />
            <span>Projetos &amp; Orçamentos</span>
          </button>

          <button
            onClick={() => handleViewChange('cargatermica')}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              view === 'cargatermica'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Thermometer className="w-5 h-5 shrink-0" />
            <span>Estudo de Carga Térmica</span>
          </button>

          <button
            onClick={() => handleViewChange('cronograma')}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              view === 'cronograma'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-5 h-5 shrink-0" />
            <span>Cronograma &amp; Obra</span>
          </button>

          <button
            onClick={() => handleViewChange('proposta')}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              view === 'proposta'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileSignature className="w-5 h-5 shrink-0" />
            <span>Proposta Comercial</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="p-6 text-xs border-t border-slate-800">
          <p className="text-slate-500 font-medium">Motor de Cálculo v4.2.0</p>
          <p className="mt-1 uppercase text-[10px] tracking-wider text-slate-400">Markup por dentro (1-K)</p>
        </div>
      </aside>

      {/* 2. Main content viewport */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="bg-slate-950 text-white p-4 flex items-center justify-between md:hidden">
          <Logo size="sm" dark inline />

          {/* Simple select dropdown for mobile navigation */}
          <select 
            value={view}
            onChange={(e) => handleViewChange(e.target.value)}
            className="bg-slate-900 text-white border border-slate-800 text-xs rounded-md px-2 py-1 focus:outline-none"
          >
            <option value="dashboard">Painel de Controle</option>
            <option value="catalogo">Catálogo de Insumos</option>
            <option value="tecnicas">Tabelas Técnicas</option>
            <option value="projetos">Projetos &amp; Orçamentos</option>
            <option value="cargatermica">Estudo de Carga Térmica</option>
            <option value="cronograma">Cronograma &amp; Obra</option>
            <option value="proposta">Proposta Comercial</option>
          </select>
        </header>

        {/* Main module render container */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {view === 'dashboard' && (
            <DashboardModule 
              insumos={insumos} 
              projetos={projetos} 
              onNavigate={handleViewChange} 
              onOpenProject={(id) => {
                setActiveProjectId(id);
                setView('projetos');
              }}
            />
          )}

          {view === 'catalogo' && (
            <InsumosModule 
              insumos={insumos} 
              onAddInsumo={handleAddInsumo}
              onUpdateInsumo={handleUpdateInsumo}
              onDeleteInsumo={handleDeleteInsumo}
            />
          )}

          {view === 'tecnicas' && (
            <TabelasTecnicasModule 
              tabelaCobre={tabelaCobre}
              onUpdateTabelaCobre={handleUpdateTabelaCobre}
            />
          )}

          {view === 'projetos' && (
            <ProjetosModule 
              projetos={projetos}
              insumos={insumos}
              tabelaCobre={tabelaCobre}
              activeProjectId={activeProjectId}
              onSetActiveProject={setActiveProjectId}
              onNavigate={handleViewChange}
              onAddProjeto={handleAddProjeto}
              onUpdateProjetoDados={handleUpdateProjetoDados}
            />
          )}

          {view === 'cargatermica' && (
            <CargaTermicaModule 
              projetos={projetos}
              activeProjectId={activeProjectId}
              onUpdateProjetoDados={handleUpdateProjetoDados}
            />
          )}

          {view === 'cronograma' && (
            <CronogramaModule 
              projetos={projetos}
              activeProjectId={activeProjectId}
              onUpdateProjetoDados={handleUpdateProjetoDados}
            />
          )}

          {view === 'proposta' && (
            <PropostaModule 
              projetos={projetos}
              activeProjectId={activeProjectId}
              onSetActiveProject={setActiveProjectId}
              onUpdateProjetoDados={handleUpdateProjetoDados}
            />
          )}
        </div>
      </main>
    </div>
  );
}
