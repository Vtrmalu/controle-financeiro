const fs = require('fs');
let content = fs.readFileSync('App.jsx', 'utf8').replace(/\r\n/g, '\n');

if (!content.includes('const [expIncIsRecurring')) {
  content = content.replace(
    `const [expIncRecurrenceCount, setExpIncRecurrenceCount] = useState(1);`,
    `const [expIncIsRecurring, setExpIncIsRecurring] = useState(false);\n  const [expIncRecurrenceCount, setExpIncRecurrenceCount] = useState(1);`
  );
  fs.writeFileSync('App.jsx', content);
  console.log('Fixed missing expIncIsRecurring state!');
} else {
  console.log('expIncIsRecurring already exists.');
}
