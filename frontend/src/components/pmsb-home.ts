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
      </li>
    `;
  }

  private renderTaxItem(tax: TaxItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4 flex justify-between items-center">
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
      </li>
    `;
  }

  private renderCitizenItem(citizen: CitizenItem): TemplateResult {
    return html`
      <li class="bg-white rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-800">${citizen.firstName} ${citizen.lastName}</h3>
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
      </li>
    `;
  }

  private renderDataTabContent(): TemplateResult {
    switch (this.activeTab as DataTabId) {
      case "stiri":
        return html`
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as NewsItem[], (item) => item._id, (item) => this.renderNewsItem(item))}
          </ul>
        `;
      case "taxe-impozite":
        return html`
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as TaxItem[], (item) => item._id, (item) => this.renderTaxItem(item))}
          </ul>
        `;
      case "proprietati":
        return html`
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as PropertyItem[], (item) => item._id, (item) => this.renderPropertyItem(item))}
          </ul>
        `;
      case "programari":
        return html`
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as AppointmentItem[], (item) => item._id, (item) => this.renderAppointmentItem(item))}
          </ul>
        `;
      case "cereri":
        return html`
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as RequestItem[], (item) => item._id, (item) => this.renderRequestItem(item))}
          </ul>
        `;
      case "formulare-tip":
        return html`
          <ul class="space-y-3 max-w-3xl">
            ${repeat(this.tabData as PublicDocumentItem[], (item) => item._id, (item) => this.renderPublicDocumentItem(item))}
          </ul>
        `;
      case "date-personale":
        return html`
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
      </div>
    `;
  }
}

customElements.define("pmsb-home", PmsbHome);
