const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const stateToAdd = `
  // Auto-Updater State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const APP_VERSION = '1.0.0';

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);`;

code = code.replace('  const [showNotificationsModal, setShowNotificationsModal] = useState(false);', stateToAdd);

const effectToAdd = `  useEffect(() => {
    // Check for Updates on App Start
    const checkForUpdates = async () => {
      try {
        const response = await fetch('https://controle-financeiro-4b59c.web.app/version.json?t=' + new Date().getTime());
        if (response.ok) {
          const data = await response.json();
          if (data.version > APP_VERSION) {
            setUpdateInfo(data);
            setShowUpdateModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to check for updates', error);
      }
    };
    setTimeout(checkForUpdates, 3000);
  }, []);

  useEffect(() => {
    // Simulation of fetching transactions`;

code = code.replace('  useEffect(() => {\n    // Simulation of fetching transactions', effectToAdd);

const modalToAdd = `        {/* Modal: Auto Updater */}
        {showUpdateModal && updateInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={\`w-full max-w-sm rounded-3xl p-6 \${isDarkMode ? 'bg-[#1e1f26] text-white' : 'bg-white text-slate-900'} shadow-2xl relative overflow-hidden\`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mt-2">
                  <span className="text-3xl">🚀</span>
                </div>
                
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider mb-1">Nova Versão Disponível!</h3>
                  <p className={\`text-xs \${subText}\`}>Versão {updateInfo.version} já pode ser baixada.</p>
                </div>
                
                <div className={\`w-full p-4 rounded-2xl border \${innerInputBg} text-left\`}>
                  <h4 className="text-[10px] font-bold uppercase mb-2 text-blue-400">O que há de novo?</h4>
                  <ul className="text-xs space-y-2">
                    {updateInfo.changelog?.map((change, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="w-full flex flex-col space-y-2 pt-2">
                  <button 
                    onClick={() => {
                      window.open(updateInfo.apkUrl, '_system');
                      setShowUpdateModal(false);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30"
                  >
                    Baixar Atualização (ZIP)
                  </button>
                  <button 
                    onClick={() => setShowUpdateModal(false)}
                    className={\`w-full py-3 rounded-xl border \${isDarkMode ? 'border-white/10 text-white/50' : 'border-black/10 text-black/50'} text-xs font-bold\`}
                  >
                    Lembrar Mais Tarde
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Header`;

code = code.replace('        {/* Navigation Header', modalToAdd);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Success');
