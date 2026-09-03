const API_BASE = '/api';

interface ApiOptions extends RequestInit {
  token?: string;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.clone().json().catch(() => null);
  return new Error(payload?.error || `${fallback} (HTTP ${response.status})`);
}

async function downloadResponse(response: Response, filename: string, expectedType?: string) {
  if (!response.ok) throw await responseError(response, 'Gagal mengunduh file');

  const contentType = response.headers.get('content-type') || '';
  if (expectedType && !contentType.includes(expectedType)) {
    throw new Error('Server tidak mengirim format file yang benar');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1_000);
}

async function openAuthenticatedHtml(endpoint: string, token: string, fallbackFilename: string) {
  // Buka tab sebelum await agar tidak diblokir popup blocker browser.
  const preview = window.open('about:blank', '_blank');
  if (preview) {
    preview.document.title = 'Memuat invoice...';
    preview.document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px">Memuat invoice...</p>';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw await responseError(response, 'Gagal membuka invoice');

    const html = await response.text();
    const url = window.URL.createObjectURL(new Blob([html], { type: 'text/html' }));

    if (preview) {
      preview.location.replace(url);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      return;
    }

    // Jika popup diblokir, unduh versi HTML agar invoice tetap bisa diakses.
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fallbackFilename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1_000);
  } catch (error) {
    preview?.close();
    throw error;
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { email: string; password: string; name: string; role?: string }) =>
      apiRequest<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: (token: string) =>
      apiRequest<{ user: any }>('/auth/me', { token }),
  },

  orders: {
    list: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{ orders: any[]; pagination: any }>(`/orders${query}`, { token });
    },
    get: (token: string, id: string) =>
      apiRequest<any>(`/orders/${id}`, { token }),
    create: (token: string, data: any) =>
      apiRequest<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    updateStatus: (token: string, id: string, data: { status: string; notes?: string }) =>
      apiRequest<any>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    updatePayment: (token: string, id: string, data: any) =>
      apiRequest<any>(`/orders/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    delete: (token: string, id: string) =>
      apiRequest<any>(`/orders/${id}`, {
        method: 'DELETE',
        token,
      }),
    update: (token: string, id: string, data: any) =>
      apiRequest<any>(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    updateMaterials: (token: string, id: string, materials: any[]) =>
      apiRequest<any>(`/orders/${id}/materials`, {
        method: 'PUT',
        body: JSON.stringify({ materials }),
        token,
      }),
  },

  customers: {
    list: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{ customers: any[]; pagination: any }>(`/customers${query}`, { token });
    },
    get: (token: string, id: string) =>
      apiRequest<any>(`/customers/${id}`, { token }),
    create: (token: string, data: any) =>
      apiRequest<any>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (token: string, id: string, data: any) =>
      apiRequest<any>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (token: string, id: string) =>
      apiRequest<any>(`/customers/${id}`, {
        method: 'DELETE',
        token,
      }),
    exportPdf: async (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE}/customers/export/pdf${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to export PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-pelanggan-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  },

  dashboard: {
    stats: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/dashboard/stats${query}`, { token });
    },
    recentOrders: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{ orders: any[] }>(`/dashboard/recent-orders${query}`, { token });
    },
    productionOverview: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{ statusCounts: any[] }>(`/dashboard/production-overview${query}`, { token });
    },
    productAnalytics: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{
        productSales: { productName: string; totalQuantity: number; totalRevenue: number; orderCount: number }[];
        productCategorySales: { productCategory: string; totalQuantity: number; totalRevenue: number; orderCount: number }[];
        colorSales: { color: string; totalQuantity: number }[];
      }>(`/dashboard/product-analytics${query}`, { token });
    },
    exportExcel: async (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE}/dashboard/export/excel${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to export Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-dashboard-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    exportPdf: async (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE}/dashboard/export/pdf${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to export PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-dashboard-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  },

  tracking: {
    get: (trackingCode: string) =>
      apiRequest<any>(`/track/${trackingCode}`),
  },

  testimonials: {
    create: (data: any) =>
      apiRequest<any>('/testimonials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    published: () =>
      apiRequest<{ testimonials: any[] }>('/testimonials/published'),
  },

  invoices: {
    getPaymentInvoices: (token: string, orderId: string) =>
      apiRequest<any[]>(`/invoice/${orderId}/payment-invoices`, { token }),
    downloadOrderInvoiceHtml: (token: string, orderId: string) =>
      openAuthenticatedHtml(`/invoice/${orderId}/html`, token, `invoice-${orderId}.html`),
    downloadOrderInvoicePdf: async (token: string, orderId: string, invoiceNumber: string) => {
      const response = await fetch(`${API_BASE}/invoice/${orderId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await downloadResponse(response, `${invoiceNumber}.pdf`, 'application/pdf');
    },
    downloadPaymentInvoiceHtml: (token: string, invoiceId: string) =>
      openAuthenticatedHtml(`/invoice/payment/${invoiceId}/html`, token, `kwitansi-${invoiceId}.html`),
    downloadPaymentInvoicePdf: async (token: string, invoiceId: string) => {
      const response = await fetch(`${API_BASE}/invoice/payment/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await downloadResponse(response, `invoice-${invoiceId}.pdf`, 'application/pdf');
    },
    downloadBillingInvoiceHtml: (token: string, orderId: string, type: 'dp' | 'pelunasan') =>
      openAuthenticatedHtml(`/invoice/${orderId}/billing/${type}/html`, token, `tagihan-${type}-${orderId}.html`),
    downloadBillingInvoicePdf: async (token: string, orderId: string, type: 'dp' | 'pelunasan') => {
      const response = await fetch(`${API_BASE}/invoice/${orderId}/billing/${type}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await downloadResponse(response, `tagihan-${type}-${orderId}.pdf`, 'application/pdf');
    },
  },

  payments: {
    manual: (token: string, data: { orderId: string; amount: number; paymentMethod: string }) =>
      apiRequest<any>('/payments/manual', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  expenses: {
    list: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{ expenses: any[]; pagination: any; summary: any }>(`/expenses${query}`, { token });
    },
    get: (token: string, id: string) =>
      apiRequest<any>(`/expenses/${id}`, { token }),
    create: (token: string, data: any) =>
      apiRequest<any>('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (token: string, id: string, data: any) =>
      apiRequest<any>(`/expenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    delete: (token: string, id: string) =>
      apiRequest<any>(`/expenses/${id}`, {
        method: 'DELETE',
        token,
      }),
    getCustomers: (token: string) =>
      apiRequest<any[]>('/expenses/customers', { token }),
    getOrdersByCustomer: (token: string, customerId: string) =>
      apiRequest<any[]>(`/expenses/orders/${customerId}`, { token }),
    exportPdf: async (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE}/expenses/export/pdf${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to export PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-pengeluaran-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  },

  inventory: {
    list: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{ materials: any[]; categories: string[]; summary: any }>(`/inventory${query}`, { token });
    },
    create: (token: string, data: any) =>
      apiRequest<any>('/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (token: string, id: string, data: any) =>
      apiRequest<any>(`/inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    delete: (token: string, id: string) =>
      apiRequest<any>(`/inventory/${id}`, {
        method: 'DELETE',
        token,
      }),
    movements: (token: string, id: string) =>
      apiRequest<{ movements: any[] }>(`/inventory/${id}/movements`, { token }),
    createMovement: (token: string, id: string, data: any) =>
      apiRequest<any>(`/inventory/${id}/movements`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  financialReports: {
    get: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/financial-reports${query}`, { token });
    },
  },

  aiAssistant: {
    chat: (token: string, data: { question: string; history: Array<{ role: 'user' | 'assistant'; content: string }> }) =>
      apiRequest<{ answer: string; model: string; generatedAt: string }>('/ai-assistant/chat', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  auditLogs: {
    list: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<{ logs: any[]; pagination: any }>(`/audit-logs${query}`, { token });
    },
    stats: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/audit-logs/stats${query}`, { token });
    },
    get: (token: string, id: string) =>
      apiRequest<any>(`/audit-logs/${id}`, { token }),
    getUsers: (token: string) =>
      apiRequest<any[]>('/audit-logs/users', { token }),
  },

  users: {
    list: (token: string) =>
      apiRequest<{ users: any[]; availablePermissions: string[] }>('/auth/users', { token }),
    create: (token: string, data: { email: string; password: string; name: string; role?: string; permissions?: string[] }) =>
      apiRequest<{ message: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (token: string, id: string, data: { email?: string; password?: string; name?: string; role?: string; permissions?: string[] }) =>
      apiRequest<{ message: string; user: any }>(`/auth/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    delete: (token: string, id: string) =>
      apiRequest<{ message: string }>(`/auth/users/${id}`, {
        method: 'DELETE',
        token,
      }),
  },
};
