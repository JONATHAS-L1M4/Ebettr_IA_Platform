import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, BarChart3, Bot, AlertTriangle, ExternalLink, ChevronUp, ChevronDown } from '../components/ui/Icons';
import { useNotification } from '../context/NotificationContext';
import { fetchExecutionMetrics, ExecutionMetric } from '../services/n8n/workflowService';
import { useAppData } from '../hooks/useAppData';
import { Agent } from '../types';
import { KPICards } from '../components/dashboard/KPICards';
import DarkPage from '../components/layout/DarkPage';
import {
 Table,
 TableHeader,
 TableBody,
 TableRow,
 TableHead,
 TableCell,
} from '../components/ui/table';

export const AdminExecutionMetrics: React.FC = () => {
 const { addNotification } = useNotification();
 const { agents, isLoading: isLoadingAgents } = useAppData();
 
 const [metrics, setMetrics] = useState<ExecutionMetric[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [sortConfig, setSortConfig] = useState<{ key: 'agent' | 'success_rate' | 'average_duration', direction: 'asc' | 'desc' }>({
 key: 'success_rate',
 direction: 'desc'
 });

 const loadMetrics = async () => {
 setIsLoading(true);
 
 try {
 const data = await fetchExecutionMetrics();
 setMetrics(data);
 } catch (error) {
 addNotification('error', 'Erro', 'Falha ao carregar métricas de execução.');
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 loadMetrics();
 }, []);

 // Mapeia workflowId para Agente
 const getAgentByWorkflowId = (workflowId: string): Agent | undefined => {
 return agents.find(a => {
 if (a.workflowId === workflowId) return true;
 const configWfId = a.configSections
 .flatMap(s => s.fields)
 .find(f => f.id === 'n8n_workflow_id')?.value;
 return configWfId === workflowId;
 });
 };

 const filteredMetrics = useMemo(() => {
 let result = metrics;
 
 if (searchQuery) {
 const query = searchQuery.toLowerCase();
 result = result.filter(metric => {
 const agent = getAgentByWorkflowId(metric.workflowId);
 const agentName = agent ? agent.name.toLowerCase() : '';
 return metric.workflowId.toLowerCase().includes(query) || agentName.includes(query);
 });
 }

 // Sorting
 return [...result].sort((a, b) => {
 if (sortConfig.key === 'agent') {
 const agentA = getAgentByWorkflowId(a.workflowId)?.name || 'Agente Desconhecido';
 const agentB = getAgentByWorkflowId(b.workflowId)?.name || 'Agente Desconhecido';
 return sortConfig.direction === 'asc' 
 ? agentA.localeCompare(agentB)
 : agentB.localeCompare(agentA);
 }
 
 if (sortConfig.key === 'success_rate') {
 return sortConfig.direction === 'asc'
 ? a.success_rate - b.success_rate
 : b.success_rate - a.success_rate;
 }

 if (sortConfig.key === 'average_duration') {
 const durA = a.average_duration || 0;
 const durB = b.average_duration || 0;
 return sortConfig.direction === 'asc'
 ? durA - durB
 : durB - durA;
 }

 return 0;
 });
 }, [metrics, searchQuery, agents, sortConfig]);

 const handleSort = (key: 'agent' | 'success_rate' | 'average_duration') => {
 setSortConfig(prev => ({
 key,
 direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
 }));
 };

 const SortIcon = ({ column }: { column: 'agent' | 'success_rate' | 'average_duration' }) => {
 if (sortConfig.key !== column) return null;
 return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
 };

 const kpiStats = useMemo(() => {
 if (filteredMetrics.length === 0) return { total: 0, successRate: 0, avgDuration: '-' };

 const totalSuccessRate = filteredMetrics.reduce((acc, curr) => acc + curr.success_rate, 0);
 const avgSuccessRate = totalSuccessRate / filteredMetrics.length;

 const metricsWithDuration = filteredMetrics.filter(m => m.average_duration !== null);
 let avgDurationStr = '-';
 
 if (metricsWithDuration.length > 0) {
 const totalDuration = metricsWithDuration.reduce((acc, curr) => acc + (curr.average_duration || 0), 0);
 const avgDuration = totalDuration / metricsWithDuration.length;
 
 if (avgDuration < 1) {
 avgDurationStr = `${Math.round(avgDuration * 1000)}ms`;
 } else {
 avgDurationStr = `${avgDuration.toFixed(2)}s`;
 }
 }

 return {
 total: filteredMetrics.length,
 successRate: Number(avgSuccessRate.toFixed(1)),
 avgDuration: avgDurationStr
 };
 }, [filteredMetrics]);

 if (isLoading || isLoadingAgents) {
 return (
 <DarkPage className="min-h-[calc(100vh-4rem)]">
 <div className="flex flex-col items-center justify-center h-[60vh]">
 <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
 </div>
 </DarkPage>
 );
 }

 return (
 <DarkPage className="min-h-[calc(100vh-4rem)]">
 <div className="flex flex-col gap-6 animate-fade-in max-w-6xl mx-auto">
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 border border-border rounded-lg flex items-center justify-center text-foreground bg-muted shadow-sm">
 <BarChart3 className="w-5 h-5" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground tracking-tight">Métricas de Execução</h1>
 <p className="text-sm text-muted-foreground mt-1">Visão global de performance dos workflows.</p>
 </div>
 </div>
 </div>
 </div>

 <KPICards 
 successRate={kpiStats.successRate}
 avgDuration={kpiStats.avgDuration}
 />

 <div className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="p-4 border-border bg-muted flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="relative flex-1 max-w-md">
 <input 
 type="text"
 placeholder="Buscar por Agente ou Workflow ID..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm placeholder:text-muted-foreground shadow-sm text-foreground pr-4"
 />
 </div>
 <div className="text-sm text-muted-foreground font-medium">
 {filteredMetrics.length} {filteredMetrics.length === 1 ? 'workflow' : 'workflows'}
 </div>
 </div>

 <div className="overflow-x-auto">
 <Table className="w-full text-left text-sm">
 <TableHeader className="bg-muted text-muted-foreground font-semibold border-border">
 <TableRow>
 <TableHead 
 className="px-6 py-4 cursor-pointer hover:text-foreground transition-colors"
 onClick={() => handleSort('agent')}
 >
 <div className="flex items-center gap-1">
 Agente / Workflow
 <SortIcon column="agent" />
 </div>
 </TableHead>
 <TableHead 
 className="px-6 py-4 text-center cursor-pointer hover:text-foreground transition-colors"
 onClick={() => handleSort('success_rate')}
 >
 <div className="flex items-center justify-center gap-1">
 Taxa de Sucesso
 <SortIcon column="success_rate" />
 </div>
 </TableHead>
 <TableHead 
 className="px-6 py-4 text-right cursor-pointer hover:text-foreground transition-colors"
 onClick={() => handleSort('average_duration')}
 >
 <div className="flex items-center justify-end gap-1">
 Duração Média
 <SortIcon column="average_duration" />
 </div>
 </TableHead>
 <TableHead className="px-6 py-4 text-right">Ações</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-border">
 {filteredMetrics.length === 0 ? (
 <TableRow>
 <TableCell colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
 Nenhuma métrica encontrada.
 </TableCell>
 </TableRow>
 ) : (
 filteredMetrics.map((metric) => {
 const agent = getAgentByWorkflowId(metric.workflowId);
 
 return (
 <TableRow key={metric.workflowId} className="hover:bg-muted transition-colors">
 <TableCell className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
 {agent ? <Bot className="w-4 h-4 text-muted-foreground" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
 </div>
 <div>
 <div className="font-bold text-foreground">
 {agent ? agent.name : 'Agente Desconhecido'}
 </div>
 <div className="text-xs text-muted-foreground font-mono mt-0.5">
 {metric.workflowId}
 </div>
 </div>
 </div>
 </TableCell>
 <TableCell className="px-6 py-4">
 <div className="flex items-center justify-center gap-2">
 <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
 <div 
 className={`h-full rounded-full ${metric.success_rate >= 90 ? 'bg-emerald-500' : metric.success_rate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
 style={{ width: `${metric.success_rate}%` }}
 />
 </div>
 <span className="font-bold text-muted-foreground w-12 text-right">
 {metric.success_rate.toFixed(1)}%
 </span>
 </div>
 </TableCell>
 <TableCell className="px-6 py-4 text-right">
 <span className="font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md text-xs border border-border">
 {metric.average_duration !== null 
 ? metric.average_duration < 1 
 ? `${Math.round(metric.average_duration * 1000)}ms` 
 : `${metric.average_duration.toFixed(2)}s`
 : '-'}
 </span>
 </TableCell>
 <TableCell className="px-6 py-4 text-right">
 <button
 onClick={() => window.open(`/agents/${metric.workflowId}`, '_blank')}
 className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors inline-flex"
 title="Ver Agente"
 >
 <ExternalLink className="w-4 h-4" />
 </button>
 </TableCell>
 </TableRow>
 );
 })
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 </div>
 </DarkPage>
 );
};



