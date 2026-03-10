
import { GoogleGenAI } from "@google/genai";
import { Agent, ChatMessage } from "../types";

const API_BASE = process.env.API_BASE;

/**
 * Chama o endpoint de teste do backend, que encaminha para o webhook do agente.
 * POST /agents/test?agent_id={id}
 */
export const callAgentWebhook = async (agent: Agent, history: ChatMessage[]): Promise<string> => {
  const lastMessage = history[history.length - 1];
  
  // Extrai texto e dados da última interação
  const text = lastMessage.parts.find(p => p.text)?.text || "";
  const attachments = lastMessage.parts.filter(p => p.inlineData).map(p => ({
      mimeType: p.inlineData?.mimeType,
      data: p.inlineData?.data?.substring(0, 100) + "..." // Apenas log/meta do anexo para não sobrecarregar
  }));

  const payload = {
    sessionId: `test_session_${agent.id}`,
    chatInput: text,
    agent: {
      id: agent.id,
      name: agent.name,
      workflowId: agent.workflowId
    },
    metadata: {
        timestamp: new Date().toISOString(),
        platform: 'Ebettr IA Manager - Playground',
        hasAttachments: attachments.length > 0
    }
  };

  const token = localStorage.getItem('ebettr_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}/agents/test?agent_id=${agent.id}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    
    // Se for um array (padrão n8n), pega o primeiro item
    const item = Array.isArray(data) ? data[0] : data;
    
    // Tenta extrair a resposta de campos comuns retornados por fluxos n8n/IA
    const output = item?.output || item?.response || item?.text || item?.message || 
                   (typeof item === 'string' ? item : JSON.stringify(item));
    
    return output;
  } catch (error: any) {
    console.error("Erro na chamada do Webhook:", error);
    throw new Error(`Falha ao comunicar com o servidor de teste: ${error.message}`);
  }
};

/**
 * Gera resposta usando Gemini direto (Fallback).
 */
export const generateGeminiResponse = async (
  agent: Agent,
  history: ChatMessage[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const personalityConfig = agent.configSections.find(c => c.id === 'personality');
  const toneField = personalityConfig?.fields.find(f => f.id === 'tone');
  const tone = toneField ? String(toneField.value) : 'Neutro';
  
  const systemInstruction = `
    Você é um agente de IA chamado ${agent.name}.
    Descrição: ${agent.description}.
    Tom de voz: ${tone}
    Responda de forma breve e direta.
  `;

  try {
    const validContents = [...history];
    if (validContents.length > 0 && validContents[0].role === 'model') {
        validContents.shift(); 
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: validContents,
      config: { systemInstruction }
    });

    return response.text || "O agente não retornou texto.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Ocorreu um erro no processamento da IA.";
  }
};

/**
 * Orquestrador de resposta: Decide entre Webhook (se configurado) ou Gemini direto.
 */
export const getAgentResponse = async (agent: Agent, history: ChatMessage[]): Promise<string> => {
    // Se o agente tem um Webhook de teste definido, ele tem prioridade absoluta no playground
    if (agent.hasTestMode && agent.testWebhookUrl) {
        try {
            return await callAgentWebhook(agent, history);
        } catch (e: any) {
            return `Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente em instantes.`;
        }
    }

    // Caso contrário, usa o Gemini direto como "mock" do comportamento
    return await generateGeminiResponse(agent, history);
};
