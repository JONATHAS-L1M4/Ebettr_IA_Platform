
/**
 * Extrai um valor de um objeto complexo baseado em um caminho string.
 * Suporta notação de ponto e colchetes.
 * Exemplo path: "$.nodes[0].parameters.prompt"
 */
export const getValueFromPath = (data: any, path: string): any => {
    if (!path || data === undefined || data === null) return undefined;
    
    // Remove indicador de raiz se existir
    const cleanPath = path.startsWith('$.') ? path.substring(2) : path;
    
    // Divide por pontos ou colchetes, filtrando strings vazias
    // Ex: "nodes[0].parameters.foo" -> ["nodes", "0", "parameters", "foo"]
    const parts = cleanPath.split(/[.\[\]]+/).filter(Boolean);
    
    let current = data;
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        
        // Verifica se é array e se a chave é um índice numérico
        if (Array.isArray(current) && /^\d+$/.test(part)) {
            const index = parseInt(part, 10);
            current = current[index];
        } else {
            // Acesso normal a propriedade de objeto
            current = current[part];
        }
    }
    
    return current;
};
