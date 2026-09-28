'use server';

export interface StoreDetailsInput {
  storeName: string;
  phone?: string;
  email?: string;
  gstin: string;
  address?: string;
}

function isAdminRole(userRole?: string) {
  return userRole === 'ADMIN' || userRole === 'Admin';
}

export async function updateStoreDetails(data: StoreDetailsInput, userRole?: string) {
  if (!isAdminRole(userRole)) {
    return {
      success: false,
      error: '403 Forbidden: Only administrators can update store details.',
    };
  }

  const storeName = data.storeName?.trim();
  const gstin = data.gstin?.trim();
  if (!storeName || !gstin) {
    return { success: false, error: 'Store name and GSTIN are required.' };
  }

  return {
    success: true,
    settings: {
      storeName,
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      gstin,
      address: data.address?.trim() || '',
    },
  };
}
