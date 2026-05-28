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

interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "datetime-local";
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface EntityConfig {
  endpoint: string;
  fields: FormField[];
  title: string;
}

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  news: {
    endpoint: "news",
    title: "Stire",
    fields: [
      { name: "title", label: "Titlu", type: "text", required: true },
      { name: "content", label: "Continut", type: "textarea", required: true },
      { name: "author", label: "Autor", type: "text", required: true },
    ],
  },
  taxes: {
    endpoint: "taxes",
    title: "Taxa",
    fields: [
      { name: "citizenId", label: "ID Cetatean", type: "text", required: true },
      { name: "propertyId", label: "ID Proprietate", type: "text", required: false },
      { name: "title", label: "Titlu", type: "text", required: true },
      { name: "amount", label: "Suma (RON)", type: "number", required: true },
      { name: "dueDate", label: "Data Scadenta", type: "date", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { value: "pending", label: "In asteptare" },
        { value: "paid", label: "Platit" },
      ]},
    ],
  },
  appointments: {
    endpoint: "appointments",
    title: "Programare",
    fields: [
      { name: "citizenId", label: "ID Cetatean", type: "text", required: true },
      { name: "department", label: "Departament", type: "text", required: true },
      { name: "date", label: "Data si Ora", type: "datetime-local", required: true },
      { name: "purpose", label: "Scop", type: "text", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { value: "scheduled", label: "Programat" },
        { value: "completed", label: "Finalizat" },
        { value: "cancelled", label: "Anulat" },
      ]},
    ],
  },
  citizens: {
    endpoint: "citizens",
    title: "Cetatean",
    fields: [
      { name: "firstName", label: "Prenume", type: "text", required: true },
      { name: "lastName", label: "Nume", type: "text", required: true },
      { name: "CNP", label: "CNP", type: "text", required: true },
      { name: "idCardNumber", label: "Numar CI", type: "text", required: true },
      { name: "address", label: "Adresa", type: "text", required: true },
      { name: "phone", label: "Telefon", type: "text", required: true },
    ],
  },
  properties: {
    endpoint: "properties",
    title: "Proprietate",
    fields: [
      { name: "citizenId", label: "ID Cetatean", type: "text", required: true },
      { name: "address", label: "Adresa", type: "text", required: true },
      { name: "propertyType", label: "Tip", type: "select", required: true, options: [
        { value: "house", label: "Casa" },
        { value: "land", label: "Teren" },
        { value: "car", label: "Masina" },
      ]},
      { name: "details", label: "Detalii", type: "textarea", required: false },
    ],
  },
  requests: {
    endpoint: "requests",
    title: "Cerere",
    fields: [
      { name: "citizenId", label: "ID Cetatean", type: "text", required: true },
      { name: "documentType", label: "Tip Document", type: "text", required: true },
      { name: "legalResponseDays", label: "Termen Legal (zile)", type: "number", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { value: "pending", label: "In asteptare" },
        { value: "approved", label: "Aprobat" },
        { value: "rejected", label: "Respins" },
      ]},
      { name: "adminComment", label: "Comentariu Admin", type: "textarea", required: false },
    ],
  },
  documents: {
    endpoint: "documents",
    title: "Document",
    fields: [
      { name: "title", label: "Titlu", type: "text", required: true },
      { name: "description", label: "Descriere", type: "textarea", required: false },
      { name: "category", label: "Categorie", type: "text", required: true },
      { name: "fileUrl", label: "URL Fisier", type: "text", required: true },
      { name: "uploadedBy", label: "Incarcat de", type: "text", required: true },
    ],
  },
};

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

  @state()
  private modalOpen = false;

  @state()
  private modalMode: "add" | "edit" = "add";

  @state()
  private editingItem: Record<string, unknown> | null = null;

  @state()
  private formData: Record<string, unknown> = {};

  @state()
  private formError: string | null = null;

  @state()
  private formLoading = false;

  private async fetchData(endpoint: string, forceRefresh = false) {
    if (this.data[endpoint] && !forceRefresh) return;
    
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

  private getCurrentEndpoint(): string | undefined {
    const activeTabConfig = TABS.find((tab) => tab.id === this.activeTab);
    return activeTabConfig?.endpoint;
  }

  private openAddModal() {
    const endpoint = this.getCurrentEndpoint();
    if (!endpoint) return;
    
    this.modalMode = "add";
    this.editingItem = null;
    this.formData = {};
    this.formError = null;
    this.modalOpen = true;
  }

  private openEditModal(item: Record<string, unknown>) {
    const endpoint = this.getCurrentEndpoint();
    if (!endpoint) return;
    
    this.modalMode = "edit";
    this.editingItem = item;
    this.formData = { ...item };
    this.formError = null;
    this.modalOpen = true;
  }

  private closeModal() {
    this.modalOpen = false;
    this.editingItem = null;
    this.formData = {};
    this.formError = null;
  }

  private handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value, type } = target;
    
    let processedValue: unknown = value;
    if (type === "number") {
      processedValue = value === "" ? "" : Number(value);
    }
    
    this.formData = { ...this.formData, [name]: processedValue };
  }

  private async handleFormSubmit(e: Event) {
    e.preventDefault();
    const endpoint = this.getCurrentEndpoint();
    if (!endpoint) return;

    this.formLoading = true;
    this.formError = null;

    try {
      const url = this.modalMode === "edit" 
        ? `${API_BASE}/${endpoint}/${this.editingItem?._id}`
        : `${API_BASE}/${endpoint}`;
      
      const method = this.modalMode === "edit" ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      await this.fetchData(endpoint, true);
      this.closeModal();
    } catch (err) {
      this.formError = err instanceof Error ? err.message : "Failed to save";
    } finally {
      this.formLoading = false;
    }
  }

  private async handleDelete(item: Record<string, unknown>) {
    const endpoint = this.getCurrentEndpoint();
    if (!endpoint) return;

    if (!confirm("Sigur doriti sa stergeti acest element?")) return;

    try {
      const response = await fetch(`${API_BASE}/${endpoint}/${item._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      await this.fetchData(endpoint, true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  private renderActionButtons(item: Record<string, unknown>) {
    return html`
      <div class="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <button
          @click=${() => this.openEditModal(item)}
          class="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
        >
          Editeaza
        </button>
        <button
          @click=${() => this.handleDelete(item)}
          class="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors cursor-pointer"
        >
          Sterge
        </button>
      </div>
    `;
  }

  private renderNewsItem(item: Record<string, unknown>) {
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-800">${item.title}</h3>
        <p class="text-sm text-slate-600 mt-1">${item.content}</p>
        <p class="text-xs text-slate-400 mt-2">By ${item.author}</p>
        ${this.renderActionButtons(item)}
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
        ${this.renderActionButtons(item)}
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
        ${this.renderActionButtons(item)}
      </div>
    `;
  }

  private renderCitizenItem(item: Record<string, unknown>) {
    return html`
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-800">${item.firstName} ${item.lastName}</h3>
        <p class="text-sm text-slate-600 mt-1">${item.address}</p>
        <p class="text-sm text-slate-500 mt-1">Tel: ${item.phone}</p>
        ${this.renderActionButtons(item)}
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
        ${this.renderActionButtons(item)}
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
        ${this.renderActionButtons(item)}
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
        ${this.renderActionButtons(item)}
      </div>
    `;
  }

  private getFieldValue(field: FormField): string {
    const value = this.formData[field.name];
    if (value === undefined || value === null) return "";
    
    if (field.type === "date" && value) {
      const date = new Date(value as string);
      return date.toISOString().split("T")[0];
    }
    if (field.type === "datetime-local" && value) {
      const date = new Date(value as string);
      return date.toISOString().slice(0, 16);
    }
    return String(value);
  }

  private renderFormField(field: FormField) {
    const value = this.getFieldValue(field);
    const baseClasses = "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    
    if (field.type === "textarea") {
      return html`
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">${field.label}</label>
          <textarea
            name=${field.name}
            .value=${value}
            @input=${this.handleInputChange}
            ?required=${field.required}
            rows="3"
            class=${baseClasses}
          ></textarea>
        </div>
      `;
    }
    
    if (field.type === "select") {
      return html`
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">${field.label}</label>
          <select
            name=${field.name}
            .value=${value}
            @change=${this.handleInputChange}
            ?required=${field.required}
            class=${baseClasses}
          >
            <option value="">-- Selecteaza --</option>
            ${field.options?.map(opt => html`
              <option value=${opt.value} ?selected=${value === opt.value}>${opt.label}</option>
            `)}
          </select>
        </div>
      `;
    }
    
    return html`
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">${field.label}</label>
        <input
          type=${field.type}
          name=${field.name}
          .value=${value}
          @input=${this.handleInputChange}
          ?required=${field.required}
          class=${baseClasses}
        />
      </div>
    `;
  }

  private renderModal() {
    if (!this.modalOpen) return html``;
    
    const endpoint = this.getCurrentEndpoint();
    if (!endpoint) return html``;
    
    const config = ENTITY_CONFIGS[endpoint];
    if (!config) return html``;
    
    const title = this.modalMode === "add" 
      ? `Adauga ${config.title}` 
      : `Editeaza ${config.title}`;

    return html`
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 class="text-lg font-semibold text-slate-800">${title}</h2>
            <button
              @click=${this.closeModal}
              class="text-slate-400 hover:text-slate-600 text-2xl leading-none cursor-pointer"
            >&times;</button>
          </div>
          
          <form @submit=${this.handleFormSubmit} class="p-4">
            ${config.fields.map(field => this.renderFormField(field))}
            
            ${this.formError ? html`
              <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ${this.formError}
              </div>
            ` : ""}
            
            <div class="flex gap-3 pt-2">
              <button
                type="submit"
                ?disabled=${this.formLoading}
                class="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                ${this.formLoading ? "Se salveaza..." : "Salveaza"}
              </button>
              <button
                type="button"
                @click=${this.closeModal}
                class="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Anuleaza
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderDataList(endpoint: string): TemplateResult {
    const items = (this.data[endpoint] || []) as Record<string, unknown>[];
    const config = ENTITY_CONFIGS[endpoint];
    
    const addButton = html`
      <div class="mb-6">
        <button
          @click=${this.openAddModal}
          class="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 cursor-pointer transition-colors flex items-center gap-2"
        >
          <span class="text-lg leading-none">+</span>
          Adauga ${config?.title || "element"}
        </button>
      </div>
    `;
    
    if (this.loading) {
      return html`
        ${addButton}
        <p class="text-center text-slate-500 py-8">Loading...</p>
      `;
    }
    
    if (this.error) {
      return html`
        ${addButton}
        <p class="text-center text-red-500 py-8">${this.error}</p>
      `;
    }
    
    if (items.length === 0) {
      return html`
        ${addButton}
        <p class="text-center text-slate-500 py-8">Nu exista date</p>
      `;
    }

    const renderers: Record<string, (item: Record<string, unknown>) => TemplateResult> = {
      news: (item) => this.renderNewsItem(item),
      taxes: (item) => this.renderTaxItem(item),
      appointments: (item) => this.renderAppointmentItem(item),
      citizens: (item) => this.renderCitizenItem(item),
      properties: (item) => this.renderPropertyItem(item),
      requests: (item) => this.renderRequestItem(item),
      documents: (item) => this.renderDocumentItem(item),
    };

    const renderer = renderers[endpoint] || ((item: Record<string, unknown>) => html`<pre>${JSON.stringify(item, null, 2)}</pre>`);

    return html`
      ${addButton}
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
      ${this.renderModal()}
    `;
  }
}

customElements.define("pmsb-home", PmsbHome);
