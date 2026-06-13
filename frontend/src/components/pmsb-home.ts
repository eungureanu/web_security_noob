import { LitElement, html, unsafeCSS, type TemplateResult, nothing } from "lit";
import { state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import tailwindStyles from "../styles/tailwind.css?inline";
import { apiUrl, assetUrl } from "../config/api.config";
import {
  type ApiResponse,
  type ApiSingleResponse,
  type AppointmentItem,
  type AppointmentInput,
  type CitizenItem,
  type CitizenInput,
  type DataTabId,
  type NewsItem,
  type NewsInput,
  type PropertyItem,
  type PropertyInput,
  type PublicDocumentItem,
  type PublicDocumentInput,
  type RequestItem,
  type RequestInput,
  type TabDataMap,
  type TaxItem,
  type TaxInput,
  TAB_ENDPOINTS,
} from "../types/pmsb.types";

type FormMode = "create" | "edit" | null;
type AnyItem = NewsItem | TaxItem | PropertyItem | AppointmentItem | CitizenItem | RequestItem | PublicDocumentItem;

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
  private formMode: FormMode = null;

  @state()
  private editingItem: AnyItem | null = null;

  @state()
  private isSubmitting = false;

  @state()
  private citizens: CitizenItem[] = [];

  private async fetchTabData<K extends DataTabId>(tabId: K): Promise<void> {
    const endpoint = TAB_ENDPOINTS[tabId];

    this.isLoading = true;
    this.errorMessage = "";
    this.tabData = [];

    try {
      const response = await fetch(apiUrl(endpoint));

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
      const response = await fetch(apiUrl("citizens"));
      if (response.ok) {
        const result: ApiResponse<CitizenItem> = await response.json();
        this.citizens = result.data;
      }
    } catch {
      console.error("Failed to fetch citizens");
    }
  }

  private async createItem<T>(endpoint: string, data: T): Promise<boolean> {
    this.isSubmitting = true;
    try {
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        this.errorMessage = error.error || "Eroare la crearea resursei.";
        return false;
      }

      return true;
    } catch {
      this.errorMessage = "Eroare de conexiune. Verificați conexiunea la internet.";
      return false;
    } finally {
      this.isSubmitting = false;
    }
  }

  private async updateItem<T>(endpoint: string, id: string, data: T): Promise<boolean> {
    this.isSubmitting = true;
    try {
      const response = await fetch(apiUrl(endpoint, id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        this.errorMessage = error.error || "Eroare la actualizarea resursei.";
        return false;
      }

      return true;
    } catch {
      this.errorMessage = "Eroare de conexiune. Verificați conexiunea la internet.";
      return false;
    } finally {
      this.isSubmitting = false;
    }
  }

  private async deleteItem(endpoint: string, id: string): Promise<boolean> {
    if (!confirm("Sigur doriți să ștergeți această înregistrare?")) {
      return false;
    }

    this.isSubmitting = true;
    try {
      const response = await fetch(apiUrl(endpoint, id), {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        this.errorMessage = error.error || "Eroare la ștergerea resursei.";
        return false;
      }

      return true;
    } catch {
      this.errorMessage = "Eroare de conexiune. Verificați conexiunea la internet.";
      return false;
    } finally {
      this.isSubmitting = false;
    }
  }

  private openCreateForm(): void {
    this.formMode = "create";
    this.editingItem = null;
    this.errorMessage = "";
    if (this.activeTab !== "stiri" && this.activeTab !== "formulare-tip" && this.activeTab !== "date-personale") {
      void this.fetchCitizens();
    }
  }

  private openEditForm(item: AnyItem): void {
    this.formMode = "edit";
    this.editingItem = item;
    this.errorMessage = "";
    if (this.activeTab !== "stiri" && this.activeTab !== "formulare-tip" && this.activeTab !== "date-personale") {
      void this.fetchCitizens();
    }
  }

  private closeForm(): void {
    this.formMode = null;
    this.editingItem = null;
    this.errorMessage = "";
  }

  private async handleDelete(id: string): Promise<void> {
    if (!isDataTabId(this.activeTab)) return;
    
    const endpoint = TAB_ENDPOINTS[this.activeTab];
    const success = await this.deleteItem(endpoint, id);
    
    if (success) {
      void this.fetchTabData(this.activeTab);
    }
  }

  private async handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!isDataTabId(this.activeTab)) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const endpoint = TAB_ENDPOINTS[this.activeTab];

    let success = false;

    switch (this.activeTab) {
      case "stiri": {
        const data: NewsInput = {
          title: (formData.get("title") as string).trim(),
          content: (formData.get("content") as string).trim(),
          author: (formData.get("author") as string).trim(),
        };
        success = this.formMode === "create"
          ? await this.createItem(endpoint, data)
          : await this.updateItem(endpoint, (this.editingItem as NewsItem)._id, data);
        break;
      }
      case "taxe-impozite": {
        const data: TaxInput = {
          citizenId: formData.get("citizenId") as string,
          title: (formData.get("title") as string).trim(),
          amount: parseFloat(formData.get("amount") as string),
          dueDate: formData.get("dueDate") as string,
          status: (formData.get("status") as TaxInput["status"]) || "pending",
        };
        const propertyId = formData.get("propertyId") as string;
        if (propertyId) data.propertyId = propertyId;
        success = this.formMode === "create"
          ? await this.createItem(endpoint, data)
          : await this.updateItem(endpoint, (this.editingItem as TaxItem)._id, data);
        break;
      }
      case "proprietati": {
        const data: PropertyInput = {
          citizenId: formData.get("citizenId") as string,
          address: (formData.get("address") as string).trim(),
          propertyType: formData.get("propertyType") as PropertyInput["propertyType"],
        };
        const details = (formData.get("details") as string)?.trim();
        if (details) data.details = details;
        success = this.formMode === "create"
          ? await this.createItem(endpoint, data)
          : await this.updateItem(endpoint, (this.editingItem as PropertyItem)._id, data);
        break;
      }
      case "programari": {
        const data: AppointmentInput = {
          citizenId: formData.get("citizenId") as string,
          department: (formData.get("department") as string).trim(),
          date: formData.get("date") as string,
          purpose: (formData.get("purpose") as string).trim(),
          status: (formData.get("status") as AppointmentInput["status"]) || "scheduled",
        };
        success = this.formMode === "create"
          ? await this.createItem(endpoint, data)
          : await this.updateItem(endpoint, (this.editingItem as AppointmentItem)._id, data);
        break;
      }
      case "date-personale": {
        const data: CitizenInput = {
          firstName: (formData.get("firstName") as string).trim(),
          lastName: (formData.get("lastName") as string).trim(),
          CNP: (formData.get("CNP") as string).trim(),
          idCardNumber: (formData.get("idCardNumber") as string).trim(),
          address: (formData.get("address") as string).trim(),
          phone: (formData.get("phone") as string).trim(),
        };
        success = this.formMode === "create"
          ? await this.createItem(endpoint, data)
          : await this.updateItem(endpoint, (this.editingItem as CitizenItem)._id, data);
        break;
      }
      case "cereri": {
        const data: RequestInput = {
          citizenId: formData.get("citizenId") as string,
          documentType: (formData.get("documentType") as string).trim(),
          legalResponseDays: parseInt(formData.get("legalResponseDays") as string, 10),
          status: (formData.get("status") as RequestInput["status"]) || "pending",
        };
        const adminComment = (formData.get("adminComment") as string)?.trim();
        if (adminComment) data.adminComment = adminComment;
        success = this.formMode === "create"
          ? await this.createItem(endpoint, data)
          : await this.updateItem(endpoint, (this.editingItem as RequestItem)._id, data);
        break;
      }
      case "formulare-tip": {
        const data: PublicDocumentInput = {
          title: (formData.get("title") as string).trim(),
          category: (formData.get("category") as string).trim(),
          fileUrl: (formData.get("fileUrl") as string).trim(),
          uploadedBy: (formData.get("uploadedBy") as string).trim(),
        };
        const description = (formData.get("description") as string)?.trim();
        if (description) data.description = description;
        success = this.formMode === "create"
          ? await this.createItem(endpoint, data)
          : await this.updateItem(endpoint, (this.editingItem as PublicDocumentItem)._id, data);
        break;
      }
    }

    if (success) {
      this.closeForm();
      void this.fetchTabData(this.activeTab);
    }
  }

  private renderActionButtons(item: AnyItem): TemplateResult {
    return html`
      <div class="flex gap-2 mt-3">
        <button
          @click=${() => this.openEditForm(item)}
          class="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
        >
          Editează
        </button>
        <button
          @click=${() => this.handleDelete(item._id)}
          class="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
          ?disabled=${this.isSubmitting}
        >
          Șterge
        </button>
      </div>
    `;
  }

  private renderCitizenSelect(selectedId?: string): TemplateResult {
    return html`
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Cetățean *</span>
        <select
          name="citizenId"
          required
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selectați cetățeanul</option>
          ${repeat(
            this.citizens,
            (c) => c._id,
            (c) => html`
              <option value=${c._id} ?selected=${c._id === selectedId}>
                ${c.firstName} ${c.lastName}
              </option>
            `
          )}
        </select>
      </label>
    `;
  }

  private renderFormModal(): TemplateResult | typeof nothing {
    if (!this.formMode || !isDataTabId(this.activeTab)) return nothing;

    const title = this.formMode === "create" ? "Adaugă" : "Editează";
    
    return html`
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center p-4 border-b border-slate-200">
            <h3 class="text-lg font-semibold text-slate-800">${title}</h3>
            <button
              @click=${() => this.closeForm()}
              class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          
          <form @submit=${this.handleFormSubmit} class="p-4 space-y-4">
            ${this.errorMessage
              ? html`<p class="text-red-500 text-sm">${this.errorMessage}</p>`
              : nothing}
            
            ${this.renderFormFields()}
            
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                @click=${() => this.closeForm()}
                class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                ?disabled=${this.isSubmitting}
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                ${this.isSubmitting ? "Se salvează..." : "Salvează"}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderFormFields(): TemplateResult {
    switch (this.activeTab as DataTabId) {
      case "stiri": {
        const item = this.editingItem as NewsItem | null;
        return html`
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Titlu *</span>
            <input
              type="text"
              name="title"
              required
              maxlength="200"
              .value=${item?.title ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Conținut *</span>
            <textarea
              name="content"
              required
              maxlength="5000"
              rows="4"
              .value=${item?.content ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Autor *</span>
            <input
              type="text"
              name="author"
              required
              maxlength="100"
              .value=${item?.author ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
        `;
      }
      case "taxe-impozite": {
        const item = this.editingItem as TaxItem | null;
        return html`
          ${this.renderCitizenSelect(item?.citizenId)}
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Titlu *</span>
            <input
              type="text"
              name="title"
              required
              maxlength="200"
              .value=${item?.title ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Sumă (RON) *</span>
            <input
              type="number"
              name="amount"
              required
              min="0"
              step="0.01"
              .value=${item?.amount?.toString() ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Data scadenței *</span>
            <input
              type="date"
              name="dueDate"
              required
              .value=${item?.dueDate ? item.dueDate.split("T")[0] : ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending" ?selected=${item?.status === "pending" || !item}>În așteptare</option>
              <option value="paid" ?selected=${item?.status === "paid"}>Plătit</option>
            </select>
          </label>
        `;
      }
      case "proprietati": {
        const item = this.editingItem as PropertyItem | null;
        return html`
          ${this.renderCitizenSelect(item?.citizenId)}
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Adresă *</span>
            <input
              type="text"
              name="address"
              required
              maxlength="500"
              .value=${item?.address ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Tip proprietate *</span>
            <select
              name="propertyType"
              required
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="house" ?selected=${item?.propertyType === "house"}>Casă</option>
              <option value="land" ?selected=${item?.propertyType === "land"}>Teren</option>
              <option value="car" ?selected=${item?.propertyType === "car"}>Autovehicul</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Detalii</span>
            <textarea
              name="details"
              maxlength="1000"
              rows="3"
              .value=${item?.details ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </label>
        `;
      }
      case "programari": {
        const item = this.editingItem as AppointmentItem | null;
        return html`
          ${this.renderCitizenSelect(item?.citizenId)}
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Departament *</span>
            <input
              type="text"
              name="department"
              required
              maxlength="200"
              .value=${item?.department ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Data și ora *</span>
            <input
              type="datetime-local"
              name="date"
              required
              .value=${item?.date ? item.date.slice(0, 16) : ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Scop *</span>
            <textarea
              name="purpose"
              required
              maxlength="500"
              rows="3"
              .value=${item?.purpose ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="scheduled" ?selected=${item?.status === "scheduled" || !item}>Programat</option>
              <option value="completed" ?selected=${item?.status === "completed"}>Finalizat</option>
              <option value="cancelled" ?selected=${item?.status === "cancelled"}>Anulat</option>
            </select>
          </label>
        `;
      }
      case "date-personale": {
        const item = this.editingItem as (CitizenItem & Partial<CitizenInput>) | null;
        return html`
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Prenume *</span>
            <input
              type="text"
              name="firstName"
              required
              maxlength="100"
              .value=${item?.firstName ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Nume de familie *</span>
            <input
              type="text"
              name="lastName"
              required
              maxlength="100"
              .value=${item?.lastName ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">CNP *</span>
            <input
              type="text"
              name="CNP"
              required
              maxlength="13"
              minlength="13"
              pattern="[0-9]{13}"
              title="CNP-ul trebuie să conțină exact 13 cifre"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Număr carte de identitate *</span>
            <input
              type="text"
              name="idCardNumber"
              required
              maxlength="20"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Adresă *</span>
            <input
              type="text"
              name="address"
              required
              maxlength="500"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Telefon *</span>
            <input
              type="tel"
              name="phone"
              required
              maxlength="20"
              pattern="[0-9+\\-\\s\\(\\)]+"
              title="Numărul de telefon poate conține doar cifre, spații, +, -, (, )"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
        `;
      }
      case "cereri": {
        const item = this.editingItem as RequestItem | null;
        return html`
          ${this.renderCitizenSelect(item?.citizenId)}
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Tip document *</span>
            <input
              type="text"
              name="documentType"
              required
              maxlength="200"
              .value=${item?.documentType ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Zile legale răspuns *</span>
            <input
              type="number"
              name="legalResponseDays"
              required
              min="1"
              max="365"
              .value=${item?.legalResponseDays?.toString() ?? "30"}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending" ?selected=${item?.status === "pending" || !item}>În procesare</option>
              <option value="approved" ?selected=${item?.status === "approved"}>Aprobat</option>
              <option value="rejected" ?selected=${item?.status === "rejected"}>Respins</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Comentariu administrator</span>
            <textarea
              name="adminComment"
              maxlength="1000"
              rows="3"
              .value=${item?.adminComment ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </label>
        `;
      }
      case "formulare-tip": {
        const item = this.editingItem as PublicDocumentItem | null;
        return html`
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Titlu *</span>
            <input
              type="text"
              name="title"
              required
              maxlength="200"
              .value=${item?.title ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Descriere</span>
            <textarea
              name="description"
              maxlength="1000"
              rows="3"
              .value=${item?.description ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Categorie *</span>
            <input
              type="text"
              name="category"
              required
              maxlength="100"
              pattern="[a-zA-Z0-9\\s\\-]+"
              title="Categoria poate conține doar litere, cifre, spații și cratime"
              .value=${item?.category ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">URL fișier *</span>
            <input
              type="text"
              name="fileUrl"
              required
              maxlength="500"
              .value=${item?.fileUrl ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Încărcat de *</span>
            <input
              type="text"
              name="uploadedBy"
              required
              maxlength="100"
              .value=${item?.uploadedBy ?? ""}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
        `;
      }
      default:
        return html``;
    }
  }

  private renderAddButton(): TemplateResult {
    return html`
      <button
        @click=${() => this.openCreateForm()}
        class="mb-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <span class="text-lg leading-none">+</span>
        Adaugă
      </button>
    `;
  }

  private handleTabClick(tabId: string): void {
    this.activeTab = tabId;
    const clickedTab = TABS.find((t) => t.id === tabId);
    if (clickedTab && !clickedTab.isStatic && isDataTabId(tabId)) {
      void this.fetchTabData(tabId);
    }
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

  private renderDataTabContent(): TemplateResult {
    switch (this.activeTab as DataTabId) {
      case "stiri":
        return html`
          <div class="max-w-3xl">
            ${this.renderAddButton()}
            <ul class="space-y-3">
              ${repeat(this.tabData as NewsItem[], (item) => item._id, (item) => this.renderNewsItem(item))}
            </ul>
          </div>
        `;
      case "taxe-impozite":
        return html`
          <div class="max-w-3xl">
            ${this.renderAddButton()}
            <ul class="space-y-3">
              ${repeat(this.tabData as TaxItem[], (item) => item._id, (item) => this.renderTaxItem(item))}
            </ul>
          </div>
        `;
      case "proprietati":
        return html`
          <div class="max-w-3xl">
            ${this.renderAddButton()}
            <ul class="space-y-3">
              ${repeat(this.tabData as PropertyItem[], (item) => item._id, (item) => this.renderPropertyItem(item))}
            </ul>
          </div>
        `;
      case "programari":
        return html`
          <div class="max-w-3xl">
            ${this.renderAddButton()}
            <ul class="space-y-3">
              ${repeat(this.tabData as AppointmentItem[], (item) => item._id, (item) => this.renderAppointmentItem(item))}
            </ul>
          </div>
        `;
      case "cereri":
        return html`
          <div class="max-w-3xl">
            ${this.renderAddButton()}
            <ul class="space-y-3">
              ${repeat(this.tabData as RequestItem[], (item) => item._id, (item) => this.renderRequestItem(item))}
            </ul>
          </div>
        `;
      case "formulare-tip":
        return html`
          <div class="max-w-3xl">
            ${this.renderAddButton()}
            <ul class="space-y-3">
              ${repeat(this.tabData as PublicDocumentItem[], (item) => item._id, (item) => this.renderPublicDocumentItem(item))}
            </ul>
          </div>
        `;
      case "date-personale":
        return html`
          <div class="max-w-3xl">
            ${this.renderAddButton()}
            <ul class="space-y-3">
              ${repeat(this.tabData as CitizenItem[], (item) => item._id, (item) => this.renderCitizenItem(item))}
            </ul>
          </div>
        `;
    }
  }

  private renderTabContent(): TemplateResult {
    const tab = TABS.find((t) => t.id === this.activeTab);

    if (!tab) return HOME_CONTENT;

    if (tab.id === "home") return HOME_CONTENT;

    // if (tab.id === "date-personale") {
    //   return html`<p class="py-16 text-center text-xl text-slate-500">Această funcționalitate necesită autentificare.</p>`;
    // }

    if (this.isLoading) {
      return html`<p class="py-16 text-center text-xl text-slate-500">Se încarcă...</p>`;
    }

    if (this.errorMessage) {
      return html`<p class="py-16 text-center text-xl text-red-500">${this.errorMessage}</p>`;
    }

    if (this.tabData.length === 0) {
      return html`<p class="py-16 text-center text-xl text-slate-500">Nu există date disponibile.</p>`;
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
        
        ${this.renderFormModal()}
      </div>
    `;
  }
}

customElements.define("pmsb-home", PmsbHome);
