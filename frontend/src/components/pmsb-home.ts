import { LitElement, html, unsafeCSS, type TemplateResult } from "lit";
import { state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import tailwindStyles from "../styles/tailwind.css?inline";

const API_BASE = "http://localhost:4000/api";

const HOME_CONTENT = html`
  <section class="max-w-3xl">
    <h2 class="text-2xl font-semibold text-slate-800 mb-6">
      Bun venit pe site-ul primăriei MIERCUREA SIBIULUI județul Sibiu
    </h2>
    <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <h3 class="text-lg font-medium text-slate-700 mb-4">Date de contact</h3>
      <dl class="space-y-3 text-slate-600">
        <div>
          <dt class="text-sm font-medium text-slate-500">Adresă</dt>
          <dd class="mt-0.5">
            Str. Ilie Măcelariu Nr.48 Miercurea Sibiului jud.Sibiu
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-slate-500">E-mail</dt>
          <dd class="mt-0.5">
            primmsb@yahoo.com , primaria.miercureasibiului@sibiu.stslink.ro
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-slate-500">Telefon</dt>
          <dd class="mt-0.5">0269533102/0269533213</dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-slate-500">Fax</dt>
          <dd class="mt-0.5">0269533124</dd>
        </div>
      </dl>
    </div>
  </section>
`;

interface TabConfig {
  id: string;
  label: string;
  endpoint?: string;
  content?: TemplateResult;
}

const TABS: TabConfig[] = [
  { id: "home", label: "Home", content: HOME_CONTENT },
  { id: "stiri", label: "Stiri", endpoint: "news" },
  { id: "formulare-tip", label: "Formulare Tip", endpoint: "documents" },
  { id: "programari", label: "Programari", endpoint: "appointments" },
  { id: "date-personale", label: "Date personale", endpoint: "citizens" },
  { id: "proprietati", label: "Proprietati", endpoint: "properties" },
  { id: "cereri", label: "Cereri", endpoint: "requests" },
  { id: "taxe-impozite", label: "Taxe si Impozite", endpoint: "taxes" },
];

export class PmsbHome extends LitElement {
  static styles = unsafeCSS(tailwindStyles);

  @state()
  private activeTab = TABS[0].id;

  @state()
  private data: Record<string, unknown[]> = {};

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  private async fetchData(endpoint: string) {
    if (this.data[endpoint]) return;
    
    this.loading = true;
    this.error = null;
    
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const result = await response.json();
      this.data = { ...this.data, [endpoint]: result };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to fetch data";
    } finally {
      this.loading = false;
    }
  }

  private async handleTabClick(tab: TabConfig) {
    this.activeTab = tab.id;
    if (tab.endpoint) {
      await this.fetchData(tab.endpoint);
    }
  }

  private renderNewsItem(item: Record<string, unknown>) {
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-800">${item.title}</h3>
        <p class="text-sm text-slate-600 mt-1">${item.content}</p>
        <p class="text-xs text-slate-400 mt-2">By ${item.author}</p>
      </div>
    `;
  }

  private renderTaxItem(item: Record<string, unknown>) {
    const dueDate = new Date(item.dueDate as string).toLocaleDateString("ro-RO");
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <h3 class="font-semibold text-slate-800">${item.title}</h3>
          <span class="px-2 py-1 text-xs rounded ${item.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
            ${item.status}
          </span>
        </div>
        <p class="text-lg font-bold text-slate-900 mt-2">${item.amount} RON</p>
        <p class="text-sm text-slate-500 mt-1">Scadent: ${dueDate}</p>
      </div>
    `;
  }

  private renderAppointmentItem(item: Record<string, unknown>) {
    const date = new Date(item.date as string).toLocaleDateString("ro-RO");
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <h3 class="font-semibold text-slate-800">${item.department}</h3>
          <span class="px-2 py-1 text-xs rounded ${
            item.status === 'completed' ? 'bg-green-100 text-green-800' : 
            item.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }">
            ${item.status}
          </span>
        </div>
        <p class="text-sm text-slate-600 mt-1">${item.purpose}</p>
        <p class="text-sm text-slate-500 mt-2">Data: ${date}</p>
      </div>
    `;
  }

  private renderCitizenItem(item: Record<string, unknown>) {
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-800">${item.firstName} ${item.lastName}</h3>
        <p class="text-sm text-slate-600 mt-1">${item.address}</p>
        <p class="text-sm text-slate-500 mt-1">Tel: ${item.phone}</p>
      </div>
    `;
  }

  private renderPropertyItem(item: Record<string, unknown>) {
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <h3 class="font-semibold text-slate-800">${item.address}</h3>
          <span class="px-2 py-1 text-xs rounded bg-slate-100 text-slate-800">${item.propertyType}</span>
        </div>
        ${item.details ? html`<p class="text-sm text-slate-600 mt-1">${item.details}</p>` : ''}
      </div>
    `;
  }

  private renderRequestItem(item: Record<string, unknown>) {
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <h3 class="font-semibold text-slate-800">${item.documentType}</h3>
          <span class="px-2 py-1 text-xs rounded ${
            item.status === 'approved' ? 'bg-green-100 text-green-800' : 
            item.status === 'rejected' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'
          }">
            ${item.status}
          </span>
        </div>
        <p class="text-sm text-slate-500 mt-1">Termen legal: ${item.legalResponseDays} zile</p>
        ${item.adminComment ? html`<p class="text-sm text-slate-600 mt-1 italic">${item.adminComment}</p>` : ''}
      </div>
    `;
  }

  private renderDocumentItem(item: Record<string, unknown>) {
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <h3 class="font-semibold text-slate-800">${item.title}</h3>
          <span class="px-2 py-1 text-xs rounded bg-slate-100 text-slate-800">${item.category}</span>
        </div>
        ${item.description ? html`<p class="text-sm text-slate-600 mt-1">${item.description}</p>` : ''}
        <p class="text-xs text-slate-400 mt-2">Uploaded by ${item.uploadedBy}</p>
      </div>
    `;
  }

  private renderDataList(endpoint: string): TemplateResult {
    const items = (this.data[endpoint] || []) as Record<string, unknown>[];
    
    if (this.loading) {
      return html`<p class="text-center text-slate-500 py-8">Loading...</p>`;
    }
    
    if (this.error) {
      return html`<p class="text-center text-red-500 py-8">${this.error}</p>`;
    }
    
    if (items.length === 0) {
      return html`<p class="text-center text-slate-500 py-8">No data available</p>`;
    }

    const renderers: Record<string, (item: Record<string, unknown>) => TemplateResult> = {
      news: this.renderNewsItem,
      taxes: this.renderTaxItem,
      appointments: this.renderAppointmentItem,
      citizens: this.renderCitizenItem,
      properties: this.renderPropertyItem,
      requests: this.renderRequestItem,
      documents: this.renderDocumentItem,
    };

    const renderer = renderers[endpoint] || ((item: Record<string, unknown>) => html`<pre>${JSON.stringify(item, null, 2)}</pre>`);

    return html`
      <div class="space-y-4 max-w-3xl">
        ${repeat(items, (item: Record<string, unknown>) => (item._id as string) || Math.random(), (item: Record<string, unknown>) => renderer(item))}
      </div>
    `;
  }

  private renderTabContent() {
    const activeTabConfig = TABS.find((tab) => tab.id === this.activeTab) ?? TABS[0];
    
    if (activeTabConfig.content) {
      return activeTabConfig.content;
    }
    
    if (activeTabConfig.endpoint) {
      return this.renderDataList(activeTabConfig.endpoint);
    }
    
    return html`<p class="py-16 text-center text-2xl font-light text-slate-500">Coming Soon</p>`;
  }

  render() {
    return html`
      <div class="min-h-screen bg-slate-50">
        <header class="bg-white border-b border-slate-200 shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Primaria Miercurea Sibiului
            </h1>
          </div>
          <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul class="flex flex-wrap gap-1 border-t border-slate-100 pt-1">
              ${repeat(
                TABS,
                (tab) => tab.id,
                (tab) => html`
                  <li>
                    <button
                      @click=${() => this.handleTabClick(tab)}
                      class="px-3 py-2.5 text-sm font-medium rounded-t-md transition-colors cursor-pointer
                        ${this.activeTab === tab.id
                          ? "bg-slate-800 text-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}"
                    >
                      ${tab.label}
                    </button>
                  </li>
                `
              )}
            </ul>
          </nav>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          ${this.renderTabContent()}
        </main>
      </div>
    `;
  }
}

customElements.define("pmsb-home", PmsbHome);
