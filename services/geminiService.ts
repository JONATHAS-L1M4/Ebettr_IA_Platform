
import { GoogleGenAI } from "@google/genai";
import { Agent, ChatMessage } from "../types";

export const generateAgentResponse = async (
  agent: Agent,
  history: ChatMessage[]
): Promise<string> => {
  
  // Initialize a new GoogleGenAI instance right before making an API call using process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a system instruction based on the agent's config
  const personalityConfig = agent.configSections.find(c => c.id === 'personality');
  const toneField = personalityConfig?.fields.find(f => f.id === 'tone');
  const tone = toneField ? String(toneField.value) : 'Neutro';
  
  const systemInstruction = `
    Você é um agente de IA chamado ${agent.name}.
    Descrição do seu papel: ${agent.description}.
    
    Configurações atuais:
    - Tom de voz: ${tone}
    
    Responda ao usuário seguindo estritamente este papel.
    Seja breve e direto.
  `;

  try {
    // Filtra o histórico para garantir que a primeira mensagem seja sempre do 'user', 
    // prevenindo erros de validação do Gemini 400 Bad Request.
    const validContents = [...history];
    if (validContents.length > 0 && validContents[0].role === 'model') {
        validContents.shift(); 
    }

    const model = 'gemini-3-flash-preview'; // Suporta análise de áudio e imagem nativamente
    
    const response = await ai.models.generateContent({
      model: model,
      contents: validContents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Sem resposta gerada.";

  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Desculpe, ocorreu um erro ao processar sua mensagem ou arquivos enviados.";
  }
};
