import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import logo6 from '../assets/logo6.png';
import banner from '../assets/banner.png';
import jsPDF from 'jspdf';
import { 
  Download, 
  Plus, 
  Trash2, 
  Save,
  User,
  FileText,
  Calendar,
  IndianRupee
} from 'lucide-react';

const QuotationForm = ({ addQuotation, quotations, updateQuotation }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const isEditing = !!id;
  const existingQuotation = quotations?.find(q => q.id === id);

  const [formData, setFormData] = useState({
    clientName: '',
    quotationNo: '',
    folderName: '',
    printNumber: '',
    items: [
      { sr: 1, productName: '', qnty: 1, rate: 0, amount: 0 }
    ],
    advanceChecked: false,
    dueChecked: false,
    advanceAmount: '',
    creditAmount: '',
    // phoneNumber is set dynamically
  });

  // New state to control invoice view after save
  const [showInvoice, setShowInvoice] = useState(false);
  // Store the data to show in invoice (so it doesn't reset on form clear)
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    if (isEditing && existingQuotation) {
      setFormData({
        clientName: existingQuotation.clientName,
        quotationNo: existingQuotation.quotationNo || '',
        folderName: existingQuotation.folderName || '',
        printNumber: existingQuotation.printNumber || '',
        items: existingQuotation.items,
        advanceChecked: existingQuotation.advanceChecked || false,
        dueChecked: existingQuotation.dueChecked || false,
        phoneNumber: existingQuotation.phoneNumber || '',
        advanceAmount: existingQuotation.advanceAmount || '',
        creditAmount: existingQuotation.creditAmount || '',
      });
    }
  }, [isEditing, existingQuotation]);

  // Function to format number with Indian number system
  const formatIndianNumber = (num) => {
    const number = parseInt(num);
    if (isNaN(number)) return '0';
    return number.toLocaleString('en-IN');
  };

  const calculateAmount = (qnty, rate) => {
    return qnty * rate;
  };

  const calculateTotal = (items = formData.items) => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const handleClientNameChange = (e) => {
    setFormData(prev => ({
      ...prev,
      clientName: e.target.value
    }));
  };

  const handleQuotationNoChange = (e) => {
    setFormData(prev => ({
      ...prev,
      quotationNo: e.target.value
    }));
  };

  const handleFolderNameChange = (e) => {
    setFormData(prev => ({
      ...prev,
      folderName: e.target.value
    }));
  };

  const handlePrintNumberChange = (e) => {
    setFormData(prev => ({
      ...prev,
      printNumber: e.target.value
    }));
  };

  // Advance and Credit logic (allow both to be ticked and written at once)
  const handleAdvanceChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      advanceChecked: checked,
      // If checked and empty, set default to total; if not checked, set to 0
      advanceAmount: checked
        ? (!prev.advanceAmount ? calculateTotal().toString() : prev.advanceAmount)
        : '0'
    }));
  };

  const handleDueChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      dueChecked: checked,
      // If checked and empty, set default to total; if not checked, set to 0
      creditAmount: checked
        ? (!prev.creditAmount ? calculateTotal().toString() : prev.creditAmount)
        : '0'
    }));
  };

  // Allow manual editing of advance/credit if needed
  const handleAdvanceAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      advanceAmount: value
    }));
  };

  const handleCreditAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      creditAmount: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Recalculate amount if qnty or rate changed
    if (field === 'qnty' || field === 'rate') {
      newItems[index].amount = calculateAmount(
        parseFloat(newItems[index].qnty) || 0,
        parseFloat(newItems[index].rate) || 0
      );
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        sr: prev.items.length + 1,
        productName: '',
        qnty: 1,
        rate: 0,
        amount: 0
      }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      // Update serial numbers
      const updatedItems = newItems.map((item, i) => ({
        ...item,
        sr: i + 1
      }));
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.clientName.trim()) {
      alert('Please enter client name');
      return;
    }

    if (!formData.quotationNo.trim()) {
      alert('Please enter quotation number');
      return;
    }

    if (!formData.folderName.trim()) {
      alert('Please enter folder name');
      return;
    }

    if (!formData.printNumber.trim()) {
      alert('Please enter print number');
      return;
    }
    
    if (formData.items.some(item => !item.productName.trim())) {
      alert('Please fill in all product names');
      return;
    }

    // No longer exclusive: both advance and credit can be ticked and written at once
    const total = calculateTotal();
    // If not checked, set to 0; if checked, use value or total
    const advanceAmount = formData.advanceChecked
      ? (formData.advanceAmount || total.toString())
      : '0';
    const creditAmount = formData.dueChecked
      ? (formData.creditAmount || total.toString())
      : '0';

    const quotationData = {
      ...formData,
      total: total,
      advanceAmount,
      creditAmount,
    };

    if (isEditing) {
      updateQuotation(id, quotationData);
      alert('Quotation updated successfully!');
      navigate('/history');
    } else {
      addQuotation(quotationData);
      // Show invoice after save
      setInvoiceData(quotationData);
      setShowInvoice(true);
      // Do not reset formData here, as we want to show the invoice
    }
  };

  // This function is used for both the hidden and visible invoice
  const generatePDF = async (data = null) => {
    // Use data if provided (for invoice view), else use formData
    const usedData = data || formData;
    if (!usedData.clientName.trim()) {
      alert('Please enter client name before generating PDF');
      return;
    }

    if (!usedData.quotationNo.trim()) {
      alert('Please enter quotation number before generating PDF');
      return;
    }

    if (!usedData.folderName || !usedData.folderName.trim()) {
      alert('Please enter folder name before generating PDF');
      return;
    }

    if (!usedData.printNumber || !usedData.printNumber.trim()) {
      alert('Please enter print number before generating PDF');
      return;
    }

    if (usedData.items.some(item => !item.productName.trim())) {
      alert('Please fill in all product names before generating PDF');
      return;
    }

    try {
      // If in invoice view, use visible ref, else use hidden ref
      const ref = data ? printRef : printRef;
      const canvas = await html2canvas(ref.current, {
        scale: 3,
        letterRendering: true,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297;// A4 height in mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Use the user-entered quotation number for the filename
      const safeQuotationNo = usedData.quotationNo.replace(/[^a-zA-Z0-9_-]/g, '');
      pdf.save(`quotation-${safeQuotationNo || 'Q' + String(Date.now()).slice(-6)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const total = calculateTotal();
  const currentDate = new Date().toLocaleDateString('en-GB');
  // Use the user-entered quotation number for display in PDF
  const quotationNo = formData.quotationNo;

  // For invoice view, use invoiceData and its total
  const invoiceTotal = invoiceData ? invoiceData.total : 0;
  const invoiceCurrentDate = new Date().toLocaleDateString('en-GB');
  const invoiceQuotationNo = invoiceData ? invoiceData.quotationNo : '';

  // Invoice layout as a component for reuse
  const InvoiceLayout = React.forwardRef(({ data }, ref) => {
    // Show both advance and credit if ticked and written
    const showAdvance = data.advanceChecked && data.advanceAmount && parseInt(data.advanceAmount) > 0;
    const showCredit = data.dueChecked && data.creditAmount && parseInt(data.creditAmount) > 0;
    return (
      <div ref={ref} className="bg-white p-8 w-[700px] mx-auto">
        {/* Header Section */}
        <div className="border border-black p-0">
          <img
            src={banner}
            alt="Banner"
            className="w-full h-[90px] object-cover"
            style={{ objectFit: 'cover', width: '100%', height: '190px' }}
          />
        </div>

        {/* Client & Quotation Details Section */}

        <div className="border-t-0  border-b-0 border border-black p-4">
          <div className="grid grid-cols-2 gap-0">
            <div className="pl-2">
              <p className="text-lg text-black">
                <span className="font-semibold">Name:</span> {data.clientName}
              </p>
              <p className="text-lg text-black mt-2">
                <span className="font-semibold">Mobile:</span> {data.phoneNumber || ''}
              </p>
            </div>
            <div className="pl-6">
              <div className="mb-2">
                <p className="text-lg text-black">
                  <span className="font-semibold">Recipt No:</span> {data.quotationNo}
                </p>
              </div>
              <div>
                <p className="text-lg text-black">
                  <span className="font-semibold">Date:</span> {invoiceCurrentDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product/Service Table */}
        <div className="">
          <table className="w-full">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-b-0 border-r-0 border-black px-3 py-4 text-left text-lg font-semibold text-black">Sr.</th>
                <th className="border border-b-0 border-r-0 border-black px-3 py-4 text-left text-lg font-semibold text-black">Product Name</th>
                <th className="border border-b-0 border-r-0 border-black px-3 py-4 text-left text-lg font-semibold text-black">Qnty</th>
                <th className="border border-b-0 border-r-0 border-black px-3 py-4 text-left text-lg font-semibold text-black">Rate</th>
                <th className="border border-b-0  border-black px-3 py-4 text-left text-lg font-semibold text-black">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Only entered items have full border */}
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-b-0 border-r-0 border-black px-3 py-4 text-lg text-black font-semibold">{item.sr}</td>
                  <td className="border border-b-0 border-r-0 border-black px-3 py-4 text-lg text-black font-semibold">{item.productName}</td>
                  <td className="border border-b-0 border-r-0 border-black px-3 py-4 text-lg text-black font-semibold">{item.qnty}</td>
                  <td className="border border-b-0 border-r-0 border-black px-3 py-4 text-lg text-black font-semibold">₹{item.rate.toFixed(2)}</td>
                  <td className="border border-b-0 border-black px-3 py-4 text-lg text-black font-semibold">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              {/* Empty rows: only left, right, and top border, no bottom border */}
              {Array.from({ length: Math.max(0, 10 - data.items.length) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="border-l border-r-0 border-black px-3 py-4 text-lg text-black"></td>
                  <td className="border-l border-r-0 border-black px-3 py-4 text-lg text-black"></td>
                  <td className="border-l border-r-0 border-black px-3 py-4 text-lg text-black"></td>
                  <td className="border-l border-r-0 border-black px-3 py-4 text-lg text-black"></td>
                  <td className="border-r border-l border-black px-3 py-4 text-lg text-black"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Merged Total & Footer Section */}
        <div className="border border-black p-6 flex flex-col items-end gap-2 w-full relative">
          {/* Small left-side box as in the image */}
          <div
            className="absolute left-0 top-0 m-4"
            style={{
              border: '2px solid black',
              padding: '6px 18px 6px 10px',
              background: 'white',
              fontSize: '0.95rem',
              minWidth: 210,
              maxWidth: 260,
              lineHeight: 1.25,
              fontWeight: 500,
              letterSpacing: 0.1,
            }}
          >
            <div>
              <span className="font-semibold">Folder :</span>
              <span className="font-bold ml-1">{data.folderName || '_________'}</span>
            </div>
            <div className="mt-1">
              <span className="font-semibold">Print No. :-</span>
              <span className="ml-1" style={{ fontFamily: 'monospace', fontWeight: 400, fontSize: '1.05em' }}>{data.printNumber || '_________'}</span>
            </div>
          </div>
          <div className="flex flex-row gap-8 w-full justify-end">
            <div className="font-bold text-lg min-w-[120px] text-right">Total Amount:</div>
            <div className="font-bold text-lg min-w-[120px] text-right">
              {(() => {
                const total = data.total || 0;
                return total.toFixed(2);
              })()}
            </div>
          </div>
          <div className="flex flex-row gap-8 w-full justify-end">
            <div className="font-bold text-lg min-w-[120px] text-right">Advance:</div>
            <div className="font-bold text-lg min-w-[120px] text-right">{showAdvance ? parseFloat(data.advanceAmount).toFixed(2) : '0.00'}</div>
          </div>
          <div className="flex flex-row gap-8 w-full justify-end">
            <div className="font-bold text-lg min-w-[120px] text-right">Credit:</div>
            <div className="font-bold text-lg min-w-[120px] text-right">{showCredit ? parseFloat(data.creditAmount).toFixed(2) : '0.00'}</div>
          </div>
        </div>
      </div>
    );
  });

  // If showInvoice is true, show the invoice and download button
  if (showInvoice && invoiceData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quotation Invoice</h2>
            <p className="text-gray-600 mb-4">Below is your saved quotation invoice. You can download it as PDF.</p>
            <button
              type="button"
              onClick={() => generatePDF(invoiceData)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-4"
            >
              <Download className="h-5 w-5" />
              <span>Download Invoice PDF</span>
            </button>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowInvoice(false);
                  setFormData({
                    clientName: '',
                    quotationNo: '',
                    folderName: '',
                    printNumber: '',
                    items: [
                      { sr: 1, productName: '', qnty: 1, rate: 0, amount: 0 }
                    ],
                    advanceChecked: false,
                    dueChecked: false,
                    advanceAmount: '',
                    creditAmount: '',
                  });
                  setInvoiceData(null);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <span>New Quotation</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInvoice(false)}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <span>Back to Form</span>
              </button>
            </div>
          </div>
          {/* Visible Invoice */}
          <div className="shadow-lg border border-gray-300 rounded-lg bg-white">
            <InvoiceLayout ref={printRef} data={invoiceData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
          {isEditing ? 'Edit Quotation' : 'Create New Quotation'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Quotation Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Quotation Number *
            </label>
            <input
              type="text"
              value={formData.quotationNo}
              onChange={handleQuotationNoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter quotation number"
              required
            />
          </div>
          {/* Folder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Folder Name *
            </label>
            <input
              type="text"
              value={formData.folderName}
              onChange={handleFolderNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter folder name (e.g. 29.02.2024 A JOB)"
              required
            />
          </div>
          {/* Print Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Print Number *
            </label>
            <input
              type="text"
              value={formData.printNumber}
              onChange={handlePrintNumberChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter print number (e.g. 288-129-04)"
              required
            />
          </div>
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={handleClientNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter client name"
              required
            />
          </div>
          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={e => {
                // Only allow numbers in the input
                const onlyNums = e.target.value.replace(/\D/g, '');
                if (typeof handleClientMobileChange === 'function') {
                  // If a handler is provided, call it with a synthetic event with only numbers
                  handleClientMobileChange({
                    ...e,
                    target: {
                      ...e.target,
                      value: onlyNums
                    }
                  });
                } else {
                  setFormData(prev => ({ ...prev, phoneNumber: onlyNums }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter mobile number"
              required
              pattern="[0-9]{10,15}"
              maxLength={15}
              inputMode="numeric"
              autoComplete="tel"
            />
          </div>

          {/* Items Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-xs sm:text-sm border-collapse">
                <thead className="hidden sm:table-header-group">
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">Sr.</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">Product Name</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">Quantity</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">Rate (₹)</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">Amount (₹)</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="sm:table-row block mb-4 sm:mb-0 border-b sm:border-0">
                      {/* Mobile Card Layout */}
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 font-semibold sm:font-normal block sm:table-cell">
                        <span className="sm:hidden font-medium text-gray-600">Sr.: </span>
                        {item.sr}
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 block sm:table-cell">
                        <span className="sm:hidden font-medium text-gray-600">Product Name: </span>
                        <select
                          value={item.productName}
                          onChange={(e) => {
                            const selectedProduct = e.target.value;
                            // Define the product list with rates
                            const productRates = {
                              "Passport Size Photo 35x45-08 Copy": 60,
                              "Passport Size Photo 35x45-16 Copy": 80,
                              "Passport Size Photo 35x45-20 Copy": 100,
                              "Passport Size Photo 35x45-32 Copy": 120,
                              "Passport Size Photo 35x45-40 Copy": 140,
                              "Passport Size Photo 35x35-08 Copy": 60,
                              "Visa Size Photo (80% Face) 35x45-08 Copy": 100,
                              "Visa Size Photo (80% Face) 33x48-08 Copy": 120,
                              "Visa Size Photo (80% Face) 50x50-06 Copy": 140,
                              "Visa Size Photo (80% Face) 50x70-04 Copy": 150,
                              "E-Mail Passport Size Photo": 100,
                              "Urgent Passport Size Photo 35x45-08 Copy": 80,
                              "Photo Size 4x6": 150,
                              "Photo Size 5x7": 180,
                              "Photo Size 6x8": 250,
                              "Photo Size 6x9": 280,
                              "Photo Size 8x10": 300,
                              "Photo Size 8x12": 350,
                              "Photo Size 10x12": 400,
                              "Photo Size 10x14": 450,
                              "Photo Size 12x15": 550,
                              "Photo Size 12x18": 650,
                              "Photo Size 12x24": 850,
                              "Photo Size 12x30": 900,
                              "Photo Size 12x36": 950,
                              "Photo Size 16x20": 1000,
                              "Photo Size 16x24": 1200,
                              "Photo Size 20x24": 1500,
                              "Photo Size 20x30": 2000,
                              "Photo Size 4x6 with Lamination + Framing": 350,
                              "Photo Size 5x7 with Lamination + Framing": 350,
                              "Photo Size 6x8 with Lamination + Framing": 400,
                              "Photo Size 6x9 with Lamination + Framing": 500,
                              "Photo Size 8x10 with Lamination + Framing": 550,
                              "Photo Size 8x12 with Lamination + Framing": 600,
                              "Photo Size 10x12 with Lamination + Framing": 850,
                              "Photo Size 10x14 with Lamination + Framing": 900,
                              "Photo Size 12x15 with Lamination + Framing": 1000,
                              "Photo Size 12x18 with Lamination + Framing": 1300,
                              "Photo Size 12x24 with Lamination + Framing": 1500,
                              "Photo Size 12x30 with Lamination + Framing": 1700,
                              "Photo Size 12x36 with Lamination + Framing": 1800,
                              "Photo Size 16x20 with Lamination + Framing": 2000,
                              "Photo Size 16x24 with Lamination + Framing": 2300,
                              "Photo Size 20x24 with Lamination + Framing": 2900,
                              "Photo Size 20x30 with Lamination + Framing": 4000,
                              "Modeling Photo 6x9": 400,
                              "Modeling Photo 8x12": 500,
                              "Modeling Photo 10x12": 600,
                              "Modeling Photo 12x15": 800,
                              "Modeling Photo 16x20": 1200,
                              "Modeling Photo 16x24": 1300,
                              "Modeling Photo 20x30": 2200,
                            };
                            // Set rate automatically if product is selected
                            const rate = productRates[selectedProduct] || 0;
                            handleItemChange(index, 'productName', selectedProduct);
                            if (selectedProduct) {
                              handleItemChange(index, 'rate', rate);
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                          required
                        >
                          <option value="">Select Items</option>
                          <option value="Passport Size Photo 35x45-08 Copy">Passport Size Photo 35x45-08 Copy</option>
                          <option value="Passport Size Photo 35x45-16 Copy">Passport Size Photo 35x45-16 Copy</option>
                          <option value="Passport Size Photo 35x45-20 Copy">Passport Size Photo 35x45-20 Copy</option>
                          <option value="Passport Size Photo 35x45-32 Copy">Passport Size Photo 35x45-32 Copy</option>
                          <option value="Passport Size Photo 35x45-40 Copy">Passport Size Photo 35x45-40 Copy</option>
                          <option value="Passport Size Photo 35x35-08 Copy">Passport Size Photo 35x35-08 Copy</option>
                          <option value="Visa Size Photo (80% Face) 35x45-08 Copy">Visa Size Photo (80% Face) 35x45-08 Copy</option>
                          <option value="Visa Size Photo (80% Face) 33x48-08 Copy">Visa Size Photo (80% Face) 33x48-08 Copy</option>
                          <option value="Visa Size Photo (80% Face) 50x50-06 Copy">Visa Size Photo (80% Face) 50x50-06 Copy</option>
                          <option value="Visa Size Photo (80% Face) 50x70-04 Copy">Visa Size Photo (80% Face) 50x70-04 Copy</option>
                          <option value="E-Mail Passport Size Photo">E-Mail Passport Size Photo</option>
                          <option value="Urgent Passport Size Photo 35x45-08 Copy">Urgent Passport Size Photo 35x45-08 Copy</option>
                          <option value="Photo Size 4x6">Photo Size 4x6</option>
                          <option value="Photo Size 5x7">Photo Size 5x7</option>
                          <option value="Photo Size 6x8">Photo Size 6x8</option>
                          <option value="Photo Size 6x9">Photo Size 6x9</option>
                          <option value="Photo Size 8x10">Photo Size 8x10</option>
                          <option value="Photo Size 8x12">Photo Size 8x12</option>
                          <option value="Photo Size 10x12">Photo Size 10x12</option>
                          <option value="Photo Size 10x14">Photo Size 10x14</option>
                          <option value="Photo Size 12x15">Photo Size 12x15</option>
                          <option value="Photo Size 12x18">Photo Size 12x18</option>
                          <option value="Photo Size 12x24">Photo Size 12x24</option>
                          <option value="Photo Size 12x30">Photo Size 12x30</option>
                          <option value="Photo Size 12x36">Photo Size 12x36</option>
                          <option value="Photo Size 16x20">Photo Size 16x20</option>
                          <option value="Photo Size 16x24">Photo Size 16x24</option>
                          <option value="Photo Size 20x24">Photo Size 20x24</option>
                          <option value="Photo Size 20x30">Photo Size 20x30</option>
                          <option value="Photo Size 4x6 with Lamination + Framing">Photo Size 4x6 with Lamination + Framing</option>
                          <option value="Photo Size 5x7 with Lamination + Framing">Photo Size 5x7 with Lamination + Framing</option>
                          <option value="Photo Size 6x8 with Lamination + Framing">Photo Size 6x8 with Lamination + Framing</option>
                          <option value="Photo Size 6x9 with Lamination + Framing">Photo Size 6x9 with Lamination + Framing</option>
                          <option value="Photo Size 8x10 with Lamination + Framing">Photo Size 8x10 with Lamination + Framing</option>
                          <option value="Photo Size 8x12 with Lamination + Framing">Photo Size 8x12 with Lamination + Framing</option>
                          <option value="Photo Size 10x12 with Lamination + Framing">Photo Size 10x12 with Lamination + Framing</option>
                          <option value="Photo Size 10x14 with Lamination + Framing">Photo Size 10x14 with Lamination + Framing</option>
                          <option value="Photo Size 12x15 with Lamination + Framing">Photo Size 12x15 with Lamination + Framing</option>
                          <option value="Photo Size 12x18 with Lamination + Framing">Photo Size 12x18 with Lamination + Framing</option>
                          <option value="Photo Size 12x24 with Lamination + Framing">Photo Size 12x24 with Lamination + Framing</option>
                          <option value="Photo Size 12x30 with Lamination + Framing">Photo Size 12x30 with Lamination + Framing</option>
                          <option value="Photo Size 12x36 with Lamination + Framing">Photo Size 12x36 with Lamination + Framing</option>
                          <option value="Photo Size 16x20 with Lamination + Framing">Photo Size 16x20 with Lamination + Framing</option>
                          <option value="Photo Size 16x24 with Lamination + Framing">Photo Size 16x24 with Lamination + Framing</option>
                          <option value="Photo Size 20x24 with Lamination + Framing">Photo Size 20x24 with Lamination + Framing</option>
                          <option value="Photo Size 20x30 with Lamination + Framing">Photo Size 20x30 with Lamination + Framing</option>
                          <option value="Modeling Photo 6x9">Modeling Photo 6x9</option>
                          <option value="Modeling Photo 8x12">Modeling Photo 8x12</option>
                          <option value="Modeling Photo 10x12">Modeling Photo 10x12</option>
                          <option value="Modeling Photo 12x15">Modeling Photo 12x15</option>
                          <option value="Modeling Photo 16x20">Modeling Photo 16x20</option>
                          <option value="Modeling Photo 16x24">Modeling Photo 16x24</option>
                          <option value="Modeling Photo 20x30">Modeling Photo 20x30</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 block sm:table-cell">
                        <span className="sm:hidden font-medium text-gray-600">Quantity: </span>
                        <input
                          type="number"
                          value={item.qnty}
                          onChange={(e) => handleItemChange(index, 'qnty', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                          min="0"
                          step="0.01"
                          required
                        />
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 block sm:table-cell">
                        <span className="sm:hidden font-medium text-gray-600">Rate (₹): </span>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                          min="0"
                          step="0.01"
                          required
                        />
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 block sm:table-cell">
                        <span className="sm:hidden font-medium text-gray-600">Amount (₹): </span>
                        <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 block sm:table-cell">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan="6" className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3">
                      {/* Custom Total Layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="font-semibold text-base sm:text-lg">
                          Total: ₹{total.toFixed(2)}
                        </div>
                        <div className="flex flex-row gap-6">
                          <div className="font-semibold text-base sm:text-lg">
                            Advance: {formData.advanceChecked && formData.advanceAmount && parseInt(formData.advanceAmount) > 0
                              ? `₹${formatIndianNumber(formData.advanceAmount)}`
                              : '₹0'}
                          </div>
                          <div className="font-semibold text-base sm:text-lg">
                            Credit: {formData.dueChecked && formData.creditAmount && parseInt(formData.creditAmount) > 0
                              ? `₹${formatIndianNumber(formData.creditAmount)}`
                              : '₹0'}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Advance/Due Checkboxes and Amounts */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mt-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.advanceChecked}
                  onChange={handleAdvanceChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Advance</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.dueChecked}
                  onChange={handleDueChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Credit</span>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm text-gray-700 min-w-[80px]">Advance Amount</label>
                <input
                  type="text"
                  value={formData.advanceAmount}
                  onChange={handleAdvanceAmountChange}
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Advance"
                  disabled={!formData.advanceChecked}
                  inputMode="numeric"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm text-gray-700 min-w-[80px]">Credit Amount</label>
                <input
                  type="text"
                  value={formData.creditAmount}
                  onChange={handleCreditAmountChange}
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Credit"
                  disabled={!formData.dueChecked}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4">
            <button
              type="submit"
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="h-5 w-5" />
              <span>{isEditing ? 'Update Quotation' : 'Save Quotation'}</span>
            </button>
            
            <button
              type="button"
              onClick={generatePDF}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </button>
          </div>
        </form>
      </div>

      {/* Hidden PDF Layout - for download from form */}
      <div ref={printRef} className="absolute -left-[9999px] bg-white p-8" style={{ width: '794px' }}>
        <InvoiceLayout data={{...formData, total}} />
      </div>
    </div>
  );
};

export default QuotationForm;