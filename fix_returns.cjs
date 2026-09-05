const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The string that was injected incorrectly:
const badStr = `  useEffect(() => {
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

  return (`

// How many times does it appear?
let count = code.split(badStr).length - 1;
console.log("Found bad string " + count + " times.");

// Replace all occurrences back to "  return ("
if (count > 0) {
  code = code.split(badStr).join("  return (");
  fs.writeFileSync('src/App.jsx', code, 'utf8');
  console.log("Restored all returns!");
}

