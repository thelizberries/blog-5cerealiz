/**
 * Blog 5Cerealiz - Cloudflare Worker per Upload Immagini e Creazione Post
 * 
 * Questo worker gestisce:
 * 1. Upload di immagini su GitHub (assets/images/posts/)
 * 2. Creazione di post nel blog (cartella _posts/)
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data = await request.json();
      const { action, password } = data;

      // Verifica password
      if (password !== env.UPLOAD_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Password non valida' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Configurazione GitHub
      const GITHUB_TOKEN = env.GITHUB_TOKEN;
      const GITHUB_OWNER = 'thelizberries';
      const GITHUB_REPO = 'blog-5cerealiz';
      const GITHUB_BRANCH = 'main';

      if (action === 'upload_image') {
        return await handleImageUpload(data, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, corsHeaders);
      } else if (action === 'create_post') {
        return await handlePostCreation(data, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, corsHeaders);
      } else {
        return new Response(JSON.stringify({ error: 'Azione non valida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Gestisce l'upload di un'immagine su GitHub
 */
async function handleImageUpload(data, token, owner, repo, branch, corsHeaders) {
  const { filename, content } = data;

  if (!filename || !content) {
    return new Response(JSON.stringify({ error: 'Filename e content sono richiesti' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Verifica formato file
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  if (!hasValidExtension) {
    return new Response(JSON.stringify({ error: 'Formato file non valido. Usa JPG, PNG, GIF o WebP' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const path = `assets/images/posts/${filename}`;

  try {
    // Verifica se il file esiste già
    const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': '5Cerealiz-Blog-Worker'
      }
    });

    if (checkResponse.ok) {
      return new Response(JSON.stringify({ error: 'Un file con questo nome esiste già' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upload del file
    const uploadUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': '5Cerealiz-Blog-Worker'
      },
      body: JSON.stringify({
        message: `Add image: ${filename}`,
        content: content.split(',')[1], // Rimuove il prefisso data:image/...;base64,
        branch: branch
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('GitHub upload error:', errorText);
      return new Response(JSON.stringify({ error: `Errore GitHub: ${uploadResponse.status}` }), {
        status: uploadResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await uploadResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: `Immagine "${filename}" caricata con successo!`,
      webpName: filename.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
      url: result.content.download_url,
      path: path
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Gestisce la creazione di un post nel blog
 */
async function handlePostCreation(data, token, owner, repo, branch, corsHeaders) {
  const { filename, content } = data;

  if (!filename || !content) {
    return new Response(JSON.stringify({ error: 'Filename e content sono richiesti' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Verifica che il filename sia un .md file
  if (!filename.endsWith('.md')) {
    return new Response(JSON.stringify({ error: 'Il file deve avere estensione .md' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Verifica e correggi il marcatore <!--more-->
  let processedContent = ensureMoreMarker(content);

  const path = `_posts/${filename}`;

  try {
    // Verifica se il post esiste già
    const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': '5Cerealiz-Blog-Worker'
      }
    });

    if (checkResponse.ok) {
      return new Response(JSON.stringify({ error: `Un post con il nome "${filename}" esiste già. Modifica il titolo o la data.` }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Crea il post
    const createUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const createResponse = await fetch(createUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': '5Cerealiz-Blog-Worker'
      },
      body: JSON.stringify({
        message: `Create post: ${filename}`,
        content: btoa(unescape(encodeURIComponent(processedContent))),
        branch: branch
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('GitHub create error:', errorText);
      return new Response(JSON.stringify({ error: `Errore GitHub: ${createResponse.status}` }), {
        status: createResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Post creato con successo!',
      filename: filename
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Post creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Funzione per verificare e inserire il marcatore <!--more-->
function ensureMoreMarker(content) {
  // Separa front matter dal contenuto
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    // Se non c'è front matter, restituisci il contenuto originale
    return content;
  }
  
  const frontMatter = match[1];
  let postContent = match[2];
  
  // Rimuovi spazi/newline iniziali
  postContent = postContent.trim();
  
  // Estrai il titolo dal front matter per controllarne la lunghezza
  const titleMatch = frontMatter.match(/title:\s*['"]?([^'"\n]+)['"]?/);
  const titleLength = titleMatch ? titleMatch[1].trim().length : 0;
  
  // Se il titolo è >= 50 caratteri, riduci il limite a 80, altrimenti usa 100
  const maxLength = titleLength >= 50 ? 80 : 100;
  const minLength = titleLength >= 50 ? 40 : 50;
  const searchStart = titleLength >= 50 ? 60 : 80;
  const searchRange = titleLength >= 50 ? 40 : 50;
  
  // Controlla se <!--more--> è già presente
  if (postContent.includes('<!--more-->')) {
    const moreIndex = postContent.indexOf('<!--more-->');
    if (moreIndex > 0 && moreIndex < 400) {
      return content;
    }
    postContent = postContent.replace('<!--more-->', '').trim();
  }
  
  // Trova la posizione migliore: dopo il primo paragrafo o dopo maxLength caratteri
  let insertPosition = maxLength;
  
  // Cerca il primo doppio newline (fine paragrafo) entro i primi maxLength caratteri
  const firstParagraphEnd = postContent.substring(0, maxLength).indexOf('\n\n');
  if (firstParagraphEnd > minLength && firstParagraphEnd < maxLength) {
    insertPosition = firstParagraphEnd;
  } else {
    // Altrimenti cerca la fine della prima frase dopo searchStart caratteri
    const actualSearchStart = Math.min(searchStart, postContent.length);
    const remainingText = postContent.substring(actualSearchStart, Math.min(actualSearchStart + searchRange, postContent.length));
    
    // Cerca il primo punto seguito da spazio o newline
    const sentenceEndMatch = remainingText.match(/[.!?][\s\n]/);
    if (sentenceEndMatch) {
      insertPosition = actualSearchStart + sentenceEndMatch.index + 1;
    } else {
      // Se non trova un punto, cerca almeno uno spazio dopo 100 caratteri
      const spaceIndex = remainingText.indexOf(' ');
      if (spaceIndex !== -1) {
        insertPosition = searchStart + spaceIndex;
      }
    }
  }
  
  // Assicurati di non troncare nel mezzo di una parola
  while (insertPosition < postContent.length && 
         postContent[insertPosition] !== ' ' && 
         postContent[insertPosition] !== '\n') {
    insertPosition++;
  }
  
  // Inserisci il marcatore
  const beforeMarker = postContent.substring(0, insertPosition).trimEnd();
  const afterMarker = postContent.substring(insertPosition).trimStart();
  
  postContent = `${beforeMarker}\n\n<!--more-->\n\n${afterMarker}`;
  
  // Ricostruisci il file completo
  return `---\n${frontMatter}\n---\n${postContent}`;
}
