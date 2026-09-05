const fs = require('fs');
const zipPath = 'public/ControleFinanceiro_Atualizado.zip';
const outPath = 'C:/Users/Safari Posiivo/.gemini/antigravity/brain/95514ca0-873f-490a-b393-ecc7061d3f9f/download_widget.html';

const zipData = fs.readFileSync(zipPath);
const base64Data = zipData.toString('base64');

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-5 flex items-center justify-center min-h-[300px]">
  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-8 shadow-lg max-w-sm w-full text-center">
    <div class="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <span class="text-4xl">🚀</span>
    </div>
    <h2 class="text-[var(--foreground)] font-bold text-xl mb-2">APK Atualizado Pronto!</h2>
    <p class="text-[var(--muted-foreground)] text-sm mb-6">O arquivo contém a versão com o Auto-Updater incluído e correção de caracteres.</p>
    
    <a href="data:application/zip;base64,${base64Data}" download="ControleFinanceiro_Atualizado.zip" class="block w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg shadow-blue-500/30 text-lg hover:scale-105 transition-transform">
      ⬇️ BAIXAR APLICATIVO (ZIP)
    </a>
    
    <p class="text-xs text-[var(--muted-foreground)] mt-4">Ao baixar, extraia o ZIP no celular e instale o APK.</p>
  </div>
</body>
</html>`;

fs.writeFileSync(outPath, htmlContent);
console.log('HTML widget created successfully!');
