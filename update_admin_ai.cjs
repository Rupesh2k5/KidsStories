const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

// 1. Add state and function
const stateStr = `  const [aiResponse, setAiResponse] = useState('');

  const handleAIPrompt = async (promptText) => {
    try {
      const toastId = toast.loading('Gemini is generating response...');
      const { data } = await axios.post(backendUrl + '/api/ai/prompt', { prompt: promptText }, { headers: { token } });
      if (data.success) {
        toast.dismiss(toastId);
        setAiResponse(data.text);
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to generate response');
    }
  };`;

// Insert after setActiveTab
code = code.replace(
  "const [analyticsTab, setAnalyticsTab] = useState('overview');",
  "const [analyticsTab, setAnalyticsTab] = useState('overview');\n" + stateStr
);

// 2. Replace onClick alerts with handleAIPrompt
code = code.replace(/onClick=\{\(\) => alert\('AI Prompt Feature \(Demo\)'\)\}/g, "onClick={(e) => { const prompt = e.target.getAttribute('data-prompt') || 'Provide tips for this feature'; handleAIPrompt(prompt); }}");

// To make this work, the original HTML buttons didn't have data-prompt, they passed it to the function: onclick="sendPrompt('How do I improve my SEO...')"
// In my first script, I replaced those with `alert('AI Prompt Feature (Demo)')`, losing the original prompt string. 
// That's fine, let's hardcode some prompts based on the tab context.
code = code.replace(/<button className="btn btn-sm" onClick=\{\(e\) => \{ const prompt = e\.target\.getAttribute\('data-prompt'\) \|\| 'Provide tips for this feature'; handleAIPrompt\(prompt\); \}\}>Get SEO tips for this ↗<\/button>/g, 
  `<button className="btn btn-sm" onClick={() => handleAIPrompt('Provide SEO tips for ranking a children\\'s storybook website in India.')}>Get SEO tips for this ↗</button>`);

code = code.replace(/<button className="btn btn-sm" onClick=\{\(e\) => \{ const prompt = e\.target\.getAttribute\('data-prompt'\) \|\| 'Provide tips for this feature'; handleAIPrompt\(prompt\); \}\}>Write compelling meta tags ↗<\/button>/g, 
  `<button className="btn btn-sm" onClick={() => handleAIPrompt('Write compelling meta tags (title and description) for an e-commerce store selling kids activity books.')}>Write compelling meta tags ↗</button>`);
  
code = code.replace(/<button className="btn btn-sm" onClick=\{\(e\) => \{ const prompt = e\.target\.getAttribute\('data-prompt'\) \|\| 'Provide tips for this feature'; handleAIPrompt\(prompt\); \}\}>Generate keyword ideas ↗<\/button>/g, 
  `<button className="btn btn-sm" onClick={() => handleAIPrompt('Generate keyword ideas for an online bookstore specializing in children\\'s educational and activity books in India.')}>Generate keyword ideas ↗</button>`);

code = code.replace(/<button className="btn btn-primary" onClick=\{\(e\) => \{ const prompt = e\.target\.getAttribute\('data-prompt'\) \|\| 'Provide tips for this feature'; handleAIPrompt\(prompt\); \}\}><i className="fas fa-magic"><\/i> Generate with AI<\/button>/g, 
  `<button className="btn btn-primary" onClick={() => handleAIPrompt('Generate a persuasive promotional email for a new children\\'s bedtime storybook release.')}><i className="fas fa-magic"></i> Generate with AI</button>`);

// 3. Insert Modal JSX right before the final closing div/tag
const modalJsx = `
      {aiResponse && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'15px', width:'90%', maxWidth:'700px', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
            <h3 style={{marginTop:0, color:'var(--primary)', display:'flex', alignItems:'center', gap:'10px'}}>
              <i className="fas fa-sparkles"></i> AI Suggestion
            </h3>
            <div style={{whiteSpace:'pre-wrap', lineHeight:'1.6', fontSize:'14px', color:'#444', background:'#f8f9fa', padding:'20px', borderRadius:'10px', border:'1px solid #eee'}}>
              {aiResponse}
            </div>
            <div style={{marginTop:'20px', textAlign:'right'}}>
              <button onClick={() => setAiResponse('')} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/(<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};\s*export default Admin;)/, modalJsx + '$1');

fs.writeFileSync('src/pages/Admin.jsx', code);
console.log('Admin.jsx updated with AI integration');
