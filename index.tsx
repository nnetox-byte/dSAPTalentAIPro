import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("🚀 Iniciando Bootstrap da Aplicação...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("❌ Erro Crítico: Elemento #root não encontrado no DOM.");
} else {
  try {
    console.log("📦 Criando Root do React...");
    const root = createRoot(rootElement);
    
    console.log("⚛️ Renderizando App...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ Aplicação montada com sucesso.");
  } catch (error: any) {
    console.error("❌ Falha fatal ao renderizar React:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; max-width: 600px; margin: 100px auto; border: 1px solid #fee2e2; border-radius: 24px; background: #fff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
        <h2 style="color: #ef4444; margin-top: 0;">Falha na Inicialização</h2>
        <p style="color: #64748b;">O React não conseguiu iniciar a interface. Erro:</p>
        <code style="display: block; background: #f8fafc; padding: 15px; border-radius: 12px; font-size: 12px; color: #be123c; overflow-x: auto; margin-bottom: 20px;">
          ${error.message || error}
        </code>
        <button onclick="window.location.reload()" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">
          Tentar Novamente
        </button>
      </div>
    `;
  }
}