import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://vqjvxbayeiyapmrbvwcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxanZ4YmF5ZWl5YXBtcmJ2d2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTY1NjEsImV4cCI6MjA4MTA5MjU2MX0.kApMbdFMqwE7BK4T29hraxXws0bEF5lJspA_Z8zlSLI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Country configurations with tax and legal requirements
const countryConfigs = {
  FR: { name: 'France', currency: '€', taxName: 'TVA', defaultTax: 20, taxOptions: [0, 5.5, 10, 20], 
        requirements: ['SIRET', 'Numéro TVA'], dateFormat: 'DD/MM/YYYY', isEU: true,
        legalMentions: ['Pénalités de retard : 3x le taux d\'intérêt légal', 'Indemnité forfaitaire de recouvrement : 40,00 €'],
        reverseChargeMention: 'Autoliquidation - TVA due par le preneur - art. 283-2 du CGI',
        exportMention: 'Exonération de TVA - art. 262 ter I du CGI' },
  BR: { name: 'Brésil', currency: 'R$', taxName: 'ICMS', defaultTax: 18, taxOptions: [0, 7, 12, 18, 25],
        requirements: ['CNPJ', 'Inscrição Estadual'], dateFormat: 'DD/MM/YYYY', isEU: false,
        legalMentions: [], reverseChargeMention: '', exportMention: 'Exportação de serviços - não incidência' },
  US: { name: 'États-Unis', currency: '$', taxName: 'Sales Tax', defaultTax: 0, taxOptions: [0, 5, 6, 7, 8, 10],
        requirements: ['EIN', 'State Tax ID'], dateFormat: 'MM/DD/YYYY', isEU: false,
        legalMentions: [], reverseChargeMention: '', exportMention: 'Export - Tax exempt' },
  DE: { name: 'Allemagne', currency: '€', taxName: 'MwSt', defaultTax: 19, taxOptions: [0, 7, 19],
        requirements: ['USt-IdNr', 'Handelsregisternummer'], dateFormat: 'DD.MM.YYYY', isEU: true,
        legalMentions: [],
        reverseChargeMention: 'Steuerschuldnerschaft des Leistungsempfängers - §13b UStG',
        exportMention: 'Steuerfreie Ausfuhrlieferung - §4 Nr. 1a UStG' },
  GB: { name: 'Royaume-Uni', currency: '£', taxName: 'VAT', defaultTax: 20, taxOptions: [0, 5, 20],
        requirements: ['VAT Number', 'Company Number'], dateFormat: 'DD/MM/YYYY', isEU: false,
        legalMentions: [],
        reverseChargeMention: 'Reverse charge - customer to account for VAT',
        exportMention: 'Export of services - Outside scope of VAT' },
  PT: { name: 'Portugal', currency: '€', taxName: 'IVA', defaultTax: 23, taxOptions: [0, 6, 13, 23],
        requirements: ['NIF'], dateFormat: 'DD/MM/YYYY', isEU: true,
        legalMentions: [],
        reverseChargeMention: 'Autoliquidação - IVA devido pelo adquirente - art. 2º CIVA',
        exportMention: 'Isenção de IVA - art. 14º CIVA' },
  ES: { name: 'Espagne', currency: '€', taxName: 'IVA', defaultTax: 21, taxOptions: [0, 4, 10, 21],
        requirements: ['NIF/CIF'], dateFormat: 'DD/MM/YYYY', isEU: true,
        legalMentions: [],
        reverseChargeMention: 'Inversión del sujeto pasivo - art. 84 LIVA',
        exportMention: 'Exención de IVA por exportación - art. 21 LIVA' },
  IT: { name: 'Italie', currency: '€', taxName: 'IVA', defaultTax: 22, taxOptions: [0, 4, 10, 22],
        requirements: ['Partita IVA', 'Codice Fiscale'], dateFormat: 'DD/MM/YYYY', isEU: true,
        legalMentions: [],
        reverseChargeMention: 'Inversione contabile - art. 17 DPR 633/72',
        exportMention: 'Operazione non imponibile - art. 8 DPR 633/72' },
  BE: { name: 'Belgique', currency: '€', taxName: 'TVA', defaultTax: 21, taxOptions: [0, 6, 12, 21],
        requirements: ['Numéro TVA', 'Numéro d\'entreprise'], dateFormat: 'DD/MM/YYYY', isEU: true,
        legalMentions: [],
        reverseChargeMention: 'Autoliquidation - art. 51 §2 CTVA',
        exportMention: 'Exonération de TVA - art. 39 CTVA' },
  NL: { name: 'Pays-Bas', currency: '€', taxName: 'BTW', defaultTax: 21, taxOptions: [0, 9, 21],
        requirements: ['BTW-nummer', 'KVK-nummer'], dateFormat: 'DD-MM-YYYY', isEU: true,
        legalMentions: [],
        reverseChargeMention: 'BTW verlegd - art. 12 lid 2 Wet OB',
        exportMention: 'Vrijgesteld van BTW - art. 9 lid 2 Wet OB' },
};

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatCurrency = (amount, currency = '€') => {
  const formatted = new Intl.NumberFormat('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount || 0);
  return currency === '€' ? `${formatted} €` : `${currency} ${formatted}`;
};

const formatDate = (dateStr, format = 'DD/MM/YYYY') => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'DD.MM.YYYY': return `${day}.${month}.${year}`;
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
    default: return `${day}/${month}/${year}`;
  }
};

const getTransactionType = (sellerCountry, buyerCountry, hasBuyerVAT) => {
  const sellerConfig = countryConfigs[sellerCountry];
  const buyerConfig = countryConfigs[buyerCountry];
  
  if (sellerCountry === buyerCountry) {
    return { type: 'domestic', applyTax: true, mention: null };
  }
  
  if (sellerConfig?.isEU && buyerConfig?.isEU) {
    if (hasBuyerVAT) {
      return { 
        type: 'intraEU_B2B', 
        applyTax: false, 
        mention: sellerConfig.reverseChargeMention 
      };
    }
    return { type: 'intraEU_B2C', applyTax: true, mention: null };
  }
  
  if (sellerConfig?.isEU && !buyerConfig?.isEU) {
    return { 
      type: 'export', 
      applyTax: false, 
      mention: sellerConfig.exportMention 
    };
  }
  
  if (!sellerConfig?.isEU && buyerConfig?.isEU) {
    return { type: 'import', applyTax: false, mention: 'Import de services' };
  }
  
  return { type: 'international', applyTax: false, mention: 'Transaction internationale' };
};

const validateInvoice = (invoice, client, company) => {
  const warnings = [];
  const errors = [];
  const sellerConfig = countryConfigs[company?.country];
  const transactionType = getTransactionType(company?.country, client?.country, !!client?.vat_number);
  
  if (sellerConfig?.isEU && !company?.company_tax_id) {
    errors.push(`Numéro de ${sellerConfig.taxName} de l'émetteur requis`);
  }
  if (company?.company_country === 'FR' && !company?.company_siret) {
    errors.push('Numéro SIRET requis pour les entreprises françaises');
  }
  
  if (transactionType.type === 'intraEU_B2B' && !client?.vat_number) {
    errors.push('Numéro de TVA intracommunautaire du client obligatoire');
  }
  
  if (client?.country === 'FR' && !client?.siret) {
    warnings.push('SIREN/SIRET du client recommandé pour les clients français');
  }
  
  if (transactionType.applyTax === false && invoice?.items) {
    const hasNonZeroTax = invoice.items.some(item => item.tax > 0);
    if (hasNonZeroTax) {
      warnings.push(`Transaction ${transactionType.type}: les lignes devraient être à 0% de taxe`);
    }
  }
  
  if (invoice?.number === '' && invoice?.status !== 'draft') {
    errors.push('Numéro de facture requis');
  }
  if (invoice?.date === '' && invoice?.status !== 'draft') {
    errors.push('Date de facture requise');
  }
  
  return { errors, warnings, transactionType };
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tax / 100), 0);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
};

// ==================== AUTH SCREEN ====================
function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage('Vérifiez votre email pour confirmer votre inscription.');
        } else {
          onLogin(data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authStyles.container}>
      <div style={authStyles.card}>
        <div style={authStyles.logo}>◧</div>
        <h1 style={authStyles.title}>Factura</h1>
        <p style={authStyles.subtitle}>
          {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
        </p>

        <form onSubmit={handleSubmit} style={authStyles.form}>
          <div style={authStyles.formGroup}>
            <label style={authStyles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={authStyles.input}
              placeholder="vous@exemple.com"
              required
            />
          </div>
          <div style={authStyles.formGroup}>
            <label style={authStyles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={authStyles.input}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <p style={authStyles.error}>{error}</p>}
          {message && <p style={authStyles.message}>{message}</p>}

          <button type="submit" style={authStyles.button} disabled={loading}>
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>

        <p style={authStyles.switchText}>
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            style={authStyles.switchButton}
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}

const authStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  logo: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '8px',
  },
  title: {
    fontFamily: "'Lora', serif",
    fontSize: '32px',
    fontWeight: 600,
    textAlign: 'center',
    margin: '0 0 8px 0',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '15px',
    color: '#666',
    textAlign: 'center',
    margin: '0 0 32px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    padding: '14px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#e53935',
    fontSize: '14px',
    margin: 0,
    padding: '12px',
    background: '#ffebee',
    borderRadius: '8px',
  },
  message: {
    color: '#2e7d32',
    fontSize: '14px',
    margin: 0,
    padding: '12px',
    background: '#e8f5e9',
    borderRadius: '8px',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    marginTop: '24px',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontWeight: 500,
    cursor: 'pointer',
    marginLeft: '6px',
  },
};

// ==================== LOADING SCREEN ====================
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f8f8',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>◧</div>
        <p style={{ color: '#666', fontSize: '15px' }}>Chargement...</p>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function InvoiceApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('invoices');
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Sorties (Expenses) state
  const [expensesSections, setExpensesSections] = useState([]);
  const [expenseDocuments, setExpenseDocuments] = useState([]);
  const [expenseCollaborators, setExpenseCollaborators] = useState([]);
  const [driveConnected, setDriveConnected] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [dragOverSection, setDragOverSection] = useState(null);

  // Add global tooltip CSS for faster display
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [title] {
        position: relative;
      }
      [title]:hover::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background: #1a1a1a;
        color: white;
        font-size: 12px;
        white-space: nowrap;
        border-radius: 4px;
        pointer-events: none;
        z-index: 1000;
        margin-bottom: 4px;
        animation: fadeIn 0.1s;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user data from Supabase
  const loadUserData = async (userId) => {
    try {
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setCompanyInfo({
          name: profile.company_name || 'Votre Entreprise',
          legalStatus: profile.company_legal_status || 'SARL',
          addressLine1: profile.company_address_line1 || '',
          addressLine2: profile.company_address_line2 || '',
          email: profile.company_email || profile.email,
          phone: profile.company_phone || '',
          country: profile.company_country || 'FR',
          taxId: profile.company_tax_id || '',
          siret: profile.company_siret || '',
          logo: profile.company_logo_url,
          accountantEmail: '',
          bankName: profile.bank_name || '',
          iban: profile.bank_iban || '',
          bic: profile.bank_bic || '',
          bankAccountName: profile.bank_account_name || '',
          defaultTaxRate: profile.default_tax_rate || 20,
          defaultPaymentMode: profile.default_payment_mode || 'Virement bancaire',
          defaultPaymentTerms: profile.default_payment_terms || 30,
          defaultPaymentConditions: profile.default_payment_conditions || 'Paiement à réception de facture',
          defaultLatePenaltyRate: profile.default_late_penalty_rate || 10,
          defaultDiscountRate: 0,
          invoicePrefix: profile.invoice_prefix || 'FAC',
          creditNotePrefix: profile.credit_note_prefix || 'AV',
          numberingDigits: profile.numbering_digits || 3,
          annualReset: profile.annual_reset ?? true,
        });
      }

      // Load clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (clientsData) {
        setClients(clientsData.map(c => ({
          id: c.id,
          name: c.name,
          contactName: c.contact_name,
          email: c.email,
          financeEmail: c.finance_email,
          addressLine1: c.address_line1,
          addressLine2: c.address_line2,
          country: c.country,
          siret: c.siret,
          vatNumber: c.vat_number,
          defaultNotes: c.default_notes,
        })));
      }

      // Load invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (invoicesData) {
        setInvoices(invoicesData.map(inv => ({
          id: inv.id,
          clientId: inv.client_id,
          type: inv.type,
          number: inv.number,
          status: inv.status,
          date: inv.date,
          dueDate: inv.due_date,
          items: inv.items || [],
          notes: inv.notes,
          clientNotes: inv.client_notes,
          paymentMode: inv.payment_mode,
          paymentTerms: inv.payment_terms,
          relatedInvoice: inv.related_invoice_id,
        })));
      }

      // Load expense sections
      const { data: sectionsData } = await supabase
        .from('expense_sections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (sectionsData) {
        setExpensesSections(sectionsData.map(s => ({
          id: s.id,
          name: s.name,
          isDefault: s.is_default,
        })));
        if (sectionsData.length > 0) {
          setDriveConnected(true);
        }
      }

      // Load expense documents
      const { data: docsData } = await supabase
        .from('expense_documents')
        .select('*')
        .eq('user_id', userId);

      if (docsData) {
        setExpenseDocuments(docsData.map(d => ({
          id: d.id,
          name: d.name,
          size: d.file_size,
          type: d.file_type,
          sectionId: d.section_id,
          uploadedAt: d.created_at,
          uploadedBy: d.uploaded_by,
        })));
      }

      // Load collaborators
      const { data: collabsData } = await supabase
        .from('expense_collaborators')
        .select('*')
        .eq('user_id', userId);

      if (collabsData) {
        setExpenseCollaborators(collabsData.map(c => ({
          id: c.id,
          email: c.email,
          invitedAt: c.invited_at,
        })));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save profile to Supabase
  const saveProfile = async (profileData) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: profileData.name,
        company_legal_status: profileData.legalStatus,
        company_address_line1: profileData.addressLine1,
        company_address_line2: profileData.addressLine2,
        company_country: profileData.country,
        company_tax_id: profileData.taxId,
        company_siret: profileData.siret,
        company_email: profileData.email,
        company_phone: profileData.phone,
        bank_name: profileData.bankName,
        bank_iban: profileData.iban,
        bank_bic: profileData.bic,
        bank_account_name: profileData.bankAccountName,
        default_tax_rate: profileData.defaultTaxRate,
        default_payment_mode: profileData.defaultPaymentMode,
        default_payment_terms: profileData.defaultPaymentTerms,
        default_payment_conditions: profileData.defaultPaymentConditions,
        default_late_penalty_rate: profileData.defaultLatePenaltyRate,
        invoice_prefix: profileData.invoicePrefix,
        credit_note_prefix: profileData.creditNotePrefix,
        numbering_digits: profileData.numberingDigits,
        annual_reset: profileData.annualReset,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving profile:', error);
      notify('Erreur lors de la sauvegarde', 'error');
    } else {
      setCompanyInfo(profileData);
      notify('Paramètres enregistrés');
    }
  };

  // Client CRUD operations
  const saveClient = async (clientData) => {
    if (!user) return;

    const dbClient = {
      user_id: user.id,
      name: clientData.name,
      contact_name: clientData.contactName,
      email: clientData.email,
      finance_email: clientData.financeEmail,
      address_line1: clientData.addressLine1,
      address_line2: clientData.addressLine2,
      country: clientData.country,
      siret: clientData.siret,
      vat_number: clientData.vatNumber,
      default_notes: clientData.defaultNotes,
      updated_at: new Date().toISOString(),
    };

    if (clientData.id && clients.find(c => c.id === clientData.id)) {
      // Update existing
      const { error } = await supabase
        .from('clients')
        .update(dbClient)
        .eq('id', clientData.id);

      if (error) {
        notify('Erreur lors de la mise à jour', 'error');
        return null;
      }

      setClients(clients.map(c => c.id === clientData.id ? clientData : c));
      notify('Client modifié');
      return clientData;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('clients')
        .insert(dbClient)
        .select()
        .single();

      if (error) {
        notify('Erreur lors de la création', 'error');
        return null;
      }

      const newClient = { ...clientData, id: data.id };
      setClients([newClient, ...clients]);
      notify('Client ajouté');
      return newClient;
    }
  };

  const deleteClient = async (clientId) => {
    if (!user) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      notify('Erreur lors de la suppression', 'error');
      return;
    }

    setClients(clients.filter(c => c.id !== clientId));
    notify('Client supprimé');
  };

  // Invoice CRUD operations
  const saveInvoice = async (invoiceData) => {
    if (!user) return;

    const dbInvoice = {
      user_id: user.id,
      client_id: invoiceData.clientId,
      type: invoiceData.type || 'invoice',
      number: invoiceData.number || null,
      status: invoiceData.status || 'draft',
      date: invoiceData.date || null,
      due_date: invoiceData.dueDate || null,
      items: invoiceData.items || [],
      notes: invoiceData.notes,
      client_notes: invoiceData.clientNotes,
      payment_mode: invoiceData.paymentMode,
      payment_terms: invoiceData.paymentTerms,
      related_invoice_id: invoiceData.relatedInvoice || null,
      updated_at: new Date().toISOString(),
    };

    if (invoiceData.id && invoices.find(i => i.id === invoiceData.id)) {
      // Update existing
      const { error } = await supabase
        .from('invoices')
        .update(dbInvoice)
        .eq('id', invoiceData.id);

      if (error) {
        notify('Erreur lors de la mise à jour', 'error');
        return;
      }

      setInvoices(invoices.map(i => i.id === invoiceData.id ? invoiceData : i));
      notify('Document modifié');
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('invoices')
        .insert(dbInvoice)
        .select()
        .single();

      if (error) {
        notify('Erreur lors de la création', 'error');
        return;
      }

      const newInvoice = { ...invoiceData, id: data.id };
      setInvoices([newInvoice, ...invoices]);
      notify('Document créé');
    }
  };

  const deleteInvoice = async (invoiceId) => {
    if (!user) return;

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      notify('Erreur lors de la suppression', 'error');
      return;
    }

    setInvoices(invoices.filter(i => i.id !== invoiceId));
    notify('Document supprimé');
  };

  // Expense section operations
  const saveExpenseSection = async (sectionData) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('expense_sections')
      .insert({
        user_id: user.id,
        name: sectionData.name,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      notify('Erreur lors de la création', 'error');
      return;
    }

    setExpensesSections([...expensesSections, {
      id: data.id,
      name: data.name,
      isDefault: false,
    }]);
    notify(`Section "${sectionData.name}" créée`);
  };

  const deleteExpenseSection = async (sectionId) => {
    if (!user) return;

    // Move documents to default section first
    const defaultSection = expensesSections.find(s => s.isDefault);
    if (defaultSection) {
      await supabase
        .from('expense_documents')
        .update({ section_id: defaultSection.id })
        .eq('section_id', sectionId);
    }

    const { error } = await supabase
      .from('expense_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      notify('Erreur lors de la suppression', 'error');
      return;
    }

    setExpensesSections(expensesSections.filter(s => s.id !== sectionId));
    setExpenseDocuments(expenseDocuments.map(d => 
      d.sectionId === sectionId ? { ...d, sectionId: defaultSection?.id } : d
    ));
    notify('Section supprimée');
  };

  // Collaborator operations
  const addCollaborator = async (email) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('expense_collaborators')
      .insert({
        user_id: user.id,
        email: email,
      })
      .select()
      .single();

    if (error) {
      notify('Erreur lors de l\'invitation', 'error');
      return;
    }

    setExpenseCollaborators([...expenseCollaborators, {
      id: data.id,
      email: data.email,
      invitedAt: data.invited_at,
    }]);
    notify(`Invitation envoyée à ${email}`);
  };

  const removeCollaborator = async (collabId) => {
    if (!user) return;

    const { error } = await supabase
      .from('expense_collaborators')
      .delete()
      .eq('id', collabId);

    if (error) {
      notify('Erreur lors de la suppression', 'error');
      return;
    }

    setExpenseCollaborators(expenseCollaborators.filter(c => c.id !== collabId));
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClients([]);
    setInvoices([]);
    setCompanyInfo(null);
  };

  // Show notification
  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Generate invoice number
  const generateInvoiceNumber = (type = 'invoice') => {
    const prefix = type === 'credit' ? companyInfo?.creditNotePrefix || 'AV' : companyInfo?.invoicePrefix || 'FAC';
    const year = new Date().getFullYear();
    const digits = companyInfo?.numberingDigits || 3;
    
    const sameTypeInvoices = invoices.filter(inv => inv.type === type && inv.number);
    const sameYearInvoices = companyInfo?.annualReset 
      ? sameTypeInvoices.filter(inv => inv.number?.includes(year.toString()))
      : sameTypeInvoices;
    
    const nextNum = sameYearInvoices.length + 1;
    const paddedNum = nextNum.toString().padStart(digits, '0');
    
    return `${prefix}-${year}-${paddedNum}`;
  };

  // Loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen onLogin={(u) => { setUser(u); loadUserData(u.id); }} />;
  }

  // Default company info if not loaded
  const company = companyInfo || {
    name: 'Votre Entreprise',
    legalStatus: 'SARL',
    addressLine1: '',
    addressLine2: '',
    email: user.email,
    phone: '',
    country: 'FR',
    taxId: '',
    siret: '',
    logo: null,
    bankName: '',
    iban: '',
    bic: '',
    bankAccountName: '',
    defaultTaxRate: 20,
    defaultPaymentMode: 'Virement bancaire',
    defaultPaymentTerms: 30,
    defaultPaymentConditions: 'Paiement à réception de facture',
    defaultLatePenaltyRate: 10,
    invoicePrefix: 'FAC',
    creditNotePrefix: 'AV',
    numberingDigits: 3,
    annualReset: true,
  };

  const sellerConfig = countryConfigs[company.country] || countryConfigs.FR;

  // Calculate dashboard stats
  const totalRevenue = invoices
    .filter(inv => inv.type !== 'credit' && inv.status === 'paid')
    .reduce((sum, inv) => sum + calculateTotals(inv.items || []).total, 0);

  const pendingAmount = invoices
    .filter(inv => inv.type !== 'credit' && (inv.status === 'issued' || inv.status === 'pending'))
    .reduce((sum, inv) => sum + calculateTotals(inv.items || []).total, 0);

  const pendingCount = invoices.filter(inv => inv.status === 'issued' || inv.status === 'pending').length;

  return (
    <div style={styles.app}>
      {/* Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          background: notification.type === 'error' ? '#e53935' : '#1a1a1a'
        }}>
          {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: sidebarCollapsed ? '72px' : '240px'
      }}>
        <div style={styles.sidebarHeader}>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={styles.collapseBtn}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
          {!sidebarCollapsed && (
            <h1 style={styles.logo}>Factura</h1>
          )}
        </div>

        <div style={{
          ...styles.nav,
          padding: sidebarCollapsed ? '24px 12px' : '24px 16px'
        }}>
          {[
            { id: 'invoices', label: 'Entrées', icon: '◧' },
            { id: 'expenses', label: 'Sorties', icon: '◨' },
            { id: 'clients', label: 'Clients', icon: '◎' },
            { id: 'dashboard', label: 'Tableau de bord', icon: '◫' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                ...styles.navItem,
                ...(view === item.id ? styles.navItemActive : {}),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '14px' : '12px 16px',
              }}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span style={{
                ...styles.navIcon,
                fontSize: sidebarCollapsed ? '22px' : '19px',
                marginRight: sidebarCollapsed ? 0 : '20px',
                width: sidebarCollapsed ? '28px' : '24px',
                textAlign: 'center',
                display: 'inline-block'
              }}>{item.icon}</span>
              {!sidebarCollapsed && item.label}
            </button>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <button 
            onClick={() => setView('settings')} 
            style={{
              ...styles.settingsBtn,
              ...(view === 'settings' ? styles.navItemActive : {}),
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: sidebarCollapsed ? 0 : '20px'
            }}
            title={sidebarCollapsed ? 'Paramètres' : ''}
          >
            <span style={{ fontSize: sidebarCollapsed ? '22px' : '18px' }}>⚙</span>
            {!sidebarCollapsed && 'Paramètres'}
          </button>
          <button 
            onClick={handleLogout} 
            style={{
              ...styles.settingsBtn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: sidebarCollapsed ? 0 : '20px',
              color: '#999',
            }}
            title={sidebarCollapsed ? 'Déconnexion' : ''}
          >
            <span style={{ fontSize: sidebarCollapsed ? '22px' : '18px' }}>↪</span>
            {!sidebarCollapsed && 'Déconnexion'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div style={styles.content}>
            <header style={styles.header}>
              <div>
                <h1 style={styles.pageTitle}>Tableau de bord</h1>
                <p style={styles.pageSubtitle}>Vue d'ensemble de votre activité</p>
              </div>
            </header>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{formatCurrency(totalRevenue, sellerConfig.currency)}</span>
                <span style={styles.statMeta}>Chiffre d'affaires encaissé</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{formatCurrency(pendingAmount, sellerConfig.currency)}</span>
                <span style={styles.statMeta}>En attente de paiement</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{pendingCount}</span>
                <span style={styles.statMeta}>Documents à régler</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{clients.length}</span>
                <span style={styles.statMeta}>Clients</span>
              </div>
            </div>
          </div>
        )}

        {/* Invoices View */}
        {view === 'invoices' && !selectedInvoice && (
          <div style={styles.content}>
            <header style={styles.header}>
              <div>
                <h1 style={styles.pageTitle}>Entrées</h1>
                <p style={styles.pageSubtitle}>Factures et avoirs émis</p>
              </div>
              <div style={styles.headerActions}>
                <button onClick={() => setEditingInvoice({ type: 'credit' })} style={styles.secondaryBtn}>
                  Nouvel avoir
                </button>
                <button onClick={() => setEditingInvoice({})} style={styles.primaryBtn}>
                  Nouvelle facture
                </button>
              </div>
            </header>

            {invoices.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Aucun document</p>
                <p style={styles.emptySubtext}>Créez votre première facture pour commencer</p>
              </div>
            ) : (
              <div style={styles.invoiceList}>
                {invoices.map(invoice => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  const totals = calculateTotals(invoice.items || []);
                  return (
                    <div 
                      key={invoice.id} 
                      style={styles.invoiceRow}
                    >
                      <div style={styles.invoiceMain}>
                        <span style={{
                          ...styles.invoiceType,
                          background: invoice.type === 'credit' ? '#fff3e0' : '#e3f2fd',
                          color: invoice.type === 'credit' ? '#e65100' : '#1565c0'
                        }}>
                          {invoice.type === 'credit' ? 'Avoir' : 'Facture'}
                        </span>
                        <span style={styles.invoiceNumber}>{invoice.number || 'Brouillon'}</span>
                        <span style={styles.invoiceClient}>{client?.name || 'Client inconnu'}</span>
                      </div>
                      <div style={styles.invoiceMeta}>
                        <span style={{
                          ...styles.invoiceStatus,
                          background: invoice.status === 'paid' ? '#e8f5e9' : 
                                      invoice.status === 'issued' ? '#e3f2fd' :
                                      invoice.status === 'pending' ? '#fff3e0' : '#f5f5f5',
                          color: invoice.status === 'paid' ? '#2e7d32' :
                                 invoice.status === 'issued' ? '#1565c0' :
                                 invoice.status === 'pending' ? '#e65100' : '#666'
                        }}>
                          {invoice.status === 'paid' ? 'Payée' :
                           invoice.status === 'issued' ? 'Émise' :
                           invoice.status === 'pending' ? 'En attente' : 'Brouillon'}
                        </span>
                        <span style={styles.invoiceDate}>
                          {invoice.date ? formatDate(invoice.date, sellerConfig.dateFormat) : '-'}
                        </span>
                        <span style={styles.invoiceAmount}>
                          {formatCurrency(totals.total, sellerConfig.currency)}
                        </span>
                        <div style={styles.invoiceActions}>
                          <button 
                            onClick={() => setSelectedInvoice(invoice)} 
                            style={styles.iconBtn}
                            title="Voir"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="8" cy="8" r="2" fill="currentColor"/>
                            </svg>
                          </button>
                          <button 
                            onClick={() => setEditingInvoice(invoice)} 
                            style={styles.iconBtn}
                            title="Modifier"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M2 11V14H5L13 6L10 3L2 11Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <path d="M10 3L13 6" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </button>
                          {invoice.status === 'draft' && (
                            <button 
                              onClick={() => {
                                const updatedInvoice = { ...invoice, status: 'issued' };
                                if (!invoice.number) {
                                  updatedInvoice.number = generateInvoiceNumber(invoice.type);
                                  updatedInvoice.date = new Date().toISOString().split('T')[0];
                                }
                                saveInvoice(updatedInvoice);
                              }}
                              style={styles.iconBtn}
                              title="Émettre"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 8L14 8M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                          <button 
                            onClick={() => alert('Téléchargement PDF (à venir)')} 
                            style={styles.iconBtn}
                            title="Télécharger PDF"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 2V12M8 12L4 8M8 12L12 8M2 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                                deleteInvoice(invoice.id);
                              }
                            }}
                            style={{...styles.iconBtn, color: '#e53935'}}
                            title="Supprimer"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Invoice Detail View */}
        {view === 'invoices' && selectedInvoice && (
          <InvoiceDetailView
            invoice={selectedInvoice}
            client={clients.find(c => c.id === selectedInvoice.clientId)}
            company={company}
            sellerConfig={sellerConfig}
            onBack={() => setSelectedInvoice(null)}
            onEdit={() => { setEditingInvoice(selectedInvoice); setSelectedInvoice(null); }}
            onDelete={() => { deleteInvoice(selectedInvoice.id); setSelectedInvoice(null); }}
            onStatusChange={(newStatus) => {
              const updatedInvoice = { ...selectedInvoice, status: newStatus };
              if (newStatus !== 'draft' && !selectedInvoice.number) {
                updatedInvoice.number = generateInvoiceNumber(selectedInvoice.type);
                updatedInvoice.date = new Date().toISOString().split('T')[0];
              }
              saveInvoice(updatedInvoice);
              setSelectedInvoice(updatedInvoice);
            }}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        {/* Guided Invoice Creator */}
        {editingInvoice && (
          <GuidedInvoiceCreator
            invoice={editingInvoice}
            clients={clients}
            company={company}
            sellerConfig={sellerConfig}
            generateInvoiceNumber={generateInvoiceNumber}
            onSave={(invoiceData) => {
              saveInvoice(invoiceData);
              setEditingInvoice(null);
            }}
            onCancel={() => setEditingInvoice(null)}
            onCreateClient={async (clientData) => {
              const newClient = await saveClient(clientData);
              return newClient;
            }}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        {/* Clients View */}
        {view === 'clients' && (
          <div style={styles.content}>
            <header style={styles.header}>
              <div>
                <h1 style={styles.pageTitle}>Clients</h1>
                <p style={styles.pageSubtitle}>{clients.length} contact{clients.length > 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setEditingClient({})} style={styles.primaryBtn}>
                Nouveau client
              </button>
            </header>

            <div style={styles.clientGrid}>
              {clients.length === 0 ? (
                <div style={{...styles.emptyState, gridColumn: '1 / -1'}}>
                  <p style={styles.emptyText}>Aucun client</p>
                  <p style={styles.emptySubtext}>Ajoutez votre premier client pour créer des factures</p>
                </div>
              ) : (
                clients.map(client => {
                  const clientInvoices = invoices.filter(i => i.clientId === client.id);
                  const totalAmount = clientInvoices.reduce((sum, inv) => 
                    sum + calculateTotals(inv.items || []).total, 0);
                  const clientConfig = countryConfigs[client.country] || sellerConfig;
                  
                  return (
                    <div key={client.id} style={styles.clientCard}>
                      <div style={styles.clientHeader}>
                        <h3 style={styles.clientName}>{client.name}</h3>
                        <span style={styles.clientCountry}>{countryConfigs[client.country]?.name || client.country}</span>
                      </div>
                      <p style={styles.clientEmail}>{client.email}</p>
                      <p style={styles.clientAddress}>{client.addressLine1}</p>
                      <p style={styles.clientAddress}>{client.addressLine2}</p>
                      {client.siret && <p style={styles.clientTaxId}>SIREN/SIRET: {client.siret}</p>}
                      {client.vatNumber && <p style={styles.clientTaxId}>TVA: {client.vatNumber}</p>}
                      <div style={styles.clientStats}>
                        <span>{clientInvoices.length} document{clientInvoices.length > 1 ? 's' : ''}</span>
                        <span>{formatCurrency(totalAmount, clientConfig.currency)}</span>
                      </div>
                      <div style={styles.clientActions}>
                        <button onClick={() => setEditingClient(client)} style={styles.textBtn}>Modifier</button>
                        <button onClick={() => deleteClient(client.id)} style={{...styles.textBtn, color: '#999'}}>Supprimer</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Client Editor Modal */}
        {editingClient && (
          <ClientEditorModal
            client={editingClient}
            onSave={(clientData) => {
              saveClient(clientData);
              setEditingClient(null);
            }}
            onCancel={() => setEditingClient(null)}
          />
        )}

        {/* Sorties (Expenses) View */}
        {view === 'expenses' && (
          <div style={styles.content}>
            <header style={styles.header}>
              <div>
                <h1 style={styles.pageTitle}>Sorties</h1>
                <p style={styles.pageSubtitle}>Factures et documents reçus</p>
              </div>
              <div style={styles.headerActions}>
                {driveConnected && (
                  <>
                    <button onClick={() => setShowNewSectionModal(true)} style={styles.secondaryBtn}>
                      + Nouvelle section
                    </button>
                    <button onClick={() => setShowInviteModal(true)} style={styles.secondaryBtn}>
                      Inviter
                    </button>
                  </>
                )}
              </div>
            </header>

            {!driveConnected ? (
              <div style={styles.driveConnectCard}>
                <div style={styles.driveConnectIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3 style={styles.driveConnectTitle}>Connecter Google Drive</h3>
                <p style={styles.driveConnectText}>
                  Connectez un dossier Google Drive pour stocker et organiser vos factures fournisseurs. 
                  Les documents et dossiers seront synchronisés automatiquement.
                </p>
                <button 
                  onClick={() => {
                    setDriveConnected(true);
                    notify('Google Drive connecté');
                  }} 
                  style={styles.driveConnectBtn}
                >
                  Connecter Google Drive
                </button>
              </div>
            ) : (
              <div style={styles.expensesContainer}>
                {/* Collaborators bar */}
                {expenseCollaborators.length > 0 && (
                  <div style={styles.collaboratorsBar}>
                    <span style={styles.collaboratorsLabel}>Collaborateurs :</span>
                    <div style={styles.collaboratorsList}>
                      {expenseCollaborators.map(collab => (
                        <div key={collab.id} style={styles.collaboratorChip}>
                          <span style={styles.collaboratorAvatar}>{collab.email[0].toUpperCase()}</span>
                          <span style={styles.collaboratorEmail}>{collab.email}</span>
                          <button 
                            onClick={() => removeCollaborator(collab.id)}
                            style={styles.collaboratorRemove}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections grid */}
                <div style={styles.sectionsGrid}>
                  {expensesSections.map(section => {
                    const sectionDocs = expenseDocuments.filter(d => d.sectionId === section.id);
                    return (
                      <div 
                        key={section.id} 
                        style={{
                          ...styles.sectionCard,
                          ...(dragOverSection === section.id ? styles.sectionCardDragOver : {})
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverSection(section.id);
                        }}
                        onDragLeave={() => setDragOverSection(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverSection(null);
                          // Handle file drop - in real app would upload to Supabase Storage
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 0) {
                            const newDocs = files.map(file => ({
                              id: generateId(),
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              sectionId: section.id,
                              uploadedAt: new Date().toISOString(),
                              uploadedBy: company.email
                            }));
                            setExpenseDocuments([...expenseDocuments, ...newDocs]);
                            notify(`${files.length} document(s) ajouté(s)`);
                          }
                        }}
                      >
                        <div style={styles.sectionHeader}>
                          <div style={styles.sectionTitleRow}>
                            <span style={styles.sectionIcon}>📁</span>
                            <h3 style={styles.sectionName}>{section.name}</h3>
                            <span style={styles.sectionCount}>{sectionDocs.length}</span>
                          </div>
                          {!section.isDefault && (
                            <button 
                              onClick={() => deleteExpenseSection(section.id)}
                              style={styles.sectionDeleteBtn}
                            >×</button>
                          )}
                        </div>
                        
                        <div style={styles.sectionDropzone}>
                          {sectionDocs.length === 0 ? (
                            <p style={styles.dropzoneText}>
                              Glissez-déposez des fichiers ici
                            </p>
                          ) : (
                            <div style={styles.documentsList}>
                              {sectionDocs.map(doc => (
                                <div key={doc.id} style={styles.documentItem}>
                                  <span style={styles.documentIcon}>
                                    {doc.type?.includes('pdf') ? '📄' : 
                                     doc.type?.includes('image') ? '🖼' : '📎'}
                                  </span>
                                  <div style={styles.documentInfo}>
                                    <span style={styles.documentName}>{doc.name}</span>
                                    <span style={styles.expenseDocMeta}>
                                      {(doc.size / 1024).toFixed(1)} Ko
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sync status */}
                <div style={styles.syncStatus}>
                  <span style={styles.syncIcon}>✓</span>
                  Synchronisé avec Supabase
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div style={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Inviter un collaborateur</h2>
              <p style={styles.modalSubtitle}>
                Les collaborateurs auront accès uniquement à l'onglet Sorties.
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const email = e.target.email.value;
                if (email && !expenseCollaborators.find(c => c.email === email)) {
                  addCollaborator(email);
                  setShowInviteModal(false);
                }
              }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Adresse email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="collaborateur@exemple.com"
                    style={styles.input}
                    required
                    autoFocus
                  />
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowInviteModal(false)} style={styles.secondaryBtn}>
                    Annuler
                  </button>
                  <button type="submit" style={styles.primaryBtn}>
                    Envoyer l'invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Section Modal */}
        {showNewSectionModal && (
          <div style={styles.modalOverlay} onClick={() => setShowNewSectionModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Nouvelle section</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const name = e.target.sectionName.value;
                if (name) {
                  saveExpenseSection({ name });
                  setShowNewSectionModal(false);
                }
              }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom de la section</label>
                  <input
                    type="text"
                    name="sectionName"
                    placeholder="Ex: Fournisseurs, Abonnements..."
                    style={styles.input}
                    required
                    autoFocus
                  />
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowNewSectionModal(false)} style={styles.secondaryBtn}>
                    Annuler
                  </button>
                  <button type="submit" style={styles.primaryBtn}>
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <SettingsView
            company={company}
            onSave={saveProfile}
            userEmail={user.email}
          />
        )}
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function InvoiceDetailView({ invoice, client, company, sellerConfig, onBack, onEdit, onDelete, onStatusChange, formatCurrency, formatDate }) {
  const totals = calculateTotals(invoice.items || []);
  const transactionType = getTransactionType(company?.country, client?.country, !!client?.vatNumber);

  return (
    <div style={styles.content}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Retour</button>
        <div style={styles.headerActions}>
          <button onClick={onEdit} style={styles.secondaryBtn}>Modifier</button>
          {invoice.status === 'draft' && (
            <button onClick={() => onStatusChange('issued')} style={styles.primaryBtn}>Émettre</button>
          )}
          {invoice.status === 'issued' && (
            <button onClick={() => onStatusChange('paid')} style={styles.primaryBtn}>Marquer payée</button>
          )}
          <button 
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                onDelete();
              }
            }}
            style={{...styles.textBtn, color: '#e53935'}}
          >
            Supprimer
          </button>
        </div>
      </header>

      <div style={styles.a4Container}>
        <div style={styles.documentHeader}>
          <div style={styles.companyBlock}>
            <p style={styles.companyName}>{company.name}</p>
            <p style={styles.companyInfo}>{company.legalStatus}</p>
            <p style={styles.companyInfo}>{company.addressLine1}</p>
            <p style={styles.companyInfo}>{company.addressLine2}</p>
            <p style={styles.companyInfo}>{company.email}</p>
            {company.siret && <p style={styles.companyInfo}>SIRET: {company.siret}</p>}
            {company.taxId && <p style={styles.companyInfo}>{sellerConfig?.taxName}: {company.taxId}</p>}
          </div>
          <div style={styles.invoiceTitle}>
            <h1 style={styles.documentTitle}>{invoice.type === 'credit' ? 'Avoir' : 'Facture'}</h1>
            <p style={invoice.number ? styles.invoiceNum : styles.invoiceNumDraft}>
              {invoice.number || 'Brouillon'}
            </p>
          </div>
        </div>

        <div style={styles.documentMeta}>
          <div style={styles.clientBlock}>
            <span style={styles.metaLabel}>Facturer à</span>
            <p style={styles.clientBlockName}>{client?.name || 'Client non défini'}</p>
            {client?.contactName && <p style={styles.clientBlockContact}>{client.contactName}</p>}
            <p style={styles.clientBlockInfo}>{client?.addressLine1}</p>
            <p style={styles.clientBlockInfo}>{client?.addressLine2}</p>
            {client?.siret && <p style={styles.clientBlockInfo}>SIREN/SIRET: {client.siret}</p>}
            {client?.vatNumber && <p style={styles.clientBlockInfo}>TVA Intracom.: {client.vatNumber}</p>}
          </div>
          <div style={styles.datesBlock}>
            <div style={styles.dateItem}>
              <span style={styles.metaLabel}>Date</span>
              <span style={styles.dateValue}>
                {invoice.date ? formatDate(invoice.date, sellerConfig.dateFormat) : '-'}
              </span>
            </div>
            <div style={styles.dateItem}>
              <span style={styles.metaLabel}>Échéance</span>
              <span style={styles.dateValue}>
                {invoice.dueDate ? formatDate(invoice.dueDate, sellerConfig.dateFormat) : '-'}
              </span>
            </div>
          </div>
        </div>

        {transactionType.mention && (
          <div style={styles.transactionIndicatorDoc}>
            <span style={styles.transactionBadge}>{transactionType.type.replace('_', ' ')}</span>
            <span style={styles.transactionMention}>{transactionType.mention}</span>
          </div>
        )}

        <table style={styles.itemsTableDoc}>
          <thead>
            <tr>
              <th style={{...styles.tableHeader, textAlign: 'left'}}>Description</th>
              <th style={{...styles.tableHeader, textAlign: 'center'}}>Qté</th>
              <th style={{...styles.tableHeader, textAlign: 'right'}}>Prix unit.</th>
              <th style={{...styles.tableHeader, textAlign: 'center'}}>{sellerConfig?.taxName || 'TVA'}</th>
              <th style={{...styles.tableHeader, textAlign: 'right'}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => (
              <tr key={index}>
                <td style={{...styles.tableCell, textAlign: 'left'}} dangerouslySetInnerHTML={{ __html: item.description }} />
                <td style={{...styles.tableCell, textAlign: 'center'}}>{item.quantity}</td>
                <td style={{...styles.tableCell, textAlign: 'right'}}>{formatCurrency(item.unitPrice, sellerConfig.currency)}</td>
                <td style={{...styles.tableCell, textAlign: 'center'}}>{item.tax}%</td>
                <td style={{...styles.tableCell, textAlign: 'right'}}>{formatCurrency(item.quantity * item.unitPrice * (1 + item.tax/100), sellerConfig.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.documentTotals}>
          <div style={styles.totalsTable}>
            <div style={styles.totalsRow}>
              <span>Sous-total HT</span>
              <span>{formatCurrency(totals.subtotal, sellerConfig.currency)}</span>
            </div>
            <div style={styles.totalsRow}>
              <span>{sellerConfig?.taxName || 'TVA'}</span>
              <span>{formatCurrency(totals.taxAmount, sellerConfig.currency)}</span>
            </div>
            <div style={styles.totalsRowFinal}>
              <span>Total TTC</span>
              <span>{formatCurrency(totals.total, sellerConfig.currency)}</span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.clientNotes) && (
          <div style={styles.notesSection}>
            <p style={styles.notesTitle}>Notes</p>
            {invoice.clientNotes && <p style={{...styles.notesText, whiteSpace: 'pre-wrap'}}>{invoice.clientNotes}</p>}
            {invoice.notes && <p style={{...styles.notesText, whiteSpace: 'pre-wrap'}}>{invoice.notes}</p>}
          </div>
        )}

        {company.bankName && (
          <div style={styles.bankSection}>
            <p style={styles.bankTitle}>Coordonnées bancaires</p>
            <p style={styles.bankInfo}>{company.bankName}</p>
            <p style={styles.bankInfo}>IBAN: {company.iban}</p>
            <p style={styles.bankInfo}>BIC: {company.bic}</p>
          </div>
        )}

        <div style={styles.a4Footer}>1/1</div>
      </div>
    </div>
  );
}

function GuidedInvoiceCreator({ invoice, clients, company, sellerConfig, generateInvoiceNumber, onSave, onCancel, onCreateClient, formatCurrency, formatDate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    type: invoice?.type || 'invoice',
    clientId: invoice?.clientId || '',
    status: invoice?.status || 'draft',
    date: invoice?.date || '',
    dueDate: invoice?.dueDate || '',
    number: invoice?.number || '',
    items: invoice?.items?.length > 0 ? invoice.items : [{ description: '', quantity: 1, unitPrice: 0, tax: company.defaultTaxRate || 20 }],
    notes: invoice?.notes || '',
    clientNotes: invoice?.clientNotes || '',
    paymentMode: invoice?.paymentMode || company.defaultPaymentMode || 'Virement bancaire',
    paymentTerms: invoice?.paymentTerms || company.defaultPaymentTerms || 30,
    id: invoice?.id || null
  });
  const [showClientForm, setShowClientForm] = useState(false);

  const selectedClient = clients.find(c => c.id === form.clientId);
  const transactionType = selectedClient 
    ? getTransactionType(company.country, selectedClient.country, !!selectedClient.vatNumber)
    : { type: 'domestic', applyTax: true, mention: null };

  const totals = {
    subtotal: form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
    taxAmount: form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tax / 100), 0),
  };
  totals.total = totals.subtotal + totals.taxAmount;

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    const newTransactionType = client 
      ? getTransactionType(company.country, client.country, !!client.vatNumber)
      : { type: 'domestic', applyTax: true, mention: null };
    
    const defaultTax = newTransactionType.applyTax === false ? 0 : (company.defaultTaxRate || 20);
    
    setForm({ 
      ...form, 
      clientId,
      clientNotes: client?.defaultNotes || '',
      items: form.items.map(item => ({ ...item, tax: defaultTax }))
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    const defaultTax = transactionType.applyTax === false ? 0 : (company.defaultTaxRate || 20);
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, tax: defaultTax }] });
  };

  const removeItem = (index) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
    }
  };

  const steps = [
    { num: 1, label: 'Client', completed: !!form.clientId },
    { num: 2, label: 'Lignes', completed: form.items.some(i => i.description) },
    { num: 3, label: 'Finaliser', completed: currentStep > 3 },
    { num: 4, label: 'Aperçu', completed: false }
  ];

  const canGoToStep = (stepNum) => {
    if (stepNum === 1) return true;
    return !!form.clientId;
  };

  return (
    <div style={styles.creatorOverlay}>
      <div style={styles.creatorContainer}>
        {/* Header */}
        <div style={styles.creatorHeader}>
          <div style={styles.creatorTitleRow}>
            <h2 style={styles.creatorTitle}>
              {form.type === 'credit' ? 'Nouvel avoir' : 'Nouvelle facture'}
            </h2>
            <button onClick={onCancel} style={styles.creatorClose}>×</button>
          </div>
          
          {/* Steps */}
          <div style={styles.stepsRow}>
            {steps.map(step => (
              <button
                key={step.num}
                onClick={() => canGoToStep(step.num) && setCurrentStep(step.num)}
                style={{
                  ...styles.stepIndicator,
                  ...(currentStep === step.num ? styles.stepIndicatorActive : {}),
                  ...(step.completed ? styles.stepIndicatorCompleted : {}),
                  opacity: canGoToStep(step.num) ? 1 : 0.4,
                  cursor: canGoToStep(step.num) ? 'pointer' : 'not-allowed',
                }}
              >
                <span style={styles.stepNum}>{step.num}</span>
                <span style={styles.stepLabel}>{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={styles.creatorContent}>
          {/* Step 1: Client */}
          {currentStep === 1 && (
            <div style={styles.stepFormContainer}>
              <div style={styles.stepFormContent}>
                <div style={styles.stepContentCentered}>
                  <h3 style={styles.stepTitle}>Sélectionnez un client</h3>
                  <p style={styles.stepDescription}>Choisissez le client à facturer</p>
                </div>

                <select
                  value={form.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  style={styles.selectLarge}
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button 
                    onClick={() => setShowClientForm(true)} 
                    style={styles.textBtn}
                  >
                    + Créer un nouveau client
                  </button>
                </div>

                {selectedClient && (
                  <div style={styles.selectedClientCard}>
                    <div style={styles.selectedClientBadges}>
                      <span style={styles.selectedClientBadge}>Client sélectionné</span>
                      {transactionType.mention && (
                        <span style={styles.transactionTypeBadge}>{transactionType.type.replace('_', ' ')}</span>
                      )}
                    </div>
                    <h4 style={styles.selectedClientName}>{selectedClient.name}</h4>
                    <p style={styles.selectedClientInfo}>{selectedClient.addressLine1}</p>
                    <p style={styles.selectedClientInfo}>{selectedClient.addressLine2}</p>
                    {selectedClient.vatNumber && (
                      <p style={styles.selectedClientInfo}>TVA: {selectedClient.vatNumber}</p>
                    )}
                  </div>
                )}

                <div style={styles.stepNavigation}>
                  <button onClick={onCancel} style={styles.secondaryBtn}>Annuler</button>
                  <button 
                    onClick={() => setCurrentStep(2)} 
                    style={styles.primaryBtn}
                    disabled={!form.clientId}
                  >
                    Continuer →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Line Items */}
          {currentStep === 2 && (
            <div style={styles.stepFormContainer}>
              <div style={styles.stepContentWide}>
                <div style={styles.stepHeaderRow}>
                  <div>
                    <h3 style={styles.stepTitle}>Lignes de facturation</h3>
                    <p style={styles.stepDescription}>Ajoutez les produits ou services</p>
                  </div>
                  <div style={styles.stepTotalBadge}>
                    Total: {formatCurrency(totals.total, sellerConfig.currency)}
                  </div>
                </div>

                {transactionType.mention && (
                  <div style={styles.taxNotice}>
                    ℹ️ {transactionType.type.replace('_', ' ')}: {transactionType.mention}
                  </div>
                )}

                <div style={styles.lineItemsContainer}>
                  {form.items.map((item, index) => (
                    <div key={index} style={styles.lineItemCardCompact}>
                      <div style={styles.formGroup}>
                        <label style={styles.labelSmall}>Description</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => {
                            updateItem(index, 'description', e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          style={styles.descriptionTextarea}
                          placeholder="Description du produit ou service"
                          rows={3}
                        />
                      </div>
                      <div style={styles.lineItemGrid}>
                        <div style={styles.formGroupSmall}>
                          <label style={styles.labelSmall}>Quantité</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            style={styles.inputSmall}
                          />
                        </div>
                        <div style={styles.formGroupSmall}>
                          <label style={styles.labelSmall}>Prix unitaire</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            style={styles.inputSmall}
                          />
                        </div>
                        <div style={styles.formGroupSmall}>
                          <label style={styles.labelSmall}>{sellerConfig?.taxName || 'TVA'}</label>
                          <select
                            value={item.tax}
                            onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                            style={styles.selectSmall}
                          >
                            <option value={0}>0%</option>
                            {(sellerConfig?.taxOptions || [5.5, 10, 20]).filter(rate => rate > 0).map(rate => (
                              <option key={rate} value={rate}>{rate}%</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.formGroupSmall}>
                          <label style={styles.labelSmall}>Total ligne</label>
                          <div style={styles.lineItemTotalValue}>
                            {formatCurrency(item.quantity * item.unitPrice * (1 + item.tax/100), sellerConfig.currency)}
                          </div>
                        </div>
                      </div>
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(index)} style={styles.removeItemBtn}>
                          Supprimer
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={addItem} style={styles.addItemBtn}>
                  + Ajouter une ligne
                </button>

                <div style={styles.stepNavigation}>
                  <button onClick={() => setCurrentStep(1)} style={styles.secondaryBtn}>← Retour</button>
                  <button onClick={() => setCurrentStep(3)} style={styles.primaryBtn}>Continuer →</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Finalize */}
          {currentStep === 3 && (
            <div style={styles.stepFormContainer}>
              <div style={styles.stepFormContent}>
                <div style={styles.stepContentCentered}>
                  <h3 style={styles.stepTitle}>Finalisation</h3>
                  <p style={styles.stepDescription}>Vérifiez et ajoutez des notes</p>
                </div>

                <div style={styles.formRow}>
                  <div style={{...styles.formGroup, flex: 1}}>
                    <label style={styles.label}>Mode de paiement</label>
                    <select
                      value={form.paymentMode}
                      onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Virement bancaire">Virement bancaire</option>
                      <option value="Carte bancaire">Carte bancaire</option>
                      <option value="Chèque">Chèque</option>
                      <option value="Espèces">Espèces</option>
                      <option value="Prélèvement">Prélèvement</option>
                    </select>
                  </div>
                  <div style={{...styles.formGroup, flex: 1}}>
                    <label style={styles.label}>Délai de paiement (jours)</label>
                    <input
                      type="number"
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: parseInt(e.target.value) || 0 })}
                      style={styles.input}
                      min="0"
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes client</label>
                  <textarea
                    value={form.clientNotes}
                    onChange={(e) => setForm({ ...form, clientNotes: e.target.value })}
                    style={styles.textarea}
                    placeholder="Notes spécifiques au client..."
                    rows={2}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes document</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    style={styles.textarea}
                    placeholder="Notes pour ce document..."
                    rows={2}
                  />
                </div>

                <div style={styles.summaryCardCompact}>
                  <div style={styles.summaryRow}>
                    <span>Client</span>
                    <span>{selectedClient?.name}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Lignes</span>
                    <span>{form.items.filter(i => i.description).length}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Sous-total HT</span>
                    <span>{formatCurrency(totals.subtotal, sellerConfig.currency)}</span>
                  </div>
                  <div style={styles.summaryRowTotal}>
                    <span>Total TTC</span>
                    <span>{formatCurrency(totals.total, sellerConfig.currency)}</span>
                  </div>
                </div>

                <div style={styles.stepNavigation}>
                  <button onClick={() => setCurrentStep(2)} style={styles.secondaryBtn}>← Retour</button>
                  <button onClick={() => setCurrentStep(4)} style={styles.primaryBtn}>Voir l'aperçu →</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div style={styles.previewStepContainer}>
              <div style={styles.a4Container}>
                {/* Document preview content */}
                <div style={styles.documentHeader}>
                  <div style={styles.companyBlock}>
                    <p style={styles.companyName}>{company.name}</p>
                    <p style={styles.companyInfo}>{company.legalStatus}</p>
                    <p style={styles.companyInfo}>{company.addressLine1}</p>
                    <p style={styles.companyInfo}>{company.addressLine2}</p>
                    <p style={styles.companyInfo}>{company.email}</p>
                    <p style={styles.companyInfo}>{company.phone}</p>
                    {company.siret && <p style={styles.companyInfo}>SIRET: {company.siret}</p>}
                    {company.taxId && <p style={styles.companyInfo}>{sellerConfig?.taxName}: {company.taxId}</p>}
                  </div>
                  <div style={styles.invoiceTitle}>
                    <h1 style={styles.documentTitle}>{form.type === 'credit' ? 'Avoir' : 'Facture'}</h1>
                    <p style={styles.invoiceNumDraft}>{form.number || 'N° à attribuer'}</p>
                  </div>
                </div>

                <div style={styles.documentMeta}>
                  <div style={styles.clientBlock}>
                    <span style={styles.metaLabel}>Facturer à</span>
                    <p style={styles.clientBlockName}>{selectedClient?.name}</p>
                    {selectedClient?.contactName && <p style={styles.clientBlockContact}>{selectedClient.contactName}</p>}
                    <p style={styles.clientBlockInfo}>{selectedClient?.addressLine1}</p>
                    <p style={styles.clientBlockInfo}>{selectedClient?.addressLine2}</p>
                    {selectedClient?.siret && <p style={styles.clientBlockInfo}>SIREN/SIRET: {selectedClient.siret}</p>}
                    {selectedClient?.vatNumber && <p style={styles.clientBlockInfo}>TVA Intracom.: {selectedClient.vatNumber}</p>}
                  </div>
                  <div style={styles.datesBlock}>
                    <div style={styles.dateItem}>
                      <span style={styles.metaLabel}>Date</span>
                      <span style={styles.dateValue}>
                        {form.date ? formatDate(form.date, sellerConfig.dateFormat) : 'À définir'}
                      </span>
                    </div>
                    <div style={styles.dateItem}>
                      <span style={styles.metaLabel}>Échéance</span>
                      <span style={styles.dateValue}>
                        {form.dueDate ? formatDate(form.dueDate, sellerConfig.dateFormat) : `${form.paymentTerms} jours`}
                      </span>
                    </div>
                  </div>
                </div>

                <table style={styles.invoiceTable}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, textAlign: 'left'}}>Description</th>
                      <th style={{...styles.tableHeader, textAlign: 'center'}}>Qté</th>
                      <th style={{...styles.tableHeader, textAlign: 'right'}}>Prix unit.</th>
                      <th style={{...styles.tableHeader, textAlign: 'center'}}>{sellerConfig?.taxName}</th>
                      <th style={{...styles.tableHeader, textAlign: 'right'}}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.filter(i => i.description).map((item, index) => (
                      <tr key={index}>
                        <td style={{...styles.tableCell, textAlign: 'left'}} dangerouslySetInnerHTML={{ __html: item.description }} />
                        <td style={{...styles.tableCell, textAlign: 'center'}}>{item.quantity}</td>
                        <td style={{...styles.tableCell, textAlign: 'right'}}>{formatCurrency(item.unitPrice, sellerConfig.currency)}</td>
                        <td style={{...styles.tableCell, textAlign: 'center'}}>{item.tax}%</td>
                        <td style={{...styles.tableCell, textAlign: 'right'}}>{formatCurrency(item.quantity * item.unitPrice * (1 + item.tax/100), sellerConfig.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={styles.documentTotals}>
                  <div style={styles.totalsTable}>
                    <div style={styles.totalsRow}>
                      <span>Sous-total HT</span>
                      <span>{formatCurrency(totals.subtotal, sellerConfig.currency)}</span>
                    </div>
                    <div style={styles.totalsRow}>
                      <span>{sellerConfig?.taxName}</span>
                      <span>{formatCurrency(totals.taxAmount, sellerConfig.currency)}</span>
                    </div>
                    <div style={styles.totalsRowFinal}>
                      <span>Total TTC</span>
                      <span>{formatCurrency(totals.total, sellerConfig.currency)}</span>
                    </div>
                  </div>
                </div>

                {(form.clientNotes || form.notes) && (
                  <div style={styles.notesSection}>
                    <p style={styles.notesTitle}>Notes</p>
                    {form.clientNotes && <p style={{...styles.notesText, whiteSpace: 'pre-wrap'}}>{form.clientNotes}</p>}
                    {form.notes && <p style={{...styles.notesText, whiteSpace: 'pre-wrap'}}>{form.notes}</p>}
                  </div>
                )}

                {company.bankName && (
                  <div style={styles.bankSection}>
                    <p style={styles.bankTitle}>Coordonnées bancaires</p>
                    <p style={styles.bankInfo}>{company.bankName}</p>
                    <p style={styles.bankInfo}>IBAN: {company.iban}</p>
                    <p style={styles.bankInfo}>BIC: {company.bic}</p>
                  </div>
                )}

                <div style={styles.a4Footer}>1/1</div>
              </div>

              <div style={styles.previewActions}>
                <button onClick={() => setCurrentStep(3)} style={styles.secondaryBtn}>← Modifier</button>
                <button onClick={() => onSave(form)} style={styles.primaryBtn}>Enregistrer le brouillon</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Form Modal */}
      {showClientForm && (
        <ClientEditorModal
          client={{}}
          onSave={async (clientData) => {
            const newClient = await onCreateClient(clientData);
            setShowClientForm(false);
            if (newClient?.id) {
              // Directly set the new client ID
              setForm({ ...form, clientId: newClient.id });
            }
          }}
          onCancel={() => setShowClientForm(false)}
        />
      )}
    </div>
  );
}

function ClientEditorModal({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    contactName: client?.contactName || '',
    email: client?.email || '',
    addressLine1: client?.addressLine1 || '',
    addressLine2: client?.addressLine2 || '',
    country: client?.country || 'FR',
    siret: client?.siret || '',
    vatNumber: client?.vatNumber || '',
    financeEmail: client?.financeEmail || '',
    defaultNotes: client?.defaultNotes || '',
    id: client?.id || null
  });

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>{client?.id ? 'Modifier le client' : 'Nouveau client'}</h2>
        <div style={styles.formGroup}>
          <label style={styles.label}>Nom / Raison sociale</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={styles.input}
            placeholder="Nom de l'entreprise"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Nom du contact</label>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            style={styles.input}
            placeholder="Prénom Nom"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={styles.input}
            placeholder="email@exemple.com"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Adresse</label>
          <input
            type="text"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            style={styles.input}
            placeholder="123 Rue de la Paix"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Code postal, Ville</label>
          <input
            type="text"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            style={styles.input}
            placeholder="75001 Paris"
          />
        </div>
        <div style={styles.formRow}>
          <div style={{...styles.formGroup, flex: 1}}>
            <label style={styles.label}>Pays</label>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              style={styles.select}
            >
              {Object.entries(countryConfigs).map(([code, cfg]) => (
                <option key={code} value={code}>{cfg.name}</option>
              ))}
            </select>
          </div>
          <div style={{...styles.formGroup, flex: 1}}>
            <label style={styles.label}>SIREN / SIRET</label>
            <input
              type="text"
              value={form.siret}
              onChange={(e) => setForm({ ...form, siret: e.target.value.replace(/\s/g, '') })}
              style={styles.input}
              placeholder="123456789"
            />
          </div>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>N° TVA intracommunautaire</label>
          <input
            type="text"
            value={form.vatNumber}
            onChange={(e) => setForm({ ...form, vatNumber: e.target.value.toUpperCase().replace(/\s/g, '') })}
            style={styles.input}
            placeholder="FR12345678901"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email finance</label>
          <input
            type="email"
            value={form.financeEmail}
            onChange={(e) => setForm({ ...form, financeEmail: e.target.value })}
            style={styles.input}
            placeholder="finance@client.com"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Notes par défaut</label>
          <textarea
            value={form.defaultNotes}
            onChange={(e) => setForm({ ...form, defaultNotes: e.target.value })}
            style={styles.textarea}
            placeholder="Notes pour ce client..."
            rows={2}
          />
        </div>
        <div style={styles.modalActions}>
          <button onClick={onCancel} style={styles.secondaryBtn}>Annuler</button>
          <button onClick={() => onSave(form)} style={styles.primaryBtn}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ company, onSave, userEmail }) {
  const [form, setForm] = useState({ ...company });
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div style={styles.content}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Paramètres</h1>
          <p style={styles.pageSubtitle}>Compte: {userEmail}</p>
        </div>
        <button onClick={() => onSave(form)} style={styles.primaryBtn}>
          Enregistrer
        </button>
      </header>

      <div style={styles.settingsTabs}>
        {[
          { id: 'company', label: 'Entreprise' },
          { id: 'bank', label: 'Banque' },
          { id: 'accounting', label: 'Comptabilité' },
          { id: 'numbering', label: 'Numérotation' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.settingsTab,
              ...(activeTab === tab.id ? styles.settingsTabActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.settingsContent}>
        {activeTab === 'company' && (
          <div style={styles.settingsSection}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom de l'entreprise</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Forme juridique</label>
                <input
                  type="text"
                  value={form.legalStatus}
                  onChange={(e) => setForm({ ...form, legalStatus: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Pays</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  style={styles.select}
                >
                  {Object.entries(countryConfigs).map(([code, cfg]) => (
                    <option key={code} value={code}>{cfg.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Adresse</label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Code postal, Ville</label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Téléphone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>SIRET</label>
                <input
                  type="text"
                  value={form.siret}
                  onChange={(e) => setForm({ ...form, siret: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>N° TVA</label>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div style={styles.settingsSection}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom de la banque</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Titulaire du compte</label>
              <input
                type="text"
                value={form.bankAccountName}
                onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>IBAN</label>
              <input
                type="text"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>BIC</label>
              <input
                type="text"
                value={form.bic}
                onChange={(e) => setForm({ ...form, bic: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
        )}

        {activeTab === 'accounting' && (
          <div style={styles.settingsSection}>
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Taux de TVA par défaut</label>
                <select
                  value={form.defaultTaxRate}
                  onChange={(e) => setForm({ ...form, defaultTaxRate: parseFloat(e.target.value) })}
                  style={styles.select}
                >
                  {(countryConfigs[form.country]?.taxOptions || [0, 5.5, 10, 20]).map(rate => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Mode de paiement</label>
                <select
                  value={form.defaultPaymentMode}
                  onChange={(e) => setForm({ ...form, defaultPaymentMode: e.target.value })}
                  style={styles.select}
                >
                  <option value="Virement bancaire">Virement bancaire</option>
                  <option value="Carte bancaire">Carte bancaire</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Prélèvement">Prélèvement</option>
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Délai de paiement (jours)</label>
                <input
                  type="number"
                  value={form.defaultPaymentTerms}
                  onChange={(e) => setForm({ ...form, defaultPaymentTerms: parseInt(e.target.value) || 30 })}
                  style={styles.input}
                />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Taux de pénalités (%)</label>
                <input
                  type="number"
                  value={form.defaultLatePenaltyRate}
                  onChange={(e) => setForm({ ...form, defaultLatePenaltyRate: parseFloat(e.target.value) || 0 })}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Conditions de paiement</label>
              <textarea
                value={form.defaultPaymentConditions}
                onChange={(e) => setForm({ ...form, defaultPaymentConditions: e.target.value })}
                style={styles.textarea}
                rows={2}
              />
            </div>
          </div>
        )}

        {activeTab === 'numbering' && (
          <div style={styles.settingsSection}>
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Préfixe factures</label>
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Préfixe avoirs</label>
                <input
                  type="text"
                  value={form.creditNotePrefix}
                  onChange={(e) => setForm({ ...form, creditNotePrefix: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Nombre de chiffres</label>
                <select
                  value={form.numberingDigits}
                  onChange={(e) => setForm({ ...form, numberingDigits: parseInt(e.target.value) })}
                  style={styles.select}
                >
                  <option value={2}>2 (01, 02...)</option>
                  <option value={3}>3 (001, 002...)</option>
                  <option value={4}>4 (0001, 0002...)</option>
                  <option value={5}>5 (00001, 00002...)</option>
                </select>
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Remise à zéro annuelle</label>
                <select
                  value={form.annualReset ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, annualReset: e.target.value === 'true' })}
                  style={styles.select}
                >
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            </div>
            <div style={styles.previewBox}>
              <p style={styles.previewLabel}>Aperçu:</p>
              <p style={styles.previewValue}>
                {form.invoicePrefix}-{new Date().getFullYear()}-{'0'.repeat(form.numberingDigits - 1)}1
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8f8f8',
    fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  sidebar: {
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  collapseBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  logo: {
    fontFamily: "'Lora', serif",
    fontSize: '22px',
    fontWeight: 600,
    margin: 0,
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    color: '#999',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    background: '#333',
    color: '#fff',
  },
  navIcon: {
    fontSize: '19px',
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  settingsBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'left',
  },
  main: {
    flex: 1,
    marginLeft: '240px',
    transition: 'margin-left 0.2s ease',
  },
  content: {
    padding: '32px 40px',
    maxWidth: '1200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  pageTitle: {
    fontFamily: "'Lora', serif",
    fontSize: '28px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: '#1a1a1a',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  primaryBtn: {
    padding: '12px 24px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '12px 24px',
    background: '#fff',
    color: '#1a1a1a',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 12px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 0',
  },
  notification: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '14px 24px',
    background: '#1a1a1a',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #eee',
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 600,
    color: '#1a1a1a',
    fontFamily: "'Lora', serif",
  },
  statMeta: {
    display: 'block',
    fontSize: '13px',
    color: '#999',
    marginTop: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #eee',
  },
  emptyText: {
    fontSize: '18px',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  invoiceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  invoiceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #eee',
    transition: 'all 0.15s ease',
  },
  invoiceActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    transition: 'background 0.15s ease',
    color: '#1a1a1a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  invoiceType: {
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '4px',
  },
  invoiceNumber: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  invoiceClient: {
    fontSize: '14px',
    color: '#666',
  },
  invoiceMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  invoiceStatus: {
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '4px',
  },
  invoiceDate: {
    fontSize: '13px',
    color: '#999',
  },
  invoiceAmount: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    minWidth: '100px',
    textAlign: 'right',
  },
  clientGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  clientCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #eee',
  },
  clientHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    color: '#1a1a1a',
  },
  clientCountry: {
    fontSize: '12px',
    color: '#999',
    background: '#f5f5f5',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  clientEmail: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 8px 0',
  },
  clientAddress: {
    fontSize: '13px',
    color: '#999',
    margin: '0 0 4px 0',
  },
  clientTaxId: {
    fontSize: '13px',
    color: '#666',
    margin: '8px 0 0 0',
  },
  clientStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #eee',
  },
  clientActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontFamily: "'Lora', serif",
    fontSize: '22px',
    fontWeight: 600,
    margin: '0 0 24px 0',
    color: '#1a1a1a',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '-16px 0 24px 0',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  // Creator styles
  creatorOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#f8f8f8',
    zIndex: 200,
    overflow: 'auto',
  },
  creatorContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  creatorHeader: {
    background: '#fff',
    borderBottom: '1px solid #eee',
    padding: '20px 40px',
  },
  creatorTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  creatorTitle: {
    fontFamily: "'Lora', serif",
    fontSize: '24px',
    fontWeight: 600,
    margin: 0,
    color: '#1a1a1a',
  },
  creatorClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#999',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  stepsRow: {
    display: 'flex',
    gap: '8px',
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
  },
  stepIndicatorActive: {
    background: '#1a1a1a',
    color: '#fff',
  },
  stepIndicatorCompleted: {
    background: '#e8f5e9',
    color: '#2e7d32',
  },
  stepNum: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'currentColor',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 600,
  },
  stepLabel: {
    fontWeight: 500,
  },
  creatorContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  stepFormContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  stepFormContent: {
    width: '100%',
    maxWidth: '700px',
  },
  stepContentCentered: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  stepContentWide: {
    width: '100%',
    maxWidth: '900px',
  },
  stepIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  stepTitle: {
    fontFamily: "'Lora', serif",
    fontSize: '24px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1a1a1a',
  },
  stepDescription: {
    fontSize: '15px',
    color: '#666',
    margin: 0,
  },
  stepHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  stepTotalBadge: {
    background: 'transparent',
    color: '#1a1a1a',
    border: '1px solid #1a1a1a',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
  },
  selectLarge: {
    display: 'block',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
    padding: '16px 20px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    background: '#fff',
  },
  selectedClientCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    margin: '24px auto 0',
    textAlign: 'left',
  },
  selectedClientBadges: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  selectedClientBadge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '4px',
    background: '#e8f5e9',
    color: '#2e7d32',
  },
  transactionTypeBadge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '4px',
    background: '#fff3e0',
    color: '#e65100',
  },
  selectedClientName: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1a1a1a',
  },
  selectedClientInfo: {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0',
  },
  taxNotice: {
    background: '#fff8e1',
    border: '1px solid #ffecb3',
    color: '#f57c00',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  lineItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  lineItemCardCompact: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #eee',
  },
  lineItemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginTop: '16px',
  },
  formGroupSmall: {
    marginBottom: 0,
  },
  labelSmall: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#666',
    marginBottom: '6px',
  },
  inputSmall: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  selectSmall: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  },
  descriptionTextarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none',
    overflow: 'hidden',
    minHeight: '68px',
    lineHeight: 1.4,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },
  lineItemTotalValue: {
    padding: '10px 12px',
    background: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  removeItemBtn: {
    background: 'none',
    border: 'none',
    color: '#e53935',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '8px 0',
    marginTop: '12px',
  },
  addItemBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    background: 'none',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    marginTop: '16px',
  },
  defaultsCard: {
    background: '#f5f5f5',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    margin: '0 auto 24px',
  },
  defaultsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  defaultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  defaultsLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#999',
  },
  defaultsValue: {
    display: 'block',
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: 500,
    marginTop: '4px',
  },
  summaryCardCompact: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px 24px',
    maxWidth: '400px',
    margin: '24px auto 0',
    color: '#fff',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
  },
  summaryRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    marginTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    fontSize: '18px',
    fontWeight: 600,
  },
  stepNavigation: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'space-between',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #eee',
  },
  previewStepContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
  },
  previewDocument: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '48px',
    width: '100%',
    maxWidth: '800px',
  },
  previewActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '32px',
  },
  // Document styles
  documentPreview: {
    background: '#fff',
    borderRadius: '12px',
    padding: '48px',
    maxWidth: '800px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  documentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '40px',
  },
  companyBlock: {},
  companyName: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: '#1a1a1a',
  },
  companyInfo: {
    fontSize: '13px',
    color: '#666',
    margin: '2px 0',
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  documentTitle: {
    fontFamily: "'Lora', serif",
    fontSize: '28px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1a1a1a',
  },
  invoiceNum: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  invoiceNumDraft: {
    fontSize: '16px',
    color: '#999',
    fontStyle: 'italic',
    margin: 0,
  },
  documentMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  clientBlock: {},
  metaLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  clientBlockName: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: '#1a1a1a',
  },
  clientBlockContact: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 4px 0',
  },
  clientBlockInfo: {
    fontSize: '13px',
    color: '#666',
    margin: '2px 0',
  },
  datesBlock: {
    textAlign: 'right',
  },
  dateItem: {
    marginBottom: '12px',
  },
  dateValue: {
    display: 'block',
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: 500,
  },
  transactionIndicatorDoc: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '8px',
  },
  transactionBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '4px',
    background: '#fff3e0',
    color: '#e65100',
    textTransform: 'uppercase',
  },
  transactionMention: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
  },
  itemsTableDoc: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
  },
  invoiceTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
  },
  tableHeader: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '12px 8px',
    borderBottom: '2px solid #eee',
    textAlign: 'left',
  },
  tableCell: {
    fontSize: '14px',
    color: '#1a1a1a',
    padding: '14px 8px',
    borderBottom: '1px solid #f0f0f0',
  },
  documentTotals: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  totalsTable: {
    width: '280px',
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#666',
  },
  totalsRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
    borderTop: '2px solid #1a1a1a',
    marginTop: '8px',
    fontFamily: "'Lora', serif",
  },
  notesSection: {
    position: 'absolute',
    bottom: '25mm',
    left: '20mm',
    right: '20mm',
    paddingTop: '24px',
    borderTop: '1px solid #eee',
  },
  notesTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#999',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0',
    lineHeight: 1.5,
  },
  bankSection: {
    position: 'absolute',
    bottom: '60mm',
    left: '20mm',
    right: '20mm',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
  },
  bankTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#999',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
  },
  bankInfo: {
    fontSize: '13px',
    color: '#1a1a1a',
    margin: '4px 0',
  },
  // Settings styles
  settingsTabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid #eee',
    paddingBottom: '16px',
  },
  settingsTab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
  },
  settingsTabActive: {
    background: '#1a1a1a',
    color: '#fff',
  },
  settingsContent: {
    background: '#fff',
    borderRadius: '12px',
    padding: '32px',
    border: '1px solid #eee',
  },
  settingsSection: {
    maxWidth: '600px',
  },
  previewBox: {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '24px',
  },
  previewLabel: {
    fontSize: '12px',
    color: '#999',
    margin: '0 0 8px 0',
  },
  previewValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
    fontFamily: "'Lora', serif",
    margin: 0,
  },
  // Expenses styles
  driveConnectCard: {
    textAlign: 'center',
    padding: '80px 40px',
    background: '#fff',
    borderRadius: '16px',
    border: '2px dashed #e0e0e0',
    maxWidth: '500px',
    margin: '40px auto',
  },
  driveConnectIcon: {
    marginBottom: '24px',
  },
  driveConnectTitle: {
    fontFamily: "'Lora', serif",
    fontSize: '24px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 12px 0',
  },
  driveConnectText: {
    fontSize: '15px',
    color: '#666',
    lineHeight: 1.6,
    margin: '0 0 32px 0',
  },
  driveConnectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 28px',
    background: '#4285f4',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  expensesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  collaboratorsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#f5f5f5',
    borderRadius: '8px',
  },
  collaboratorsLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
  },
  collaboratorsList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  collaboratorChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '20px',
    fontSize: '13px',
  },
  collaboratorAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 500,
  },
  collaboratorEmail: {
    color: '#1a1a1a',
  },
  collaboratorRemove: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 4px',
  },
  sectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  sectionCard: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  sectionCardDragOver: {
    borderColor: '#4285f4',
    boxShadow: '0 0 0 3px rgba(66, 133, 244, 0.2)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionIcon: {
    fontSize: '18px',
  },
  sectionName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  sectionCount: {
    fontSize: '12px',
    color: '#999',
    background: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  sectionDeleteBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px 8px',
  },
  sectionDropzone: {
    padding: '20px',
    minHeight: '150px',
  },
  dropzoneText: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    padding: '40px 20px',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    margin: 0,
  },
  documentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  documentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f8f8f8',
    borderRadius: '8px',
  },
  documentIcon: {
    fontSize: '20px',
  },
  documentInfo: {
    flex: 1,
    minWidth: 0,
  },
  documentName: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  expenseDocMeta: {
    display: 'block',
    fontSize: '12px',
    color: '#999',
    marginTop: '2px',
  },
  syncStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    fontSize: '13px',
    color: '#2e7d32',
    background: '#e8f5e9',
    borderRadius: '8px',
  },
  syncIcon: {
    fontSize: '14px',
  },
  // A4 Document styles
  a4Container: {
    width: '210mm',
    minHeight: '297mm',
    background: '#fff',
    margin: '20px auto',
    padding: '20mm',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    boxSizing: 'border-box',
    position: 'relative',
  },
  a4Footer: {
    position: 'absolute',
    bottom: '15mm',
    right: '20mm',
    fontSize: '11px',
    color: '#999',
  },
  a4BottomSection: {
    position: 'absolute',
    bottom: '25mm',
    left: '20mm',
    right: '20mm',
  },
};
