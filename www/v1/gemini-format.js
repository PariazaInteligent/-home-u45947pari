/**
 * Formatează răspunsul text de la Gemini în HTML cu stiluri frumoase
 * @param {string} text - Textul brut de la Gemini
 * @returns {string} - HTML formatat
 */
function formatGeminiResponse(text) {
    if (!text) return '';

    let html = text;

    // Escape HTML pentru securitate (înainte de orice altceva)
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Procesează code blocks (```...```)
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

    // Procesează inline code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic (*text*)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Linii de text într-un array pentru procesare linie cu linie
    const lines = html.split('\n');
    const processed = [];
    let inList = false;
    let inOrderedList = false;
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines (dar le păstrăm pentru spațiere între paragrafe)
        if (!line) {
            if (inList || inOrderedList) {
                // Finishing a list
                if (inList) {
                    processed.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
                } else {
                    processed.push('<ol>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ol>');
                }
                inList = false;
                inOrderedList = false;
                listItems = [];
            }
            continue;
        }

        // Headers (## sau ###)
        if (line.startsWith('### ')) {
            if (inList || inOrderedList) {
                if (inList) {
                    processed.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
                } else {
                    processed.push('<ol>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ol>');
                }
                inList = false;
                inOrderedList = false;
                listItems = [];
            }
            processed.push(`<h3>${line.substring(4)}</h3>`);
            continue;
        }

        if (line.startsWith('## ')) {
            if (inList || inOrderedList) {
                if (inList) {
                    processed.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
                } else {
                    processed.push('<ol>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ol>');
                }
                inList = false;
                inOrderedList = false;
                listItems = [];
            }
            processed.push(`<h2>${line.substring(3)}</h2>`);
            continue;
        }

        if (line.startsWith('# ')) {
            if (inList || inOrderedList) {
                if (inList) {
                    processed.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
                } else {
                    processed.push('<ol>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ol>');
                }
                inList = false;
                inOrderedList = false;
                listItems = [];
            }
            processed.push(`<h1>${line.substring(2)}</h1>`);
            continue;
        }

        // Separatoare (---, ___, ***)
        if (line.match(/^(---+|___+|\*\*\*+)$/)) {
            if (inList || inOrderedList) {
                if (inList) {
                    processed.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
                } else {
                    processed.push('<ol>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
                }
                inList = false;
                inOrderedList = false;
                listItems = [];
            }
            processed.push('<hr />');
            continue;
        }

        // Liste cu bullet points (- sau * la început de linie)
        if (line.match(/^[-*]\s+/)) {
            const itemText = line.replace(/^[-*]\s+/, '');
            if (!inList) {
                // Start a new unordered list
                inList = true;
                inOrderedList = false;
                listItems = [];
            }
            listItems.push(itemText);
            continue;
        }

        // Liste numerotate (1. 2. etc.)
        if (line.match(/^\d+\.\s+/)) {
            const itemText = line.replace(/^\d+\.\s+/, '');
            if (!inOrderedList) {
                // Start a new ordered list
                inOrderedList = true;
                inList = false;
                listItems = [];
            }
            listItems.push(itemText);
            continue;
        }

        // Dacă eram într-o listă și nu mai suntem, o închidem
        if (inList || inOrderedList) {
            if (inList) {
                processed.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
            } else {
                processed.push('<ol>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ol>');
            }
            inList = false;
            inOrderedList = false;
            listItems = [];
        }

        // Paragrafe normale
        processed.push(`<p>${line}</p>`);
    }

    // Close any remaining list
    if (inList || inOrderedList) {
        if (inList) {
            processed.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
        } else {
            processed.push('<ol>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ol>');
        }
    }

    return processed.join('\n');
}
