import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
// import Navbar from './components/Navbar';
import QuotationForm from './components/QuotationForm';
import QuotationPDF from './components/QuotationPDF';

function App() {
  const [quotations, setQuotations] = useState([]);

  // Load quotations from localStorage on component mount
  useEffect(() => {
    try {
      const savedQuotations = localStorage.getItem('quotations');
      if (savedQuotations) {
        const parsedQuotations = JSON.parse(savedQuotations);
        setQuotations(parsedQuotations);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save quotations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('quotations', JSON.stringify(quotations));
    } catch (error) {
      console.error('Error saving quotations to localStorage:', error);
    }
  }, [quotations]);

  const addQuotation = (quotation) => {
    // Generate unique quotation number based on timestamp
    const timestamp = Date.now();
    const quotationNo = `Q${String(timestamp).slice(-6)}`;
    
    const newQuotation = {
      ...quotation,
      id: timestamp.toString(),
      quotationNo: quotationNo,
      date: new Date().toLocaleDateString('en-GB'),
      createdAt: new Date().toISOString()
    };
    
    setQuotations(prevQuotations => [...prevQuotations, newQuotation]);
  };

  const updateQuotation = (id, updatedQuotation) => {
    setQuotations(prevQuotations => 
      prevQuotations.map(q => q.id === id ? { ...q, ...updatedQuotation } : q)
    );
  };

  const deleteQuotation = (id) => {
    setQuotations(prevQuotations => prevQuotations.filter(q => q.id !== id));
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* <Navbar /> */}
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={<QuotationForm addQuotation={addQuotation} quotations={quotations} />} 
            />
            <Route 
              path="/edit/:id" 
              element={<QuotationForm quotations={quotations} updateQuotation={updateQuotation} />} 
            />
            <Route 
              path="/pdf/:id" 
              element={<QuotationPDF quotations={quotations} />} 
            />
          </Routes>
      </div>
      </div>
    </Router>
  );
}

export default App;
