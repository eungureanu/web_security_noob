import { LitElement, html, unsafeCSS, type TemplateResult, nothing } from "lit";
import { state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import tailwindStyles from "../styles/tailwind.css?inline";
import { API_BASE_URL, assetUrl } from "../config/api.config";
import {
  type ApiResponse,
  type AppointmentItem,
  type CitizenItem,
  type DataTabId,
  type NewsItem,
  type PropertyItem,
  type PublicDocumentItem,
  type RequestItem,
  type TabDataMap,
  type TaxItem,
  TAB_ENDPOINTS,
} from "../types/pmsb.types";

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

const TABS: { id: string; label: string; isStatic?: boolean }[] = [
  { id: "home", label: "Home", isStatic: true },
  { id: "stiri", label: "Stiri" },
  { id: "formulare-tip", label: "Formulare Tip" },
  { id: "programari", label: "Programari" },
  { id: "date-personale", label: "Date personale" },
  { id: "proprietati", label: "Proprietati" },
  { id: "cereri", label: "Cereri" },
  { id: "taxe-impozite", label: "Taxe si Impozite" },
];

const PROPERTY_TYPE_LABELS: Record<PropertyItem["propertyType"], string> = {
  house: "Casă",
  land: "Teren",
  car: "Autovehicul",
};

const APPOINTMENT_STATUS_LABELS: Record<AppointmentItem["status"], string> = {
  scheduled: "Programat",
  completed: "Finalizat",
  cancelled: "Anulat",
};

const APPOINTMENT_STATUS_COLORS: Record<AppointmentItem["status"], string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const REQUEST_STATUS_LABELS: Record<RequestItem["status"], string> = {
  pending: "În procesare",
  approved: "Aprobat",
  rejected: "Respins",
};

const REQUEST_STATUS_COLORS: Record<RequestItem["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function isDataTabId(tabId: string): tabId is DataTabId {
  return tabId in TAB_ENDPOINTS;
}

interface FormData {
  [key: string]: string | number;
}

export class PmsbHome extends LitElement {
  static styles = unsafeCSS(tailwindStyles);

  @state()
  private activeTab = TABS[0].id;

  @state()
  private tabData: TabDataMap[DataTabId][] = [];

  @state()
  private isLoading = false;

  @state()
  private errorMessage = "";

  @state()
  private showModal = false;

  @state()
  private modalMode: "add" | "edit" = "add";

  @state()
  private editingItem: TabDataMap[DataTabId] | null = null;

  @state()
  private formData: FormData = {};

  @state()
  private citizensList: CitizenItem[] = [];

  private async fetchTabData<K extends DataTabId>(tabId: K): Promise<void> {
    const endpoint = TAB_ENDPOINTS[tabId];

    this.isLoading = true;
    this.errorMessage = "";
    this.tabData = [];

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`);

      if (!response.ok) {
        this.errorMessage = "Nu s-au putut încărca datele. Vă rugăm încercați din nou.";
        return;
      }

      const result: ApiResponse<TabDataMap[K]> = await response.json();
      this.tabData = result.data;
    } catch {
      this.errorMessage = "Eroare de conexiune. Verificați conexiunea la internet.";
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchCitizens(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/citizens`);
      if (response.ok) {
        const result: ApiResponse<CitizenItem> = await response.json();
        this.citizensList = result.data;
      }
    } catch {
      console.error("Failed to fetch citizens");
    }
  }

  private handleTabClick(tabId: string): void {
    this.activeTab = tabId;
    const clickedTab = TABS.find((t) => t.id === tabId);
    if (clickedTab && !clickedTab.isStatic && isDataTabId(tabId)) {
      void this.fetchTabData(tabId);
    }
  }

  private openAddModal(): void {
    this.modalMode = "add";
    this.editingItem = null;
    this.formData = this.getDefaultFormData();
    this.showModal = true;
    if (this.needsCitizenSelect()) {
      void this.fetchCitizens();
    }
  }

  private openEditModal(item: TabDataMap[DataTabId]): void {
    this.modalMode = "edit";
    this.editingItem = item;
    this.formData = this.itemToFormData(item);
    this.showModal = true;
    if (this.needsCitizenSelect()) {
      void this.fetchCitizens();
    }
  }

  private closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.formData = {};
  }

  private needsCitizenSelect(): boolean {
    return ["programari", "proprietati", "cereri", "taxe-impozite"].includes(this.activeTab);
  }

  private getDefaultFormData(): FormData {
    switch (this.activeTab as DataTabId) {
      case "stiri":
        return { title: "", content: "", author: "" };
      case "formulare-tip":
        return { title: "", description: "", category: "", fileUrl: "", uploadedBy: "" };
      case "programari":
        return { citizenId: "", department: "", date: "", purpose: "", status: "scheduled" };
      case "date-personale":
        return { firstName: "", lastName: "", CNP: "", idCardNumber: "", address: "", phone: "" };
      case "proprietati":
        return { citizenId: "", address: "", propertyType: "house", details: "" };
      case "cereri":
        return { citizenId: "", documentType: "", status: "pending", adminComment: "", legalResponseDays: 30 };
      case "taxe-impozite":
        return { citizenId: "", title: "", amount: 0, dueDate: "", status: "pending" };
      default:
        return {};
    }
  }

  private itemToFormData(item: TabDataMap[DataTabId]): FormData {
    const data: FormData = {};
    for (const [key, value] of Object.entries(item)) {
      if (key !== "_id" && key !== "createdAt" && key !== "updatedAt") {
        if (key === "date" || key === "dueDate") {
          data[key] = value ? new Date(value as string).toISOString().slice(0, 16) : "";
        } else {
          data[key] = value as string | number;
        }
      }
    }
    return data;
  }

  private handleInputChange(e: Event): void {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    this.formData = {
      ...this.formData,
      [name]: type === "number" ? Number(value) : value,
    };
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    if (!isDataTabId(this.activeTab)) return;
    
    const endpoint = TAB_ENDPOINTS[this.activeTab];
    const url = this.modalMode === "edit" && this.editingItem
      ? `${API_BASE_URL}/${endpoint}/${this.editingItem._id}`
      : `${API_BASE_URL}/${endpoint}`;
    
    const method = this.modalMode === "edit" ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.formData),
      });

      if (!response.ok) {
        const error = await response.json();
        this.errorMessage = error.error || "A apărut o eroare.";
        return;
      }

      this.closeModal();
      void this.fetchTabData(this.activeTab);
    } catch {
      this.errorMessage = "Eroare de conexiune.";
    }
  }

  private async handleDelete(item: TabDataMap[DataTabId]): Promise<void> {
    if (!confirm("Sigur doriți să ștergeți acest element?")) return;
    
    if (!isDataTabId(this.activeTab)) return;
    
    const endpoint = TAB_ENDPOINTS[this.activeTab];

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${item._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        this.errorMessage = "Nu s-a putut șterge elementul.";
        return;
      }

      void this.fetchTabData(this.activeTab);
    } catch {
      this.errorMessage = "Eroare de conexiune.";
    }
  }

  private renderFormField(name: string, label: string, type: string = "text", options?: { value: string; label: string }[]): TemplateResult {
    if (options) {
      return html`
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">${label}</label>
          <select
            name=${name}
            .value=${String(this.formData[name] ?? "")}
            @change=${this.handleInputChange}
            class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selectați...</option>
            ${options.map((opt) => html`<option value=${opt.value}>${opt.label}</option>`)}
          </select>
        </div>
      `;
    }

    if (type === "textarea") {
      return html`
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">${label}</label>
          <textarea
            name=${name}
            .value=${String(this.formData[name] ?? "")}
            @input=${this.handleInputChange}
            class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            required
          ></textarea>
        </div>
      `;
    }

    return html`
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">${label}</label>
        <input
          type=${type}
          name=${name}
          .value=${String(this.formData[name] ?? "")}
          @input=${this.handleInputChange}
          class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ?required=${name !== "details" && name !== "description" && name !== "adminComment" && name !== "propertyId"}
        />
      </div>
    `;
  }

  private renderCitizenSelect(): TemplateResult {
    const options = this.citizensList.map((c) => ({
      value: c._id,
      label: `${c.firstName} ${c.lastName}`,
    }));
    return this.renderFormField("citizenId", "Cetățean", "select", options);
  }

  private renderModalForm(): TemplateResult {
    switch (this.activeTab as DataTabId) {
      case "stiri":
        return html`
          ${this.renderFormField("title", "Titlu")}
          ${this.renderFormField("content", "Conținut", "textarea")}
          ${this.renderFormField("author", "Autor")}
        `;
      case "formulare-tip":
        return html`
          ${this.renderFormField("title", "Titlu")}
          ${this.renderFormField("description", "Descriere", "textarea")}
          ${this.renderFormField("category", "Categorie")}
          ${this.renderFormField("fileUrl", "URL Fișier")}
          ${this.renderFormField("uploadedBy", "Încărcat de")}
        `;
      case "programari":
        return html`
          ${this.renderCitizenSelect()}
          ${this.renderFormField("department", "Departament")}
          ${this.renderFormField("date", "Data și ora", "datetime-local")}
          ${this.renderFormField("purpose", "Scopul programării")}
          ${this.renderFormField("status", "Status", "select", [
            { value: "scheduled", label: "Programat" },
            { value: "completed", label: "Finalizat" },
            { value: "cancelled", label: "Anulat" },
          ])}
        `;
      case "date-personale":
        return html`
          ${this.renderFormField("firstName", "Prenume")}
          ${this.renderFormField("lastName", "Nume")}
          ${this.renderFormField("CNP", "CNP")}
          ${this.renderFormField("idCardNumber", "Număr CI")}
          ${this.renderFormField("address", "Adresă")}
          ${this.renderFormField("phone", "Telefon")}
        `;
      case "proprietati":
        return html`
          ${this.renderCitizenSelect()}
          ${this.renderFormField("address", "Adresă")}
          ${this.renderFormField("propertyType", "Tip proprietate", "select", [
            { value: "house", label: "Casă" },
            { value: "land", label: "Teren" },
            { value: "car", label: "Autovehicul" },
          ])}
          ${this.renderFormField("details", "Detalii", "textarea")}
        `;
      case "cereri":
        return html`
          ${this.renderCitizenSelect()}
          ${this.renderFormField("documentType", "Tip document")}
          ${this.renderFormField("legalResponseDays", "Zile răspuns legal", "number")}
          ${this.renderFormField("status", "Status", "select", [
            { value: "pending", label: "În procesare" },
            { value: "approved", label: "Aprobat" },
            { value: "rejected", label: "Respins" },
          ])}
          ${this.renderFormField("adminComment", "Comentariu admin", "textarea")}
        `;
      case "taxe-impozite":
        return html`
          ${this.renderCitizenSelect()}
          ${this.renderFormField("title", "Titlu")}
          ${this.renderFormField("amount", "Sumă (RON)", "number")}
          ${this.renderFormField("dueDate", "Data scadentă", "datetime-local")}
          ${this.renderFormField("status", "Status", "select", [
            { value: "pending", label: "În așteptare" },
            { value: "paid", label: "Plătit" },
          ])}
        `;
      default:
        return html``;
    }
  }

  private renderModal(): TemplateResult {
    if (!this.showModal) return html``;

    const title = this.modalMode === "add" ? "Adaugă element nou" : "Editează element";

    return html`
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click=${this.closeModal}>
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" @click=${(e: Event) => e.stopPropagation()}>
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-slate-800">${title}</h2>
              <button @click=${this.closeModal} class="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <form @submit=${this.handleSubmit}>
              ${this.renderModalForm()}
              <div class="flex gap-3 mt-6">
                <button
                  type="button"
                  @click=${this.closeModal}
                  class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  ${this.modalMode === "add" ? "Adaugă" : "Salvează"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  private renderActionButtons(item: TabDataMap[DataTabId]): TemplateResult {
    return html`
      <div class="flex gap-2 mt-3">
        <button
          @click=${() => this.openEditModal(item)}
          class="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200 cursor-pointer"
        >
          Editează
        </button>
        <button
          @click=${() => this.handleDelete(item)}
          class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 cursor-pointer"
        >
          Șterge
        </button>
      </div>
    `;
  }

  private renderNewsItem(news: NewsItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-800">${news.title}</h3>
        <p class="text-slate-600 mt-1 text-sm">${news.content}</p>
        <p class="text-slate-400 text-xs mt-2">De: ${news.author} | ${new Date(news.createdAt).toLocaleDateString("ro-RO")}</p>
        ${this.renderActionButtons(news)}
      </li>
    `;
  }

  private renderTaxItem(tax: TaxItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-slate-800">${tax.title}</h3>
            <p class="text-slate-500 text-sm">Scadent: ${new Date(tax.dueDate).toLocaleDateString("ro-RO")}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-lg">${tax.amount} RON</p>
            <span class="text-xs px-2 py-1 rounded ${tax.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}">
              ${tax.status === "paid" ? "Plătit" : "În așteptare"}
            </span>
          </div>
        </div>
        ${this.renderActionButtons(tax)}
      </li>
    `;
  }

  private renderPropertyItem(property: PropertyItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-slate-800">${property.address}</h3>
            ${property.details ? html`<p class="text-slate-600 text-sm mt-1">${property.details}</p>` : nothing}
          </div>
          <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">${PROPERTY_TYPE_LABELS[property.propertyType]}</span>
        </div>
        ${this.renderActionButtons(property)}
      </li>
    `;
  }

  private renderAppointmentItem(appointment: AppointmentItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-slate-800">${appointment.department}</h3>
            <p class="text-slate-600 text-sm mt-1">${appointment.purpose}</p>
            <p class="text-slate-400 text-xs mt-2">${new Date(appointment.date).toLocaleDateString("ro-RO", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded ${APPOINTMENT_STATUS_COLORS[appointment.status]}">${APPOINTMENT_STATUS_LABELS[appointment.status]}</span>
        </div>
        ${this.renderActionButtons(appointment)}
      </li>
    `;
  }

  private renderCitizenItem(citizen: CitizenItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-800">${citizen.firstName} ${citizen.lastName}</h3>
        ${this.renderActionButtons(citizen)}
      </li>
    `;
  }

  private renderRequestItem(request: RequestItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-slate-800">${request.documentType}</h3>
            ${request.adminComment ? html`<p class="text-slate-600 text-sm mt-1">${request.adminComment}</p>` : nothing}
            <p class="text-slate-400 text-xs mt-2">Depus: ${new Date(request.createdAt).toLocaleDateString("ro-RO")} | Răspuns în: ${request.legalResponseDays} zile</p>
          </div>
          <span class="text-xs px-2 py-1 rounded ${REQUEST_STATUS_COLORS[request.status]}">${REQUEST_STATUS_LABELS[request.status]}</span>
        </div>
        ${this.renderActionButtons(request)}
      </li>
    `;
  }

  private renderPublicDocumentItem(document: PublicDocumentItem): TemplateResult {
    const downloadUrl = assetUrl(document.fileUrl);
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="font-semibold text-slate-800">${document.title}</h3>
            ${document.description ? html`<p class="text-slate-600 text-sm mt-1">${document.description}</p>` : nothing}
          </div>
          <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded shrink-0">${document.category}</span>
        </div>
        <a
          href="${downloadUrl}"
          download
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-block px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Descarcă
        </a>
        ${this.renderActionButtons(document)}
      </li>
    `;
  }

  private renderAddButton(): TemplateResult {
    return html`
      <button
        @click=${this.openAddModal}
        class="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 cursor-pointer"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Adaugă nou
      </button>
    `;
  }

  private renderDataTabContent(): TemplateResult {
    switch (this.activeTab as DataTabId) {
      case "stiri":
        return html`
          ${this.renderAddButton()}
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as NewsItem[], (item) => item._id, (item) => this.renderNewsItem(item))}
          </ul>
        `;
      case "taxe-impozite":
        return html`
          ${this.renderAddButton()}
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as TaxItem[], (item) => item._id, (item) => this.renderTaxItem(item))}
          </ul>
        `;
      case "proprietati":
        return html`
          ${this.renderAddButton()}
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as PropertyItem[], (item) => item._id, (item) => this.renderPropertyItem(item))}
          </ul>
        `;
      case "programari":
        return html`
          ${this.renderAddButton()}
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as AppointmentItem[], (item) => item._id, (item) => this.renderAppointmentItem(item))}
          </ul>
        `;
      case "cereri":
        return html`
          ${this.renderAddButton()}
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as RequestItem[], (item) => item._id, (item) => this.renderRequestItem(item))}
          </ul>
        `;
      case "formulare-tip":
        return html`
          ${this.renderAddButton()}
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as PublicDocumentItem[], (item) => item._id, (item) => this.renderPublicDocumentItem(item))}
          </ul>
        `;
      case "date-personale":
        return html`
          ${this.renderAddButton()}
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as CitizenItem[], (item) => item._id, (item) => this.renderCitizenItem(item))}
          </ul>
        `;
    }
  }

  private renderTabContent(): TemplateResult {
    const tab = TABS.find((t) => t.id === this.activeTab);

    if (!tab) return HOME_CONTENT;

    if (tab.id === "home") return HOME_CONTENT;

    if (this.isLoading) {
      return html`<p class="py-16 text-center text-xl text-slate-500">Se încarcă...</p>`;
    }

    if (this.errorMessage) {
      return html`<p class="py-16 text-center text-xl text-red-500">${this.errorMessage}</p>`;
    }

    if (this.tabData.length === 0) {
      return html`
        ${this.renderAddButton()}
        <p class="py-16 text-center text-xl text-slate-500">Nu există date disponibile.</p>
      `;
    }

    return this.renderDataTabContent();
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
                      @click=${() => this.handleTabClick(tab.id)}
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
