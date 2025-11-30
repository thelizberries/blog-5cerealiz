# 🎨 Blog 5Cerealiz

Il blog ufficiale della cartoon band **5Cerealiz** - Sistema di blogging moderno con Jekyll, GitHub Pages e Cloudflare Workers.

## 🌐 URL

- **Blog**: https://blog.5cerealiz.thelizards.it
- **Editor**: https://blog.5cerealiz.thelizards.it/upload.html

## ✨ Caratteristiche

- ✅ **Editor unificato** per creare post con live preview
- ✅ **Upload immagini** automatizzato con conversione WebP
- ✅ **Stile fumettoso** dedicato ai 5Cerealiz
- ✅ **Backup giornaliero** automatico (30 giorni di retention)
- ✅ **SEO ottimizzato** con feed RSS e sitemap
- ✅ **Responsive design** - perfetto su mobile e desktop

## 📝 Come Creare un Post

### Metodo 1: Editor Unificato (CONSIGLIATO)

1. Vai su **https://blog.5cerealiz.thelizards.it/upload.html**
2. Compila i campi:
   - **Immagine** (opzionale): Seleziona JPG o PNG
   - **Titolo**: es. "Nuova Puntata Disponibile!"
   - **Data**: Scegli la data di pubblicazione
   - **Contenuto**: Scrivi in Markdown (vedi toolbar per aiuto)
3. Vedi l'anteprima in tempo reale sulla destra
4. Inserisci la **password** (richiesta al team tecnico)
5. Clicca **"Pubblica Post"**

**Risultato**: Immagine caricata + Post creato in un solo click! 🎉

### Metodo 2: Modifica Post Esistente

Usa [Prose.io](http://prose.io/#thelizberries/blog-5cerealiz) per modificare post già pubblicati.

## 🎨 Markdown Cheat Sheet

```markdown
# Titolo H1
## Titolo H2
### Titolo H3

**Grassetto**
*Corsivo*

[Link](https://url.com)

- Lista
- Di
- Elementi

<!--more-->  <- Separa l'anteprima dal contenuto completo
```

## ⚙️ Automazioni

### Conversione Immagini
- Upload immagine (JPG/PNG) → automaticamente convertita in WebP (~30-40KB)
- Ridimensionata a max 900x600px
- Originale eliminato automaticamente

### Backup Giornaliero
- Ogni giorno alle 03:00 UTC
- Branch `backup/YYYY-MM-DD`
- Retention: 30 giorni

## 🚀 Deploy e Configurazione

### GitHub Repository
- **Organizzazione**: thelizberries
- **Repository**: blog-5cerealiz
- **Branch**: main
- **GitHub Pages**: Abilitato

### Cloudflare Worker
- **Nome**: 5cerealiz-blog-upload
- **URL**: https://5cerealiz-blog-upload.5cerealiz.workers.dev
- **Variabili Segrete**:
  - `UPLOAD_PASSWORD`: Add5LizPhoto25!
  - `GITHUB_TOKEN`: (Personal Access Token con permessi `repo`)

### DNS / Dominio
Configura il CNAME per puntare a:
```
blog.5cerealiz.thelizards.it → thelizberries.github.io
```

## 📁 Struttura del Progetto

```
blog-5cerealiz/
├── _config.yml          # Configurazione Jekyll
├── _layouts/            # Template pagine
│   ├── default.html
│   ├── home.html
│   └── post.html
├── _includes/           # Componenti riutilizzabili
│   ├── header.html
│   └── footer.html
├── _posts/              # Post del blog (YYYY-MM-DD-titolo.md)
├── assets/
│   ├── css/
│   │   └── 5cerealiz-blog.css  # Stile fumettoso
│   └── images/
│       └── posts/       # Immagini dei post
├── .github/
│   └── workflows/       # GitHub Actions
│       ├── convert-images-to-webp.yml
│       └── daily-backup.yml
├── workers/             # Cloudflare Worker
│   ├── upload.js
│   └── wrangler.toml
├── upload.html          # Editor unificato
└── README.md
```

## 🔧 Sviluppo Locale

```bash
# Installa Jekyll (richiede Ruby)
gem install jekyll bundler

# Crea Gemfile
bundle init
bundle add jekyll

# Servi il blog localmente
bundle exec jekyll serve

# Apri: http://localhost:4000
```

## 🛡️ Sicurezza

- Password protetto per upload/creazione post
- GitHub Token con permessi minimi necessari
- Validazione formato file
- Check duplicati automatico

## 📞 Supporto

Per problemi o domande:
- Repository: https://github.com/thelizberries/blog-5cerealiz
- Sito ufficiale: https://www.thelizards.it/5cerealiz/

---

**5Cerealiz** - La Cartoon Band 🎨🎵
