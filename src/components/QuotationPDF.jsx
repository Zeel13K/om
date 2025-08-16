import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, ArrowLeft } from 'lucide-react';

const QuotationPDF = ({ quotations, clients }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const quotation = quotations.find(q => q.id === id);
  const client = clients.find(c => c.id === quotation?.clientId);

  useEffect(() => {
    if (!quotation) {
      navigate('/');
    }
  }, [quotation, navigate]);

  // Function to format number with Indian number system
  const formatIndianNumber = (num) => {
    const number = parseInt(num);
    if (isNaN(number)) return '0';
    
    return number.toLocaleString('en-IN');
  };

  // Function to convert number to words in Indian format
  const convertToWords = (num) => {
    const number = parseInt(num);
    if (isNaN(number) || number === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanOneThousand = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
    };

    if (number < 1000) return convertLessThanOneThousand(number);
    if (number < 100000) {
      const thousands = Math.floor(number / 1000);
      const remainder = number % 1000;
      return convertLessThanOneThousand(thousands) + ' Thousand' + (remainder !== 0 ? ' ' + convertLessThanOneThousand(remainder) : '');
    }
    if (number < 10000000) {
      const lakhs = Math.floor(number / 100000);
      const remainder = number % 100000;
      return convertLessThanOneThousand(lakhs) + ' Lakh' + (remainder !== 0 ? ' ' + convertToWords(remainder) : '');
    }
    if (number < 1000000000) {
      const crores = Math.floor(number / 10000000);
      const remainder = number % 10000000;
      return convertLessThanOneThousand(crores) + ' Crore' + (remainder !== 0 ? ' ' + convertToWords(remainder) : '');
    }
    
    return 'Amount too large';
  };

  const generatePDF = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, {
      scale: 3,
      letterRendering: true,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Convert 4x6 inches to mm (1 inch = 25.4 mm)
    const pageWidth = 4 * 25.4;  // 101.6 mm
    const pageHeight = 6 * 25.4; // 152.4 mm
    
    const pdf = new jsPDF('p', 'mm', [pageWidth, pageHeight]);
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage([pageWidth, pageHeight]);
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`quotation-${quotation.quotationNo}.pdf`);
  };

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Quotation not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to History</span>
          </button>
          
          <button
            onClick={generatePDF}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Print Container - Exact Layout */}
      <div ref={printRef} className="print-container bg-white p-8 w-[794px]">
        {/* Header Section */}
        <div className="border border-black p-6 text-center">
          <h1 className="text-2xl font-bold text-black mb-1">OM Photography</h1>
          <h2 className="text-xl font-semibold text-black">Quotation</h2>
        </div>

        {/* Client & Quotation Details Section */}
        <div className="border-t-0 border border-black p-6">
          <div className="grid grid-cols-2 gap-0">
            <div className="border-r border-black pr-4">
              <p className="text-xl text-black">
                <span className="font-semibold">Mr/Ms:</span> {quotation.clientName}
              </p>
            </div>
            <div className="pl-4">
              <div className="mb-2">
                <p className="text-xl text-black">
                  <span className="font-semibold">Quotation No:</span> {quotation.quotationNo}
                </p>
              </div>
              <div>
                <p className="text-xl text-black">
                  <span className="font-semibold">Date:</span> {quotation.date}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product/Service Table */}
        <div className="">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black border-b-0 px-3 py-4 text-left text-lg font-semibold text-black">Sr.</th>
                <th className="border border-black border-b-0 px-3 py-4 text-left text-lg font-semibold text-black">Product Name</th>
                <th className="border border-black border-b-0 px-3 py-4 text-left text-lg font-semibold text-black">Qnty</th>
                <th className="border border-black border-b-0 px-3 py-4 text-left text-lg font-semibold text-black">Rate</th>
                <th className="border border-black border-b-0 px-3 py-4 text-left text-lg font-semibold text-black">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black px-3 py-4 text-lg text-black">{item.sr}</td>
                  <td className="border border-black px-3 py-4 text-lg text-black">{item.productName}</td>
                  <td className="border border-black px-3 py-4 text-lg text-black">{item.qnty}</td>
                  <td className="border border-black px-3 py-4 text-lg text-black">₹{item.rate.toFixed(2)}</td>
                  <td className="border border-black px-3 py-4 text-lg text-black">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              {/* Add empty rows for more items */}
              {Array.from({ length: Math.max(0, 8 - quotation.items.length) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="border border-black px-3 py-4 text-sm text-black"></td>
                  <td className="border border-black px-3 py-4 text-sm text-black"></td>
                  <td className="border border-black px-3 py-4 text-sm text-black"></td>
                  <td className="border border-black px-3 py-4 text-sm text-black"></td>
                  <td className="border border-black px-3 py-4 text-sm text-black"></td>
                </tr>
              ))}
              {/* remove bottom border of the last visual row */}
              <tr>
                <td className="border-x border-black border-b-0"></td>
                <td className="border-x border-black border-b-0"></td>
                <td className="border-x border-black border-b-0"></td>
                <td className="border-x border-black border-b-0"></td>
                <td className="border-x border-black border-b-0"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Section */}
        <div className="border-t-0 border border-black p-6">
          <div className="grid grid-cols-2 gap-0">
            <div className="border-r border-black pr-4">
              <div className="text-xl font-bold text-black">
                Total:<span className='font-normal'> {convertToWords(quotation.total)}</span>
              </div>
            </div>
            <div className="pl-4">
              <div className="text-xl font-bold text-black text-right">
                ₹{formatIndianNumber(quotation.total)}/-
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-0 border border-black p-6 text-center">
          <p className="text-base font-semibold text-black">Thank you.. Visit Again</p>
        </div>
      </div>
    </div>
  );
};

export default QuotationPDF; 