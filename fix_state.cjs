const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const appHeader = 'export default function App() {\n  const [isDarkMode, setIsDarkMode] = useState(true);';

const injectedBlock = `
  // Auto-Updater State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
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
`;

if (!code.includes('const [showUpdateModal')) {
  code = code.replace(appHeader, appHeader + '\n' + injectedBlock);
  fs.writeFileSync('src/App.jsx', code, 'utf8');
  console.log("Injected properly!");
} else {
  console.log("Already has state!");
}
