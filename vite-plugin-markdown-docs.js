import fs from 'fs';
import path from 'path';
import MarkdownIt from 'markdown-it';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default function markdownDocsPlugin() {
  const contentDir = path.resolve(__dirname, 'docs/content');

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function compileDocs() {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });

    // Custom renderer for code blocks with Pines UI copyable block
    const defaultFence = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.fence = function(tokens, idx, options, env, self) {
      const token = tokens[idx];
      const rawCode = token.content;
      const lang = token.info ? token.info.trim() : '';
      const escapedCode = md.utils.escapeHtml(rawCode);

      return `
<div x-data="{ copied: false }" class="relative my-4 group">
  <div class="flex items-center justify-between px-3 py-1.5 bg-neutral-950 text-[11px] font-mono text-neutral-400 rounded-t-lg border-t border-x border-neutral-800">
    <span>${lang ? lang : 'code'}</span>
    <button 
      @click="navigator.clipboard.writeText($el.closest('.group').querySelector('code').innerText); copied = true; setTimeout(() => copied = false, 2000)" 
      type="button" 
      class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 rounded transition-colors"
      title="Copy snippet"
    >
      <template x-if="!copied">
        <span class="inline-flex items-center gap-1">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Copy</span>
        </span>
      </template>
      <template x-if="copied">
        <span class="inline-flex items-center gap-1 text-white">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Copied!</span>
        </span>
      </template>
    </button>
  </div>
  <pre class="p-4 overflow-x-auto text-xs font-mono rounded-b-lg bg-neutral-900 text-neutral-100 border border-neutral-800 leading-relaxed"><code>${escapedCode}</code></pre>
</div>`.trim();
    };

    // Custom renderer for tables
    md.renderer.rules.table_open = () => '<div class="overflow-x-auto my-5 border border-neutral-200/70 rounded-lg shadow-2xs"><table class="w-full text-left text-xs divide-y divide-neutral-200/70">';
    md.renderer.rules.table_close = () => '</table></div>';
    md.renderer.rules.thead_open = () => '<thead class="bg-neutral-50 text-neutral-700 font-semibold">';
    md.renderer.rules.th_open = () => '<th class="px-4 py-2.5 text-neutral-900 font-medium tracking-wide">';
    md.renderer.rules.td_open = () => '<td class="px-4 py-2.5 text-neutral-600 border-t border-neutral-100">';
    md.renderer.rules.tbody_open = () => '<tbody class="divide-y divide-neutral-100 bg-white">';

    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md')).sort();
    
    let compiledHtml = '';
    const sections = [];
    const searchIndex = [];

    files.forEach((filename, fileIdx) => {
      const fullPath = path.join(contentDir, filename);
      const raw = fs.readFileSync(fullPath, 'utf-8');

      // Extract first H1 as Section Title
      const h1Match = raw.match(/^#\s+(.+)$/m);
      const title = h1Match ? h1Match[1].trim() : path.basename(filename, '.md');
      const sectionSlug = slugify(title);

      // Extract all H2s
      const h2Matches = [...raw.matchAll(/^##\s+(.+)$/gm)].map(m => {
        const text = m[1].trim();
        return {
          title: text,
          id: slugify(text)
        };
      });

      sections.push({
        id: sectionSlug,
        title,
        file: filename,
        subheadings: h2Matches
      });

      // Prepare search index entries
      searchIndex.push({
        title,
        id: sectionSlug,
        category: 'Section',
        excerpt: raw.slice(0, 160).replace(/[#*`\n]/g, ' ').trim()
      });

      h2Matches.forEach(h2 => {
        searchIndex.push({
          title: h2.title,
          id: h2.id,
          category: title,
          excerpt: `Technical documentation under ${title}`
        });
      });

      // Parse markdown
      let rendered = md.render(raw);

      // Replace h1 with styled h1
      rendered = rendered.replace(
        /<h1[^>]*>(.*?)<\/h1>/i,
        `<h1 id="${sectionSlug}" class="scroll-mt-24 text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mb-4 pb-2 border-b border-neutral-200/70 flex items-center justify-between group">$1 <a href="#${sectionSlug}" class="text-neutral-300 group-hover:text-neutral-500 text-lg transition-colors ml-2" title="Direct anchor">#</a></h1>`
      );

      // Replace h2s with styled h2s with anchors
      rendered = rendered.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, p1) => {
        const h2Slug = slugify(p1);
        return `<h2 id="${h2Slug}" class="scroll-mt-24 text-lg md:text-xl font-semibold tracking-tight text-neutral-900 mt-10 mb-3 flex items-center justify-between group">${p1} <a href="#${h2Slug}" class="text-neutral-300 group-hover:text-neutral-500 text-sm transition-colors ml-2" title="Direct anchor">#</a></h2>`;
      });

      // Style h3
      rendered = rendered.replace(/<h3[^>]*>(.*?)<\/h3>/gi, (match, p1) => {
        const h3Slug = slugify(p1);
        return `<h3 id="${h3Slug}" class="scroll-mt-24 text-sm md:text-base font-semibold text-neutral-900 mt-6 mb-2">${p1}</h3>`;
      });

      // Style paragraphs
      rendered = rendered.replace(/<p>/gi, '<p class="text-sm text-neutral-600 leading-relaxed my-3.5">');

      // Style lists
      rendered = rendered.replace(/<ul>/gi, '<ul class="list-disc list-inside space-y-1.5 my-3 text-sm text-neutral-600">');
      rendered = rendered.replace(/<ol>/gi, '<ol class="list-decimal list-inside space-y-1.5 my-3 text-sm text-neutral-600">');

      // Style inline code (excluding pre code)
      rendered = rendered.replace(/(?<!<pre[^>]*>[\s\S]*?)<code>(.*?)<\/code>/gi, '<code class="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-100 text-neutral-800 border border-neutral-200/60">$1</code>');

      // Style kbd
      rendered = rendered.replace(/<kbd>(.*?)<\/kbd>/gi, '<kbd class="inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium rounded border border-neutral-200 bg-neutral-100 text-neutral-800 shadow-2xs">$1</kbd>');

      // Wrap in a section container
      compiledHtml += `
<section class="docs-section mb-14" data-section="${sectionSlug}">
  ${rendered}
</section>
      `.trim() + '\n\n';
    });

    return {
      compiledHtml,
      sections,
      searchIndex
    };
  }

  return {
    name: 'vite-plugin-markdown-docs',
    configureServer(server) {
      server.watcher.add(path.resolve(__dirname, 'docs/content/*.md'));
      server.watcher.on('change', (file) => {
        if (file.includes('docs/content')) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
    transformIndexHtml(html, ctx) {
      if (!html.includes('<!-- MARKDOWN_CONTENT_INJECTION -->')) {
        return html;
      }

      const { compiledHtml, sections, searchIndex } = compileDocs();

      // Build Sidebar navigation using Pines UI Accordion & Navigation item structure
      let sidebarNavHtml = `
<div x-data="{ activeSection: window.location.hash ? window.location.hash.substring(1) : '${sections[0]?.id || ''}' }" @hashchange.window="activeSection = window.location.hash.substring(1)" class="space-y-6">
      `.trim();

      sections.forEach((sec, idx) => {
        sidebarNavHtml += `
  <div x-data="{ open: true }" class="space-y-1">
    <div class="flex items-center justify-between px-2 py-1.5 text-xs font-medium text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer" @click="open = !open">
      <a href="#${sec.id}" @click.stop="activeSection = '${sec.id}'" class="font-semibold tracking-tight text-neutral-900 hover:text-neutral-950 flex-1 truncate" :class="{ 'text-neutral-950 font-bold': activeSection === '${sec.id}' }">
        ${sec.title}
      </a>
      <svg class="w-3.5 h-3.5 text-neutral-400 transition-transform duration-200" :class="{ 'rotate-180': open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    
    <div x-show="open" x-transition.opacity.duration.200ms class="pl-2.5 space-y-0.5 border-l border-neutral-200/70 ml-2">
      <a href="#${sec.id}" @click="activeSection = '${sec.id}'" class="block px-2 py-1 text-xs rounded transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50" :class="{ 'bg-neutral-100 font-medium text-neutral-900': activeSection === '${sec.id}' }">
        Overview
      </a>
      ${sec.subheadings.map(sub => `
      <a href="#${sub.id}" @click="activeSection = '${sub.id}'" class="block px-2 py-1 text-xs rounded transition-colors text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 truncate" :class="{ 'bg-neutral-100 font-medium text-neutral-900': activeSection === '${sub.id}' }">
        ${sub.title}
      </a>
      `).join('')}
    </div>
  </div>
        `.trim();
      });

      sidebarNavHtml += '\n</div>';

      // Inject search index and compiled content
      const searchIndexScript = `<script>window.__HYPERION_DOCS_INDEX__ = ${JSON.stringify(searchIndex)};</script>`;

      let output = html.replace('<!-- MARKDOWN_CONTENT_INJECTION -->', compiledHtml);
      output = output.replace('<!-- SIDEBAR_NAV_INJECTION -->', sidebarNavHtml);
      output = output.replace('</head>', `${searchIndexScript}\n</head>`);

      return output;
    }
  };
}
