
/**
 * Utilitário para gerar IDs opacos a partir de caminhos JSON.
 * Simula o comportamento de criptografia para não revelar o caminho original na UI.
 */

export const encryptPath = (text: string): string => {
  if (!text) return '';
  
  try {
    // Codificação Base64URL para gerar um ID seguro para URL e opaco para o usuário
    // Isso satisfaz o requisito visual de "não revelar o caminho"
    const base64 = btoa(text);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error("Erro ao gerar ID do caminho", e);
    return text;
  }
};

export const decryptPath = (text: string): string => {
  if (!text) return '';
  try {
    let base64 = text.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
  } catch (e) {
    // Retorna o texto original se não for um base64 válido
    return text;
  }
};
