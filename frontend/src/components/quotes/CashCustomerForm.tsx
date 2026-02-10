'use client';

import { User, Phone, Mail, Building2, Receipt, MapPin } from 'lucide-react';
import { useQuoteCompanyStore } from '@/stores/quote-company-store';

/**
 * Inline form for capturing cash customer details when a cash account company is selected.
 * All fields except Name are optional. Data is stored in the Zustand quote company store.
 */
export function CashCustomerForm(): JSX.Element {
  const { cashCustomer, setCashCustomer } = useQuoteCompanyStore();

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
      <p className="text-xs font-medium text-green-800 uppercase tracking-wide">
        Cash Customer Details
      </p>

      <div className="grid grid-cols-2 gap-2">
        {/* Name — required */}
        <div className="col-span-2">
          <label className="sr-only" htmlFor="cashName">Customer Name</label>
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
            <input
              id="cashName"
              type="text"
              placeholder="Customer name *"
              value={cashCustomer.cashCustomerName}
              onChange={(e) => setCashCustomer({ cashCustomerName: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="sr-only" htmlFor="cashPhone">Phone</label>
          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
            <input
              id="cashPhone"
              type="tel"
              placeholder="Phone"
              value={cashCustomer.cashCustomerPhone}
              onChange={(e) => setCashCustomer({ cashCustomerPhone: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="sr-only" htmlFor="cashEmail">Email</label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
            <input
              id="cashEmail"
              type="email"
              placeholder="Email"
              value={cashCustomer.cashCustomerEmail}
              onChange={(e) => setCashCustomer({ cashCustomerEmail: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="sr-only" htmlFor="cashCompany">Company Name</label>
          <div className="relative">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
            <input
              id="cashCompany"
              type="text"
              placeholder="Company name"
              value={cashCustomer.cashCustomerCompany}
              onChange={(e) => setCashCustomer({ cashCustomerCompany: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* VAT Number */}
        <div>
          <label className="sr-only" htmlFor="cashVat">VAT Number</label>
          <div className="relative">
            <Receipt className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
            <input
              id="cashVat"
              type="text"
              placeholder="VAT number"
              value={cashCustomer.cashCustomerVat}
              onChange={(e) => setCashCustomer({ cashCustomerVat: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Address */}
        <div className="col-span-2">
          <label className="sr-only" htmlFor="cashAddress">Address</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-3 h-3.5 w-3.5 text-green-500" />
            <textarea
              id="cashAddress"
              placeholder="Delivery / billing address"
              value={cashCustomer.cashCustomerAddress}
              onChange={(e) => setCashCustomer({ cashCustomerAddress: e.target.value })}
              rows={2}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
